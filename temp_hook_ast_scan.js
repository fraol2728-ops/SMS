const ts = require('typescript');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const hookNames = new Set(['useState','useEffect','useMemo','useCallback','useRef','useContext','useReducer','useRouter','usePathname','useSearchParams','useTransition']);
function isHookCall(node) {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && hookNames.has(node.expression.escapedText);
}
function traverse(node, state, report) {
  if (!node) return;
  const parent = state.parentStack[state.parentStack.length - 1];
  if (isHookCall(node)) {
    const nested = state.parentStack.some(p => ts.isIfStatement(p) || ts.isForStatement(p) || ts.isForOfStatement(p) || ts.isForInStatement(p) || ts.isWhileStatement(p) || ts.isDoStatement(p) || ts.isSwitchStatement(p) || ts.isConditionalExpression(p) || ts.isCatchClause(p));
    if (nested) {
      report.nestedHooks.push({line: ts.getLineAndCharacterOfPosition(state.sourceFile, node.pos).line + 1, text: node.getText(state.sourceFile)});
    }
    report.firstHookPos = report.firstHookPos ?? node.pos;
  }
  if (ts.isReturnStatement(node) && report.firstHookPos === undefined) {
    report.returnBeforeHook = report.returnBeforeHook || [];
    report.returnBeforeHook.push({line: ts.getLineAndCharacterOfPosition(state.sourceFile, node.pos).line + 1, text: node.getText(state.sourceFile)});
  }
  state.parentStack.push(node);
  node.forEachChild(child => traverse(child, state, report));
  state.parentStack.pop();
}
function inspectFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (!text.includes('"use client"') && !text.includes("'use client'")) return;
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues = [];
  function visit(node) {
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const report = { nestedHooks: [], returnBeforeHook: [], firstHookPos: undefined, node };
      const state = { sourceFile, parentStack: [] };
      traverse(node.body, state, report);
      if (report.nestedHooks.length || report.returnBeforeHook.length) {
        issues.push(report);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (issues.length) {
    console.log(`FILE: ${filePath}`);
    issues.forEach(r => {
      if (r.returnBeforeHook.length) {
        r.returnBeforeHook.forEach(item => console.log(`  RETURN BEFORE HOOK @${item.line}: ${item.text}`));
      }
      if (r.nestedHooks.length) {
        r.nestedHooks.forEach(item => console.log(`  NESTED HOOK @${item.line}: ${item.text}`));
      }
    });
    console.log('');
  }
}
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === '.next') continue;
      walk(p);
    } else if (ent.isFile() && p.endsWith('.tsx')) {
      inspectFile(p);
    }
  }
}
walk(root);
