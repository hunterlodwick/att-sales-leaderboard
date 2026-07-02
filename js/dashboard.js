/* ============================================================
   dashboard.js — Dashboard Stats & Activity Feed
   ============================================================ */

const Dashboard = (() => {

  function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getProductTypes(deal) {
    const types = [];
    if (deal.fiber) types.push('fiber');
    if (deal.directv) types.push('directv');
    if (deal.wireless) types.push('wireless');
    if (deal.adt) types.push('adt');
    return types;
  }

  function getProductLabel(deal) {
    const parts = [];
    if (deal.fiber) {
      const tierLabels = { '300mbps': 'Fiber 300M', '500mbps': 'Fiber 500M', '1gig': 'Fiber 1G', '5gig': 'Fiber 5G' };
      parts.push(tierLabels[deal.fiberTier] || 'Fiber 1G');
    }
    if (deal.directv) parts.push('DirecTV');
    if (deal.wireless) {
      const total = (deal.closerLines || 0) + (deal.setterLines || 0);
      parts.push(`${total} Wireless`);
    }
    if (deal.adt) {
      if (deal.adtPackage && Deals.COMMISSION.adt.packages[deal.adtPackage]) {
        parts.push('ADT ' + Deals.COMMISSION.adt.packages[deal.adtPackage].label);
      } else {
        parts.push('ADT');
      }
    }
    return parts.join(' + ');
  }

  function render() {
    const stats = Deals.getStats();

    // Stat cards
    document.getElementById('statToday').textContent = formatMoney(stats.today.total);
    document.getElementById('statTodayCount').textContent = `${stats.today.count} deal${stats.today.count !== 1 ? 's' : ''}`;
    document.getElementById('statWeek').textContent = formatMoney(stats.week.total);
    document.getElementById('statWeekCount').textContent = `${stats.week.count} deal${stats.week.count !== 1 ? 's' : ''}`;
    document.getElementById('statMonth').textContent = formatMoney(stats.month.total);
    document.getElementById('statMonthCount').textContent = `${stats.month.count} deal${stats.month.count !== 1 ? 's' : ''}`;
    document.getElementById('statYear').textContent = formatMoney(stats.year.total);
    document.getElementById('statYearCount').textContent = `${stats.year.count} deal${stats.year.count !== 1 ? 's' : ''}`;

    // Personal Records
    renderRecords();

    // Product breakdown
    document.getElementById('prodFiber').textContent = formatMoney(stats.fiber.total);
    document.getElementById('prodFiberCount').textContent = `${stats.fiber.count} deal${stats.fiber.count !== 1 ? 's' : ''}`;
    document.getElementById('prodDtv').textContent = formatMoney(stats.directv.total);
    document.getElementById('prodDtvCount').textContent = `${stats.directv.count} deal${stats.directv.count !== 1 ? 's' : ''}`;
    document.getElementById('prodWireless').textContent = formatMoney(stats.wireless.total);
    document.getElementById('prodWirelessCount').textContent = `${stats.wireless.count} deal${stats.wireless.count !== 1 ? 's' : ''}`;
    document.getElementById('prodAdt').textContent = formatMoney(stats.adt.total);
    document.getElementById('prodAdtCount').textContent = `${stats.adt.count} deal${stats.adt.count !== 1 ? 's' : ''}`;

    // Recent activity
    const deals = Deals.getAll();
    const activityEl = document.getElementById('activityList');
    const emptyEl = document.getElementById('dashEmptyState');

    if (deals.length === 0) {
      activityEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      Icons.refresh();
      return;
    }

    emptyEl.style.display = 'none';
    const recent = deals.slice(0, 8);

    activityEl.innerHTML = recent.map(deal => {
      const { totalPayout } = Deals.calcDealPayout(deal);
      const types = getProductTypes(deal);
      const primaryType = types[0] || 'fiber';
      const label = getProductLabel(deal);

      return `
        <div class="activity-item" onclick="window.App.switchTab('deals')">
          <div class="activity-item__dot activity-item__dot--${primaryType}"></div>
          <div class="activity-item__info">
            <div class="activity-item__name">${escapeHtml(deal.name)}</div>
            <div class="activity-item__detail">${label} · ${formatDate(deal.saleDate ? deal.saleDate + 'T12:00:00' : deal.createdAt)}</div>
          </div>
          <div class="activity-item__amount">${formatMoney(totalPayout)}</div>
        </div>
      `;
    }).join('');
    Icons.refresh();
  }

  function renderRecords() {
    const container = document.getElementById('personalRecords');
    if (!container) return;

    const records = Deals.getPersonalRecords();
    const hasData = records.bestDay.total > 0;

    if (!hasData) {
      container.innerHTML = '';
      return;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Format dates for display
    const bestDayLabel = records.bestDay.date
      ? new Date(records.bestDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—';

    const bestWeekLabel = records.bestWeek.startDate
      ? new Date(records.bestWeek.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        + ' – ' + new Date(records.bestWeek.endDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—';

    const bestMonthLabel = records.bestMonth.year
      ? monthNames[records.bestMonth.month] + ' ' + records.bestMonth.year
      : '—';

    // Progress percentages (current vs best)
    const dayPct = records.bestDay.total > 0 ? Math.min((records.currentDay.total / records.bestDay.total) * 100, 100) : 0;
    const weekPct = records.bestWeek.total > 0 ? Math.min((records.currentWeek.total / records.bestWeek.total) * 100, 100) : 0;
    const monthPct = records.bestMonth.total > 0 ? Math.min((records.currentMonth.total / records.bestMonth.total) * 100, 100) : 0;

    // Check if current IS the record (new record!)
    const isDayRecord = records.currentDay.total > 0 && records.currentDay.total >= records.bestDay.total;
    const isWeekRecord = records.currentWeek.total > 0 && records.currentWeek.total >= records.bestWeek.total;
    const isMonthRecord = records.currentMonth.total > 0 && records.currentMonth.total >= records.bestMonth.total;

    function buildCard(label, bestAmount, bestCount, bestDateLabel, currentAmount, pct, isRecord, accentClass) {
      const recordBadge = isRecord ? '<span class="record-badge">🔥 NEW RECORD</span>' : '';
      const glowClass = isRecord ? ' record-card--glow' : '';
      return `
        <div class="record-card ${accentClass}${glowClass}">
          <div class="record-card__header">
            <div class="record-card__label">${label}${recordBadge}</div>
            <div class="record-card__best">${formatMoney(bestAmount)}</div>
          </div>
          <div class="record-card__sub">${bestDateLabel} · ${bestCount} deal${bestCount !== 1 ? 's' : ''}</div>
          <div class="record-bar">
            <div class="record-bar__fill record-bar__fill--${accentClass}" style="--target-width: ${pct}%"></div>
          </div>
          <div class="record-card__progress">
            <span>Today's progress</span>
            <span>${formatMoney(currentAmount)} / ${formatMoney(bestAmount)}</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <h2 class="section-title">Personal Records</h2>
      <div class="records-grid">
        ${buildCard('Best Day', records.bestDay.total, records.bestDay.count, bestDayLabel, records.currentDay.total, dayPct, isDayRecord, 'day')}
        ${buildCard('Best Week', records.bestWeek.total, records.bestWeek.count, bestWeekLabel, records.currentWeek.total, weekPct, isWeekRecord, 'week')}
        ${buildCard('Best Month', records.bestMonth.total, records.bestMonth.count, bestMonthLabel, records.currentMonth.total, monthPct, isMonthRecord, 'month')}
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { render, renderRecords, formatMoney, formatDate, getProductLabel, getProductTypes, escapeHtml };
})();

window.Dashboard = Dashboard;
