window.CalendarTab = (() => {
  let currentDate = new Date();
  let selectedDate = null; // YYYY-MM-DD
  let selectedWeek = null; // YYYY-MM-DD (Sunday start)
  let viewMode = 'installs'; // 'installs' | 'sales' | 'weekly'

  function init() {
    render();
  }

  function setViewMode(mode) {
    viewMode = mode;
    selectedDate = null;
    selectedWeek = null;
    render();
  }

  // Compact money format: $430, $1.2k, $12.5k
  function formatCompact(amount) {
    if (amount >= 10000) return '$' + (amount / 1000).toFixed(1) + 'k';
    if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'k';
    return '$' + Math.round(amount);
  }

  function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString();
  }

  // Get the intensity class for a count pill
  function getCountPillClass(count) {
    if (count >= 7) return 'month-calendar__count-pill--hot';
    if (count >= 4) return 'month-calendar__count-pill--high';
    if (count >= 2) return 'month-calendar__count-pill--medium';
    return 'month-calendar__count-pill--low';
  }

  function render() {
    const root = document.getElementById('calendarRoot');
    if (!root) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Subtitle text
    const subtitles = {
      installs: 'Pending Installs & Alerts',
      sales: 'Sales History',
      weekly: 'Weekly Statistics'
    };

    // Header nav with 3 pills
    const headerHtml = `
      <div class="filter-pills mb-lg" style="margin-bottom: var(--space-lg); margin-top: 10px;">
        <button class="filter-pill ${viewMode === 'installs' ? 'active' : ''}" onclick="window.CalendarTab.setViewMode('installs')">Installs & Follow-ups</button>
        <button class="filter-pill ${viewMode === 'sales' ? 'active' : ''}" onclick="window.CalendarTab.setViewMode('sales')">Sales</button>
        <button class="filter-pill ${viewMode === 'weekly' ? 'active' : ''}" onclick="window.CalendarTab.setViewMode('weekly')">Weekly</button>
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; padding: 0 var(--space-md); margin-bottom: var(--space-lg);">
        <button onclick="window.CalendarTab.prevMonth()" style="background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); border-radius:var(--radius-md); width:40px; height:40px; display:flex; align-items:center; justify-content:center; color:var(--text-primary); cursor:pointer; transition: background 0.2s;">
          ${window.Icons.arrowLeft}
        </button>
        <div style="text-align:center;">
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">${monthName}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${subtitles[viewMode]}</div>
        </div>
        <button onclick="window.CalendarTab.nextMonth()" style="background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); border-radius:var(--radius-md); width:40px; height:40px; display:flex; align-items:center; justify-content:center; color:var(--text-primary); cursor:pointer; transition: background 0.2s;">
          ${window.Icons.arrowRight}
        </button>
      </div>
    `;

    // Map out the days
    const allDeals = window.Deals.getAll();
    const dayMap = {}; // { 'YYYY-MM-DD': { installs: [], followUps: [], sales: [], salesTotal: 0 } }

    allDeals.forEach(deal => {
      // Installs & follow ups
      if (viewMode === 'installs') {
        if (!deal.installed && deal.installDate) {
          if (!dayMap[deal.installDate]) dayMap[deal.installDate] = { installs: [], followUps: [] };
          dayMap[deal.installDate].installs.push(deal);
        }
        if (deal.followUpDate) {
          if (!dayMap[deal.followUpDate]) dayMap[deal.followUpDate] = { installs: [], followUps: [] };
          dayMap[deal.followUpDate].followUps.push(deal);
        }
      } else {
        // Sales (both 'sales' and 'weekly' modes need this)
        const sd = deal.saleDate || (deal.createdAt ? deal.createdAt.split('T')[0] : '');
        if (sd) {
          if (!dayMap[sd]) dayMap[sd] = { sales: [], salesTotal: 0 };
          const { totalPayout: tp } = window.Deals.calcDealPayout(deal);
          dayMap[sd].sales.push(deal);
          dayMap[sd].salesTotal += tp;
        }
      }
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); 
    const daysInMonth = lastDay.getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    let gridHtml = '<div class="month-calendar" style="padding: 0 var(--space-md);">';
    gridHtml += '<div class="month-calendar__header">';
    ['S','M','T','W','T','F','S'].forEach(d => {
      gridHtml += `<div class="month-calendar__dow">${d}</div>`;
    });
    gridHtml += '</div><div class="month-calendar__grid">';

    for (let i = 0; i < startDow; i++) {
      gridHtml += '<div class="month-calendar__cell month-calendar__cell--empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const ds = d.toISOString().split('T')[0];
      const data = dayMap[ds] || { installs: [], followUps: [], sales: [], salesTotal: 0 };

      const isToday = ds === todayStr;
      const isSelected = ds === selectedDate;
      
      let hasEvents = false;
      if (viewMode === 'installs') {
        hasEvents = (data.installs?.length || 0) + (data.followUps?.length || 0) > 0;
      } else {
        hasEvents = (data.sales?.length || 0) > 0;
      }
      
      let classes = 'month-calendar__cell';
      if (isToday) classes += ' month-calendar__cell--today';
      if (isSelected && viewMode !== 'weekly') classes += ' month-calendar__cell--active';
      if (hasEvents) classes += ' month-calendar__cell--has-deals';
      if (viewMode === 'installs' && data.followUps?.length > 0) classes += ' month-calendar__cell--has-alerts';

      // Check if this day is part of the selected week
      if (viewMode === 'weekly' && selectedWeek) {
        const weekStart = new Date(selectedWeek + 'T12:00:00');
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (d >= weekStart && d <= weekEnd) {
          classes += ' month-calendar__cell--active';
        }
      }

      let dotsHtml = '';
      
      if (viewMode === 'installs') {
        const installsCount = data.installs?.length || 0;
        const followUpsCount = data.followUps?.length || 0;
        for(let i=0; i<installsCount; i++) dotsHtml += '<span class="month-calendar__dot month-calendar__dot--install"></span>';
        for(let i=0; i<followUpsCount; i++) dotsHtml += '<span class="month-calendar__dot month-calendar__dot--alert"></span>';

        const maxDots = 4;
        const totalDots = installsCount + followUpsCount;
        if (totalDots > maxDots) {
          dotsHtml = `
            <span class="month-calendar__dot month-calendar__dot--install"></span>
            <span class="month-calendar__dot month-calendar__dot--install"></span>
            <span class="month-calendar__dot month-calendar__dot--alert"></span>
            <span class="month-calendar__dot month-calendar__dot--more" style="color:var(--text-muted);">+</span>
          `;
        }
      } else {
        // Sales view & Weekly view — use count pill instead of dots
        const salesCount = data.sales?.length || 0;
        if (salesCount > 0) {
          const pillClass = getCountPillClass(salesCount);
          dotsHtml += `<span class="month-calendar__count-pill ${pillClass}">${salesCount}</span>`;
          dotsHtml += `<div class="month-calendar__compact-amount">${formatCompact(data.salesTotal)}</div>`;
        }
      }

      // Click handler depends on mode
      let clickHandler = '';
      if (viewMode === 'weekly') {
        // Calculate the Sunday of this day's week
        const dayOfWeek = d.getDay();
        const sunday = new Date(d);
        sunday.setDate(d.getDate() - dayOfWeek);
        const sundayStr = sunday.toISOString().split('T')[0];
        clickHandler = `onclick="window.CalendarTab.selectWeek('${sundayStr}')"`;
      } else {
        clickHandler = `onclick="window.CalendarTab.selectDate('${ds}')"`;
      }

      gridHtml += `
        <div class="${classes}" ${clickHandler}>
          <div class="month-calendar__day-num">${day}</div>
          <div class="month-calendar__dots">${dotsHtml}</div>
        </div>
      `;
    }

    gridHtml += '</div></div>';

    // Drill-down panel
    let drillHtml = '';

    if (viewMode === 'weekly' && selectedWeek) {
      drillHtml = renderWeekSummary(selectedWeek, dayMap);
    } else if (selectedDate && viewMode !== 'weekly') {
      drillHtml = renderDayDrill(selectedDate, dayMap);
    } else {
      drillHtml = `<div style="padding-bottom: 80px;"></div>`;
    }

    root.innerHTML = headerHtml + gridHtml + drillHtml;
    window.Icons.refresh();
  }

  // --- Day Drill-Down (existing, refactored) ---
  function renderDayDrill(dateStr, dayMap) {
    const sDate = new Date(dateStr + 'T12:00:00');
    const drillLabel = sDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const data = dayMap[dateStr] || { installs: [], followUps: [], sales: [], salesTotal: 0 };
    
    let listContent = '';
    
    if (viewMode === 'installs') {
      if (data.installs.length === 0 && data.followUps.length === 0) {
        listContent = '<div style="text-align:center;color:var(--text-muted);margin-top:20px;">No installs or follow-ups</div>';
      } else {
        const allDayDeals = [...data.installs, ...data.followUps];
        const uniqueDeals = Array.from(new Set(allDayDeals.map(d => d.id)))
                                .map(id => allDayDeals.find(d => d.id === id));
                                
        listContent = uniqueDeals.map(deal => {
          const isInstall = deal.installDate === dateStr && !deal.installed;
          const isAlert = deal.followUpDate === dateStr;
          
          let statusLabel = '';
          if (isInstall) statusLabel += `<span class="badge badge--pending" style="margin-right:5px;">${window.Icons.pending} Pending Install</span>`;
          if (isAlert) statusLabel += `<span class="badge badge--cancelled" style="background:rgba(245,130,32,0.1);color:var(--att-orange); border: 1px solid rgba(245,130,32,0.2);">${window.Icons.warning} Follow-up Alert</span>`;
          
          return `
            <div class="deal-card" onclick="window.App.switchTab('dashboard'); window.setTimeout(() => window.DealsList.toggleDetails('${deal.id}'), 100);">
              <div class="deal-card__header">
                <div class="deal-card__name">${window.Dashboard.escapeHtml(deal.name)}</div>
              </div>
              <div class="deal-card__meta" style="margin-top:10px;">
                <div class="deal-card__badges">
                  ${statusLabel}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    } else {
      // Sales view
      if (data.sales.length === 0) {
        listContent = '<div style="text-align:center;color:var(--text-muted);margin-top:20px;">No sales recorded</div>';
      } else {
        listContent = data.sales.map(deal => {
          const { totalPayout } = window.Deals.calcDealPayout(deal);
          const productLabel = window.Dashboard.getProductLabel(deal);
          const productTypes = window.Dashboard.getProductTypes(deal);
          const iconMap = { fiber: window.Icons.fiber, directv: window.Icons.directv, wireless: window.Icons.wireless, adt: window.Icons.adt };
          const primaryIcon = productTypes.length > 0 ? iconMap[productTypes[0]] : window.Icons.fiber;
          
          return `
            <div class="deal-card" onclick="window.App.switchTab('deals'); window.setTimeout(() => window.DealsList.toggleDetails('${deal.id}'), 100);">
              <div class="deal-card__header">
                <div class="deal-card__name">${window.Dashboard.escapeHtml(deal.name)}</div>
                <div class="deal-card__price">$${Math.round(totalPayout)}</div>
              </div>
              <div class="deal-card__meta" style="margin-top:10px;">
                <span class="badge badge--primary">${primaryIcon} ${productLabel}</span>
              </div>
            </div>
          `;
        }).join('');
        
        listContent = `
          <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:600;">
            <span>Total Revenue:</span>
            <span style="color:var(--att-blue);">$${Math.round(data.salesTotal).toLocaleString()}</span>
          </div>
          ${listContent}
        `;
      }
    }

    return `
      <div class="drill-down" style="padding: 0 var(--space-md); padding-bottom: 80px;">
        <div class="drill-down__header">${drillLabel}</div>
        ${listContent}
      </div>
    `;
  }

  // --- Weekly Summary Panel ---
  function renderWeekSummary(weekStartStr, dayMap) {
    const weekStart = new Date(weekStartStr + 'T12:00:00');
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Gather all deals for this week
    const weekDeals = window.Deals.getDealsForWeek(weekStartStr);
    
    let totalRevenue = 0;
    let totalDeals = 0;
    const productCounts = { fiber: 0, directv: 0, wireless: 0, adt: 0 };
    const productRevenue = { fiber: 0, directv: 0, wireless: 0, adt: 0 };
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun–Sat
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    weekDeals.forEach(deal => {
      const { totalPayout } = window.Deals.calcDealPayout(deal);
      if (totalPayout === 0) return;
      totalRevenue += totalPayout;
      totalDeals++;

      // Day of week
      const sd = deal.saleDate || (deal.createdAt ? deal.createdAt.split('T')[0] : '');
      if (sd) {
        const d = new Date(sd + 'T12:00:00');
        const dow = d.getDay();
        dayTotals[dow] += totalPayout;
      }

      // Product breakdown
      if (deal.fiber) {
        productCounts.fiber++;
        const tier = deal.fiberTier || '1gig';
        const tierData = window.Deals.COMMISSION.fiber[tier];
        productRevenue.fiber += tierData ? tierData.total : window.Deals.COMMISSION.fiber['1gig'].total;
      }
      if (deal.directv) {
        productCounts.directv++;
        productRevenue.directv += window.Deals.COMMISSION.directv.total;
      }
      if (deal.wireless) {
        productCounts.wireless++;
        const closerAmt = (deal.closerLines || 0) * window.Deals.COMMISSION.wireless.closer;
        const setterAmt = (deal.setterLines || 0) * window.Deals.COMMISSION.wireless.setter;
        productRevenue.wireless += closerAmt + setterAmt;
      }
      if (deal.adt) {
        productCounts.adt++;
        if (deal.adtPackage && window.Deals.COMMISSION.adt.packages[deal.adtPackage]) {
          productRevenue.adt += window.Deals.calcAdtCommission(deal.adtPackage);
        }
      }
    });

    const avgDeal = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0;
    const maxDayTotal = Math.max(...dayTotals, 1); // avoid divide by zero

    // Stats cards
    const statsHtml = `
      <div class="week-summary__stats">
        <div class="week-summary__stat">
          <div class="week-summary__stat-value">${totalDeals}</div>
          <div class="week-summary__stat-label">Total Deals</div>
        </div>
        <div class="week-summary__stat">
          <div class="week-summary__stat-value">${formatMoney(totalRevenue)}</div>
          <div class="week-summary__stat-label">Revenue</div>
        </div>
        <div class="week-summary__stat">
          <div class="week-summary__stat-value">${formatMoney(avgDeal)}</div>
          <div class="week-summary__stat-label">Avg/Deal</div>
        </div>
      </div>
    `;

    // Product breakdown
    const productData = [
      { key: 'fiber', name: 'Fiber', icon: window.Icons.fiber },
      { key: 'directv', name: 'DirecTV', icon: window.Icons.directv },
      { key: 'wireless', name: 'Wireless', icon: window.Icons.wireless },
      { key: 'adt', name: 'ADT', icon: window.Icons.adt }
    ];

    const productsHtml = `
      <div class="week-summary__products">
        ${productData.map(p => `
          <div class="week-summary__product">
            <div class="week-summary__product-icon week-summary__product-icon--${p.key}">
              ${p.icon}
            </div>
            <div class="week-summary__product-info">
              <div class="week-summary__product-name">${p.name}</div>
              <div class="week-summary__product-detail">${productCounts[p.key]} deal${productCounts[p.key] !== 1 ? 's' : ''} · ${formatMoney(productRevenue[p.key])}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Mini bar chart
    const barsHtml = `
      <div class="week-summary__chart">
        <div class="week-summary__chart-title">Daily Revenue</div>
        <div class="week-summary__bars">
          ${dayTotals.map((total, i) => {
            const heightPct = maxDayTotal > 0 ? (total / maxDayTotal) * 100 : 0;
            const delay = i * 0.08;
            return `
              <div class="week-summary__bar-col">
                ${total > 0 ? `<div class="week-summary__bar-amount">${formatCompact(total)}</div>` : ''}
                <div class="week-summary__bar" style="height: ${Math.max(heightPct, 3)}%; animation-delay: ${delay}s;${total === 0 ? ' background: rgba(255,255,255,0.05);' : ''}"></div>
                <div class="week-summary__bar-label">${dayLabels[i]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Deal list
    let dealsListHtml = '';
    if (weekDeals.length > 0) {
      dealsListHtml = `<div class="week-summary__deals-title">All Deals This Week</div>`;
      dealsListHtml += weekDeals.map(deal => {
        const { totalPayout } = window.Deals.calcDealPayout(deal);
        const productLabel = window.Dashboard.getProductLabel(deal);
        const productTypes = window.Dashboard.getProductTypes(deal);
        const iconMap = { fiber: window.Icons.fiber, directv: window.Icons.directv, wireless: window.Icons.wireless, adt: window.Icons.adt };
        const primaryIcon = productTypes.length > 0 ? iconMap[productTypes[0]] : window.Icons.fiber;
        const saleDate = deal.saleDate
          ? new Date(deal.saleDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : '';

        return `
          <div class="deal-card" onclick="window.App.switchTab('deals'); window.setTimeout(() => window.DealsList.toggleDetails('${deal.id}'), 100);">
            <div class="deal-card__header">
              <div class="deal-card__name">${window.Dashboard.escapeHtml(deal.name)}</div>
              <div class="deal-card__price">$${Math.round(totalPayout).toLocaleString()}</div>
            </div>
            <div class="deal-card__meta" style="margin-top:10px;">
              <span class="deal-card__date">${saleDate}</span>
              <span class="badge badge--primary">${primaryIcon} ${productLabel}</span>
            </div>
          </div>
        `;
      }).join('');
    } else {
      dealsListHtml = '<div style="text-align:center;color:var(--text-muted);margin-top:20px;">No sales this week</div>';
    }

    return `
      <div class="week-summary">
        <div class="week-summary__header">
          <span>Week of ${startLabel} – ${endLabel}</span>
          <span class="week-summary__header-sub">${totalDeals} deal${totalDeals !== 1 ? 's' : ''}</span>
        </div>
        ${statsHtml}
        ${productsHtml}
        ${barsHtml}
        ${dealsListHtml}
      </div>
    `;
  }

  function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    render();
  }

  function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    render();
  }

  function selectDate(dateStr) {
    if (selectedDate === dateStr) {
      selectedDate = null; // Toggle off
    } else {
      selectedDate = dateStr;
    }
    render();
  }

  function selectWeek(weekStartStr) {
    if (selectedWeek === weekStartStr) {
      selectedWeek = null; // Toggle off
    } else {
      selectedWeek = weekStartStr;
    }
    render();
  }

  return { init, render, prevMonth, nextMonth, selectDate, selectWeek, setViewMode };
})();
