const fs = require('fs');
const path = require('path');
const root = process.cwd();
const hooks = ['useState','useEffect','useMemo','useRouter','usePathname','useTransition'];
const hookRegex = new RegExp(`\\b(?:${hooks.join('|')})\\b`);

function findClientFiles(dir) {
  const results = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      results.push(...findClientFiles(p));
    } else if (ent.isFile() && p.endsWith('.tsx')) {
      const text = fs.readFileSync(p, 'utf8');
      if (text.includes('"use client"') || text.includes("'use client'")) {
        results.push(p);
      }
    }
  }
  return results;
}

for (const file of findClientFiles(root)) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\bif\s*\([^)]*\)\s*return/.test(line)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
        if (hookRegex.test(lines[j])) {
          console.log(`HOOK AFTER EARLY RETURN: ${file}:${i+1}: ${line.trim()}`);
          console.log(`  ${j+1}: ${lines[j].trim()}`);
        }
      }
    }
    if (/\bif\s*\([^)]*\)\s*\{/.test(line) && hookRegex.test(line)) {
      console.log(`HOOK IN IF LINE: ${file}:${i+1}: ${line.trim()}`);
    }
    if (/\bfor\b|\bwhile\b/.test(line) && hookRegex.test(line)) {
      console.log(`HOOK IN LOOP LINE: ${file}:${i+1}: ${line.trim()}`);
    }
    if (/\breturn\b/.test(line) && hookRegex.test(line)) {
      console.log(`HOOK IN RETURN LINE: ${file}:${i+1}: ${line.trim()}`);
    }
  }
}
