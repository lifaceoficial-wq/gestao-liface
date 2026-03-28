const fs = require('fs');
const path = require('path');
const pagesDir = path.join(process.cwd(), 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
let changed = 0;
for (const file of files) {
  const fp = path.join(pagesDir, file);
  let c = fs.readFileSync(fp, 'utf-8');
  if (c.includes('INITIAL_MOCK_DATA')) {
    c = c.replace(/return INITIAL_MOCK_DATA;/g, 'return [];');
    c = c.replace(/return INITIAL_MOCK_DATA/g, 'return []');
    fs.writeFileSync(fp, c);
    console.log('Updated ' + file);
    changed++;
  }
}
console.log('Modified ' + changed + ' files.');
