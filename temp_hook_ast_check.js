const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const hookNames = new Set(['useState','useEffect','useMemo','useCallback','useRef','useContext','useReducer','useRouter','usePathname','useSearchParams','useTransition']);

function isHookCall(node) {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && hookNames.has(node.expression.escapedText);
}

function containsTopLevelHook(node) {
  let found = false;
  function visit(n) {
    if (found) return;
    if (isHookCall(n)) {
      found = true;
      return;
    }
    if (ts.isFunctionLike(n) && n !== node) return; // do not dive into nested functions
    ts.forEachChild(n, visit);
  }
  visit(node);
  return found;
}

function inspectFunction(node, sourceFile, filePath) {
  const body = node.body;
  if (!body || !ts.isBlock(body)) return null;
  let firstHookStatementIndex = Infinity;
  const statements = body.statements;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (containsTopLevelHook(stmt)) {
      firstHookStatementIndex = i;
      break;
    }
  }
  if (firstHookStatementIndex === Infinity) return null;

  const issues = [];
  for (let i = 0; i < firstHookStatementIndex; i++) {
    const stmt = statements[i];
    if (ts.isIfStatement(stmt)) {
      const thenBlock = stmt.thenStatement;
      if (ts.isReturnStatement(thenBlock) || (ts.isBlock(thenBlock) && thenBlock.statements.some(s => ts.isReturnStatement(s)))) {
        const line = sourceFile.getLineAndCharacterOfPosition(stmt.getStart(sourceFile)).line + 1;
        issues.push({type: 'if-return-before-hooks', line, text: stmt.getText(sourceFile)});
      }
    }
    if (ts.isReturnStatement(stmt)) {
      const line = sourceFile.getLineAndCharacterOfPosition(stmt.getStart(sourceFile)).line + 1;
      issues.push({type: 'return-before-hooks', line, text: stmt.getText(sourceFile)});
    }
  }
  // also check hooks inside if/loops after first hook statement
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    function scan(n, parentIsLoopOrIf=false) {
      if (isHookCall(n) && parentIsLoopOrIf) {
        const line = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile)).line + 1;
        issues.push({type: 'hook-in-nested-block', line, text: n.getText(sourceFile)});
      }
      if (ts.isFunctionLike(n) && n !== node) return; // ignore nested functions
      let nextParent = parentIsLoopOrIf || ts.isIfStatement(n) || ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isForInStatement(n) || ts.isWhileStatement(n) || ts.isDoStatement(n) || ts.isSwitchStatement(n);
      ts.forEachChild(n, child => scan(child, nextParent));
    }
    scan(stmt, false);
  }

  if (issues.length) {
    return {functionName: node.name ? node.name.getText(sourceFile) : '(anonymous)', startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1, issues};
  }
  return null;
}

function inspectFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes('"use client"') && !text.includes("'use client'")) return;
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const results = [];
  function visit(node) {
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const issue = inspectFunction(node, sourceFile, filePath);
      if (issue) results.push(issue);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return results;
}

function walk(dir) {
  const findings = [];
  for (const ent of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.next') continue;
      findings.push(...walk(p));
    } else if (ent.isFile() && p.endsWith('.tsx')) {
      findings.push(...inspectFile(p).map(f => ({file: p, ...f})));
    }
  }
  return findings;
}

const issues = walk(root);
if (issues.length === 0) {
  console.log('No hook-order issues found in client files.');
} else {
  issues.forEach(i => {
    console.log(`FILE: ${i.file}`);
    console.log(`  FUNCTION @${i.startLine}: ${i.functionName}`);
    i.issues.forEach(issue => {
      console.log(`    ${issue.type} @${issue.line}: ${issue.text.replace(/\s+/g,' ')} `);
    });
    console.log('');
  });
}
