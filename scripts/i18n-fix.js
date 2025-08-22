// Runtime i18n patch for Settings & Reports
// Loads the existing window.posLang if available, otherwise attempts to read from localStorage.
(function () {
  function getLang() {
    if (window.pos && window.pos.lang) return window.pos.lang;
    if (window.posLang) return window.posLang;
    try { return localStorage.getItem('pos.lang') || 'en'; } catch (e) { return 'en'; }
  }

  function t(key) {
    var lang = getLang();
    if (lang === 'ar' && window.I18N_AR && window.I18N_AR[key]) return window.I18N_AR[key];
    if ((lang === 'en' || !lang) && window.I18N_EN && window.I18N_EN[key]) return window.I18N_EN[key];
    // fallback check both
    if (window.I18N_EN && window.I18N_EN[key]) return window.I18N_EN[key];
    if (window.I18N_AR && window.I18N_AR[key]) return window.I18N_AR[key];
    return '';
  }

  function replaceIfSelector(sel, key) {
    var el = document.querySelector(sel);
    if (el) el.textContent = t(key);
  }

  function replaceIfSelectorValue(sel, key) {
    var el = document.querySelector(sel);
    if (el) el.value = t(key);
  }

  function runPatch() {
    // Settings
    replaceIfSelector('.settings-title', 'settingsTitle');
    replaceIfSelector('#lowStockLabel', 'lowStockThresholdLabel');
    replaceIfSelector('#lowStockHint', 'lowStockHint');
    replaceIfSelector('#saveSettingsBtn', 'saveSettingsBtn');

    // Password section
    replaceIfSelector('#settings-password h3', 'passwordSectionTitle');
    replaceIfSelector('label[for="currentPassword"]', 'currentPasswordLabel');
    var cp = document.querySelector('#currentPassword'); if (cp) cp.placeholder = t('currentPasswordPlaceholder');
    replaceIfSelector('label[for="newPassword"]', 'newPasswordLabel');
    var np = document.querySelector('#newPassword'); if (np) np.placeholder = t('newPasswordPlaceholder');
    replaceIfSelector('label[for="confirmNewPassword"]', 'confirmNewPasswordLabel');
    var cnp = document.querySelector('#confirmNewPassword'); if (cnp) cnp.placeholder = t('confirmNewPasswordPlaceholder');
    replaceIfSelector('#btnChangePassword', 'btnChangePassword');
    replaceIfSelector('#passwordHint', 'passwordHint');

    // Reports KPIs (common selectors used in the app)
    replaceIfSelector('.kpi-inventory .kpi-label', 'kpiInventoryValue');
    replaceIfSelector('.kpi-sales .kpi-label', 'kpiSalesRevenue');
    replaceIfSelector('.kpi-delivery .kpi-label', 'kpiDeliveryRevenue');
    replaceIfSelector('.kpi-cogs .kpi-label', 'kpiCOGS');
    replaceIfSelector('.kki-profit .kpi-label', 'kpiProfit');

    // Color swatches labels (if present)
    var mapping = [
      {sel: '.swatch-cyan .swatch-label', key: 'colorCyan'},
      {sel: '.swatch-neon-green .swatch-label', key: 'colorNeonGreen'},
      {sel: '.swatch-neon-purple .swatch-label', key: 'colorNeonPurple'},
      {sel: '.swatch-neon-blue .swatch-label', key: 'colorNeonBlue'},
      {sel: '.swatch-neon-orange .swatch-label', key: 'colorNeonOrange'}
    ];
    mapping.forEach(function(m) { replaceIfSelector(m.sel, m.key); });
  }

  // Run on DOMContentLoaded and also after a short delay in case the settings section is injected dynamically
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(runPatch, 150); });
  } else {
    setTimeout(runPatch, 50);
  }

  // Expose a helper so other dynamic insertion code can call translateElement-like behaviour
  window.__posI18nApply = runPatch;
})();