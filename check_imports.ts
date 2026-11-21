
import fs from 'fs';
import path from 'path';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  'path', 'fs', 'http', 'https', 'crypto', 'os', 'url', 'events', 'buffer', 'util', 'stream', 'zlib', 'querystring', 'string_decoder', 'timers', 'tls', 'net', 'dgram', 'dns', 'vite'
]);

function getFiles(dir: string, allFiles: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        getFiles(name, allFiles);
      }
    } else {
      if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) {
        allFiles.push(name);
      }
    }
  }
  return allFiles;
}

const allFiles = getFiles('.');
const missing = new Set();

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
  imports.forEach(imp => {
    const name = imp.match(/from\s+['"]([^'"]+)['"]/)[1];
    if (name.startsWith('.') || name.startsWith('@/')) return;
    
    // Handle scoped packages like @supabase/supabase-js
    const parts = name.split('/');
    const pkgName = name.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    
    if (!dependencies.has(pkgName)) {
      missing.add(`${pkgName} (in ${file})`);
    }
  });
});

console.log(Array.from(missing).join('\n'));
