// Direction synchronization script for RTL/LTR handling
(function() {
  'use strict';

  // Helper function to get current language
  function getCurrentLanguage() {
    // Priority 1: UI settings from database
    if (typeof getUISettings === 'function') {
      try {
        const uiSettings = getUISettings();
        if (uiSettings && uiSettings.language) return uiSettings.language;
      } catch (e) {
        // Ignore error, try other methods
      }
    }
    
    // Priority 2: Global language variables
    if (window.pos && window.pos.lang) return window.pos.lang;
    if (window.posLang) return window.posLang;
    
    // Priority 3: localStorage
    try {
      return localStorage.getItem('pos.lang') || 'en';
    } catch (e) {
      return 'en';
    }
  }

  // Function to update document direction based on language
  function updateDirection() {
    const language = getCurrentLanguage();
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    
    if (document.documentElement.dir !== direction) {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
      
      // Dispatch custom event for other components to listen
      try {
        window.dispatchEvent(new CustomEvent('directionChanged', {
          detail: { language, direction }
        }));
      } catch (e) {
        // Fallback for older browsers
      }
    }
  }

  // Observer for language selector changes
  function observeLanguageChanges() {
    const languageSelector = document.getElementById('uiLanguage');
    if (languageSelector) {
      languageSelector.addEventListener('change', function() {
        // Slight delay to allow the UI settings to be saved first
        setTimeout(updateDirection, 10);
      });
    }

    // Also observe for any programmatic language changes
    let lastLanguage = getCurrentLanguage();
    const checkLanguageChange = function() {
      const currentLanguage = getCurrentLanguage();
      if (currentLanguage !== lastLanguage) {
        lastLanguage = currentLanguage;
        updateDirection();
      }
    };

    // Check for language changes periodically (lightweight check)
    setInterval(checkLanguageChange, 1000);
  }

  // Initialize direction on load
  function initialize() {
    updateDirection();
    observeLanguageChanges();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Export for manual triggering if needed
  window.updateDirection = updateDirection;
})();