/* ============================================================
   app.js — Main App Controller
   Tab routing, Manual form, Edit modal, Deals list, Timeline, Init
   ============================================================ */

// ---- Manual Form Controller ----
const ManualForm = (() => {
  function toggleProduct(product) {
    const map = {
      fiber: 'fiberOptions',
      dtv: null,
      wireless: 'wirelessOptions',
      adt: 'adtOptions'
    };

    const optionsId = map[product];
    if (optionsId) {
      const checkbox = document.getElementById(product === 'dtv' ? 'chkDtv' : product === 'fiber' ? 'chkFiber' : product === 'wireless' ? 'chkWireless' : 'chkAdt');
      const optionsEl = document.getElementById(optionsId);
      if (checkbox.checked) {
        optionsEl.classList.add('show');
      } else {
        optionsEl.classList.remove('show');
      }
    }
    updatePayout();
  }

  function updatePayout() {
    let total = 0;
    const parts = [];

    // Fiber
    if (document.getElementById('chkFiber').checked) {
      const tier = document.querySelector('#tab-add input[name="fiberTier"]:checked')?.value || '1gig';
      const tierMap = { '300mbps': 250, '500mbps': 300, '1gig': 430, '5gig': 505 };
      const tierLabels = { '300mbps': '300M', '500mbps': '500M', '1gig': '1G', '5gig': '5G' };
      const amt = tierMap[tier] || 430;
      total += amt;
      parts.push(`Fiber ${tierLabels[tier] || '1G'}: $${amt}`);
    }

    // DirecTV
    if (document.getElementById('chkDtv').checked) {
      total += 375;
      parts.push('DirecTV: $375');
    }

    // Wireless
    if (document.getElementById('chkWireless').checked) {
      const closer = parseInt(document.getElementById('closerLines').value) || 0;
      const setter = parseInt(document.getElementById('setterLines').value) || 0;
      const closerAmt = closer * 130;
      const setterAmt = setter * 65;
      total += closerAmt + setterAmt;
      if (closer > 0) parts.push(`Closer x${closer}: $${closerAmt}`);
      if (setter > 0) parts.push(`Setter x${setter}: $${setterAmt}`);
    }

    // ADT
    if (document.getElementById('chkAdt').checked) {
      const pkg = document.querySelector('#tab-add input[name="adtPackage"]:checked')?.value || '';
      if (pkg) {
        const amt = Deals.calcAdtCommission(pkg);
        total += amt;
        const label = Deals.COMMISSION.adt.packages[pkg]?.label || pkg;
        parts.push(`ADT ${label}: $${Math.round(amt)}`);
      }
    }

    document.getElementById('livePayoutAmount').textContent = '$' + Math.round(total).toLocaleString();
    document.getElementById('livePayoutBreakdown').textContent = parts.length > 0 ? parts.join(' + ') : 'Select products above';
  }

  function saveDeal() {
    const name = document.getElementById('customerName').value.trim();
    if (!name) {
      App.showToast('Please enter a customer name', true);
      return;
    }

    const hasFiber = document.getElementById('chkFiber').checked;
    const hasDtv = document.getElementById('chkDtv').checked;
    const hasWireless = document.getElementById('chkWireless').checked;
    const hasAdt = document.getElementById('chkAdt').checked;

    if (!hasFiber && !hasDtv && !hasWireless && !hasAdt) {
      App.showToast('Please select at least one product', true);
      return;
    }

    const deal = {
      name,
      saleDate: document.getElementById('saleDate').value,
      installDate: document.getElementById('installDate').value,
      installed: document.getElementById('isInstalled').checked,
      fiber: hasFiber,
      fiberTier: document.querySelector('#tab-add input[name="fiberTier"]:checked')?.value || '1gig',
      directv: hasDtv,
      wireless: hasWireless,
      closerLines: hasWireless ? parseInt(document.getElementById('closerLines').value) || 0 : 0,
      setterLines: hasWireless ? parseInt(document.getElementById('setterLines').value) || 0 : 0,
      adt: hasAdt,
      adtPackage: hasAdt ? (document.querySelector('#tab-add input[name="adtPackage"]:checked')?.value || '') : '',
      adtAmount: 0
    };

    Deals.addDeal(deal);
    App.showToast(`Deal saved for ${name}`);
    resetForm();
    App.refreshAll();
  }

  function resetForm() {
    document.getElementById('customerName').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saleDate').value = today;
    document.getElementById('installDate').value = '';
    document.getElementById('isInstalled').checked = false;
    document.getElementById('chkFiber').checked = false;
    document.getElementById('chkDtv').checked = false;
    document.getElementById('chkWireless').checked = false;
    document.getElementById('chkAdt').checked = false;
    document.getElementById('closerLines').value = '0';
    document.getElementById('setterLines').value = '0';
    document.querySelectorAll('.sub-options').forEach(el => el.classList.remove('show'));
    // Reset radio to 1 gig
    const oneGigRadio = document.querySelector('#tab-add input[name="fiberTier"][value="1gig"]');
    if (oneGigRadio) oneGigRadio.checked = true;
    // Reset ADT to secure
    const secureRadio = document.querySelector('#tab-add input[name="adtPackage"][value="secure"]');
    if (secureRadio) secureRadio.checked = true;
    updatePayout();
  }

  return { toggleProduct, updatePayout, saveDeal, resetForm };
})();

