const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = [
  ...walk('app'),
  ...walk('components'),
];

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace all zinc with slate
  newContent = newContent.replace(/zinc-/g, 'slate-');
  
  // Replace all indigo with blue
  newContent = newContent.replace(/indigo-/g, 'blue-');

  // One specific edge case: if there's any '#1f202c' or hardcoded colors I added
  newContent = newContent.replace(/bg-\[#1a1b26\]/g, 'bg-slate-900');
  newContent = newContent.replace(/bg-\[#1f202c\]/g, 'bg-slate-800');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});

console.log(`Changed ${changedCount} files.`);
