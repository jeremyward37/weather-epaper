// SVG authoring and raster pipeline for the 400 x 300 BW panel.
// Run: node design/build.js [--all], then python3 design/threshold.py, then python3 design/verify.py
// (or ./build.sh from the project root). The canonical outputs are the five normal-* and two
// state-* frames (setup, low-battery). Pass --all to also regenerate the historical concept/6-hour/logo-size/audit
// renders that live under exports/archive/.
// Everything under .build/ (raw antialiased PNGs, generated SVGs, fonts.conf) is regenerated
// on every run. Edit this file and fixtures/, never the generated SVGs.
// The severe-weather alert state and the DATA STALE badge were removed from scope on 2026-09-25; their renders live in exports/archive/.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const buildAll = process.argv.includes('--all');
const fontDir = path.join(root,'assets/fonts');
const source = path.join(root,'assets/source'); // vendored masters; see assets/source/SOURCES.md
const iconDir = path.join(root, 'assets/icons');
const srcDir = path.join(root, '.build/svg');
const rawDir = path.join(root, '.build/raw');
const sharp = require('sharp');
for (const dir of [iconDir, srcDir, rawDir]) fs.mkdirSync(dir, {recursive:true});
for (const dir of [iconDir, srcDir, rawDir]) {
  for (const entry of fs.readdirSync(dir)) fs.rmSync(path.join(dir, entry), {recursive:true, force:true});
}
const fontConfig = path.join(root,'.build/fonts.conf');
fs.writeFileSync(fontConfig, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${fontDir}</dir><cachedir>/tmp/weather-epaper-font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontConfig;

const names = {
  clearDay:'wi-day-sunny', clearNight:'wi-night-clear', mostlyClearDay:'wi-day-sunny-overcast', mostlyClearNight:'wi-night-alt-partly-cloudy',
  partlyDay:'wi-day-cloudy', partlyNight:'wi-night-partly-cloudy', cloudyDay:'wi-day-cloudy-high', cloudyNight:'wi-night-cloudy-high',
  overcast:'wi-cloudy', fogDay:'wi-day-haze', fogNight:'wi-night-fog', windDay:'wi-day-windy', windNight:'wi-night-cloudy-windy',
  rainDay:'wi-day-rain', rainNight:'wi-night-rain', showersDay:'wi-day-showers', showersNight:'wi-night-showers',
  drizzleDay:'wi-day-sprinkle', drizzleNight:'wi-night-sprinkle', snowDay:'wi-day-snow', snowNight:'wi-night-snow',
  flurriesDay:'wi-day-snow-wind', flurriesNight:'wi-night-snow-wind',
  mixDay:'wi-day-rain-mix', mixNight:'wi-night-rain-mix', thunderDay:'wi-day-thunderstorm', thunderNight:'wi-night-thunderstorm',
  hailDay:'wi-day-hail', hailNight:'wi-night-hail', smoke:'wi-smoke',
  typeRain:'wi-raindrop', typeSnow:'wi-snowflake-cold', typeMix:'wi-sleet', typeThunder:'wi-lightning',
  dawn:'wi-sunrise', dusk:'wi-sunset', lowBattery:'battery_alert_0deg'
};
const sizes = [14,20,24,48,60];
const iconData = {};
async function icon(name, size) {
  const key = `${name}-${size}`;
  if (iconData[key]) return iconData[key];
  const file = name === 'refresh' ? path.join(source,'refresh-icon.png') :
    name === 'logo' ? path.join(source,'sovereign-aperture-black.svg') :
    path.join(source, `${names[name] || name}.svg`);
  if (!fs.existsSync(file)) throw new Error(`Missing icon ${name}: ${file}`);
  const replacements = {
    typeRain:'<path d="M7 1 C6 4 3 6 3 9 a4 4 0 0 0 8 0 C11 6 8 4 7 1Z"/>',
    typeSnow:'<path d="M7 1v12 M1 7h12 M3 3l8 8 M11 3l-8 8"/>',
    typeMix:'<path d="M4 2 C3 4 1 6 1 8 a3 3 0 0 0 6 0 C7 6 5 4 4 2Z M11 4v8 M8 8h6"/>',
    typeThunder:'<path d="M8 1 3 8h4l-1 5 5-7H7Z"/>',
    lowBattery:'<rect x="1.5" y="3.5" width="10" height="7" rx="1" fill="none"/><path d="M12.5 6v2 M4.5 6v2" fill="none"/>'
  };
  let raw;
  if(replacements[name]) {
    const fill = name==='typeSnow'||name==='typeMix'||name==='lowBattery' ? 'none' : '#000';
    const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><rect width="14" height="14" fill="#fff"/><g fill="${fill}" stroke="#000" stroke-width="${name==='typeRain'||name==='typeThunder'?1.6:2}" stroke-linecap="round" stroke-linejoin="round">${replacements[name]}</g></svg>`;
    raw = await sharp(Buffer.from(mark)).resize(size,size).png().toBuffer();
  } else {
    raw = await sharp(file).resize(size,size,{fit:'contain',background:'#ffffff'}).flatten({background:'#ffffff'}).png().toBuffer();
  }
  // The source flurry wind and hail pellets disappear at 32 px. Reinforce those
  // semantic marks at every live size without changing the source cloud artwork.
  if (name.startsWith('flurries') || name.startsWith('hail')) {
    const marks = name.startsWith('flurries')
      ? '<path d="M19 26h9 M22 29h8" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="square"/>'
      : '<rect x="5" y="28" width="2" height="2" fill="#000"/><rect x="17" y="28" width="2" height="2" fill="#000"/>';
    const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${marks}</svg>`;
    raw = await sharp(raw).composite([{input:Buffer.from(overlay)}]).png().toBuffer();
  }
  const out = path.join(iconDir,key+'.png');
  fs.writeFileSync(out,raw);
  iconData[key] = `data:image/png;base64,${raw.toString('base64')}`;
  return iconData[key];
}
function esc(s) {return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function rect(x,y,w,h,fill='#000') {return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;}
function line(x1,y1,x2,y2,dotted=false) {return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1" ${dotted?'stroke-dasharray="1 3"':''}/>`;}
function text(t,x,y,size=14,anchor='start',family='Lato') {return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="400" font-kerning="none" text-anchor="${anchor}" fill="#000">${esc(t)}</text>`;}
async function img(name,x,y,size) {return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${await icon(name,size)}"/>`;}
function svg(body) {return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fff"/>${body}</svg>`;}
const textInkCache=new Map();
const iconInkCache=new Map();
async function textInkOffset(value,size,family){
  const key=`${family}:${size}:${value}`;
  if(textInkCache.has(key)) return textInkCache.get(key);
  const sample=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160"><rect width="600" height="160" fill="#fff"/>${text(value,10,80,size,'start',family)}</svg>`;
  const {data,info}=await sharp(Buffer.from(sample)).greyscale().raw().toBuffer({resolveWithObject:true});
  let minY=160,maxY=-1;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[y*info.width+x]<160){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(maxY<0) throw new Error(`Blank text: ${value}`);
  const offset=(minY+maxY)/2-80;
  textInkCache.set(key,offset);
  return offset;
}
async function centeredText(value,x,cy,size,anchor='start',family='Lato'){
  const baseline=Math.round(cy-await textInkOffset(value,size,family));
  return text(value,x,baseline,size,anchor,family);
}
async function iconInkOffset(name,size){
  const key=`${name}-${size}`;
  if(iconInkCache.has(key)) return iconInkCache.get(key);
  await icon(name,size);
  const {data,info}=await sharp(path.join(iconDir,key+'.png')).greyscale().raw().toBuffer({resolveWithObject:true});
  let minY=size,maxY=-1;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[y*info.width+x]<160){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(maxY<0) throw new Error(`Blank icon: ${name}`);
  const offset=(minY+maxY)/2;
  iconInkCache.set(key,offset);
  return offset;
}
async function centeredIcon(name,x,cy,size){
  const y=Math.round(cy-await iconInkOffset(name,size));
  return img(name,x,y,size);
}

const data = JSON.parse(fs.readFileSync(path.join(root,'fixtures/archive/concept-spring.json')));
async function footer() {
  let s=line(5,278,395,278);
  s+=await img('refresh',6,282,12);
  s+=text('9/24 4:58 PM',21,293,11);
  s+=await img('logo',188,279,24);
  s+=text('Marriott-Slaterville, UT',395,293,11,'end');
  return s;
}
function pct(slot) {return slot.precip>0?`${slot.precip}%`:'';}
async function precip(slot,x,y,align='center',size=14,fontSize=12) {
  if(!slot.precip) return '';
  const label=pct(slot);
  if(align==='center') return (await img('type'+slot.type,x-25,y-11,size))+text(label,x+2,y,fontSize);
  return (await img('type'+slot.type,x,y-12,size))+text(label,x+size+3,y,fontSize);
}
async function conceptA(){
  let s='';
  s+=await img(data.current.icon,11,10,60);
  s+=text(data.current.temp+'°',77,78,66,'start','Lato');
  s+=text('LAST LIGHT',264,38,11);
  s+=await img('dusk',267,47,24);
  s+=text(data.sun.time,296,66,19);
  s+=line(6,94,394,94,true);
  s+=text('NEXT 6 HOURS',8,110,11);
  const hw=64, hx=8;
  for(let i=0;i<6;i++){
    const d=data.hourly[i], cx=hx+hw*i+hw/2;
    s+=text(d.time,cx,129,12,'middle');
    s+=await img(d.icon,cx-12,136,24);
    s+=text(d.temp+'°',cx,176,18,'middle');
    s+=await precip(d,cx,192);
  }
  s+=line(6,201,394,201,true);
  s+=text('NEXT 5 DAYS',8,212,11);
  for(let i=0;i<5;i++){
    const d=data.daily[i], cx=8+77*i+38.5;
    s+=text(d.day,cx,224,12,'middle');
    s+=await img(d.icon,cx-9,228,18);
    s+=text(`${d.high}°/${d.low}°`,cx,258,14,'middle');
    if(d.precip) s+=await precip(d,cx,273,'center',12);
  }
  s+=await footer();
  return s;
}
async function conceptB(){
  let s='';
  s+=text('NOW',8,20,11);
  s+=await img(data.current.icon,8,33,60);
  s+=text(data.current.temp+'°',66,90,62);
  s+=text('Last light',8,117,13);
  s+=text(data.sun.time,84,117,16);
  s+=line(174,8,174,154,true);
  s+=text('NEXT 6 HOURS',184,20,11);
  for(let i=0;i<6;i++){
    const d=data.hourly[i], col=i%3, row=Math.floor(i/3), cx=184+col*70+35, y=24+row*62;
    s+=text(d.time,cx,y+9,11,'middle');
    s+=await img(d.icon,cx-10,y+11,20);
    s+=text(d.temp+'°',cx,y+45,17,'middle');
    if(d.precip) s+=await precip(d,cx,y+57,'center',12);
  }
  s+=line(6,154,394,154,true);
  s+=text('NEXT 5 DAYS',8,171,11);
  for(let i=0;i<5;i++){
    const d=data.daily[i], cx=8+i*77+38.5;
    s+=text(d.day,cx,187,13,'middle');
    s+=await img(d.icon,cx-12,193,24);
    s+=text(`${d.high}° / ${d.low}°`,cx,237,13,'middle');
    if(d.precip) s+=await precip(d,cx,260,'center',12);
  }
  s+=await footer();
  return s;
}
async function conceptC(){
  let s='';
  s+=text('CURRENT',8,20,11);
  s+=await img(data.current.icon,7,28,48);
  s+=text(data.current.temp+'°',51,84,57);
  s+=text('Last light',9,105,12);
  s+=text(data.sun.time,85,105,15);
  s+=line(8,117,188,117,true);
  s+=text('NEXT 5 DAYS',8,134,11);
  for(let i=0;i<5;i++){
    const d=data.daily[i], y=144+i*26;
    s+=text(d.day,8,y+17,12);
    s+=await img(d.icon,38,y,20);
    s+=text(`${d.high}°/${d.low}°`,66,y+17,13);
    if(d.precip) s+=await precip(d,137,y+17,'start',14);
  }
  s+=line(195,7,195,270,true);
  s+=text('NEXT 6 HOURS',207,20,11);
  for(let i=0;i<6;i++){
    const d=data.hourly[i], y=29+i*40;
    s+=text(d.time,207,y+19,12);
    s+=await img(d.icon,258,y+3,24);
    s+=text(d.temp+'°',291,y+22,18);
    if(d.precip) s+=await precip(d,346,y+22,'start',14);
    if(i<5) s+=line(207,y+37,393,y+37,true);
  }
  s+=await footer();
  return s;
}
// C variation: same split ledger, but an open right column and a larger current reading.
async function conceptD(){
  let s='';
  s+=text('CURRENT',8,19,11);
  s+=text(data.current.temp+'°',8,86,70);
  s+=await img(data.current.icon,169,33,48);
  s+=text('Last light',8,112,12);
  s+=text(data.sun.time,83,112,16);
  s+=line(8,122,213,122,true);
  s+=text('NEXT 5 DAYS',8,139,11);
  for(let i=0;i<5;i++){
    const d=data.daily[i], y=148+i*25;
    s+=text(d.day,8,y+16,12);
    s+=await img(d.icon,39,y,20);
    s+=text(`${d.high}°/${d.low}°`,67,y+16,13);
    if(d.precip) s+=await precip(d,164,y+16,'start',14);
  }
  s+=line(222,7,222,270,true);
  s+=text('NEXT 6 HOURS',234,20,11);
  for(let i=0;i<6;i++){
    const d=data.hourly[i], y=31+i*39;
    s+=text(d.time,234,y+18,12);
    s+=await img(d.icon,279,y+1,22);
    s+=text(d.temp+'°',307,y+19,18);
    if(d.precip) s+=await precip(d,354,y+19,'start',14);
  }
  s+=await footer();
  return s;
}
// C variation: retain the two vertical forecast lists beneath a full-width current hero.
async function conceptE({top=true,center=true,rows=true}={}){
  let s='';
  s+=text('CURRENT',8,20,11);
  s+=await img(data.current.icon,8,29,54);
  s+=text(data.current.temp+'°',67,84,70);
  s+=text('LAST LIGHT',255,42,11);
  s+=await img('dusk',255,50,24);
  s+=text(data.sun.time,284,69,19);
  if(top) s+=line(6,95,394,95,true);
  s+=text('NEXT 6 HOURS',8,112,11);
  s+=text('NEXT 5 DAYS',210,112,11);
  if(center) s+=line(198,103,198,270,true);
  for(let i=0;i<6;i++){
    const d=data.hourly[i], y=118+i*26;
    s+=text(d.time,8,y+18,12);
    s+=await img(d.icon,56,y+1,20);
    s+=text(d.temp+'°',84,y+18,15);
    if(d.precip) s+=await precip(d,140,y+18,'start',14);
    if(rows && i<5) s+=line(8,y+24,189,y+24,true);
  }
  for(let i=0;i<5;i++){
    const d=data.daily[i], y=118+i*30;
    s+=text(d.day,210,y+19,12);
    s+=await img(d.icon,243,y+1,22);
    s+=text(`${d.high}°/${d.low}°`,270,y+19,13);
    if(d.precip) s+=await precip(d,352,y+19,'start',14);
    if(rows && i<4) s+=line(210,y+28,393,y+28,true);
  }
  s+=await footer();
  return s;
}
function validateNormal(d){
  if(d.threeHourly.length!==4 || d.daily.length!==3) throw new Error(`${d.id}: forecast counts`);
  const hour=Number(d.localNow.slice(11,13));
  if(d.hourly){ // only present when --all merges the archived six-hour data
    if(d.hourly.length!==6) throw new Error(`${d.id}: six-hour count`);
    for(let i=0;i<6;i++){
      const h=(hour+1+i)%24;
      const label=(h%12 || 12)+' '+(h<12?'AM':'PM');
      if(d.hourly[i].time!==label) throw new Error(`${d.id}: hour ${i} should be ${label}`);
    }
  }
  const nextThree=(Math.floor(hour/3)+1)*3;
  for(let i=0;i<4;i++){
    const h=(nextThree+i*3)%24;
    const label=(h%12 || 12)+' '+(h<12?'AM':'PM');
    if(d.threeHourly[i].time!==label) throw new Error(`${d.id}: three-hour slot ${i} should be ${label}`);
  }
  const weekday=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today=new Date(d.localNow.slice(0,10)+'T12:00:00Z').getUTCDay();
  for(let i=0;i<3;i++){
    const expected=weekday[(today+1+i)%7];
    if(d.daily[i].day!==expected) throw new Error(`${d.id}: day ${i} should be ${expected}`);
  }
  for(const slot of [...(d.hourly||[]),...d.threeHourly,...d.daily]){
    if((slot.precip===0)!==(slot.type===null)) throw new Error(`${d.id}: precip and type mismatch`);
    if(slot.precip<0||slot.precip>100) throw new Error(`${d.id}: precip out of range`);
    if(slot.precip>0){
      const matching={Rain:/rain|showers|drizzle/i,Snow:/snow|flurries/i,Mix:/mix|sleet/i,Thunder:/thunder/i};
      if(!matching[slot.type]?.test(slot.icon)) throw new Error(`${d.id}: ${slot.icon} does not show ${slot.type}`);
    }
  }
}
async function normalFooter(d,logoSize){
  let s=line(5,272,395,272);
  const cy=285.5;
  s+=await centeredIcon('refresh',7,cy,14);
  s+=await centeredText(d.lastUpdate,27,cy,14);
  if(d.lowBattery) s+=await centeredIcon('lowBattery',136,cy,14);
  s+=await centeredIcon('logo',395-logoSize,cy,logoSize);
  return s;
}
async function normalE(d,logoSize=20,mode='three'){
  validateNormal(d);
  let s='';
  s+=await centeredIcon(d.current.icon,10,55,66);
  s+=await centeredText(d.current.temp+'°',82,55,76,'start','Raleway');
  const dawn=d.sun.event==='civilDawn';
  s+=await centeredText(dawn?'FIRST LIGHT':'LAST LIGHT',255,31,14);
  s+=await centeredIcon(dawn?'dawn':'dusk',255,64,30);
  s+=await centeredText(d.sun.time,293,64,22);
  s+=line(6,94,394,94,true);
  s+=line(209,102,209,263,true);
  if(mode==='three'){
    for(let i=0;i<4;i++){
      const slot=d.threeHourly[i], cy=121+i*40;
      s+=await centeredText(slot.time,8,cy,18);
      s+=await centeredText(slot.temp+'°',70,cy,22);
      s+=await centeredIcon(slot.icon,119,cy,32);
      if(slot.precip) s+=await centeredText(slot.precip+'%',164,cy,15);
    }
  }else{
    for(let i=0;i<6;i++){
      const slot=d.hourly[i], cy=116+i*27;
      s+=await centeredText(slot.time,8,cy,16);
      s+=await centeredText(slot.temp+'°',66,cy,20);
      s+=await centeredIcon(slot.icon,115,cy,26);
      if(slot.precip) s+=await centeredText(slot.precip+'%',153,cy,14);
    }
  }
  for(let i=0;i<3;i++){
    const slot=d.daily[i], cy=126+i*52;
    s+=await centeredText(slot.day,218,cy,18);
    s+=await centeredIcon(slot.icon,260,cy,36);
    s+=await centeredText(`${slot.high}°/${slot.low}°`,303,cy,20);
    if(slot.precip) s+=await centeredText(slot.precip+'%',303,cy+20,16);
  }
  s+=await normalFooter(d,logoSize);
  return s;
}
async function setupScreen(d){
  let s='';
  s+=await centeredIcon('logo',168,53,64);
  s+=await centeredText('SET UP WEATHER STATION',200,111,22,'middle');
  s+=line(24,131,376,131);
  s+=await centeredText('1. Connect to Wi-Fi',35,155,18);
  s+=await centeredText(d.network,59,179,20);
  s+=await centeredText('Password: '+d.password,59,203,20);
  s+=await centeredText('2. Open this address',35,239,18);
  s+=await centeredText(d.address,59,263,20);
  return s;
}
async function auditSheet(){
  let s=text('1-BIT TYPE + ICON AUDIT',8,18,14);
  s+=text('Lato 12',8,42,11)+text('108°  9/24 4:58 PM',92,42,12);
  s+=text('Lato 14',8,64,11)+text('108°  9/24 4:58 PM',92,64,14);
  s+=text('Raleway 14',8,87,11)+text('108°  9/24 4:58 PM',92,87,14,'start','Raleway');
  s+=text('Montserrat 14',8,110,11)+text('108°  9/24 4:58 PM',112,110,14,'start','Montserrat');
  s+=text('Roboto Mono 14',8,133,11)+text('108°  9/24 4:58 PM',112,133,14,'start','Roboto Mono');
  s+=line(7,143,393,143,true);
  s+=text('Condition @ 20 / 48 px',8,159,11);
  for(const [i,n] of ['clearDay','partlyDay','rainDay','snowDay','clearNight'].entries()){
    s+=await img(n,10+i*76,170,20);
    s+=await img(n,33+i*76,164,48);
  }
  s+=line(7,222,393,222,true);
  s+=text('Precip type @ 14 px',8,239,11);
  for(const [i,n] of ['typeRain','typeSnow','typeMix','typeThunder'].entries()){
    s+=await img(n,20+i*95,248,14);
    s+=text(n.slice(4),38+i*95,261,12);
  }
  return s;
}
async function main(){
  const concepts={A:conceptA,B:conceptB,C:conceptC,D:conceptD,E:conceptE,
    E1:()=>conceptE({top:false,center:false,rows:false}),
    E2:()=>conceptE({top:true,center:false,rows:false}),
    E3:()=>conceptE({top:true,center:true,rows:false})};
  for(const [n,fn] of Object.entries(concepts)){
    if(!buildAll) break; // historical concepts; regenerate with --all
    const content=svg(await fn());
    fs.writeFileSync(path.join(srcDir,`concept-${n}.svg`),content);
    await sharp(Buffer.from(content)).png().toFile(path.join(rawDir,`concept-${n}.png`));
  }
  for(const id of ['summer','winter','spring','widths','night']){
    const fixture=JSON.parse(fs.readFileSync(path.join(root,'fixtures',`normal-${id}.json`)));
    const content=svg(await normalE(fixture,20));
    fs.writeFileSync(path.join(srcDir,`normal-${id}.svg`),content);
    await sharp(Buffer.from(content)).png().toFile(path.join(rawDir,`normal-${id}.png`));
    if(!buildAll) continue; // 6-hour and logo-size alternates are historical; regenerate with --all
    const sixData=JSON.parse(fs.readFileSync(path.join(root,'fixtures/archive',`sixhour-${id}.json`)));
    const six=svg(await normalE({...fixture,hourly:sixData.hourly},20,'six'));
    fs.writeFileSync(path.join(srcDir,`normal-6hour-${id}.svg`),six);
    await sharp(Buffer.from(six)).png().toFile(path.join(rawDir,`normal-6hour-${id}.png`));
    if(id==='summer'){
      const alt=svg(await normalE(fixture,18));
      fs.writeFileSync(path.join(srcDir,'normal-summer-logo18.svg'),alt);
      await sharp(Buffer.from(alt)).png().toFile(path.join(rawDir,'normal-summer-logo18.png'));
      const old=svg(await normalE(fixture,24));
      fs.writeFileSync(path.join(srcDir,'normal-summer-logo24.svg'),old);
      await sharp(Buffer.from(old)).png().toFile(path.join(rawDir,'normal-summer-logo24.png'));
    }
  }
  const setupData=JSON.parse(fs.readFileSync(path.join(root,'fixtures/setup.json')));
  const setup=svg(await setupScreen(setupData));
  fs.writeFileSync(path.join(srcDir,'state-setup.svg'),setup);
  await sharp(Buffer.from(setup)).png().toFile(path.join(rawDir,'state-setup.png'));
  const low=svg(await normalE(JSON.parse(fs.readFileSync(path.join(root,'fixtures/normal-night.json')))));
  fs.writeFileSync(path.join(srcDir,'state-low-battery.svg'),low);
  await sharp(Buffer.from(low)).png().toFile(path.join(rawDir,'state-low-battery.png'));
  // The firmware handoff set is complete even when fixtures do not exercise an icon.
  for(const n of Object.keys(names).filter(n=>!n.startsWith('type') && !['dawn','dusk','lowBattery'].includes(n)))
    for(const size of [66,32,36]) await icon(n,size);
  for(const n of ['dawn','dusk']) await icon(n,30);
  for(const n of ['refresh','lowBattery']) await icon(n,14);
  for(const size of [20,64]) await icon('logo',size);
  if(buildAll){
    // Historical concept sampling belongs only to exports/archive/.
    for(const n of ['clearDay','partlyDay','clearNight','partlyNight','rainDay','snowDay','mixDay','thunderDay','typeRain','typeSnow','typeMix','typeThunder','refresh','logo'])
      for(const size of (n==='logo'?[18,24]:n==='refresh'?[12]:sizes)) await icon(n,size);
  }
  if(buildAll){
    const audit=svg(await auditSheet());
    fs.writeFileSync(path.join(srcDir,'audit-font-icon.svg'),audit);
    await sharp(Buffer.from(audit)).png().toFile(path.join(rawDir,'audit-font-icon.png'));
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
