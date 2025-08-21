// LILIJA utils.js - Shared utility functions (DRY)
(function() {
  'use strict';

  // Normalize string for comparisons (trim and lowercase)
  function normalizeString(s) {
    return (s || '').trim().toLowerCase();
  }

  // Check if product name already exists (excluding specific ID)
  function isDuplicateProductName(name, excludeId = null) {
    if (!window.db || !window.db.products) return false;
    const norm = normalizeString(name);
    return window.db.products.some(x => 
      x.id !== excludeId && normalizeString(x.name) === norm
    );
  }

  // Check if SKU already exists (excluding specific ID)  
  function isDuplicateSKU(sku, excludeId = null) {
    if (!sku || !window.db || !window.db.products) return false;
    const norm = normalizeString(sku);
    return window.db.products.some(x => 
      x.id !== excludeId && normalizeString(x.sku) === norm
    );
  }

  // Create product map for quick lookups
  function productMap(db = window.db) {
    if (!db || !db.products) return new Map();
    const m = new Map();
    db.products.forEach(p => m.set(p.id, p));
    return m;
  }

  // Export functions globally for now (before full module system)
  window.LilijaUtils = {
    normalizeString,
    isDuplicateProductName,
    isDuplicateSKU,
    productMap
  };

  // Keep legacy global functions for compatibility during transition
  window.productMap = productMap;
  window.normalizeString = normalizeString;

})();