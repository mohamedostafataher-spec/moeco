import fs from 'fs';
import path from 'path';

const walkSync = (dir: string, filelist: string[] = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const dirs = [];
if (fs.existsSync('pages')) dirs.push('pages');
if (fs.existsSync('components')) dirs.push('components');

const files = dirs.flatMap(dir => walkSync(dir));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Horizontal Issues & Hardcoded Dimensions Fixes
  content = content.replace(/min-w-\[([0-9]{3,})px\]/g, 'w-full sm:w-auto sm:min-w-[$1px]');
  content = content.replace(/w-\[([0-9]{3,})px\]/g, 'w-full sm:max-w-[$1px]');
  content = content.replace(/\bw-80\b/g, 'w-full sm:w-80');
  content = content.replace(/\bw-96\b/g, 'w-full sm:w-96');
  
  // Height fixes (let flex or Grid contain heights, but preserve chart containers on desktop)
  content = content.replace(/h-\[(300|400|500|600|650)px\]/g, 'h-[300px] sm:h-[$1px]'); // charts need explicit height, so default to 300px on mobile
  
  // Wrap / Text Overflow fixes
  // Change whitespace-nowrap to whitespace-normal on mobile, nowrap on desktop
  content = content.replace(/\bwhitespace-nowrap\b/g, 'whitespace-normal sm:whitespace-nowrap break-words');
  
  // Replace absolute dimensions that push out of viewport
  content = content.replace(/-right-20/g, '-right-10 sm:-right-20');
  content = content.replace(/-left-20/g, '-left-10 sm:-left-20');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
