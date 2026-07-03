/* ============================================================
   settings.js — Commission Rate Settings UI
   User-configurable rates, non-retroactive (stamped on deals at creation)
   ============================================================ */

window.SettingsTab = (() => {

  function init() {
    render();
  }

  function render() {
    const root = document.getElementById('settingsRoot');
    if (!root) return;

    const rates = Deals.getActiveRates();
    const defaults = Deals.COMMISSION;

    root.innerHTML = `
      <!-- Fiber Section -->
      <div class="settings-group">
        <div class="settings-group__header">
          <div class="settings-group__icon settings-group__icon--fiber">
            ${window.Icons.fiber}
          </div>
          <div>
            <div class="settings-group__title">Fiber</div>
            <div class="settings-group__sub">Base commission + CA bonus per tier</div>
          </div>
        </div>

        <div class="settings-group__fields">
          <div class="settings-field">
            <label class="settings-field__label">CA Bonus (all tiers)</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setFiberBonus" value="${rates.fiber['1gig'].caBonus}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Default: $${defaults.fiber['1gig'].caBonus}</div>
          </div>

          <div class="settings-field">
            <label class="settings-field__label">300 Mbps Base</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setFiber300" value="${rates.fiber['300mbps'].base}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Total: $${rates.fiber['300mbps'].total} · Default: $${defaults.fiber['300mbps'].base}</div>
          </div>

          <div class="settings-field">
            <label class="settings-field__label">500 Mbps Base</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setFiber500" value="${rates.fiber['500mbps'].base}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Total: $${rates.fiber['500mbps'].total} · Default: $${defaults.fiber['500mbps'].base}</div>
          </div>

          <div class="settings-field">
            <label class="settings-field__label">1 Gig Base</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setFiber1g" value="${rates.fiber['1gig'].base}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Total: $${rates.fiber['1gig'].total} · Default: $${defaults.fiber['1gig'].base}</div>
          </div>

          <div class="settings-field">
            <label class="settings-field__label">5 Gig Base</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setFiber5g" value="${rates.fiber['5gig'].base}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Total: $${rates.fiber['5gig'].total} · Default: $${defaults.fiber['5gig'].base}</div>
          </div>
        </div>
      </div>

      <!-- DirecTV Section -->
      <div class="settings-group">
        <div class="settings-group__header">
          <div class="settings-group__icon settings-group__icon--directv">
            ${window.Icons.directv}
          </div>
          <div>
            <div class="settings-group__title">DirecTV</div>
            <div class="settings-group__sub">Flat commission per sale</div>
          </div>
        </div>

        <div class="settings-group__fields">
          <div class="settings-field">
            <label class="settings-field__label">Commission</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setDirectv" value="${rates.directv.total}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Default: $${defaults.directv.total}</div>
          </div>
        </div>
      </div>

      <!-- Wireless Section -->
      <div class="settings-group">
        <div class="settings-group__header">
          <div class="settings-group__icon settings-group__icon--wireless">
            ${window.Icons.wireless}
          </div>
          <div>
            <div class="settings-group__title">Wireless</div>
            <div class="settings-group__sub">Per-line commission rates</div>
          </div>
        </div>

        <div class="settings-group__fields">
          <div class="settings-field">
            <label class="settings-field__label">Closer (per line)</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setWirelessCloser" value="${rates.wireless.closer}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Default: $${defaults.wireless.closer}</div>
          </div>

          <div class="settings-field">
            <label class="settings-field__label">Setter (per line)</label>
            <div class="settings-field__input-wrap">
              <span class="settings-field__prefix">$</span>
              <input type="number" class="settings-field__input" id="setWirelessSetter" value="${rates.wireless.setter}" min="0" step="1" />
            </div>
            <div class="settings-field__default">Default: $${defaults.wireless.setter}</div>
          </div>
        </div>
      </div>

      <!-- ADT Section (read-only, formula-based) -->
      <div class="settings-group">
        <div class="settings-group__header">
          <div class="settings-group__icon settings-group__icon--adt">
            ${window.Icons.adt}
          </div>
          <div>
            <div class="settings-group__title">ADT</div>
            <div class="settings-group__sub">Formula-based · Activation + (Monthly × 36) × 68%</div>
          </div>
        </div>

        <div class="settings-group__fields">
          <div class="settings-field">
            <label class="settings-field__label">Secure ($53.99/mo)</label>
            <div class="settings-field__readonly">$${Math.round(Deals.calcAdtCommission('secure'))}</div>
          </div>
          <div class="settings-field">
            <label class="settings-field__label">Smart ($63.99/mo)</label>
            <div class="settings-field__readonly">$${Math.round(Deals.calcAdtCommission('smart'))}</div>
          </div>
          <div class="settings-field">
            <label class="settings-field__label">Complete ($74.99/mo)</label>
            <div class="settings-field__readonly">$${Math.round(Deals.calcAdtCommission('complete'))}</div>
          </div>
          <div class="settings-field">
            <label class="settings-field__label">Complete + Nest ($81.99/mo)</label>
            <div class="settings-field__readonly">$${Math.round(Deals.calcAdtCommission('completeNest'))}</div>
          </div>
        </div>
      </div>

      <!-- Save + Reset -->
      <div class="settings-actions">
        <button class="btn btn--primary settings-save-btn" onclick="window.SettingsTab.save()">
          Save Commission Rates
        </button>
        <button class="btn btn--secondary settings-reset-btn" onclick="window.SettingsTab.resetDefaults()">
          Reset to Defaults
        </button>
      </div>

      <div style="padding-bottom: 100px;"></div>
    `;

    window.Icons.refresh();
  }

  function save() {
    const settings = {
      fiberBonus: parseFloat(document.getElementById('setFiberBonus').value) || 0,
      fiber300: parseFloat(document.getElementById('setFiber300').value) || 0,
      fiber500: parseFloat(document.getElementById('setFiber500').value) || 0,
      fiber1g: parseFloat(document.getElementById('setFiber1g').value) || 0,
      fiber5g: parseFloat(document.getElementById('setFiber5g').value) || 0,
      directv: parseFloat(document.getElementById('setDirectv').value) || 0,
      wirelessCloser: parseFloat(document.getElementById('setWirelessCloser').value) || 0,
      wirelessSetter: parseFloat(document.getElementById('setWirelessSetter').value) || 0
    };

    Deals.saveSettings(settings);

    // Show toast
    if (window.App && window.App.showToast) {
      window.App.showToast('Commission rates saved! New deals will use these rates.');
    }

    // Re-render to show updated totals
    render();
  }

  function resetDefaults() {
    localStorage.removeItem('att_sales_settings');

    if (window.App && window.App.showToast) {
      window.App.showToast('Commission rates reset to defaults.');
    }

    render();
  }

  return { init, render, save, resetDefaults };
})();
