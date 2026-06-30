/* ============================================================
   payouts.js — Friday Payday View + Residual Tracker
   Shows upfront 85% commissions grouped by Friday paydate,
   pending installs, and upcoming residual payouts.
   ============================================================ */

const Payouts = (() => {
  let currentView = 'upcoming'; // 'upcoming' | 'residuals' | 'all'

  function setView(view) {
    currentView = view;
    document.querySelectorAll('[data-pview]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pview === view);
    });
    render();
  }

  function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString();
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatDateLong(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getDaysUntil(dateStr) {
    const due = new Date(dateStr);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  }

  function getThisFriday() {
    const now = new Date();
    const day = now.getDay();
    const daysUntilFri = (5 - day + 7) % 7;
    const friday = new Date(now);
    friday.setDate(friday.getDate() + (daysUntilFri === 0 ? 0 : daysUntilFri));
    return friday.toISOString().split('T')[0];
  }

  function isThisWeekFriday(fridayStr) {
    return fridayStr === getThisFriday();
  }

  function isPastFriday(fridayStr) {
    return new Date(fridayStr + 'T12:00:00') < new Date();
  }

  function getCountdownText(daysUntil, paid) {
    if (paid) return 'Collected';
    if (daysUntil <= 0) return 'Due now';
    if (daysUntil === 1) return '1 day left';
    if (daysUntil <= 30) return `${daysUntil} days left`;
    const months = Math.floor(daysUntil / 30);
    const remaining = daysUntil % 30;
    if (remaining === 0) return `${months} month${months > 1 ? 's' : ''} left`;
    return `${months}mo ${remaining}d left`;
  }

  function render() {
    const listEl = document.getElementById('payoutsList');
    const emptyEl = document.getElementById('payoutsEmptyState');

    // ---- Calculate summary stats ----
    const thisFriday = getThisFriday();
    const paydayGroups = Deals.getInstalledDealsByPayday();
    const pendingInstalls = Deals.getPendingInstalls();
    const allResiduals = Deals.getAllResiduals();

    // This Friday's total
    const thisFridayGroup = paydayGroups.find(g => g.friday === thisFriday);
    let thisFridayTotal = 0;
    if (thisFridayGroup) {
      thisFridayGroup.deals.forEach(deal => {
        const { upfront } = Deals.calcPayoutSplit(deal);
        thisFridayTotal += upfront;
      });
    }

    // Pending installs total
    let pendingTotal = 0;
    pendingInstalls.forEach(deal => {
      const { totalPayout } = Deals.calcDealPayout(deal);
      pendingTotal += totalPayout;
    });

    // Residuals
    let residualsPending = 0;
    let residualsDue = 0;
    let residualsCollected = 0;
    allResiduals.forEach(r => {
      const days = getDaysUntil(r.dueDate);
      if (r.paid) residualsCollected += r.amount;
      else if (days <= 0) residualsDue += r.amount;
      else residualsPending += r.amount;
    });

    // Update summary cards
    document.getElementById('payThisFriday').textContent = formatMoney(thisFridayTotal);
    document.getElementById('payThisFridayDate').textContent = formatDate(thisFriday);
    document.getElementById('payPendingInstalls').textContent = formatMoney(pendingTotal);
    document.getElementById('payPendingCount').textContent = `${pendingInstalls.length} deal${pendingInstalls.length !== 1 ? 's' : ''}`;
    document.getElementById('payResiduals').textContent = formatMoney(residualsDue + residualsPending);
    document.getElementById('payResidualsStatus').textContent = residualsDue > 0
      ? `${formatMoney(residualsDue)} due now`
      : `${allResiduals.filter(r => !r.paid).length} upcoming`;

    // ---- Render main content ----
    let html = '';

    if (currentView === 'upcoming' || currentView === 'all') {
      // Friday payday groups
      if (paydayGroups.length > 0) {
        html += paydayGroups.map(group => {
          let groupTotal = 0;
          const dealCards = group.deals.map(deal => {
            const { upfront } = Deals.calcPayoutSplit(deal);
            groupTotal += upfront;
            const types = Dashboard.getProductTypes(deal);
            const badges = types.map(t => `<span class="badge badge--${t}">${t}</span>`).join('');

            return `
              <div class="payday-deal" onclick="window.EditModal.open('${deal.id}')">
                <div class="payday-deal__info">
                  <div class="payday-deal__name">${Dashboard.escapeHtml(deal.name)}</div>
                  <div class="payday-deal__badges">${badges}</div>
                </div>
                <div class="payday-deal__amount">${formatMoney(upfront)}</div>
              </div>
            `;
          }).join('');

          const isThisWeek = isThisWeekFriday(group.friday);
          const isPast = isPastFriday(group.friday);
          const headerClass = isThisWeek ? 'payday-group__header--current' : (isPast ? 'payday-group__header--past' : '');
          const label = isThisWeek ? 'This Friday' : (isPast ? 'Paid' : 'Upcoming');

          return `
            <div class="payday-group">
              <div class="payday-group__header ${headerClass}">
                <div class="payday-group__date">
                  <i data-lucide="calendar-days" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;"></i>
                  ${formatDate(group.friday)}
                  <span class="payday-group__label">${label}</span>
                </div>
                <div class="payday-group__total">${formatMoney(groupTotal)}</div>
              </div>
              <div class="payday-group__deals">${dealCards}</div>
            </div>
          `;
        }).join('');
      }

      // Pending installs (not yet installed — no payday yet)
      if (pendingInstalls.length > 0 && (currentView === 'all' || paydayGroups.length === 0)) {
        html += `
          <div class="payout-section">
            <div class="payout-section__title">Awaiting Install (${pendingInstalls.length})</div>
            ${pendingInstalls.map(deal => {
              const { totalPayout } = Deals.calcDealPayout(deal);
              const types = Dashboard.getProductTypes(deal);
              const badges = types.map(t => `<span class="badge badge--${t}">${t}</span>`).join('');
              return `
                <div class="payday-deal payday-deal--pending" onclick="window.EditModal.open('${deal.id}')">
                  <div class="payday-deal__info">
                    <div class="payday-deal__name">${Dashboard.escapeHtml(deal.name)}</div>
                    <div class="payday-deal__badges">${badges}</div>
                  </div>
                  <div class="payday-deal__amount payday-deal__amount--pending">${formatMoney(totalPayout)}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    if (currentView === 'residuals' || currentView === 'all') {
      // Residual tracking
      if (allResiduals.length > 0) {
        const dueNow = [];
        const pending = [];
        const paid = [];

        allResiduals.forEach(r => {
          const days = getDaysUntil(r.dueDate);
          if (r.paid) paid.push({ ...r, days });
          else if (days <= 0) dueNow.push({ ...r, days });
          else pending.push({ ...r, days });
        });

        if (dueNow.length > 0) {
          html += `<div class="payout-section">
            <div class="payout-section__title">Ready to Collect (${dueNow.length})</div>
            ${dueNow.map(r => renderResidualCard(r)).join('')}
          </div>`;
        }

        if (pending.length > 0) {
          html += `<div class="payout-section">
            <div class="payout-section__title">Pending Residuals (${pending.length})</div>
            ${pending.map(r => renderResidualCard(r)).join('')}
          </div>`;
        }

        if (paid.length > 0) {
          html += `<div class="payout-section">
            <div class="payout-section__title">Collected (${paid.length})</div>
            ${paid.map(r => renderResidualCard(r)).join('')}
          </div>`;
        }
      }
    }

    if (!html) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = html;
    Icons.refresh();
  }

  function renderResidualCard(r) {
    const status = r.paid ? 'paid' : (r.days <= 0 ? 'due' : 'pending');
    const dueDate = new Date(r.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const productKey = r.product.toLowerCase() === 'directv' ? 'directv' : 'fiber';

    return `
      <div class="payout-card">
        <div class="payout-card__status payout-card__status--${status}"></div>
        <div class="payout-card__info">
          <div class="payout-card__name">${Dashboard.escapeHtml(r.customerName)}</div>
          <div class="payout-card__product">${r.product} · ${r.months}mo residual · ${dueDate}</div>
          <div class="payout-card__countdown ${status === 'due' ? 'payout-card__countdown--due' : ''}">${getCountdownText(r.days, r.paid)}</div>
        </div>
        <div class="payout-card__amount">${formatMoney(r.amount)}</div>
        <div class="payout-card__check ${r.paid ? 'checked' : ''}"
             onclick="event.stopPropagation(); window.Payouts.togglePaid('${r.dealId}', '${productKey}')"
             title="${r.paid ? 'Mark as uncollected' : 'Mark as collected'}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="payout-check-svg"><path d="M3 8l3.5 3.5L13 5"/></svg>
        </div>
      </div>
    `;
  }

  function togglePaid(dealId, product) {
    Deals.toggleResidualPaid(dealId, product);
    render();
    Dashboard.render();
  }

  return { render, setView, togglePaid };
})();
