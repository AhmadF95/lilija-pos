(function (global) {
  // Unified language lookup used by the translation runtime
  function getLang() {
    try {
      // Prefer DB UI settings
      if (typeof getUISettings === 'function') {
        var ui = getUISettings();
        if (ui && ui.language) return ui.language;
      }

      // App-level globals used by older code
      if (global.pos && global.pos.lang) return global.pos.lang;
      if (global.posLang) return global.posLang;

      // Fallback to localStorage
      try {
        var ls = localStorage.getItem('pos.lang');
        if (ls) return ls;
      } catch (e) { /* ignore localStorage errors */ }

      // Default to English
      return 'en';
    } catch (e) {
      return 'en';
    }
  }

  // Helper: get current dictionary object for language
  function getDict(lang) {
    if (!lang) lang = getLang();
    if (lang === 'ar') return global.I18N_AR || {};
    return global.I18N_EN || {};
  }

  // Translate a single element given a key and optional attribute (textContent/placeholder/title)
  function applyTranslationToElement(el, key, dict, attr) {
    if (!el || !key) return;
    var text = dict[key];
    if (typeof text === 'undefined') return;
    try {
      if (attr === 'value') {
        // For input values
        el.value = text;
      } else if (attr === 'placeholder') {
        el.setAttribute('placeholder', text);
      } else if (attr === 'title') {
        el.setAttribute('title', text);
      } else {
        // default: innerText (preserve simple HTML by setting textContent)
        if ('textContent' in el) el.textContent = text;
        else el.innerText = text;
      }
    } catch (e) { /* ignore DOM errors */ }
  }

  // Main translate pass: elements with data-i18n attributes and selectorMapping
  function applyTranslations(lang) {
    var dictionary = getDict(lang);

    // 1) Elements using data-i18n attribute: can specify "key" or "key:attr"
    var nodes = document.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(nodes, function (el) {
      var spec = el.getAttribute('data-i18n');
      if (!spec) return;
      // allow multiple translations separated by semicolon: "key" or "key:placeholder"
      spec.split(';').forEach(function (s) {
        s = s.trim();
        if (!s) return;
        var parts = s.split(':');
        var key = parts[0];
        var attr = parts[1] ? parts[1] : null;
        applyTranslationToElement(el, key, dictionary, attr);
      });
    });

    // 2) Selector mapping: map selectors to keys (useful for <option>, static text nodes)
    var mapping = global.selectorMapping || {};
    Object.keys(mapping).forEach(function (sel) {
      var key = mapping[sel];
      if (!key) return;
      try {
        var els = document.querySelectorAll(sel);
        Array.prototype.forEach.call(els, function (el) {
          // Special-case: <option> innerText vs value/placeholder
          if (el.tagName && el.tagName.toLowerCase() === 'option') {
            applyTranslationToElement(el, key, dictionary);
          } else {
            applyTranslationToElement(el, key, dictionary);
          }
        });
      } catch (e) {
        // ignore invalid selectors
      }
    });

    // 3) Adjust dir and lang attributes on <html> and body to support RTL for Arabic
    try {
      var html = document.documentElement;
      if (html) {
        if (lang === 'ar') {
          html.dir = 'rtl';
          html.lang = 'ar';
        } else {
          html.dir = 'ltr';
          html.lang = 'en';
        }
      }
    } catch (e) { /* ignore DOM errors */ }
  }

  // Expose helpers
  global.i18n = global.i18n || {};
  global.i18n.getLang = getLang;
  global.i18n.applyTranslations = applyTranslations;

  // Optionally auto-apply on DOMContentLoaded, but other app init may call applyTranslations too.
  document.addEventListener('DOMContentLoaded', function () {
    try {
      applyTranslations(getLang());
    } catch (e) { /* ignore */ }
  });
})(window);