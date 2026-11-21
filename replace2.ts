import fs from 'fs';
import path from 'path';

function replaceInDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('carbon_impact')) {
        content = content.replace(/carbon_impact/g, 'co2');
        fs.writeFileSync(fullPath, content);
        console.log('Replaced in', fullPath);
      }
    }
  }
}

replaceInDir('./pages');
replaceInDir('./services');
