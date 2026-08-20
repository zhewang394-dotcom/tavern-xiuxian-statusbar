import fs from 'fs';

const distHtmlPath = 'D:/AGENT/AI/秋青子/本格修仙_重构项目/05_GitHub开源分发仓库/tavern-xiuxian-statusbar/dist/修仙状态栏/index.html';
let html = fs.readFileSync(distHtmlPath, 'utf8');

// 1. 去除模块导出，转为纯 IIFE 执行（支持任意函数名 QF, WF 等）
html = html.replace(/export\s+default\s+([A-Za-z0-9_$]+)\(\);?<\/script>/, '$1();</script>');

// 2. 移除 type="module" 和 crossorigin，让 jQuery 在 iframe 中直接执行
html = html.replace(/<script\s+type="module"\s+crossorigin>/g, '<script>');

fs.writeFileSync(distHtmlPath, html, 'utf8');

console.log('✅ dist/修仙状态栏/index.html 彻底清洗完成！');
