// Regenerate the canonical design frames and icon inventory.
// Run node design/build.js [--all], then threshold.py and verify.py (or ./build.sh).
// The --all option also regenerates the historical archive. Never edit .build/ by hand.
const fs=require('fs');
const path=require('path');
const root=__dirname;
const buildAll=process.argv.includes('--all');
const {renderNormalSvg,renderSetupSvg,renderConceptSvg,renderAuditSvg,rasterizeSvg,
  getIconPng,iconNames,iconSizes}=require('./lib/render.js');
const iconDir=path.join(root,'assets/icons');
const srcDir=path.join(root,'.build/svg');
const rawDir=path.join(root,'.build/raw');

function clearOutput() {
  for(const dir of [iconDir,srcDir,rawDir]) {
    fs.mkdirSync(dir,{recursive:true});
    for(const entry of fs.readdirSync(dir)) fs.rmSync(path.join(dir,entry),{recursive:true,force:true});
  }
}
function fixture(file) {return JSON.parse(fs.readFileSync(path.join(root,'fixtures',file)));}
async function writeFrame(name,content) {
  fs.writeFileSync(path.join(srcDir,`${name}.svg`),content);
  fs.writeFileSync(path.join(rawDir,`${name}.png`),await rasterizeSvg(content));
}
async function writeIcon(name,size) {
  fs.writeFileSync(path.join(iconDir,`${name}-${size}.png`),await getIconPng(name,size));
}
async function main() {
  clearOutput();
  if(buildAll) for(const name of ['A','B','C','D','E','E1','E2','E3'])
    await writeFrame(`concept-${name}`,await renderConceptSvg(name));
  for(const id of ['summer','winter','spring','widths','night']) {
    const d=fixture(`normal-${id}.json`);
    await writeFrame(`normal-${id}`,await renderNormalSvg(d));
    if(!buildAll) continue;
    const {hourly}=fixture(`archive/sixhour-${id}.json`);
    await writeFrame(`normal-6hour-${id}`,await renderNormalSvg({...d,hourly},{mode:'six'}));
    if(id==='summer') {
      await writeFrame('normal-summer-logo18',await renderNormalSvg(d,{logoSize:18}));
      await writeFrame('normal-summer-logo24',await renderNormalSvg(d,{logoSize:24}));
    }
  }
  await writeFrame('state-setup',await renderSetupSvg(fixture('setup.json')));
  await writeFrame('state-low-battery',await renderNormalSvg(fixture('normal-night.json')));

  // Keep the complete icon inventory even when a fixture does not use an icon.
  for(const name of iconNames.filter(n=>!n.startsWith('type')&&!['dawn','dusk','lowBattery'].includes(n)))
    for(const size of [66,32,36]) await writeIcon(name,size);
  for(const name of ['dawn','dusk']) await writeIcon(name,30);
  for(const name of ['refresh','lowBattery']) await writeIcon(name,14);
  for(const size of [20,64]) await writeIcon('logo',size);
  if(buildAll) {
    for(const name of ['clearDay','partlyDay','clearNight','partlyNight','rainDay','snowDay','mixDay','thunderDay','typeRain','typeSnow','typeMix','typeThunder','refresh','logo'])
      for(const size of (name==='logo'?[18,24]:name==='refresh'?[12]:iconSizes)) await writeIcon(name,size);
    await writeFrame('audit-font-icon',await renderAuditSvg());
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
