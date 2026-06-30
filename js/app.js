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
      phone: document.getElementById('customerPhone')?.value.trim() || '',
      saleDate: document.getElementById('saleDate').value,
      installDate: document.getElementById('installDate').value,
      followUpDate: document.getElementById('followUpDate')?.value || '',
      notes: document.getElementById('customerNotes')?.value.trim() || '',
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
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) phoneInput.value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('saleDate').value = today;
    document.getElementById('installDate').value = '';
    const followUpInput = document.getElementById('followUpDate');
    if (followUpInput) followUpInput.value = '';
    const notesInput = document.getElementById('customerNotes');
    if (notesInput) notesInput.value = '';
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
      let statusBadge = '';
      if (deal.status === 'cbi') {
        statusBadge = `<span class="badge badge--cancelled">${Icons.xCircle} Cancelled Before Install</span>`;
      } else if (deal.status === 'cai') {
        statusBadge = `<span class="badge badge--cancelled">${Icons.xCircle} Cancelled After Install</span>`;
      } else if (deal.installed) {
        statusBadge = `<span class="badge badge--installed">${Icons.installed} Installed</span>`;
      } else {
        statusBadge = `<span class="badge badge--pending">${Icons.pending} Pending</span>`;
      }

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

      if (deal.notes) {
        detailRows += `<div class="deal-card__notes">${Dashboard.escapeHtml(deal.notes)}</div>`;
      }

      let contactActions = '';
      if (deal.phone) {
        contactActions = `
          <div class="contact-actions">
            <a href="sms:${deal.phone}" class="btn-contact btn-contact--text" onclick="event.stopPropagation();">
              ${Icons.messageCircle} Text Customer
            </a>
            <a href="tel:${deal.phone}" class="btn-contact btn-contact--call" onclick="event.stopPropagation();">
              ${Icons.phone} Call Customer
            </a>
          </div>
        `;
      } else if (deal.followUpDate) {
        const fDate = new Date(deal.followUpDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        contactActions = `
          <div class="contact-actions">
            <div style="flex:1;text-align:center;font-size:12px;color:var(--att-orange);padding:10px;">
              Follow-up Alert: ${fDate}
            </div>
          </div>
        `;
      }

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
            ${contactActions}
            <div class="deal-card__actions">
              <button class="deal-card__action-btn deal-card__action-btn--edit"
                      onclick="event.stopPropagation(); window.EditModal.open('${deal.id}')">
                ${Icons.edit} Edit
              </button>
              <button class="deal-card__action-btn deal-card__action-btn--install"
                      onclick="event.stopPropagation(); window.DealsList.toggleInstall('${deal.id}')">
                ${deal.installed ? Icons.pending + ' Mark Pending' : Icons.installed + ' Mark Installed'}
              </button>
              ${deal.status === 'active' ? `
                <button class="deal-card__action-btn deal-card__action-btn--cancel"
                        onclick="event.stopPropagation(); window.DealsList.markStatus('${deal.id}', 'cbi')">
                  ${Icons.xCircle} Cancel Before Install
                </button>
                <button class="deal-card__action-btn deal-card__action-btn--cancel"
                        onclick="event.stopPropagation(); window.DealsList.markStatus('${deal.id}', 'cai')">
                  ${Icons.xCircle} Cancel After Install
                </button>
              ` : `
                <button class="deal-card__action-btn deal-card__action-btn--restore"
                        onclick="event.stopPropagation(); window.DealsList.markStatus('${deal.id}', 'active')">
                  ${Icons.refreshCw} Restore Active
                </button>
              `}
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

  function markStatus(dealId, status) {
    Deals.markStatus(dealId, status);
    App.refreshAll();
    App.showToast(status === 'active' ? 'Deal restored to active' : 'Deal marked as cancelled');
  }

  return { setFilter, filter, render, toggleDetails, toggleInstall, markStatus };
})();
window.DealsList = DealsList;

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

    if (window.CalendarTab) CalendarTab.init();
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
    if (window.DealsList && tabName === 'deals') DealsList.render();
    if (window.Payouts && tabName === 'payouts') Payouts.render();
    if (window.Attrition && tabName === 'attrition') Attrition.render();
    if (window.CalendarTab && tabName === 'calendar') CalendarTab.render();
    else if (tabName === 'dashboard') Dashboard.render();
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
    if (window.Attrition) Attrition.render();

    if (window.CalendarTab) CalendarTab.render();
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
