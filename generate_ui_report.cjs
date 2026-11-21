const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

let report = "تقرير تحليل ربط جميع شاشات التطبيق بقاعدة البيانات (Supabase)\n=====================\n\n";

let unlinkedPages = [];
let linkedPagesCount = 0;

pages.forEach(page => {
  const content = fs.readFileSync(path.join(pagesDir, page), 'utf8');
  let isConnected = false;
  
  if (content.includes('supabase')) isConnected = true;
  if (content.includes('Service')) isConnected = true; 
  if (content.includes('sync') || content.includes('Engine')) isConnected = true;

  if (isConnected) {
    linkedPagesCount++;
  } else {
    unlinkedPages.push(page);
  }
});

console.log(`إجمالي الشاشات المفحوصة: ${pages.length}`);
console.log(`الشاشات المربوطة بنجاح: ${linkedPagesCount}`);
console.log(`الشاشات الغير مربوطة (شاشات ثابتة أو إعدادات محلية):`);
console.log(unlinkedPages.map(p => `- ${p}`).join('\n'));
