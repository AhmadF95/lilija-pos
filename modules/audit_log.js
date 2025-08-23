// LILIJA audit_log.js
(function () {
  if (window.__lilijaAuditLoaded) return;
  window.__lilijaAuditLoaded = true;

  // Module-scope state for pagination and lazy rendering
  const auditUIState = {
    filteredRows: [],
    mode: 'paged', // 'paged' or 'lazy'
    currentPage: 1,
    pageSize: 100,
    loadedCount: 0,
    lastSearchTerm: '',
    totalFiltered: 0
  };

  // Constants for lazy loading
  const CHUNK_SIZE = 300;
  const SCROLL_THRESHOLD = 250;

  // Helper function for safe translation with fallback
  function safeGetTranslation(lang, key, fallback = key) {
    try {
      if (typeof getTranslation === 'function') {
        return getTranslation(lang, key) || fallback;
      }
      return fallback;
    } catch (e) {
      return fallback;
    }
  }

  // وقت محلي بشكل بسيط
  function nowLocalISO() {
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    return (
      d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
    );
  }

  // Apply filtered results based on search term and update state
  function applyFiltering(searchTerm) {
    if (!window.db || !Array.isArray(window.db.audit)) {
      auditUIState.filteredRows = [];
      auditUIState.totalFiltered = 0;
      return;
    }

    const term = searchTerm.toLowerCase();
    auditUIState.filteredRows = window.db.audit.filter(r => {
      if (!term) return true;
      return (
        String(r.user || '').toLowerCase().includes(term) ||
        String(r.module || '').toLowerCase().includes(term) ||
        String(r.action || '').toLowerCase().includes(term) ||
        String(r.details || '').toLowerCase().includes(term)
      );
    });
    auditUIState.totalFiltered = auditUIState.filteredRows.length;
    auditUIState.lastSearchTerm = searchTerm;
  }

  // Reset pagination state on search or mode change
  function resetUIState(newMode = null) {
    auditUIState.currentPage = 1;
    auditUIState.loadedCount = 0;
    if (newMode) auditUIState.mode = newMode;
  }

  // Get current page data for paged mode
  function getCurrentPageData() {
    const startIdx = (auditUIState.currentPage - 1) * auditUIState.pageSize;
    const endIdx = startIdx + auditUIState.pageSize;
    return auditUIState.filteredRows.slice(startIdx, endIdx);
  }

  // Get data for lazy mode (up to loadedCount)
  function getLazyModeData() {
    return auditUIState.filteredRows.slice(0, auditUIState.loadedCount);
  }
  // تسجيل حركة + حفظ + رندر فوري
  window.recordAudit = function (action, module, refId, details, qty) {
      try {
      if (!window.db || typeof window.db !== 'object') return;
      if (!Array.isArray(window.db.audit)) window.db.audit = [];

      const me = window.currentUser || 'unknown';
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
      const lang = (getUISettings?.().language) || 'ar';
      panel.innerHTML = `
        <h2 data-i18n="auditTitle">${safeGetTranslation(lang, 'auditTitle', 'Audit Log')}</h2>
        <div class="hint" data-i18n="auditHint">${safeGetTranslation(lang, 'auditHint', 'System activity log')}</div>
        <div class="flex" style="gap:8px;margin:8px 0;align-items:center">
          <input id="auditSearch" data-i18n-placeholder="auditSearchPlaceholder" placeholder="${safeGetTranslation(lang, 'auditSearchPlaceholder', 'Search audit log...')}" />
          <label style="display:flex;align-items:center;gap:4px;white-space:nowrap">
            <input type="checkbox" id="auditLazyToggle" />
            <span data-i18n="auditLazyMode">${safeGetTranslation(lang, 'auditLazyMode', 'Lazy')}</span>
          </label>
          <button id="btnAuditExport" type="button">${safeGetTranslation(lang, 'btnAuditExport', 'Export')}</button>
          <button id="btnAuditClear" class="btn-danger" type="button">${safeGetTranslation(lang, 'btnAuditClear', 'Clear')}</button>
        </div>
        
        <!-- Pagination controls (shown in paged mode) -->
        <div id="auditPaginationControls" class="flex" style="gap:8px;margin:8px 0;align-items:center;flex-wrap:wrap">
          <label style="display:flex;align-items:center;gap:4px">
            <span data-i18n="auditPageSize">${safeGetTranslation(lang, 'auditPageSize', 'Page size:')}</span>
            <select id="auditPageSize">
              <option value="50">50</option>
              <option value="100" selected>100</option>
              <option value="250">250</option>
              <option value="500">500</option>
            </select>
          </label>
          <button id="auditPrevPage" type="button">${safeGetTranslation(lang, 'auditPrevPage', 'Previous')}</button>
          <button id="auditNextPage" type="button">${safeGetTranslation(lang, 'auditNextPage', 'Next')}</button>
        </div>
        
        <!-- Status display -->
        <div id="auditStatusDisplay" style="margin:8px 0;font-size:0.9em;color:var(--muted,#666)"></div>
        
        <div class="table-wrap" id="auditTableWrap" style="max-height:500px;overflow-y:auto">
          <table id="auditTable">
            <thead>
              <tr>
                <th data-i18n="thTime">${safeGetTranslation(lang, 'thTime', 'Time')}</th><th data-i18n="thUser">${safeGetTranslation(lang, 'thUser', 'User')}</th><th data-i18n="thModule">${safeGetTranslation(lang, 'thModule', 'Module')}</th>
                <th data-i18n="thAction">${safeGetTranslation(lang, 'thAction', 'Action')}</th><th data-i18n="thRefId">${safeGetTranslation(lang, 'thRefId', 'Ref ID')}</th><th data-i18n="thDetails">${safeGetTranslation(lang, 'thDetails', 'Details')}</th><th data-i18n="thQty">${safeGetTranslation(lang, 'thQty', 'Qty')}</th><th data-i18n="thViewDetails">${safeGetTranslation(lang, 'thViewDetails', 'View Details')}</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>`;
      
      // Setup event handlers
      const searchInput = panel.querySelector('#auditSearch');
      const lazyToggle = panel.querySelector('#auditLazyToggle');
      const pageSizeSelect = panel.querySelector('#auditPageSize');
      const prevButton = panel.querySelector('#auditPrevPage');
      const nextButton = panel.querySelector('#auditNextPage');
      const tableWrap = panel.querySelector('#auditTableWrap');
      
      // Search input handler
      if (searchInput) {
        searchInput.oninput = () => {
          const searchTerm = searchInput.value || '';
          applyFiltering(searchTerm);
          
          // Auto-enable lazy mode if filtered results > 2000
          if (auditUIState.totalFiltered > 2000 && auditUIState.mode !== 'lazy') {
            resetUIState('lazy');
            if (lazyToggle) lazyToggle.checked = true;
          }
          
          resetUIState(); // Reset to page 1 or reset lazy count
          updateDisplay();
        };
      }
      
      // Lazy mode toggle handler
      if (lazyToggle) {
        lazyToggle.onchange = () => {
          const newMode = lazyToggle.checked ? 'lazy' : 'paged';
          resetUIState(newMode);
          updateDisplay();
        };
      }
      
      // Page size change handler
      if (pageSizeSelect) {
        pageSizeSelect.onchange = () => {
          auditUIState.pageSize = parseInt(pageSizeSelect.value) || 100;
          resetUIState(); // Reset to page 1
          updateDisplay();
        };
      }
      
      // Pagination button handlers
      if (prevButton) {
        prevButton.onclick = () => {
          if (auditUIState.currentPage > 1) {
            auditUIState.currentPage--;
            updateDisplay();
          }
        };
      }
      
      if (nextButton) {
        nextButton.onclick = () => {
          const maxPage = Math.ceil(auditUIState.totalFiltered / auditUIState.pageSize);
          if (auditUIState.currentPage < maxPage) {
            auditUIState.currentPage++;
            updateDisplay();
          }
        };
      }
      
      // Infinite scroll handler for lazy mode
      if (tableWrap) {
        tableWrap.addEventListener('scroll', () => {
          if (auditUIState.mode !== 'lazy') return;
          
          const { scrollTop, scrollHeight, clientHeight } = tableWrap;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD;
          
          if (isNearBottom && auditUIState.loadedCount < auditUIState.totalFiltered) {
            // Load next chunk
            const nextChunkSize = Math.min(CHUNK_SIZE, auditUIState.totalFiltered - auditUIState.loadedCount);
            auditUIState.loadedCount += nextChunkSize;
            updateDisplay();
          }
        });
      }
    }

    // Initial filtering and display
    const searchInput = panel.querySelector('#auditSearch');
    const currentSearchTerm = searchInput ? searchInput.value || '' : '';
    
    // Always apply filtering to ensure filtered data is current
    applyFiltering(currentSearchTerm);
    
    // Auto-enable lazy mode if filtered results > 2000
    const lazyToggle = panel.querySelector('#auditLazyToggle');
    if (auditUIState.totalFiltered > 2000 && auditUIState.mode !== 'lazy') {
      resetUIState('lazy');
      if (lazyToggle) lazyToggle.checked = true;
    } else {
      resetUIState(); // Reset pagination state
    }
    
    updateDisplay();
    
    // Initialize modal handlers on first render
    initializeModalHandlers();
    
    // تصدير CSV with scope selection
    const btnExp = panel.querySelector('#btnAuditExport');
    if (btnExp) btnExp.onclick = () => {
      let exportData = [];
      let filename = 'audit.csv';
      
      // If there are multiple pages or filtered results, prompt for scope
      const hasMultiplePages = auditUIState.mode === 'paged' && Math.ceil(auditUIState.totalFiltered / auditUIState.pageSize) > 1;
      const hasFilteredData = auditUIState.totalFiltered !== window.db.audit.length;
      const isLazyMode = auditUIState.mode === 'lazy';
      
      if (hasMultiplePages || hasFilteredData || isLazyMode) {
        const scopeOptions = [];
        
        if (auditUIState.mode === 'paged') {
          scopeOptions.push('page - Current page only');
        } else {
          scopeOptions.push('page - Currently loaded rows');
        }
        
        if (hasFilteredData) {
          scopeOptions.push('filtered - All filtered results');
        }
        
        scopeOptions.push('all - Complete audit database');
        
        const prompt_msg = `Export scope options:\n${scopeOptions.join('\n')}\n\nEnter: page, filtered, or all (default: filtered)`;
        const scope = (prompt(prompt_msg, 'filtered') || 'filtered').toLowerCase().trim();
        
        switch (scope) {
          case 'page':
            exportData = auditUIState.mode === 'paged' ? getCurrentPageData() : getLazyModeData();
            filename = `audit-page-${auditUIState.currentPage || 'loaded'}.csv`;
            break;
          case 'all':
            exportData = window.db.audit || [];
            filename = 'audit-complete.csv';
            break;
          case 'filtered':
          default:
            exportData = auditUIState.filteredRows;
            filename = 'audit-filtered.csv';
            break;
        }
      } else {
        // Single page, no filtering - export all
        exportData = window.db.audit || [];
      }
      
      // Generate CSV
      const csv = ['time,user,module,action,refId,details,qty']
        .concat(exportData.map(r =>
          [r.ts, r.user, r.module, r.action, r.refId, (r.details || '').replace(/,/g, ';'), r.qty].join(',')
        ))
        .join('\n');
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = filename; 
      a.click();
      URL.revokeObjectURL(url);
    };
    
    // مسح السجل
    const btnClr = panel.querySelector('#btnAuditClear');
    if (btnClr) btnClr.onclick = () => {
      const lang = (getUISettings?.().language) || 'ar';
      if (window.can && !can('audit', 'delete')) return alert(safeGetTranslation(lang, 'auditNoPermission', 'No permission to delete audit logs'));
      if (!confirm(safeGetTranslation(lang, 'auditClearConfirm', 'Are you sure you want to clear the audit log?'))) return;
      window.db.audit = [];
      if (typeof saveDB === 'function') saveDB(window.db);
      
      // Reset state and re-render
      auditUIState.filteredRows = [];
      auditUIState.totalFiltered = 0;
      auditUIState.lastSearchTerm = '';
      resetUIState();
      renderAudit();
    };
  };

  // Update display based on current mode and state
  function updateDisplay() {
    const panel = document.querySelector('section.panel[data-tab="audit"]');
    if (!panel) return;

    const tbody = panel.querySelector('#auditTable tbody');
    const statusDisplay = panel.querySelector('#auditStatusDisplay');
    const paginationControls = panel.querySelector('#auditPaginationControls');
    const lazyToggle = panel.querySelector('#auditLazyToggle');
    
    if (!tbody) return;

    // Show/hide pagination controls based on mode
    if (paginationControls) {
      paginationControls.style.display = auditUIState.mode === 'paged' ? 'flex' : 'none';
    }
    
    // Sync lazy toggle with current mode
    if (lazyToggle && lazyToggle.checked !== (auditUIState.mode === 'lazy')) {
      lazyToggle.checked = auditUIState.mode === 'lazy';
    }

    let displayRows;
    let statusText;
    
    if (auditUIState.mode === 'paged') {
      // Paged mode
      displayRows = getCurrentPageData();
      const totalPages = Math.ceil(auditUIState.totalFiltered / auditUIState.pageSize);
      const startItem = auditUIState.totalFiltered > 0 ? ((auditUIState.currentPage - 1) * auditUIState.pageSize) + 1 : 0;
      const endItem = Math.min(auditUIState.currentPage * auditUIState.pageSize, auditUIState.totalFiltered);
      
      statusText = `${startItem}–${endItem} / ${auditUIState.totalFiltered}`;
      
      // Update pagination button states
      const prevButton = panel.querySelector('#auditPrevPage');
      const nextButton = panel.querySelector('#auditNextPage');
      if (prevButton) prevButton.disabled = auditUIState.currentPage === 1;
      if (nextButton) nextButton.disabled = auditUIState.currentPage >= totalPages;
      
    } else {
      // Lazy mode - initialize loadedCount if needed
      if (auditUIState.loadedCount === 0 && auditUIState.totalFiltered > 0) {
        auditUIState.loadedCount = Math.min(CHUNK_SIZE, auditUIState.totalFiltered);
      }
      
      displayRows = getLazyModeData();
      statusText = `Loaded ${auditUIState.loadedCount} / ${auditUIState.totalFiltered}`;
    }

    // Render table rows
    tbody.innerHTML = displayRows.map((r, index) => `
      <tr>
        <td>${r.ts || ''}</td>
        <td>${r.user || ''}</td>
        <td>${r.module || ''}</td>
        <td>${r.action || ''}</td>
        <td>${r.refId || ''}</td>
        <td>${r.details || ''}</td>
        <td>${r.qty || ''}</td>
        <td><button class="eye-icon-btn" data-record-index="${index}" title="عرض التفاصيل">👁️</button></td>
      </tr>`).join('');

    // Update status display
    if (statusDisplay) {
      statusDisplay.textContent = statusText;
    }

    // Add event listeners for eye icon buttons
    const eyeButtons = tbody.querySelectorAll('.eye-icon-btn');
    eyeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const recordIndex = parseInt(e.target.dataset.recordIndex);
        const record = displayRows[recordIndex];
        if (record) {
          showAuditDetailsModal(record);
        }
      });
    });
  }

  // Modal functionality
  function showAuditDetailsModal(record) {
    const modal = document.getElementById('auditDetailsModal');
    const content = document.getElementById('auditDetailsContent');
    if (!modal || !content) return;

    const lang = getUISettings()?.language || 'en';
    
    // Build detailed view
    const details = {
      [safeGetTranslation(lang, 'thTime', 'Time')]: record.ts || '',
      [safeGetTranslation(lang, 'thUser', 'User')]: record.user || '',
      [safeGetTranslation(lang, 'thModule', 'Module')]: record.module || '',
      [safeGetTranslation(lang, 'thAction', 'Action')]: record.action || '',
      [safeGetTranslation(lang, 'thRefId', 'Ref ID')]: record.refId || '',
      [safeGetTranslation(lang, 'thDetails', 'Details')]: record.details || '',
      [safeGetTranslation(lang, 'thQuantity', 'Quantity')]: record.qty || ''
    };

    // Enhanced details for sales and purchases
    if (record.module === 'sales' || record.module === 'purchases') {
      try {
        const parsedDetails = JSON.parse(record.details || '{}');
        if (parsedDetails && typeof parsedDetails === 'object') {
          Object.keys(parsedDetails).forEach(key => {
            details[key] = parsedDetails[key];
          });
        }
      } catch (e) {
        // If parsing fails, keep original details
      }
    }

    // Render details
    content.innerHTML = Object.entries(details).map(([label, value]) => `
      <div class="detail-row">
        <div class="detail-label">${label}:</div>
        <div class="detail-value">${value}</div>
      </div>
    `).join('');

    modal.style.display = 'flex';
  }

  function hideAuditDetailsModal() {
    const modal = document.getElementById('auditDetailsModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Initialize modal event listeners
  function initializeModalHandlers() {
    const modal = document.getElementById('auditDetailsModal');
    const closeBtn = modal?.querySelector('.modal-close');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', hideAuditDetailsModal);
    }
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          hideAuditDetailsModal();
        }
      });
    }
  }

  // Click handler for audit tab (redundant but kept for robustness)
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab[data-tab="audit"]');
    if (tab) {
      setTimeout(() => { try { renderAudit(); } catch (_) {} }, 0);
    }
  });

  // Note: activateTab already calls renderAudit when needed, so no monkey-patching required
})();
