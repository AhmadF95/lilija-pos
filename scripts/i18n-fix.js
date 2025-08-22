// Runtime i18n patch (selector-based, no HTML changes required)
(function () {
  function getLang() {
    // Prefer DB UI settings first
    if (typeof getUISettings === 'function') {
      try {
        var uiSettings = getUISettings();
        if (uiSettings && uiSettings.language) return uiSettings.language;
      } catch (e) {}
    }
    if (window.pos && window.pos.lang) return window.pos.lang;
    if (window.posLang) return window.posLang;
    try { return localStorage.getItem('pos.lang') || 'en'; } catch (e) { return 'en'; }
  }

  function t(key) {
    var lang = getLang();
    if (lang === 'ar' && window.I18N_AR && window.I18N_AR[key]) return window.I18N_AR[key];
    if ((lang === 'en' || !lang) && window.I18N_EN && window.I18N_EN[key]) return window.I18N_EN[key];
    if (window.I18N_EN && window.I18N_EN[key]) return window.I18N_EN[key];
    if (window.I18N_AR && window.I18N_AR[key]) return window.I18N_AR[key];
    return '';
  }

  function replaceIfSelector(sel, key) {
    var el = document.querySelector(sel);
    if (el) el.textContent = t(key);
  }

  function replaceIfSelectorAttr(sel, attr, key) {
    var el = document.querySelector(sel);
    if (!el) return;
    try { el.setAttribute(attr, t(key)); } catch (e) { el[attr] = t(key); }
  }

  function replaceByText(originalText, key) {
    if (!originalText) return;
    var nodes = document.querySelectorAll('body *:not(script):not(style)');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.children.length === 0) {
        var txt = el.textContent ? el.textContent.trim() : '';
        if (txt === originalText) {
          el.textContent = t(key);
        }
      }
    }
  }

  function applyDataAttributes() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      if (el.tagName.toLowerCase() === 'option') {
        // Special handling for option elements
        el.textContent = t(key);
      } else {
        el.textContent = t(key);
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      try { el.placeholder = t(key); } catch (e) { el.setAttribute('placeholder', t(key)); }
    });
    document.querySelectorAll('[data-i18n-value]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-value');
      if (!key) return;
      try { el.value = t(key); } catch (e) { el.setAttribute('value', t(key)); }
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (!key) return;
      try { el.title = t(key); } catch (e) { el.setAttribute('title', t(key)); }
    });
  }

  function runPatch() {
    replaceIfSelector('.settings-title', 'settingsTitle');
    replaceIfSelector('#lowStockLabel', 'lowStockThresholdLabel');
    replaceIfSelector('#lowStockHint', 'lowStockHint');
    replaceIfSelector('#saveSettingsBtn', 'saveSettingsBtn');
    replaceIfSelectorAttr('#saveSettingsBtn', 'value', 'saveSettingsBtn');

    replaceIfSelector('#settings-password h3', 'passwordSectionTitle');
    replaceIfSelector('label[for="currentPassword"]', 'currentPasswordLabel');
    var cp = document.querySelector('#currentPassword'); if (cp) cp.placeholder = t('currentPasswordPlaceholder');
    replaceIfSelector('label[for="newPassword"]', 'newPasswordLabel');
    var np = document.querySelector('#newPassword'); if (np) np.placeholder = t('newPasswordPlaceholder');
    replaceIfSelector('label[for="confirmNewPassword"]', 'confirmNewPasswordLabel');
    var cnp = document.querySelector('#confirmNewPassword'); if (cnp) cnp.placeholder = t('confirmNewPasswordPlaceholder');
    replaceIfSelector('#btnChangePassword', 'btnChangePassword');
    replaceIfSelector('#passwordHint', 'passwordHint');

    replaceIfSelector('.kpi-inventory .kpi-label', 'kpiInventoryValue');
    replaceIfSelector('.kpi-sales .kpi-label', 'kpiSalesRevenue');
    replaceIfSelector('.kpi-delivery .kpi-label', 'kpiDeliveryRevenue');
    replaceIfSelector('.kpi-cogs .kpi-label', 'kpiCOGS');
    replaceIfSelector('.kpi-profit .kpi-label', 'kpiProfit');

    var mapping = [
      {sel: '.swatch-cyan .swatch-label', key: 'colorCyan'},
      {sel: '.swatch-neon-green .swatch-label', key: 'colorNeonGreen'},
      {sel: '.swatch-neon-purple .swatch-label', key: 'colorNeonPurple'},
      {sel: '.swatch-neon-blue .swatch-label', key: 'colorNeonBlue'},
      {sel: '.swatch-neon-orange .swatch-label', key: 'colorNeonOrange'}
    ];
    mapping.forEach(function(m) { replaceIfSelector(m.sel, m.key); });

    var selectorMapping = [
      // Dashboard elements
      {sel: 'h1.dashboard-title', key: 'dashboardTitle'},
      {sel: '.dashboard h1', key: 'dashboardTitle'},
      {sel: '.dashboard-title', key: 'dashboardTitle'},
      {sel: '.report-period-label', key: 'reportPeriodLabel'},
      {sel: '.report-controls .report-period', key: 'reportPeriodLabel'},
      {sel: '.period-btn.today', key: 'today'},
      {sel: '.period-btn.this-week', key: 'thisWeek'},
      {sel: '.period-btn.this-month', key: 'thisMonth'},
      {sel: '.period-btn.custom', key: 'customPeriod'},
      {sel: '.kpi-sales .kpi-label', key: 'kpiSalesRevenue'},
      {sel: '.kpi-cogs .kpi-label', key: 'kpiCOGS'},
      {sel: '.kpi-profit .kpi-label', key: 'kpiProfit'},
      {sel: '.kpi-inventory .kpi-label', key: 'kpiInventoryValue'},
      {sel: '.data-type-label', key: 'dataTypeLabel'},
      {sel: '.chart-type-label', key: 'chartTypeLabel'},
      {sel: '.purchases-table thead th:nth-child(1)', key: 'purchasesProduct'},
      {sel: '.purchases-table thead th:nth-child(2)', key: 'purchasesQuantity'},
      {sel: '.purchases-table thead th:nth-child(3)', key: 'purchasesUnitCost'},
      {sel: '.purchases-table thead th:nth-child(4)', key: 'purchasesTotal'},
      {sel: '.purchases-table tfoot td[colspan="3"]', key: 'grandTotalLabel'},
      
      // Header and app branding
      {sel: 'title', key: 'appTitle'},
      {sel: '#appVersion', key: 'appName'},
      
      // General settings elements
      {sel: '#generalSettingsTitle', key: 'generalSettingsTitle'},
      {sel: '#languageLabel', key: 'languageLabel'},
      {sel: '#themeLabel', key: 'themeLabel'},
      
      // Language dropdown options
      {sel: 'option[value="ar"]', key: 'languageArabic'},
      {sel: 'option[value="en"]', key: 'languageEnglish'},
      {sel: 'option[value="dark"]', key: 'themeDark'},
      {sel: 'option[value="light"]', key: 'themeLight'},
      
      // Tab elements (if they have class-based selectors)
      {sel: '.tab[data-tab="products"]', key: 'tabProducts'},
      {sel: '.tab[data-tab="purchases"]', key: 'tabPurchases'},
      {sel: '.tab[data-tab="sales"]', key: 'tabSales'},
      {sel: '.tab[data-tab="dashboard"]', key: 'tabDashboard'},
      {sel: '.tab[data-tab="reports"]', key: 'tabReports'},
      {sel: '.tab[data-tab="general"]', key: 'tabGeneral'},
      {sel: '.tab[data-tab="settings"]', key: 'tabSettings'},
      {sel: '.tab[data-tab="audit"]', key: 'tabAudit'}
    ];
    selectorMapping.forEach(function(m) { replaceIfSelector(m.sel, m.key); });

    var textMapping = [
      {text: 'Dashboard', key: 'dashboardTitle'},
      {text: 'Report Period', key: 'reportPeriodLabel'},
      {text: 'Today', key: 'today'},
      {text: 'This Week', key: 'thisWeek'},
      {text: 'This Month', key: 'thisMonth'},
      {text: 'Custom Period', key: 'customPeriod'},
      {text: 'Sales revenue', key: 'kpiSalesRevenue'},
      {text: 'Cost of goods sold', key: 'kpiCOGS'},
      {text: 'Profit', key: 'kpiProfit'},
      {text: 'Inventory value', key: 'kpiInventoryValue'},
      {text: 'Data type', key: 'dataTypeLabel'},
      {text: 'Sales', key: 'salesLabel'},
      {text: 'Chart type', key: 'chartTypeLabel'},
      {text: 'Line', key: 'line'},
      {text: 'Daily summary', key: 'dailySummaryTitle'},
      {text: 'Export (Excel)', key: 'exportExcel'},
      {text: 'Date', key: 'tableDate'},
      {text: 'Total sales', key: 'tableTotalSales'},
      {text: 'Total purchases', key: 'tableTotalPurchases'},
      {text: 'Product', key: 'purchasesProduct'},
      {text: 'Quantity', key: 'purchasesQuantity'},
      {text: 'Unit Cost', key: 'purchasesUnitCost'},
      {text: 'Total', key: 'purchasesTotal'},
      {text: 'Grand total', key: 'grandTotalLabel'}
    ];
    textMapping.forEach(function(m) { replaceByText(m.text, m.key); });

    applyDataAttributes();
  }

  function runWithRetries(retries, delay) {
    var attempts = 0;
    function attempt() {
      try { runPatch(); } catch (e) { }
      attempts++;
      if (attempts < retries) setTimeout(attempt, delay);
    }
    attempt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { runWithRetries(12, 250); });
  } else {
    runWithRetries(12, 250);
  }

  window.__posI18nApply = runPatch;
})();