window.ManualForm = ManualForm;

// ---- Edit Modal Controller ----
const EditModal = (() => {
  let editingDealId = null;

  function open(dealId) {
    const deal = Deals.getById(dealId);
    if (!deal) return;
    editingDealId = dealId;

    // Populate fields
    document.getElementById('editName').value = deal.name || '';
    document.getElementById('editSaleDate').value = deal.saleDate || '';
    document.getElementById('editInstallDate').value = deal.installDate || '';
    document.getElementById('editIsInstalled').checked = deal.installed || false;

    // Products
    document.getElementById('editChkFiber').checked = deal.fiber || false;
    document.getElementById('editChkDtv').checked = deal.directv || false;
    document.getElementById('editChkWireless').checked = deal.wireless || false;
    document.getElementById('editChkAdt').checked = deal.adt || false;

    // Sub-options visibility
    toggleEditProduct('fiber');
    toggleEditProduct('wireless');
    toggleEditProduct('adt');

    // Fiber tier
    if (deal.fiber) {
      const tierRadio = document.querySelector(`input[name="editFiberTier"][value="${deal.fiberTier || '1gig'}"]`);
      if (tierRadio) tierRadio.checked = true;
    }

    // Wireless lines
    document.getElementById('editCloserLines').value = deal.closerLines || 0;
    document.getElementById('editSetterLines').value = deal.setterLines || 0;

    // ADT package
    if (deal.adt && deal.adtPackage) {
      const adtRadio = document.querySelector(`input[name="editAdtPackage"][value="${deal.adtPackage}"]`);
      if (adtRadio) adtRadio.checked = true;
    }

    updateEditPayout();

    // Show modal
    document.getElementById('editModal').classList.add('show');
    Icons.refresh();
  }

  function close() {
    editingDealId = null;
    document.getElementById('editModal').classList.remove('show');
  }

  function toggleEditProduct(product) {
    const map = {
      fiber: { checkbox: 'editChkFiber', options: 'editFiberOptions' },
      wireless: { checkbox: 'editChkWireless', options: 'editWirelessOptions' },
      adt: { checkbox: 'editChkAdt', options: 'editAdtOptions' }
    };

    const config = map[product];
    if (!config) { updateEditPayout(); return; }

    const checkbox = document.getElementById(config.checkbox);
    const optionsEl = document.getElementById(config.options);
    if (checkbox.checked) {
      optionsEl.classList.add('show');
    } else {
      optionsEl.classList.remove('show');
    }
    updateEditPayout();
  }

  function updateEditPayout() {
    let total = 0;
    const parts = [];

    if (document.getElementById('editChkFiber').checked) {
      const tier = document.querySelector('input[name="editFiberTier"]:checked')?.value || '1gig';
      const tierMap = { '300mbps': 250, '500mbps': 300, '1gig': 430, '5gig': 505 };
      const tierLabels = { '300mbps': '300M', '500mbps': '500M', '1gig': '1G', '5gig': '5G' };
      const amt = tierMap[tier] || 430;
      total += amt;
      parts.push(`Fiber ${tierLabels[tier] || '1G'}: $${amt}`);
    }
    if (document.getElementById('editChkDtv').checked) {
      total += 375;
      parts.push('DirecTV: $375');
    }
    if (document.getElementById('editChkWireless').checked) {
      const closer = parseInt(document.getElementById('editCloserLines').value) || 0;
      const setter = parseInt(document.getElementById('editSetterLines').value) || 0;
      total += closer * 130 + setter * 65;
      if (closer > 0) parts.push(`Closer x${closer}: $${closer * 130}`);
      if (setter > 0) parts.push(`Setter x${setter}: $${setter * 65}`);
    }
    if (document.getElementById('editChkAdt').checked) {
      const pkg = document.querySelector('input[name="editAdtPackage"]:checked')?.value || '';
      if (pkg) {
        const amt = Deals.calcAdtCommission(pkg);
        total += amt;
        const label = Deals.COMMISSION.adt.packages[pkg]?.label || pkg;
        parts.push(`ADT ${label}: $${Math.round(amt)}`);
      }
    }

    document.getElementById('editPayoutAmount').textContent = '$' + Math.round(total).toLocaleString();
    document.getElementById('editPayoutBreakdown').textContent = parts.length > 0 ? parts.join(' + ') : 'Select products';
  }

  function save() {
    if (!editingDealId) return;

    const name = document.getElementById('editName').value.trim();
    if (!name) {
      App.showToast('Please enter a customer name', true);
      return;
    }

    const hasFiber = document.getElementById('editChkFiber').checked;
    const hasDtv = document.getElementById('editChkDtv').checked;
    const hasWireless = document.getElementById('editChkWireless').checked;
    const hasAdt = document.getElementById('editChkAdt').checked;

    if (!hasFiber && !hasDtv && !hasWireless && !hasAdt) {
      App.showToast('Please select at least one product', true);
      return;
    }

    const updates = {
      name,
      saleDate: document.getElementById('editSaleDate').value,
      installDate: document.getElementById('editInstallDate').value,
      installed: document.getElementById('editIsInstalled').checked,
      fiber: hasFiber,
      fiberTier: document.querySelector('input[name="editFiberTier"]:checked')?.value || '1gig',
      directv: hasDtv,
      wireless: hasWireless,
      closerLines: hasWireless ? parseInt(document.getElementById('editCloserLines').value) || 0 : 0,
      setterLines: hasWireless ? parseInt(document.getElementById('editSetterLines').value) || 0 : 0,
      adt: hasAdt,
      adtPackage: hasAdt ? (document.querySelector('input[name="editAdtPackage"]:checked')?.value || '') : '',
      adtAmount: 0
    };

    Deals.updateDeal(editingDealId, updates);
    close();
    App.refreshAll();
    App.showToast(`Deal updated for ${name}`);
  }

  return { open, close, toggleEditProduct, updateEditPayout, save };
})();

