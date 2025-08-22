// modules/dashboard.js - Dashboard functionality for Lilija POS
(function() {
  'use strict';

  // Ensure we can access global db and utility functions
  if (typeof window === 'undefined') return;

  // Graceful fallback to localStorage if window.db not available
  function getDB() {
    if (window.db) return window.db;
    try {
      const stored = localStorage.getItem('miniStoreDB_v3_orders');
      return stored ? JSON.parse(stored) : { products: [], purchases: [], sales: [], settings: { lowStockThreshold: 5 }, audit: [] };
    } catch (e) {
      return { products: [], purchases: [], sales: [], settings: { lowStockThreshold: 5 }, audit: [] };
    }
  }

  // Utility functions with fallbacks
  function sum(arr) {
    if (typeof window.sum === 'function') return window.sum(arr);
    return arr.reduce((a, b) => a + b, 0);
  }

  function lineTotal(qty, unitPrice, discountType, discountValue) {
    if (typeof window.lineTotal === 'function') {
      return window.lineTotal(qty, unitPrice, discountType, discountValue);
    }
    qty = Number(qty) || 0;
    unitPrice = Number(unitPrice) || 0;
    discountValue = Number(discountValue) || 0;
    let gross = qty * unitPrice;
    let disc = 0;
    if (discountType === 'amount') disc = discountValue;
    else if (discountType === 'percent') disc = gross * (discountValue / 100);
    return Math.max(0, gross - disc);
  }

  function calcStats() {
    if (typeof window.calcStats === 'function') return window.calcStats();
    
    const db = getDB();
    const map = {};
    for (const p of db.products) {
      map[p.id] = { name: p.name, price: p.price, purchasedQty: 0, purchasedCost: 0, soldQty: 0, revenue: 0 };
    }
    for (const b of db.purchases) {
      if (map[b.productId]) {
        map[b.productId].purchasedQty += Number(b.qty) || 0;
        map[b.productId].purchasedCost += (Number(b.qty) || 0) * (Number(b.unitCost) || 0);
      }
    }
    for (const s of db.sales) {
      if (Array.isArray(s.items)) {
        for (const it of s.items) {
          const m = map[it.productId];
          if (!m) continue;
          const qty = Number(it.qty) || 0;
          const up = Number(it.unitPrice) || 0;
          let disc = 0;
          const dv = Number(it.discountValue) || 0;
          if (it.discountType === 'amount') disc = dv;
          else if (it.discountType === 'percent') disc = (up * qty) * (dv / 100);
          const lineRevenue = Math.max(0, (up * qty) - disc);
          m.soldQty += qty;
          m.revenue += lineRevenue;
        }
      } else if (map[s.productId]) {
        const qty = Number(s.qty) || 0;
        const up = Number(s.unitPrice) || 0;
        map[s.productId].soldQty += qty;
        map[s.productId].revenue += qty * up;
      }
    }
    const out = [];
    for (const id in map) {
      const o = map[id];
      const avgCost = o.purchasedQty > 0 ? (o.purchasedCost / o.purchasedQty) : 0;
      const stock = o.purchasedQty - o.soldQty;
      const cogs = (o.soldQty) * avgCost;
      const profit = o.revenue - cogs;
      out.push({ id, name: o.name, avgCost, stock, revenue: o.revenue, cogs, profit, soldQty: o.soldQty });
    }
    return out;
  }

  // Date utility functions
  function formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function getDateRange(period, customStart, customEnd) {
    const today = new Date();
    const start = new Date();
    let end = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(today.getDate() - 6); // Last 7 days
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(today.getDate() - 29); // Last 30 days
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start.setTime(new Date(customStart).getTime());
          end.setTime(new Date(customEnd).getTime());
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
        }
        break;
    }
    return { start, end };
  }

  // Data aggregation functions
  function aggregateSalesByDate(dateRange) {
    const db = getDB();
    const { start, end } = dateRange;
    const dailyData = {};

    db.sales.forEach(sale => {
      const saleDate = new Date(sale.date || new Date().toISOString().slice(0, 10));
      if (saleDate >= start && saleDate <= end) {
        const dateStr = formatDate(saleDate);
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = { sales: 0, purchases: 0, profit: 0, deliveryFee: 0 };
        }

        let saleTotal = 0;
        if (Array.isArray(sale.items)) {
          for (const item of sale.items) {
            saleTotal += lineTotal(item.qty, item.unitPrice, item.discountType, item.discountValue);
          }
        } else {
          saleTotal = (Number(sale.qty) || 0) * (Number(sale.unitPrice) || 0);
        }
        
        const deliveryFee = Number(sale.deliveryFee) || 0;
        dailyData[dateStr].sales += saleTotal;
        dailyData[dateStr].deliveryFee += deliveryFee;
      }
    });

    return dailyData;
  }

  function aggregatePurchasesByDate(dateRange) {
    const db = getDB();
    const { start, end } = dateRange;
    const dailyData = {};

    db.purchases.forEach(purchase => {
      const purchaseDate = new Date(purchase.date || new Date().toISOString().slice(0, 10));
      if (purchaseDate >= start && purchaseDate <= end) {
        const dateStr = formatDate(purchaseDate);
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = { purchases: 0 };
        }
        dailyData[dateStr].purchases += (Number(purchase.qty) || 0) * (Number(purchase.unitCost) || 0);
      }
    });

    return dailyData;
  }

  function calculateKPIs(period, customStart, customEnd) {
    const dateRange = getDateRange(period, customStart, customEnd);
    const salesData = aggregateSalesByDate(dateRange);
    const purchasesData = aggregatePurchasesByDate(dateRange);
    const stats = calcStats();

    // Combine daily data
    const allDates = new Set([...Object.keys(salesData), ...Object.keys(purchasesData)]);
    const combinedDaily = {};
    
    allDates.forEach(date => {
      combinedDaily[date] = {
        sales: (salesData[date]?.sales || 0),
        deliveryFee: (salesData[date]?.deliveryFee || 0),
        purchases: (purchasesData[date]?.purchases || 0)
      };
    });

    // Calculate totals
    let totalSales = 0;
    let totalDelivery = 0;
    let totalPurchases = 0;

    Object.values(combinedDaily).forEach(day => {
      totalSales += day.sales;
      totalDelivery += day.deliveryFee;
      totalPurchases += day.purchases;
    });

    // Calculate profit (approximation)
    const totalRevenue = totalSales + totalDelivery;
    const totalCosts = totalPurchases;
    const profit = totalRevenue - totalCosts;

    // Stock value from current stats
    const stockValue = sum(stats.map(s => s.stock * s.avgCost));

    return {
      totalSales: totalSales + totalDelivery,
      totalPurchases,
      profit,
      stock: stockValue,
      dailyData: combinedDaily
    };
  }

  function generateDailySummary(period, customStart, customEnd) {
    const dateRange = getDateRange(period, customStart, customEnd);
    const salesData = aggregateSalesByDate(dateRange);
    const purchasesData = aggregatePurchasesByDate(dateRange);

    const allDates = new Set([...Object.keys(salesData), ...Object.keys(purchasesData)]);
    const summary = [];

    allDates.forEach(date => {
      const sales = (salesData[date]?.sales || 0) + (salesData[date]?.deliveryFee || 0);
      const purchases = purchasesData[date]?.purchases || 0;
      const profit = sales - purchases;

      summary.push({
        date,
        sales,
        purchases,
        profit
      });
    });

    // Sort by date descending
    summary.sort((a, b) => b.date.localeCompare(a.date));
    return summary;
  }

  // Chart rendering (simple canvas-based)
  function renderChart(canvasId, data, type, dataset) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!data || Object.keys(data).length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      // Use translation if available, fallback to English
      var noDataText = (window.I18N_AR && window.I18N_AR.noDataToDisplay) || 
                       (window.I18N_EN && window.I18N_EN.noDataToDisplay) || 
                       'No data to display';
      ctx.fillText(noDataText, width / 2, height / 2);
      return;
    }

    const dates = Object.keys(data).sort();
    const values = dates.map(date => data[date][dataset] || 0);
    const maxValue = Math.max(...values, 1);

    if (type === 'line' || type === 'bar') {
      const padding = 40;
      const chartWidth = width - 2 * padding;
      const chartHeight = height - 2 * padding;

      // Draw axes
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      if (type === 'line') {
        // Draw line chart
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        dates.forEach((date, i) => {
          const x = padding + (i / (dates.length - 1)) * chartWidth;
          const y = height - padding - (values[i] / maxValue) * chartHeight;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#22d3ee';
        dates.forEach((date, i) => {
          const x = padding + (i / (dates.length - 1)) * chartWidth;
          const y = height - padding - (values[i] / maxValue) * chartHeight;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
      } else {
        // Draw bar chart
        const barWidth = chartWidth / dates.length * 0.8;
        ctx.fillStyle = '#22d3ee';
        
        dates.forEach((date, i) => {
          const x = padding + (i / dates.length) * chartWidth + (chartWidth / dates.length - barWidth) / 2;
          const barHeight = (values[i] / maxValue) * chartHeight;
          const y = height - padding - barHeight;
          ctx.fillRect(x, y, barWidth, barHeight);
        });
      }

      // Draw labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      
      dates.forEach((date, i) => {
        const x = padding + (i / (dates.length - 1)) * chartWidth;
        const shortDate = date.slice(5); // MM-DD
        ctx.fillText(shortDate, x, height - padding + 15);
      });

    } else if (type === 'pie') {
      // Simple pie chart for aggregated data
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;

      const totalValue = sum(values);
      if (totalValue === 0) return;

      let currentAngle = -Math.PI / 2;
      const colors = ['#22d3ee', '#22c55e', '#f59e0b', '#ef4444'];

      dates.forEach((date, i) => {
        const value = values[i];
        const angle = (value / totalValue) * 2 * Math.PI;
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fill();

        currentAngle += angle;
      });
    }
  }

  // Export dashboard functions to global scope
  window.dashboardModule = {
    calculateKPIs,
    generateDailySummary,
    renderChart,
    formatDate
  };

})();