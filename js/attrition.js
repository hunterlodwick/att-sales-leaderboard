window.Attrition = (function() {

  function render() {
    const deals = window.Deals.getAll();
    const cbiDeals = deals.filter(d => d.status === 'cbi');
    const caiDeals = deals.filter(d => d.status === 'cai');
    const cancelledDeals = [...cbiDeals, ...caiDeals];

    const totalSales = deals.length;
    const cbiCount = cbiDeals.length;
    const caiCount = caiDeals.length;
    const totalCancelled = cancelledDeals.length;
    const attritionRate = totalSales > 0 ? Math.round((totalCancelled / totalSales) * 100) : 0;

    // Update Metrics
    document.getElementById('attrTotalSales').textContent = totalSales;
    document.getElementById('attrCbi').textContent = cbiCount;
    document.getElementById('attrCai').textContent = caiCount;
    document.getElementById('attrRate').textContent = `${attritionRate}%`;

    // Render List
    const listEl = document.getElementById('attritionList');
    const emptyEl = document.getElementById('attritionEmptyState');

    if (cancelledDeals.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      return;
    }

    emptyEl.style.display = 'none';

    let html = '';
    cancelledDeals.forEach(deal => {
      const isCbi = deal.status === 'cbi';
      const badge = isCbi 
        ? `<span class="badge badge--cancelled">${window.Icons.xCircle} Cancelled Before Install</span>`
        : `<span class="badge badge--cancelled">${window.Icons.xCircle} Cancelled After Install</span>`;

      html += `
        <div class="deal-card">
          <div class="deal-card__header">
            <div class="deal-card__title">${window.Dashboard.escapeHtml(deal.name)}</div>
          </div>
          <div class="deal-card__date">Sold: ${window.Dashboard.formatDate(deal.saleDate)}</div>
          <div class="deal-card__badges" style="margin-top: 12px; margin-bottom: 12px;">
            ${badge}
          </div>
          <div class="deal-card__actions" style="margin-top: 12px;">
            <button class="deal-card__action-btn deal-card__action-btn--restore"
                    onclick="event.stopPropagation(); window.DealsList.markStatus('${deal.id}', 'active')">
              ${window.Icons.refreshCw} Restore Active
            </button>
            <button class="deal-card__action-btn deal-card__action-btn--delete"
                    onclick="event.stopPropagation(); window.App.confirmDelete('${deal.id}', '${window.Dashboard.escapeHtml(deal.name)}')">
              ${window.Icons.trash} Delete
            </button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
    window.Icons.refresh();
  }

  return { render };
})();
