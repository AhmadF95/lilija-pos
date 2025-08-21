// LILIJA data.js - Pure data calculation functions
(function() {
  'use strict';

  // Prevent multiple loads
  if (window.__lilijaDataLoaded) return;
  window.__lilijaDataLoaded = true;

  // Calculate statistics for all products (stock, revenue, profit, etc.)
  function calcStats(db = window.db) {
    if (!db || !db.products) return [];
    
    const map = {};
    
    // Initialize product data
    for (const p of db.products) {
      map[p.id] = { 
        name: p.name, 
        price: p.price, 
        purchasedQty: 0, 
        purchasedCost: 0, 
        soldQty: 0, 
        revenue: 0 
      };
    }
    
    // Calculate purchases
    for (const b of db.purchases) {
      if (map[b.productId]) {
        map[b.productId].purchasedQty += Number(b.qty) || 0;
        map[b.productId].purchasedCost += (Number(b.qty) || 0) * (Number(b.unitCost) || 0);
      }
    }
    
    // Calculate sales (supporting both old and new sale formats)
    for (const s of db.sales) {
      if (Array.isArray(s.items)) {
        // New format: sale with items array
        for (const it of s.items) {
          const m = map[it.productId];
          if (!m) continue;
          
          const qty = Number(it.qty) || 0;
          const up = Number(it.unitPrice) || 0;
          
          // Calculate discount
          let disc = 0;
          const dv = Number(it.discountValue) || 0;
          if (it.discountType === 'amount') {
            disc = dv;
          } else if (it.discountType === 'percent') {
            disc = (up * qty) * (dv / 100);
          }
          
          const lineRevenue = Math.max(0, (up * qty) - disc);
          m.soldQty += qty;
          m.revenue += lineRevenue;
        }
      } else if (map[s.productId]) {
        // Old format: direct product sale
        const qty = Number(s.qty) || 0;
        const up = Number(s.unitPrice) || 0;
        map[s.productId].soldQty += qty;
        map[s.productId].revenue += qty * up;
      }
    }
    
    // Calculate final metrics
    const out = [];
    for (const id in map) {
      const o = map[id];
      const avgCost = o.purchasedQty > 0 ? (o.purchasedCost / o.purchasedQty) : 0;
      const stock = o.purchasedQty - o.soldQty;
      const cogs = (o.soldQty) * avgCost; // Cost of Goods Sold
      const profit = o.revenue - cogs;
      
      out.push({ 
        id, 
        name: o.name, 
        avgCost, 
        stock, 
        revenue: o.revenue, 
        cogs, 
        profit, 
        soldQty: o.soldQty 
      });
    }
    
    return out;
  }

  // Simple sum function for arrays
  function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }

  // Calculate KPIs for dashboard
  function calculateKPIs(db = window.db) {
    if (!db) return {};
    
    const stats = calcStats(db);
    const totalRevenue = sum(stats.map(s => s.revenue));
    const totalProfit = sum(stats.map(s => s.profit));
    const totalProducts = stats.length;
    const lowStockCount = stats.filter(s => s.stock < (db.settings?.lowStockThreshold || 5)).length;
    
    return {
      totalRevenue,
      totalProfit,
      totalProducts,
      lowStockCount,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  }

  // Export to global scope
  window.LilijaData = {
    calcStats,
    sum,
    calculateKPIs
  };

  // Keep legacy global functions for compatibility during transition
  window.calcStats = calcStats;
  window.sum = sum;

})();