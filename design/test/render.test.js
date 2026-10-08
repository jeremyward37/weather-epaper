const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const {renderNormal,renderSetup,renderNormalSvg,rasterizeSvg,validateNormal,toOneBitPng}=require('../lib/render.js');

const design=path.resolve(__dirname,'..');
const load=name=>JSON.parse(fs.readFileSync(path.join(design,'fixtures',name)));
const clone=value=>JSON.parse(JSON.stringify(value));
const pixels=async png=>(await sharp(png).greyscale().raw().toBuffer({resolveWithObject:true})).data;

test('validateNormal rejects forecast counts, mark labels, and precipitation/icon mismatches',()=>{
  const valid=load('normal-summer.json');
  assert.doesNotThrow(()=>validateNormal(valid));
  const wrongCount=clone(valid);
  wrongCount.threeHourly.pop();
  assert.throws(()=>validateNormal(wrongCount),/forecast counts/);
  const wrongDayCount=clone(valid);
  wrongDayCount.daily.pop();
  assert.throws(()=>validateNormal(wrongDayCount),/forecast counts/);
  const wrongMark=clone(valid);
  wrongMark.threeHourly[0].time='1 PM';
  assert.throws(()=>validateNormal(wrongMark),/three-hour slot 0/);
  const wrongDay=clone(valid);
  wrongDay.daily[0].day='Mon';
  assert.throws(()=>validateNormal(wrongDay),/day 0/);
  const mismatch=clone(valid);
  mismatch.threeHourly[0]={...mismatch.threeHourly[0],precip:25,type:'Rain',icon:'clearDay'};
  assert.throws(()=>validateNormal(mismatch),/does not show Rain/);
  const missingType=clone(valid);
  missingType.threeHourly[0]={...missingType.threeHourly[0],precip:20,type:null};
  assert.throws(()=>validateNormal(missingType),/precip and type mismatch/);
});

test('Node threshold reproduces all seven committed 1-bit frame pixels',async()=>{
  const cases=['summer','winter','spring','widths','night'].map(id=>[
    `normal/${`normal-${id}`}.png`,()=>renderNormal(load(`normal-${id}.json`))
  ]);
  cases.push(['states/state-setup.png',()=>renderSetup(load('setup.json'))]);
  cases.push(['states/state-low-battery.png',()=>renderNormal(load('normal-night.json'))]);
  for(const [name,render] of cases) {
    const actual=await toOneBitPng(await render());
    const expected=fs.readFileSync(path.join(design,'exports',name));
    const metadata=await sharp(actual).metadata();
    assert.equal(metadata.width,400,name);
    assert.equal(metadata.height,300,name);
    assert.equal(actual[24],1,`${name}: PNG bit depth`);
    assert.equal(actual[25],0,`${name}: grayscale PNG color type`);
    assert.deepEqual(await pixels(actual),await pixels(expected),name);
  }
});

test('lowBattery option overrides the fixture and changes only the footer glyph box',async()=>{
  const night=load('normal-night.json'); // legacy export fixture has lowBattery: true
  const plain=await pixels(await toOneBitPng(await renderNormal(night,{lowBattery:false})));
  const low=await pixels(await toOneBitPng(await renderNormal(night,{lowBattery:true})));
  let differences=0;
  for(let y=0;y<300;y++) for(let x=0;x<400;x++) {
    const index=y*400+x;
    if(plain[index]===low[index]) continue;
    differences++;
    assert.ok(x>=136&&x<150&&y>=278&&y<294,`unexpected difference at ${x},${y}`);
  }
  assert.ok(differences>0,'battery glyph must be visible');
  assert.equal(night.lowBattery,true,'rendering must not mutate the fixture');
});

test('daily low/high fields render in order without clipping signed, equal, or wide pairs',async()=>{
  // Explicit expected labels also detect sorting values instead of preserving field meaning.
  const cases=[
    {low:-24,high:-12,label:'-24°/-12°'},
    {low:-12,high:108,label:'-12°/108°'},
    {low:100,high:108,label:'100°/108°'},
    {low:7,high:7,label:'7°/7°'},
    {low:108,high:-24,label:'108°/-24°'},
    {low:-99,high:-88,label:'-99°/-88°'}
  ];
  for(let group=0;group<2;group++) for(const lowBattery of [false,true]) {
    const fixture=load('normal-widths.json');
    fixture.daily.forEach((day,i)=>Object.assign(day,{low:cases[group*3+i].low,high:cases[group*3+i].high}));
    const before=clone(fixture);
    const content=await renderNormalSvg(fixture,{lowBattery});
    const tags=[...content.matchAll(/<text x="303"[^>]*font-size="20"[^>]*>([^<]*)<\/text>/g)];
    assert.deepEqual(tags.map(match=>match[1]),cases.slice(group*3,group*3+3).map(value=>value.label));
    const frame=await pixels(await toOneBitPng(await rasterizeSvg(content)));
    for(let row=0;row<3;row++) {
      // Render each actual tag on a wider surface to expose any ink clipped off the panel.
      const isolated=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#fff"/>${tags[row][0]}</svg>`;
      const ink=await pixels(await rasterizeSvg(isolated));
      let x0=600,x1=-1,y0=300,y1=-1;
      for(let y=0;y<300;y++) for(let x=0;x<600;x++) if(ink[y*600+x]<160) {
        x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y);
        assert.ok(x<400&&frame[y*400+x]===0,'daily text must appear completely in the frame');
      }
      const cy=126+row*52;
      assert.ok(x0>=303&&x1<=395,`${tags[row][1]}: ink ${x0}..${x1} exceeds daily bounds`);
      assert.ok(y0>=cy-15&&y1<cy+12,'daily text must stay clear of the chance line');
      assert.ok(Math.abs((y0+y1)/2-cy)<=.5,'daily text must retain the approved visible center');
    }
    assert.deepEqual(fixture,before,'rendering must preserve NWS field values and all fixture semantics');
  }
});
