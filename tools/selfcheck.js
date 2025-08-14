// tools/selfcheck.js — offline sanity scan for Lilija (no external deps)
const fs = require('fs');
const path = require('path');

const CANDIDATES = [
  'index.html',
  'main.js',
  'modules/audit_log.js',
  'modules/users_admin.js'
].filter((p) => fs.existsSync(p));

function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

const issues = [];
function push(file, msg) { issues.push(`${file}: ${msg}`); }

// Scan each file
for (const f of CANDIDATES) {
  const s = read(f);

  // 1) Truncation markers / stray "/" lines
  if (/users\.\[\s*\]/.test(s) || /users\.\[/.test(s)) push(f, 'Suspicious "users.[...]" (looks truncated).');
  if (/^\s*\/\s*$/m.test(s)) push(f, 'Stray "/" line detected.');

  // 2) Duplicate "const controls" within same function (cheap heuristic)
  const controlsMatches = (s.match(/const\s+controls\s*=/g) || []).length;
  if (controlsMatches > 1) push(f, `Found ${controlsMatches} occurrences of "const controls =" (watch for duplicates in the same function).`);

  // 3) ensureCounters recursion (ensure it doesn't call itself)
  const ecBlocks = s.match(/function\s+ensureCounters\s*\([\s\S]*?\}\s*/g);
  if (ecBlocks && ecBlocks.some(b => /ensureCounters\s*\(/.test(b.replace(/function\s+ensureCounters[\s\S]*?\{/, ''))))
    push(f, 'ensureCounters appears to call itself (potential recursion).');

  // 4) loadDB inside render* (anti-pattern)
  const renders = s.match(/function\s+render\w+\s*\([\s\S]*?\}\s*/g) || [];
  for (const block of renders) {
    if (/loadDB\s*\(/.test(block)) push(f, 'loadDB() used inside a render* function (move to init path).');
  }

  // 5) JS syntax check (best-effort)
  if (f.endsWith('.js')) {
    try { new Function(s); } catch (e) { push(f, `Syntax error: ${e.message}`); }
  }
}

// Report
if (!issues.length) {
  console.log('OK: selfcheck passed (no blocking issues).');
  process.exit(0);
} else {
  console.log('Selfcheck issues:\n- ' + issues.join('\n- '));
  // Do not fail hard; allow Codex to propose patches
  process.exit(0);
}
