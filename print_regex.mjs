import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('D:/AGENT/AI/秋青子/本格修仙_重构项目/00_原始母卡基线/raw_card.json', 'utf8'));
const cardData = raw.data || raw;

console.log('Regex scripts:');
cardData.extensions.regex_scripts.forEach((r, idx) => {
  console.log(`[${idx}] ${r.scriptName}:`);
  console.log(`  findRegex: ${JSON.stringify(r.findRegex)}`);
  console.log(`  placement: ${JSON.stringify(r.placement)}`);
  console.log(`  disabled: ${r.disabled}, markdownOnly: ${r.markdownOnly}, promptOnly: ${r.promptOnly}, maxDepth: ${r.maxDepth}`);
  console.log(`  replaceString: ${JSON.stringify(r.replaceString)}`);
});
