const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
const {renderNormal,renderSetup,validateNormal,toOneBitPng}=require('../lib/render.js');

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
