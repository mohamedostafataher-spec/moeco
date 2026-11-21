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
      if (content.includes('carbon_activities')) {
        content = content.replace(/carbon_activities/g, 'consumption_records');
        fs.writeFileSync(fullPath, content);
        console.log('Replaced in', fullPath);
      }
    }
  }
}

replaceInDir('./pages');
replaceInDir('./services');
