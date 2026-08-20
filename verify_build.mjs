import fs from 'fs';

const html = fs.readFileSync('D:/AGENT/AI/秋青子/本格修仙_重构项目/05_GitHub开源分发仓库/tavern-xiuxian-statusbar/dist/修仙状态栏/index.html', 'utf8');

console.log('--- Verification Report ---');
console.log('1. Private Zod stripped:', !html.includes('ZodType'));
console.log('2. Global z bridged:', html.includes('globalZod'));
console.log('3. Export default stripped:', !html.includes('export default'));
console.log('4. Module tag stripped:', !html.includes('type="module"'));
console.log('5. Protagonist card included in Relations:', html.includes('xy-protagonist-card') && html.includes('本尊'));
console.log('6. HTML total length:', html.length);
