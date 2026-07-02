/* ============================================================
   deals.js — Deal CRUD + Commission Calculation Engine
   Firestore-backed with localStorage fallback
   ============================================================ */

const Deals = (() => {
  const STORAGE_KEY = 'att_sales_deals';
  const MIGRATION_KEY = 'att_firebase_migrated';

  // ---- Commission Constants ----
  const COMMISSION = {
    fiber: {
      '300mbps': { base: 220, caBonus: 30, total: 250 },
      '500mbps': { base: 270, caBonus: 30, total: 300 },
      '1gig':    { base: 400, caBonus: 30, total: 430 },
      '5gig':    { base: 475, caBonus: 30, total: 505 }
    },
    directv: { total: 375 },
    wireless: {
      closer: 130, // per line
      setter: 65   // per line (half)
    },
    adt: {
      activationFee: 99,
      contractMonths: 36,
      commissionPct: 0.68,
      packages: {
        secure:       { monthly: 53.99, label: 'Secure' },
        smart:        { monthly: 63.99, label: 'Smart' },
        complete:     { monthly: 74.99, label: 'Complete' },
        completeNest: { monthly: 81.99, label: 'Complete + Nest Aware' }
      }
    }
  };

  // Payout schedules
  const PAYOUT_SCHEDULE = {
    fiber:   { upfrontPct: 0.85, residualPct: 0.15, residualMonths: 3 },
    directv: { upfrontPct: 0.85, residualPct: 0.15, residualMonths: 6 },
    // wireless and adt: full payout, no residual split
  };

  // ---- In-memory cache (source of truth, synced to Firestore + localStorage) ----
  let dealsCache = null;

  // ---- Data Access ----
  function getAll() {
    if (dealsCache !== null) return dealsCache;
    // Fallback to localStorage on first load
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      dealsCache = data ? JSON.parse(data) : [];
      return dealsCache;
    } catch {
      dealsCache = [];
      return [];
    }
  }

  function saveAll(deals) {
    dealsCache = deals;
    // Always write to localStorage as cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  }

  function setDealsFromFirebase(deals) {
    dealsCache = deals;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  }

  function getById(id) {
    return getAll().find(d => d.id === id);
  }

  // ---- ADT Commission Calculation ----
  function calcAdtCommission(packageKey) {
    const pkg = COMMISSION.adt.packages[packageKey];
    if (!pkg) return 0;
    const contractTotal = COMMISSION.adt.activationFee + (pkg.monthly * COMMISSION.adt.contractMonths);
    return Math.round(contractTotal * COMMISSION.adt.commissionPct * 100) / 100;
  }

  // ---- Commission Calculation ----
  function calcDealPayout(deal) {
    let totalPayout = 0;
    let breakdown = [];

    // If deal is cancelled, return $0 for everything to remove from revenue
    if (deal.status === 'cbi' || deal.status === 'cai') {
      return { totalPayout: 0, breakdown: [] };
    }

    // Fiber
    if (deal.fiber) {
      const tier = deal.fiberTier || '1gig';
      const tierData = COMMISSION.fiber[tier];
      const amt = tierData ? tierData.total : COMMISSION.fiber['1gig'].total;
      totalPayout += amt;
      const tierLabels = { '300mbps': '300 Mbps', '500mbps': '500 Mbps', '1gig': '1 Gig', '5gig': '5 Gig' };
      breakdown.push({ product: 'Fiber', detail: tierLabels[tier] || '1 Gig', amount: amt });
    }

    // DirecTV
    if (deal.directv) {
      const amt = COMMISSION.directv.total;
      totalPayout += amt;
      breakdown.push({ product: 'DirecTV', detail: '', amount: amt });
    }

    // Wireless
    if (deal.wireless) {
      const closerAmt = (deal.closerLines || 0) * COMMISSION.wireless.closer;
      const setterAmt = (deal.setterLines || 0) * COMMISSION.wireless.setter;
      const wirelessTotal = closerAmt + setterAmt;
      totalPayout += wirelessTotal;
      if (closerAmt > 0) breakdown.push({ product: 'Wireless (Closer)', detail: `${deal.closerLines} line${deal.closerLines > 1 ? 's' : ''}`, amount: closerAmt });
      if (setterAmt > 0) breakdown.push({ product: 'Wireless (Setter)', detail: `${deal.setterLines} line${deal.setterLines > 1 ? 's' : ''}`, amount: setterAmt });
    }

    // ADT
    if (deal.adt) {
      let amt = 0;
      if (deal.adtPackage && COMMISSION.adt.packages[deal.adtPackage]) {
        amt = calcAdtCommission(deal.adtPackage);
        const pkg = COMMISSION.adt.packages[deal.adtPackage];
        breakdown.push({ product: 'ADT', detail: pkg.label, amount: amt });
      } else if (deal.adtAmount) {
        // Legacy: manual amount
        amt = deal.adtAmount;
        if (amt > 0) breakdown.push({ product: 'ADT', detail: 'Custom', amount: amt });
      }
      totalPayout += amt;
    }

    return { totalPayout, breakdown };
  }

  // Calculate upfront and residual for a deal
  function calcPayoutSplit(deal) {
    // If deal is cancelled, upfront and residuals are 0
    if (deal.status === 'cbi' || deal.status === 'cai') {
      return { upfront: 0, residuals: [] };
    }

    const { totalPayout } = calcDealPayout(deal);
    let upfront = 0;
    let residuals = []; // { product, amount, dueDate, months }

    // Fiber residual
    if (deal.fiber && deal.installed) {
      const tier = deal.fiberTier || '1gig';
      const tierData = COMMISSION.fiber[tier];
      const fiberAmt = tierData ? tierData.total : COMMISSION.fiber['1gig'].total;
      const sched = PAYOUT_SCHEDULE.fiber;
      upfront += fiberAmt * sched.upfrontPct;
      const installDate = new Date(deal.installDate);
      const dueDate = new Date(installDate);
      dueDate.setMonth(dueDate.getMonth() + sched.residualMonths);
      residuals.push({
        product: 'Fiber',
        amount: Math.round(fiberAmt * sched.residualPct * 100) / 100,
        dueDate: dueDate.toISOString(),
        months: sched.residualMonths,
        paid: deal.fiberResidualPaid || false
      });
    }

    // DirecTV residual
    if (deal.directv && deal.installed) {
      const dtvAmt = COMMISSION.directv.total;
      const sched = PAYOUT_SCHEDULE.directv;
      upfront += dtvAmt * sched.upfrontPct;
      const installDate = new Date(deal.installDate);
      const dueDate = new Date(installDate);
      dueDate.setMonth(dueDate.getMonth() + sched.residualMonths);
      residuals.push({
        product: 'DirecTV',
        amount: Math.round(dtvAmt * sched.residualPct * 100) / 100,
        dueDate: dueDate.toISOString(),
        months: sched.residualMonths,
        paid: deal.dtvResidualPaid || false
      });
    }

    // Wireless — full payout, no residual split
    if (deal.wireless && deal.installed) {
      const closerAmt = (deal.closerLines || 0) * COMMISSION.wireless.closer;
      const setterAmt = (deal.setterLines || 0) * COMMISSION.wireless.setter;
      upfront += closerAmt + setterAmt;
    }

    // ADT — full payout on install
    if (deal.adt && deal.installed) {
      if (deal.adtPackage && COMMISSION.adt.packages[deal.adtPackage]) {
        upfront += calcAdtCommission(deal.adtPackage);
      } else {
        upfront += deal.adtAmount || 0;
      }
    }

    return { totalPayout, upfront: Math.round(upfront * 100) / 100, residuals };
  }

  // ---- CRUD Operations ----
  function addDeal(dealData) {
    const deals = getAll();
    const deal = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      saleDate: dealData.saleDate || new Date().toISOString().split('T')[0],
      name: dealData.name || 'Unknown',
      installDate: dealData.installDate || '',
      installed: dealData.installed || false,
      fiber: dealData.fiber || false,
      fiberTier: dealData.fiberTier || '1gig',
      directv: dealData.directv || false,
      wireless: dealData.wireless || false,
      closerLines: parseInt(dealData.closerLines) || 0,
      setterLines: parseInt(dealData.setterLines) || 0,
      adt: dealData.adt || false,
      adtPackage: dealData.adtPackage || '',
      adtAmount: parseFloat(dealData.adtAmount) || 0,
      fiberResidualPaid: false,
      dtvResidualPaid: false,
      status: dealData.status || 'active'
    };
    deals.unshift(deal); // newest first
    saveAll(deals);
    // Sync to Firebase
    if (window.FirebaseDB && FirebaseDB.isReady) {
      FirebaseDB.saveDeal(deal);
    }
    return deal;
  }

  function updateDeal(id, updates) {
    const deals = getAll();
    const idx = deals.findIndex(d => d.id === id);
    if (idx === -1) return null;
    deals[idx] = { ...deals[idx], ...updates };
    saveAll(deals);
    // Sync to Firebase
    if (window.FirebaseDB && FirebaseDB.isReady) {
      FirebaseDB.saveDeal(deals[idx]);
    }
    return deals[idx];
  }

  function deleteDeal(id) {
    const deals = getAll().filter(d => d.id !== id);
    saveAll(deals);
    // Sync to Firebase
    if (window.FirebaseDB && FirebaseDB.isReady) {
      FirebaseDB.deleteDeal(id);
    }
  }

  function toggleInstalled(id) {
    const deal = getById(id);
    if (!deal) return;
    return updateDeal(id, { installed: !deal.installed });
  }

  function markStatus(id, status) {
    return updateDeal(id, { status });
  }

  function toggleResidualPaid(id, product) {
    const deal = getById(id);
    if (!deal) return;
    if (product === 'fiber') {
      return updateDeal(id, { fiberResidualPaid: !deal.fiberResidualPaid });
    } else if (product === 'directv') {
      return updateDeal(id, { dtvResidualPaid: !deal.dtvResidualPaid });
    }
  }

  // ---- Firebase Init + Migration ----
  async function initFirebase() {
    if (!window.FirebaseDB) return;

    const success = FirebaseDB.init();
    if (!success) return;

    // Check if we need to migrate localStorage → Firestore
    const migrated = localStorage.getItem(MIGRATION_KEY);
    if (!migrated) {
      const localDeals = getAll();
      if (localDeals.length > 0) {
        const count = await FirebaseDB.migrateFromLocalStorage(localDeals);
        if (count > 0) {
          localStorage.setItem(MIGRATION_KEY, 'true');
          console.log('[Deals] Migration complete');
        }
      } else {
        localStorage.setItem(MIGRATION_KEY, 'true');
      }
    }

    // Load from Firestore (overrides localStorage cache)
    const firestoreDeals = await FirebaseDB.loadAll();
    if (firestoreDeals && firestoreDeals.length > 0) {
      setDealsFromFirebase(firestoreDeals);
      if (window.App) App.refreshAll();
    }

    // Start real-time listener
    FirebaseDB.listen(deals => {
      setDealsFromFirebase(deals);
      if (window.App) App.refreshAll();
    });
  }

  // ---- Date Helpers ----
  function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }

  function isThisWeek(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d >= startOfWeek && d < endOfWeek;
  }

  function isThisMonth(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  function isThisYear(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear();
  }

  // ---- Aggregate Stats ----
  function getStats() {
    const deals = getAll();
    const stats = {
      today: { total: 0, count: 0 },
      week: { total: 0, count: 0 },
      month: { total: 0, count: 0 },
      year: { total: 0, count: 0 },
      fiber: { total: 0, count: 0 },
      directv: { total: 0, count: 0 },
      wireless: { total: 0, count: 0 },
      adt: { total: 0, count: 0 }
    };

    deals.forEach(deal => {
      const { totalPayout } = calcDealPayout(deal);
      // Use saleDate for time grouping; fall back to createdAt for legacy deals
      const dateToUse = deal.saleDate ? deal.saleDate + 'T12:00:00' : deal.createdAt;

      if (isToday(dateToUse)) { stats.today.total += totalPayout; stats.today.count++; }
      if (isThisWeek(dateToUse)) { stats.week.total += totalPayout; stats.week.count++; }
      if (isThisMonth(dateToUse)) { stats.month.total += totalPayout; stats.month.count++; }
      if (isThisYear(dateToUse)) { stats.year.total += totalPayout; stats.year.count++; }

      if (deal.fiber) {
        const tier = deal.fiberTier || '1gig';
        const tierData = COMMISSION.fiber[tier];
        const amt = tierData ? tierData.total : COMMISSION.fiber['1gig'].total;
        stats.fiber.total += amt;
        stats.fiber.count++;
      }
      if (deal.directv) {
        stats.directv.total += COMMISSION.directv.total;
        stats.directv.count++;
      }
      if (deal.wireless) {
        const closerAmt = (deal.closerLines || 0) * COMMISSION.wireless.closer;
        const setterAmt = (deal.setterLines || 0) * COMMISSION.wireless.setter;
        stats.wireless.total += closerAmt + setterAmt;
        stats.wireless.count++;
      }
      if (deal.adt) {
        if (deal.adtPackage && COMMISSION.adt.packages[deal.adtPackage]) {
          stats.adt.total += calcAdtCommission(deal.adtPackage);
        } else {
          stats.adt.total += deal.adtAmount || 0;
        }
        stats.adt.count++;
      }
    });

    return stats;
  }

  // ---- Personal Records (Best Day/Week/Month) ----
  function getPersonalRecords() {
    const deals = getAll();
    // Group deals by day, week (Sun–Sat), and month
    const dayMap = {};   // 'YYYY-MM-DD' -> { total, count }
    const weekMap = {};  // 'YYYY-MM-DD' (Sunday start) -> { total, count, startDate, endDate }
    const monthMap = {}; // 'YYYY-MM' -> { total, count, year, month }

    deals.forEach(deal => {
      const { totalPayout } = calcDealPayout(deal);
      if (totalPayout === 0) return; // skip cancelled
      const dateStr = deal.saleDate || (deal.createdAt ? deal.createdAt.split('T')[0] : '');
      if (!dateStr) return;

      const d = new Date(dateStr + 'T12:00:00');

      // Day
      if (!dayMap[dateStr]) dayMap[dateStr] = { total: 0, count: 0, date: dateStr };
      dayMap[dateStr].total += totalPayout;
      dayMap[dateStr].count++;

      // Week (Sunday start)
      const dayOfWeek = d.getDay();
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - dayOfWeek);
      const sundayStr = sunday.toISOString().split('T')[0];
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      const saturdayStr = saturday.toISOString().split('T')[0];
      if (!weekMap[sundayStr]) weekMap[sundayStr] = { total: 0, count: 0, startDate: sundayStr, endDate: saturdayStr };
      weekMap[sundayStr].total += totalPayout;
      weekMap[sundayStr].count++;

      // Month
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[monthKey]) monthMap[monthKey] = { total: 0, count: 0, year: d.getFullYear(), month: d.getMonth() };
      monthMap[monthKey].total += totalPayout;
      monthMap[monthKey].count++;
    });

    // Find bests
    let bestDay = { total: 0, count: 0, date: '' };
    Object.values(dayMap).forEach(d => { if (d.total > bestDay.total) bestDay = d; });

    let bestWeek = { total: 0, count: 0, startDate: '', endDate: '' };
    Object.values(weekMap).forEach(w => { if (w.total > bestWeek.total) bestWeek = w; });

    let bestMonth = { total: 0, count: 0, year: 0, month: 0 };
    Object.values(monthMap).forEach(m => { if (m.total > bestMonth.total) bestMonth = m; });

    // Current period values
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentDay = dayMap[todayStr] || { total: 0, count: 0 };

    const currentDow = now.getDay();
    const currentSunday = new Date(now);
    currentSunday.setDate(now.getDate() - currentDow);
    const currentSundayStr = currentSunday.toISOString().split('T')[0];
    const currentWeek = weekMap[currentSundayStr] || { total: 0, count: 0 };

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonth = monthMap[currentMonthKey] || { total: 0, count: 0 };

    return {
      bestDay, bestWeek, bestMonth,
      currentDay, currentWeek, currentMonth
    };
  }

  // ---- Get All Residuals ----
  function getAllResiduals() {
    const deals = getAll();
    const residuals = [];

    deals.forEach(deal => {
      if (!deal.installed || !deal.installDate) return;
      const { residuals: dealResiduals } = calcPayoutSplit(deal);
      dealResiduals.forEach(r => {
        residuals.push({
          ...r,
          dealId: deal.id,
          customerName: deal.name,
          installDate: deal.installDate
        });
      });
    });

    // Sort by due date
    residuals.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return residuals;
  }

  // ---- Friday Payday Helpers ----
  function getNextFriday(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay(); // 0=Sun
    const daysUntilFri = (5 - day + 7) % 7;
    const friday = new Date(d);
    friday.setDate(friday.getDate() + (daysUntilFri === 0 ? 0 : daysUntilFri));
    return friday.toISOString().split('T')[0];
  }

  function getInstalledDealsByPayday() {
    const deals = getAll().filter(d => d.installed && d.installDate);
    const grouped = {};

    deals.forEach(deal => {
      const friday = getNextFriday(deal.installDate);
      if (!grouped[friday]) grouped[friday] = [];
      grouped[friday].push(deal);
    });

    // Sort by Friday date descending (most recent first)
    const sorted = Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([friday, deals]) => ({ friday, deals }));

    return sorted;
  }

  function getPendingInstalls() {
    return getAll().filter(d => !d.installed);
  }

  // ---- Timeline Drill-Down Helpers ----
  function getDealsForDate(dateStr) {
    return getAll().filter(deal => {
      const sd = deal.saleDate || (deal.createdAt ? deal.createdAt.split('T')[0] : '');
      return sd === dateStr;
    });
  }

  function getDealsForWeek(weekStartStr) {
    const start = new Date(weekStartStr + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return getAll().filter(deal => {
      const sd = deal.saleDate || (deal.createdAt ? deal.createdAt.split('T')[0] : '');
      if (!sd) return false;
      const d = new Date(sd + 'T12:00:00');
      return d >= start && d < end;
    });
  }

  function getDealsForMonth(year, month) {
    return getAll().filter(deal => {
      const sd = deal.saleDate || (deal.createdAt ? deal.createdAt.split('T')[0] : '');
      if (!sd) return false;
      const d = new Date(sd + 'T12:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }

  // ---- Public API ----
  return {
    getAll,
    getById,
    addDeal,
    updateDeal,
    deleteDeal,
    toggleInstalled,
    markStatus,
    toggleResidualPaid,
    calcDealPayout,
    calcPayoutSplit,
    calcAdtCommission,
    getStats,
    getPersonalRecords,
    getAllResiduals,
    getNextFriday,
    getInstalledDealsByPayday,
    getPendingInstalls,
    getDealsForDate,
    getDealsForWeek,
    getDealsForMonth,
    initFirebase,
    COMMISSION,
    PAYOUT_SCHEDULE
  };
})();

window.Deals = Deals;
