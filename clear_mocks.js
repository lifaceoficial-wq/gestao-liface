const fs = require('fs');
const path = require('path');
const pagesDir = path.join(process.cwd(), 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
let changed = 0;
for (const file of files) {
  const fp = path.join(pagesDir, file);
  let c = fs.readFileSync(fp, 'utf-8');
  if (c.includes('INITIAL_MOCK_DATA')) {
    // some return INITIAL_MOCK_DATA either inside useState or outside
    c = c.replace(/return INITIAL_MOCK_DATA;/g, 'return [];');
    c = c.replace(/return INITIAL_MOCK_DATA/g, 'return []');
    
    // Also remove the definition of INITIAL_MOCK_DATA so typescript doesn't complain
    c = c.replace(/(const INITIAL_MOCK_DATA =[\s\S]*?(?=\n\n|\nexport))/g, '');
    
    fs.writeFileSync(fp, c);
    console.log('Updated ' + file);
    changed++;
  }
}
console.log('Modified ' + changed + ' files.');
