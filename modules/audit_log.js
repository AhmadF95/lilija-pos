// LILIJA audit_log.js
(function () {
  if (window.__lilijaAuditLoaded) return;
  window.__lilijaAuditLoaded = true;

  // وقت محلي بشكل بسيط
  function nowLocalISO() {
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    return (
      d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
    );
  }

  // تسجيل حركة + حفظ + رندر فوري
  window.recordAudit = function (action, module, refId, details, qty) {
      try {
      if (!window.db || typeof window.db !== 'object') return;
      if (!Array.isArray(window.db.audit)) window.db.audit = [];

      const me = window.CURRENT_USER || 'unknown';
      const id = (typeof uid === 'function') ? uid() : Math.random().toString(36).slice(2);

      window.db.audit.unshift({
        id,
        ts: nowLocalISO(),
        user: me,
        module,
        action,
        refId: refId || '',
        details: details || '',
        qty: (qty != null ? qty : '')
      });

      if (window.db.audit.length > 5000) {
        window.db.audit = window.db.audit.slice(0, 5000);
      }

      if (typeof saveDB === 'function') saveDB(window.db);
      try { renderAudit(); } catch (_) { /* ignore */ }
    } catch (err) {
      console.warn('recordAudit failed', err);
    }
  };

  // عرض جدول السجل
  window.renderAudit = function () {
    const panel = document.querySelector('section.panel[data-tab="audit"]');
    if (!panel) return;

    // تأكّد من وجود القاعدة في الذاكرة
    if (!window.db || !Array.isArray(window.db.audit)) return;

    // لا تُظهر اللوحة إلا إذا تبويب السجل هو النشط
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    panel.hidden = activeTab !== 'audit';

    // بناء الهيكل عند أول مرة
    if (!panel.querySelector('#auditTable')) {
      panel.innerHTML = `
        <h2>سجل الحركات</h2>
        <div class="hint">يسجّل جميع الإضافات/التعديلات/الحذف مع اسم المستخدم والوقت.</div>
        <div class="flex" style="gap:8px;margin:8px 0">
          <input id="auditSearch" placeholder="ابحث بالاسم/النوع/المستخدم..." />
          <button id="btnAuditExport" type="button">⬇️ تصدير CSV</button>
          <button id="btnAuditClear" class="btn-danger" type="button">🗑️ مسح السجل</button>
        </div>
        <div class="table-wrap">
          <table id="auditTable">
            <thead>
              <tr>
                <th>الوقت</th><th>المستخدم</th><th>الوحدة</th>
                <th>الإجراء</th><th>المعرّف</th><th>الاسم/التفاصيل</th><th>الكمية</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>`;
      const s = panel.querySelector('#auditSearch');
      if (s) s.oninput = () => { try { renderAudit(); } catch (_) {} };
    }

    // تعبئة الصفوف
    const tbody = panel.querySelector('#auditTable tbody');
    if (!tbody) return;

    const term = (panel.querySelector('#auditSearch')?.value || '').toLowerCase();
    const src = window.db.audit;

    const rows = src.filter(r => {
      if (!term) return true;
      return (
        String(r.user).toLowerCase().includes(term) ||
        String(r.module).toLowerCase().includes(term) ||
        String(r.action).toLowerCase().includes(term) ||
        String(r.details || '').toLowerCase().includes(term)
      );
    }).slice(0, 1000);

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.ts || ''}</td>
        <td>${r.user || ''}</td>
        <td>${r.module || ''}</td>
        <td>${r.action || ''}</td>
        <td>${r.refId || ''}</td>
        <td>${r.details || ''}</td>
        <td>${r.qty || ''}</td>
      </tr>`).join('');

    // تصدير CSV
    const btnExp = panel.querySelector('#btnAuditExport');
    if (btnExp) btnExp.onclick = () => {
      const csv = ['time,user,module,action,refId,details,qty']
        .concat(src.map(r =>
          [r.ts, r.user, r.module, r.action, r.refId, (r.details || '').replace(/,/g, ';'), r.qty].join(',')
        ))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'audit.csv'; a.click();
      URL.revokeObjectURL(url);
    };

    // مسح السجل
    const btnClr = panel.querySelector('#btnAuditClear');
    if (btnClr) btnClr.onclick = () => {
      if (window.can && !can('audit', 'delete')) return alert('غير مسموح');
      if (!confirm('مسح كامل السجل؟')) return;
      window.db.audit = [];
      if (typeof saveDB === 'function') saveDB(window.db);
      renderAudit();
    };
  };

  // جعل الاستماع للضغط متين (حتى لو ضغط داخل محتوى زر التبويب)
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab[data-tab="audit"]');
    if (tab) {
      setTimeout(() => { try { renderAudit(); } catch (_) {} }, 0);
    }
  });

  // دعم التفعيل البرمجي للتبويب
  (function hookActivateTabOnce() {
    if (window.__auditHookedActivate) return;
    window.__auditHookedActivate = true;
    const orig = window.activateTab;
    window.activateTab = function (id) {
      const ret = orig ? orig.apply(this, arguments) : undefined;
      if (id === 'audit') {
        setTimeout(() => { try { renderAudit(); } catch (_) {} }, 0);
      }
      return ret;
    };
  })();
  // تهيئة أولية تتم في index.html
})();
