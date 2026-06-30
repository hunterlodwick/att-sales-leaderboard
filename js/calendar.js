window.CalendarTab = (() => {
  let currentDate = new Date();
  let selectedDate = null; // YYYY-MM-DD

  function init() {
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
      <div class="timeline-header">
        <button class="icon-btn" onclick="window.CalendarTab.prevMonth()">
          ${Icons.arrowLeft}
        </button>
        <div class="timeline-header__title">
          ${monthName}
          <div class="timeline-header__sub">Installs & Follow-ups</div>
        </div>
        <button class="icon-btn" onclick="window.CalendarTab.nextMonth()">
          ${Icons.arrowRight}
        </button>
      </div>
    `;

    // Map out the days
    const allDeals = window.Deals.getAll();
    const dayMap = {}; // { 'YYYY-MM-DD': { installs: [], followUps: [] } }

    allDeals.forEach(deal => {
      // Pending installs
      if (!deal.installed && deal.installDate) {
        if (!dayMap[deal.installDate]) dayMap[deal.installDate] = { installs: [], followUps: [] };
        dayMap[deal.installDate].installs.push(deal);
      }
      // Follow-ups
      if (deal.followUpDate) {
        if (!dayMap[deal.followUpDate]) dayMap[deal.followUpDate] = { installs: [], followUps: [] };
        dayMap[deal.followUpDate].followUps.push(deal);
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
      const data = dayMap[ds] || { installs: [], followUps: [] };

      const isToday = ds === todayStr;
      const isSelected = ds === selectedDate;
      const hasEvents = (data.installs.length + data.followUps.length) > 0;
      
      let classes = 'month-calendar__cell';
      if (isToday) classes += ' month-calendar__cell--today';
      if (isSelected) classes += ' month-calendar__cell--active';
      if (hasEvents) classes += ' month-calendar__cell--has-deals';
      if (data.followUps.length > 0) classes += ' month-calendar__cell--has-alerts';

      let dotsHtml = '';
      data.installs.forEach(() => {
        dotsHtml += '<span class="month-calendar__dot month-calendar__dot--install"></span>';
      });
      data.followUps.forEach(() => {
        dotsHtml += '<span class="month-calendar__dot month-calendar__dot--alert"></span>';
      });

      // Limit to 4 dots visibly to not overflow too bad
      const maxDots = 4;
      const totalDots = data.installs.length + data.followUps.length;
      if (totalDots > maxDots) {
        // Just show 3 and a plus
        dotsHtml = `
          <span class="month-calendar__dot month-calendar__dot--install"></span>
          <span class="month-calendar__dot month-calendar__dot--install"></span>
          <span class="month-calendar__dot month-calendar__dot--alert"></span>
          <span class="month-calendar__dot month-calendar__dot--more" style="color:var(--text-muted);">+</span>
        `;
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
      const data = dayMap[selectedDate] || { installs: [], followUps: [] };
      
      let listContent = '';
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
          if (isInstall) statusLabel += `<span class="badge badge--pending" style="margin-right:5px;">${Icons.pending} Pending Install</span>`;
          if (isAlert) statusLabel += `<span class="badge badge--cancelled" style="background:rgba(245,130,32,0.1);color:var(--att-orange); border: 1px solid rgba(245,130,32,0.2);">${Icons.warning} Follow-up Alert</span>`;
          
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

  return { init, render, prevMonth, nextMonth, selectDate };
})();