window.EditModal = EditModal;

// ---- Deals List Controller ----
const DealsList = (() => {
  let currentFilter = 'all';

  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('#filterPills .filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    render();
  }

  function filter() {
    render();
  }

  function render() {
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    let deals = Deals.getAll();

    // Apply filter
    if (currentFilter === 'fiber') deals = deals.filter(d => d.fiber);
    else if (currentFilter === 'directv') deals = deals.filter(d => d.directv);
    else if (currentFilter === 'wireless') deals = deals.filter(d => d.wireless);
    else if (currentFilter === 'adt') deals = deals.filter(d => d.adt);
    else if (currentFilter === 'installed') deals = deals.filter(d => d.installed);
    else if (currentFilter === 'pending') deals = deals.filter(d => !d.installed);

    // Apply search
    if (searchTerm) {
      deals = deals.filter(d => d.name.toLowerCase().includes(searchTerm));
    }

    const listEl = document.getElementById('dealsList');
    const emptyEl = document.getElementById('dealsEmptyState');

    if (deals.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      if (searchTerm || currentFilter !== 'all') {
        emptyEl.querySelector('.empty-state__title').textContent = 'No Matching Deals';
        emptyEl.querySelector('.empty-state__text').textContent = 'Try adjusting your search or filter';
      } else {
        emptyEl.querySelector('.empty-state__title').textContent = 'No Deals Yet';
        emptyEl.querySelector('.empty-state__text').textContent = 'Your sales will appear here as you add them';
      }
      Icons.refresh();
      return;
    }

    emptyEl.style.display = 'none';

    listEl.innerHTML = deals.map(deal => {
      const { totalPayout, breakdown } = Deals.calcDealPayout(deal);
      const { upfront, residuals } = Deals.calcPayoutSplit(deal);
      const types = Dashboard.getProductTypes(deal);

      const badges = types.map(t => `<span class="badge badge--${t}">${t}</span>`).join('');
      const statusBadge = deal.installed
        ? `<span class="badge badge--installed">${Icons.installed} Installed</span>`
        : `<span class="badge badge--pending">${Icons.pending} Pending</span>`;

      // Show sale date as primary, install date secondary
      const saleDateStr = deal.saleDate
        ? new Date(deal.saleDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const installDateStr = deal.installDate
        ? new Date(deal.installDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

      // Detail rows
      let detailRows = '';

      if (saleDateStr) {
        detailRows += `
          <div class="deal-card__detail-row">
            <span class="deal-card__detail-label">Sale Date</span>
            <span class="deal-card__detail-value">${saleDateStr}</span>
          </div>`;
      }
      if (installDateStr) {
        detailRows += `
          <div class="deal-card__detail-row">
            <span class="deal-card__detail-label">Install Date</span>
            <span class="deal-card__detail-value">${installDateStr}</span>
          </div>`;
      }

      breakdown.forEach(b => {
        detailRows += `
          <div class="deal-card__detail-row">
            <span class="deal-card__detail-label">${b.product}${b.detail ? ' (' + b.detail + ')' : ''}</span>
            <span class="deal-card__detail-value">$${b.amount}</span>
          </div>`;
      });

      if (deal.installed && (deal.fiber || deal.directv)) {
        detailRows += `
          <div class="deal-card__detail-row">
            <span class="deal-card__detail-label">Upfront (85%)</span>
            <span class="deal-card__detail-value" style="color:var(--green);">$${Math.round(upfront)}</span>
          </div>`;
        residuals.forEach(r => {
          const dueDate = new Date(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          detailRows += `
            <div class="deal-card__detail-row">
              <span class="deal-card__detail-label">Residual ${r.months}mo (${r.product})</span>
              <span class="deal-card__detail-value" style="color:var(--att-gold);">$${Math.round(r.amount)} — ${dueDate}</span>
            </div>`;
        });
      }

      const dateDisplay = saleDateStr ? `Sold ${saleDateStr}` : (installDateStr ? installDateStr : 'No date set');

      return `
        <div class="deal-card" onclick="window.DealsList.toggleDetails('${deal.id}')">
          <div class="deal-card__header">
            <div class="deal-card__name">${Dashboard.escapeHtml(deal.name)}</div>
            <div class="deal-card__amount">$${Math.round(totalPayout).toLocaleString()}</div>
          </div>
          <div class="deal-card__meta">
            <span class="deal-card__date">${dateDisplay}</span>
            <div class="deal-card__badges">
              ${badges}
              ${statusBadge}
            </div>
          </div>
          <div class="deal-card__details" id="details-${deal.id}">
            ${detailRows}
            <div class="deal-card__actions">
              <button class="deal-card__action-btn deal-card__action-btn--edit"
                      onclick="event.stopPropagation(); window.EditModal.open('${deal.id}')">
                ${Icons.edit} Edit
              </button>
              <button class="deal-card__action-btn deal-card__action-btn--install"
                      onclick="event.stopPropagation(); window.DealsList.toggleInstall('${deal.id}')">
                ${deal.installed ? Icons.pending + ' Mark Pending' : Icons.installed + ' Mark Installed'}
              </button>
              <button class="deal-card__action-btn deal-card__action-btn--delete"
                      onclick="event.stopPropagation(); window.App.confirmDelete('${deal.id}', '${Dashboard.escapeHtml(deal.name)}')">
                ${Icons.trash} Delete
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
    Icons.refresh();
  }

  function toggleDetails(dealId) {
    const el = document.getElementById(`details-${dealId}`);
    if (el) {
      el.classList.toggle('show');
    }
  }

  function toggleInstall(dealId) {
    Deals.toggleInstalled(dealId);
    App.refreshAll();
    App.showToast('Deal updated');
  }

  return { setFilter, filter, render, toggleDetails, toggleInstall };
})();

window.DealsList = DealsList;

// ---- Timeline Controller ----
const Timeline = (() => {
  let viewMode = 'day';    // 'day' | 'week' | 'month'
  let currentDate = new Date();
  let selectedDay = null;  // For drill-down in week/month views

  function setView(mode) {
    viewMode = mode;
    selectedDay = null;
    document.querySelectorAll('#timelineViewPills .filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tview === mode);
    });
    render();
  }

  function navigate(dir) {
    selectedDay = null;
    if (viewMode === 'day') {
      currentDate.setDate(currentDate.getDate() + dir);
    } else if (viewMode === 'week') {
      currentDate.setDate(currentDate.getDate() + (dir * 7));
    } else if (viewMode === 'month') {
      currentDate.setMonth(currentDate.getMonth() + dir);
    }
    render();
  }

  function goToday() {
    currentDate = new Date();
    selectedDay = null;
    render();
  }

  function selectDay(dateStr) {
    selectedDay = dateStr;
    render();
  }

  function formatMoney(n) {
    return '$' + Math.round(n).toLocaleString();
  }

  function render() {
    const headerEl = document.getElementById('timelineHeader');
    const dealsEl = document.getElementById('timelineDeals');
    const statsEl = document.getElementById('timelineStats');

    if (viewMode === 'day') {
      renderDayView(headerEl, statsEl, dealsEl);
    } else if (viewMode === 'week') {
      renderWeekView(headerEl, statsEl, dealsEl);
    } else if (viewMode === 'month') {
      renderMonthView(headerEl, statsEl, dealsEl);
    }

    Icons.refresh();
  }

  // ================== DAY VIEW ==================
  function renderDayView(headerEl, statsEl, dealsEl) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const deals = Deals.getDealsForDate(dateStr);
    let headerText = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const subText = currentDate.toLocaleDateString('en-US', { year: 'numeric' });

    const today = new Date();
    if (currentDate.toDateString() === today.toDateString()) {
      headerText = 'Today — ' + headerText;
    }

    headerEl.innerHTML = renderNav(headerText, subText);
    statsEl.innerHTML = renderStatsSummary(deals);
    dealsEl.innerHTML = renderDealCards(deals, 'day');
  }

  // ================== WEEK VIEW ==================
  function renderWeekView(headerEl, statsEl, dealsEl) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const headerText = `${startLabel} — ${endLabel}`;
    const subText = weekStart.getFullYear().toString();

    headerEl.innerHTML = renderNav(headerText, subText);

    // Build 7-day grid data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0,0,0,0);
    let weekTotal = 0;
    let weekDealCount = 0;
    let maxDayTotal = 0;
    const dayData = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const dayDeals = Deals.getDealsForDate(ds);
      let dayTotal = 0;
      dayDeals.forEach(deal => {
        const { totalPayout: tp } = Deals.calcDealPayout(deal);
        dayTotal += tp;
      });
      weekTotal += dayTotal;
      weekDealCount += dayDeals.length;
      if (dayTotal > maxDayTotal) maxDayTotal = dayTotal;
      dayData.push({
        dateStr: ds,
        label: dayNames[i],
        dayNum: d.getDate(),
        dealCount: dayDeals.length,
        total: dayTotal,
        isToday: d.getTime() === today.getTime(),
        isSelected: selectedDay === ds
      });
    }

    // Stats summary for the week
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const allWeekDeals = Deals.getDealsForWeek(weekStartStr);
    statsEl.innerHTML = renderStatsSummary(allWeekDeals);

    // Week grid
    const barMax = maxDayTotal || 1;
    let gridHtml = '<div class="week-grid">';
    dayData.forEach(day => {
      const barPct = maxDayTotal > 0 ? Math.max((day.total / barMax) * 100, day.dealCount > 0 ? 4 : 0) : 0;
      const activeClass = day.isSelected ? 'week-grid__row--active' : '';
      const todayClass = day.isToday ? 'week-grid__row--today' : '';

      gridHtml += `
        <div class="week-grid__row ${activeClass} ${todayClass}" onclick="window.Timeline.selectDay('${day.dateStr}')">
          <div class="week-grid__day">
            <span class="week-grid__day-name">${day.label}</span>
            <span class="week-grid__day-num">${day.dayNum}</span>
          </div>
          <div class="week-grid__bar-track">
            <div class="week-grid__bar-fill" style="width:${barPct}%"></div>
          </div>
          <div class="week-grid__stats">
            <span class="week-grid__amount">${day.total > 0 ? formatMoney(day.total) : '—'}</span>
            <span class="week-grid__count">${day.dealCount > 0 ? day.dealCount + ' deal' + (day.dealCount > 1 ? 's' : '') : ''}</span>
          </div>
        </div>
      `;
    });
    gridHtml += '</div>';

    // Drill-down deal list
    let drillHtml = '';
    if (selectedDay) {
      const drillDeals = Deals.getDealsForDate(selectedDay);
      const drillDate = new Date(selectedDay + 'T12:00:00');
      const drillLabel = drillDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      drillHtml = `
        <div class="drill-down">
          <div class="drill-down__header">${drillLabel}</div>
          ${renderDealCards(drillDeals, 'week')}
        </div>
      `;
    }

    dealsEl.innerHTML = gridHtml + drillHtml;
  }

  // ================== MONTH VIEW ==================
  function renderMonthView(headerEl, statsEl, dealsEl) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const headerText = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const allMonthDeals = Deals.getDealsForMonth(year, month);
    const subText = `${allMonthDeals.length} deal${allMonthDeals.length !== 1 ? 's' : ''}`;

    headerEl.innerHTML = renderNav(headerText, subText);
    statsEl.innerHTML = renderStatsSummary(allMonthDeals);

    // Build calendar grid
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();
    const today = new Date();
    today.setHours(0,0,0,0);

    // Pre-compute deal data per day
    const dayMap = {};
    allMonthDeals.forEach(deal => {
      const sd = deal.saleDate || (deal.createdAt ? deal.createdAt.split('T')[0] : '');
      if (!sd) return;
      if (!dayMap[sd]) dayMap[sd] = { count: 0, total: 0 };
      const { totalPayout: tp } = Deals.calcDealPayout(deal);
      dayMap[sd].count++;
      dayMap[sd].total += tp;
    });

    let calHtml = '<div class="month-calendar">';
    // Day-of-week headers
    calHtml += '<div class="month-calendar__header">';
    ['S','M','T','W','T','F','S'].forEach(d => {
      calHtml += `<div class="month-calendar__dow">${d}</div>`;
    });
    calHtml += '</div>';

    // Calendar cells
    calHtml += '<div class="month-calendar__grid">';

    // Empty cells before month starts
    for (let i = 0; i < startDow; i++) {
      calHtml += '<div class="month-calendar__cell month-calendar__cell--empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const ds = d.toISOString().split('T')[0];
      const data = dayMap[ds] || { count: 0, total: 0 };
      const isToday = d.getTime() === today.getTime();
      const isSelected = selectedDay === ds;

      const todayClass = isToday ? 'month-calendar__cell--today' : '';
      const activeClass = isSelected ? 'month-calendar__cell--active' : '';
      const hasDeals = data.count > 0 ? 'month-calendar__cell--has-deals' : '';

      calHtml += `
        <div class="month-calendar__cell ${todayClass} ${activeClass} ${hasDeals}"
             onclick="window.Timeline.selectDay('${ds}')">
          <div class="month-calendar__day-num">${day}</div>
          ${data.count > 0 ? `
            <div class="month-calendar__dots">
              ${Array(Math.min(data.count, 3)).fill('<span class="month-calendar__dot"></span>').join('')}
              ${data.count > 3 ? '<span class="month-calendar__dot month-calendar__dot--more">+</span>' : ''}
            </div>
            <div class="month-calendar__amount">${formatMoney(data.total)}</div>
          ` : ''}
        </div>
      `;
    }

    // Empty cells after month ends
    const totalCells = startDow + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      calHtml += '<div class="month-calendar__cell month-calendar__cell--empty"></div>';
    }

    calHtml += '</div></div>';

    // Drill-down
    let drillHtml = '';
    if (selectedDay) {
      const drillDeals = Deals.getDealsForDate(selectedDay);
      const drillDate = new Date(selectedDay + 'T12:00:00');
      const drillLabel = drillDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      drillHtml = `
        <div class="drill-down">
          <div class="drill-down__header">${drillLabel}</div>
          ${renderDealCards(drillDeals, 'month')}
        </div>
      `;
    }

    dealsEl.innerHTML = calHtml + drillHtml;
  }

  // ================== SHARED HELPERS ==================
  function renderNav(title, sub) {
    return `
      <div class="timeline-nav">
        <button class="timeline-nav__btn" onclick="window.Timeline.navigate(-1)">
          <i data-lucide="chevron-left" style="width:20px;height:20px;"></i>
        </button>
        <div class="timeline-nav__info">
          <div class="timeline-nav__title">${title}</div>
          <div class="timeline-nav__sub">${sub}</div>
        </div>
        <button class="timeline-nav__btn" onclick="window.Timeline.navigate(1)">
          <i data-lucide="chevron-right" style="width:20px;height:20px;"></i>
        </button>
      </div>
    `;
  }

  function renderStatsSummary(deals) {
    let totalPayout = 0;
    let fiberCount = 0, dtvCount = 0, wirelessCount = 0, adtCount = 0;
    deals.forEach(deal => {
      const { totalPayout: tp } = Deals.calcDealPayout(deal);
      totalPayout += tp;
      if (deal.fiber) fiberCount++;
      if (deal.directv) dtvCount++;
      if (deal.wireless) wirelessCount++;
      if (deal.adt) adtCount++;
    });

    return `
      <div class="timeline-totals">
        <div class="timeline-totals__main">
          <div class="timeline-totals__label">Total Earnings</div>
          <div class="timeline-totals__value">${formatMoney(totalPayout)}</div>
          <div class="timeline-totals__count">${deals.length} deal${deals.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="timeline-totals__products">
          ${fiberCount > 0 ? `<span class="timeline-product-tag timeline-product-tag--fiber">${Icons.raw.fiber} ${fiberCount}</span>` : ''}
          ${dtvCount > 0 ? `<span class="timeline-product-tag timeline-product-tag--dtv">${Icons.raw.directv} ${dtvCount}</span>` : ''}
          ${wirelessCount > 0 ? `<span class="timeline-product-tag timeline-product-tag--wireless">${Icons.raw.wireless} ${wirelessCount}</span>` : ''}
          ${adtCount > 0 ? `<span class="timeline-product-tag timeline-product-tag--adt">${Icons.raw.adt} ${adtCount}</span>` : ''}
        </div>
      </div>
    `;
  }

  function renderDealCards(deals, context) {
    if (deals.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">
            <i data-lucide="calendar-days" style="width:48px;height:48px;"></i>
          </div>
          <div class="empty-state__title">No Deals</div>
          <div class="empty-state__text">No sales recorded for this ${context}</div>
        </div>
      `;
    }

    return deals.map(deal => {
      const { totalPayout: tp } = Deals.calcDealPayout(deal);
      const types = Dashboard.getProductTypes(deal);
      const label = Dashboard.getProductLabel(deal);
      const badges = types.map(t => `<span class="badge badge--${t}">${t}</span>`).join('');
      const statusBadge = deal.installed
        ? `<span class="badge badge--installed"><i data-lucide="circle-check-big" style="width:12px;height:12px;"></i></span>`
        : `<span class="badge badge--pending"><i data-lucide="clock" style="width:12px;height:12px;"></i></span>`;

      return `
        <div class="timeline-deal-card" onclick="window.EditModal.open('${deal.id}')">
          <div class="timeline-deal-card__header">
            <div>
              <div class="timeline-deal-card__name">${Dashboard.escapeHtml(deal.name)}</div>
              <div class="timeline-deal-card__label">${label}</div>
            </div>
            <div class="timeline-deal-card__amount">${formatMoney(tp)}</div>
          </div>
          <div class="timeline-deal-card__badges">${badges} ${statusBadge}</div>
        </div>
      `;
    }).join('');
  }

  return { setView, navigate, goToday, selectDay, render };
})();

window.Timeline = Timeline;

// ---- Main App Controller ----
const App = (() => {
  let deleteTargetId = null;

  function init() {
    updateHeaderDate();
    refreshAll();

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const saleDateInput = document.getElementById('saleDate');
    const dateInput = document.getElementById('installDate');
    if (saleDateInput) saleDateInput.value = today;
    if (dateInput) dateInput.value = '';

    // Mode toggle
    document.getElementById('modeAiBtn').addEventListener('click', () => setMode('ai'));
    document.getElementById('modeManualBtn').addEventListener('click', () => setMode('manual'));

    // Edit modal overlay click to close
    document.getElementById('editModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) EditModal.close();
    });

    // Init Firebase (async, non-blocking)
    Deals.initFirebase();
  }

  function updateHeaderDate() {
    const el = document.getElementById('headerDate');
    if (el) {
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }

  function switchTab(tabName) {
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(el => {
      el.classList.toggle('active', el.id === `tab-${tabName}`);
    });

    // Update tab bar buttons
    document.querySelectorAll('.tab-bar__btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Refresh the tab we're switching to
    if (tabName === 'dashboard') Dashboard.render();
    else if (tabName === 'deals') DealsList.render();
    else if (tabName === 'payouts') Payouts.render();
    else if (tabName === 'timeline') Timeline.render();
  }

  function setMode(mode) {
    document.getElementById('modeAiBtn').classList.toggle('active', mode === 'ai');
    document.getElementById('modeManualBtn').classList.toggle('active', mode === 'manual');
    document.getElementById('aiMode').style.display = mode === 'ai' ? 'block' : 'none';
    document.getElementById('manualMode').style.display = mode === 'manual' ? 'block' : 'none';
  }

  function refreshAll() {
    Dashboard.render();
    DealsList.render();
    Payouts.render();
    // Only render timeline if its tab is active
    if (document.getElementById('tab-timeline')?.classList.contains('active')) {
      Timeline.render();
    }
    Icons.refresh();
  }

  function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.toggle('toast--error', isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function confirmDelete(dealId, name) {
    deleteTargetId = dealId;
    document.getElementById('deleteModalText').textContent = `Delete the deal for "${name}"? This cannot be undone.`;
    document.getElementById('deleteModal').classList.add('show');
    document.getElementById('deleteConfirmBtn').onclick = () => {
      if (deleteTargetId) {
        Deals.deleteDeal(deleteTargetId);
        closeDeleteModal();
        refreshAll();
        showToast('Deal deleted');
      }
    };
  }

  function closeDeleteModal() {
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.remove('show');
  }

  // Close modal on overlay click
  document.getElementById('deleteModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  return { init, switchTab, refreshAll, showToast, confirmDelete, closeDeleteModal };
})();

window.App = App;
window.Payouts = Payouts;

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  Icons.refresh();
});
