// LILIJA auth.js - Centralized authentication and permissions
(function() {
  'use strict';

  // Prevent multiple loads
  if (window.__lilijaAuthLoaded) return;
  window.__lilijaAuthLoaded = true;

  // Configuration constants
  const MODULES = ['products', 'purchases', 'sales', 'dashboard', 'users', 'settings', 'audit'];
  const ACTIONS = ['view', 'edit', 'delete'];

  // Get current user based on global currentUser variable
  function getCurrentUser() {
    if (typeof loadUsers !== 'function') return null;
    const users = loadUsers() || [];
    return users.find(u => u.username === window.currentUser) || null;
  }

  // Check if current user can perform action on module
  function can(module, action) {
    const u = getCurrentUser();
    if (!u) return false;
    if (u.isRoot === true || u.type === 'admin') return true;
    return Boolean(u.perms && u.perms[module] && u.perms[module][action]);
  }

  // Ensure user schema is properly initialized
  function ensureUserSchema() {
    if (typeof loadUsers !== 'function' || typeof saveUsers !== 'function') return;
    let users = loadUsers();
    if (!Array.isArray(users)) users = [];
    
    let changed = false;
    let hasRoot = false;
    
    const defaultUserPerms = Object.fromEntries(MODULES.map(m => [m, { view: true, edit: false, delete: false }]));
    const defaultAdminPerms = Object.fromEntries(MODULES.map(m => [m, { view: true, edit: true, delete: true }]));
    
    users = users.map((u, idx) => {
      if (!u.type) { 
        u.type = (idx === 0 ? 'admin' : 'user'); 
        changed = true; 
      }
      if (!u.perms) { 
        u.perms = (u.type === 'admin') ? defaultAdminPerms : defaultUserPerms; 
        changed = true; 
      }
      if (u.isRoot) hasRoot = true;
      return u;
    }).slice(0, 5); // Limit to 5 users
    
    // Ensure first user is root admin
    if (!hasRoot && users.length) { 
      users[0].isRoot = true; 
      users[0].type = 'admin'; 
      users[0].perms = defaultAdminPerms; 
      changed = true; 
    }
    
    if (changed) saveUsers(users);
  }

  // Export to global scope for compatibility
  window.LilijaAuth = {
    MODULES,
    ACTIONS,
    getCurrentUser,
    can,
    ensureUserSchema
  };

  // Keep legacy global functions for compatibility during transition
  window.getCurrentUser = getCurrentUser;
  window.can = can;
  window.ensureUserSchema = ensureUserSchema;

})();