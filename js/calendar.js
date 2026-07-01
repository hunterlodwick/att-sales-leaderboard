window.CalendarTab = (() => {
  let currentDate = new Date();
  let selectedDate = null; // YYYY-MM-DD
  let viewMode = 'installs'; // 'installs' | 'sales'

  function init() {
    render();
  }

  function setViewMode(mode) {
    viewMode = mode;
    selectedDate = null;
    render();
  }

  function render() {
    const root = document.getElementById('calendarRoot');
    if (!root) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Header nav
    const headerHtml = `
      <div class="filter-pills mb-lg" style="margin-bottom: var(--space-lg); margin-top: 10px;">
        <button class="filter-pill ${viewMode === 'installs' ? 'active' : ''}" onclick="window.CalendarTab.setViewMode('installs')">Installs & Follow-ups</button>
        <button class="filter-pill ${viewMode === 'sales' ? 'active' : ''}" onclick="window.CalendarTab.setViewMode('sales')">Sales</button>
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; padding: 0 var(--space-md); margin-bottom: var(--space-lg);">
        <button onclick="window.CalendarTab.prevMonth()" style="background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); border-radius:var(--radius-md); width:40px; height:40px; display:flex; align-items:center; justify-content:center; color:var(--text-primary); cursor:pointer; transition: background 0.2s;">
          ${window.Icons.arrowLeft}
        </button>
        <div style="text-align:center;">
          <div style="font-size:18px; font-weight:700; color:var(--text-primary);">${monthName}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${viewMode === 'installs' ? 'Pending Installs & Alerts' : 'Sales History'}</div>
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
        // Sales
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
      if (isSelected) classes += ' month-calendar__cell--active';
      if (hasEvents) classes += ' month-calendar__cell--has-deals';
      if (viewMode === 'installs' && data.followUps?.length > 0) classes += ' month-calendar__cell--has-alerts';

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
        // Sales dots + money
        const salesCount = data.sales?.length || 0;
        if (salesCount > 0) {
          const shownDots = Math.min(salesCount, 3);
          for(let i=0; i<shownDots; i++) dotsHtml += '<span class="month-calendar__dot"></span>';
          if (salesCount > 3) dotsHtml += '<span class="month-calendar__dot month-calendar__dot--more">+</span>';
          dotsHtml += `<div class="month-calendar__amount">$${Math.round(data.salesTotal).toLocaleString()}</div>`;
        }
      }

      gridHtml += `
        <div class="${classes}" onclick="window.CalendarTab.selectDate('${ds}')">
          <div class="month-calendar__day-num">${day}</div>
          <div class="month-calendar__dots">${dotsHtml}</div>
        </div>
      `;
    }

    gridHtml += '</div></div>';

    // Drill-down for selected day
    let drillHtml = '';
    if (selectedDate) {
      const sDate = new Date(selectedDate + 'T12:00:00');
      const drillLabel = sDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const data = dayMap[selectedDate] || { installs: [], followUps: [], sales: [], salesTotal: 0 };
      
      let listContent = '';
      
      if (viewMode === 'installs') {
        if (data.installs.length === 0 && data.followUps.length === 0) {
          listContent = '<div style="text-align:center;color:var(--text-muted);margin-top:20px;">No installs or follow-ups</div>';
        } else {
          const allDayDeals = [...data.installs, ...data.followUps];
          const uniqueDeals = Array.from(new Set(allDayDeals.map(d => d.id)))
                                  .map(id => allDayDeals.find(d => d.id === id));
                                  
          listContent = uniqueDeals.map(deal => {
            const isInstall = deal.installDate === selectedDate && !deal.installed;
            const isAlert = deal.followUpDate === selectedDate;
            
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

      drillHtml = `
        <div class="drill-down" style="padding: 0 var(--space-md); padding-bottom: 80px;">
          <div class="drill-down__header">${drillLabel}</div>
          ${listContent}
        </div>
      `;
    } else {
      drillHtml = `<div style="padding-bottom: 80px;"></div>`; // padding for nav bar
    }

    root.innerHTML = headerHtml + gridHtml + drillHtml;
    window.Icons.refresh();
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

  return { init, render, prevMonth, nextMonth, selectDate, setViewMode };
})();
