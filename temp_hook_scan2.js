const fs = require('fs');
const path = require('path');
const root = process.cwd();
const hooks = ['useState','useEffect','useMemo','useRouter','usePathname','useTransition'];
const hookRegex = new RegExp(`\\b(?:${hooks.join('|')})\\b`);
const functionStartRegex = /^(export\s+)?(function\s+\w+\s*\(|const\s+\w+\s*=\s*\(?\s*\{?[^=]*\)?\s*=>\s*\{|const\s+\w+\s*=\s*function\s*\()/;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(p);
    } else if (ent.isFile() && p.endsWith('.tsx')) {
      const text = fs.readFileSync(p, 'utf8');
      if (!text.includes('"use client"') && !text.includes("'use client'")) continue;
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (functionStartRegex.test(line.trim())) {
          let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
          let hooksSeen = false;
          let earlyReturnBeforeHooks = false;
          let j = i + 1;
          for (; j < lines.length && braceCount > 0; j++) {
            const l = lines[j];
            if (!hooksSeen && /\bif\s*\([^)]*\)\s*return\b/.test(l)) {
              earlyReturnBeforeHooks = true;
            }
            if (!hooksSeen && hookRegex.test(l)) {
              hooksSeen = true;
            }
            braceCount += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
          }
          if (earlyReturnBeforeHooks && !hooksSeen) {
            console.log(`POTENTIAL HOOK VIOLATION ${p}:${i+1}`);
            console.log(`  function start: ${line.trim()}`);
          }
          if (earlyReturnBeforeHooks && hooksSeen) {
            console.log(`EARLY RETURN BEFORE HOOKS IN ${p}:${i+1}`);
            console.log(`  function start: ${line.trim()}`);
          }
          i = j;
        }
      }
    }
  }
}
walk(root);
