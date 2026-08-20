import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('D:/AGENT/AI/秋青子/本格修仙_重构项目/00_原始母卡基线/raw_card.json', 'utf8'));
const cardData = raw.data || raw;
const scripts = cardData.extensions?.tavern_helper?.scripts || [];

for (const s of scripts) {
  const code = s.content || '';
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('StatusPlaceHolder') || line.includes('PlaceHolder') || line.includes('now_plot') || line.includes('customized')) {
      console.log(`Script [${s.name}] Line ${idx}: ${line.slice(0, 150)}`);
    }
  });
}
console.log('Done scanning TH scripts.');
