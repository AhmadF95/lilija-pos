const { JSDOM } = require('jsdom');
const fs = require('fs');
const vm = require('vm');

const dom = new JSDOM(`<!DOCTYPE html><body>
  <div class="tab active" data-tab="audit"></div>
  <section class="panel" data-tab="audit"></section>
</body>`, { runScripts: 'outside-only' });

const { window } = dom;
const { document } = window;

window.saveDB = () => {};
window.loadDB = () => { throw new Error('loadDB called'); };
window.db = { audit: [] };
for (let i = 0; i < 5; i++) {
  window.db.audit.push({
    ts: `2024-01-0${i+1} 00:00:00`,
    user: 'u',
    module: 'm',
    action: 'a',
    refId: '',
    details: '',
    qty: ''
  });
}

const auditSrc = fs.readFileSync('modules/audit_log.js', 'utf8');
vm.runInContext(auditSrc, dom.getInternalVMContext());

const before = window.db.audit.length;
if (before < 5) {
  console.error('expected at least 5 audit entries');
  process.exit(1);
}

window.renderAudit();
const rows = document.querySelectorAll('#auditTable tbody tr').length;
if (!rows) {
  console.error('renderAudit produced no rows');
  process.exit(1);
}
if (window.db.audit.length !== before) {
  console.error('renderAudit mutated audit log');
  process.exit(1);
}

console.log('smoke:audit ok');
