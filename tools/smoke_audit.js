const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dom = new JSDOM(`<!doctype html><html><body>
<div id="tabs"><button class="tab active" data-tab="audit"></button></div>
<section class="panel" data-tab="audit"></section>
</body></html>`, { url: 'http://localhost' });

global.window = dom.window;
global.document = dom.window.document;
window.CURRENT_USER = 'tester';
window.currentUser = 'test-user';
window.can = () => true;
window.alert = () => {};
window.confirm = () => true;
window.uid = () => 'id';
window.saveDB = () => {};
window.getUISettings = () => ({ language: 'en' });
window.getTranslation = (lang, key, fallback) => fallback || key;
global.getUISettings = () => ({ language: 'en' });
global.getTranslation = (lang, key, fallback) => fallback || key;

const scriptPath = path.join(__dirname, '..', 'modules', 'audit_log.js');
dom.window.eval(fs.readFileSync(scriptPath, 'utf8'));

window.db = { audit: [] };
for (let i = 0; i < 5; i++) {
  window.db.audit.push({
    ts: `2024-01-0${i + 1} 00:00:00`,
    user: `u${i}`,
    module: 'mod',
    action: 'act',
    refId: String(i),
    details: 'd',
    qty: ''
  });
}
const before = window.db.audit.length;
assert.ok(before >= 5, 'audit length should be >= 5');

window.renderAudit();

assert.strictEqual(window.db.audit.length, before, 'renderAudit should not modify audit array');
const rows = document.querySelectorAll('#auditTable tbody tr').length;
assert.strictEqual(rows, before, 'renderAudit should produce one row per entry');

console.log('smoke:audit ok');
