/* ============================================================
   icons.js — Lucide Icon System
   Enterprise-grade icons via Lucide (lucide.dev)
   Used by Vercel, Stripe, Linear, Shadcn/UI
   ============================================================ */

const Icons = (() => {
  // Lucide icon wrapper — creates an <i> tag that Lucide will hydrate
  const i = (name, cls = '', size = 16) =>
    `<i data-lucide="${name}" class="lucide-icon${cls ? ' ' + cls : ''}" style="width:${size}px;height:${size}px;"></i>`;

  // Refresh all Lucide icons in a container (or entire document)
  function refresh(container) {
    if (window.lucide) {
      lucide.createIcons({ nameAttr: 'data-lucide', attrs: { 'stroke-width': 1.75 } });
    }
  }

  return {
    // ---- Product Icons ----
    fiber:    i('wifi'),
    directv:  i('monitor'),
    wireless: i('smartphone'),
    adt:      i('shield-check'),

    // ---- Status Icons ----
    installed: i('circle-check-big', 'icon--green'),
    pending:   i('clock', 'icon--yellow'),
    checkmark: i('check'),
    clock:     i('clock-3'),

    // ---- UI / Navigation Icons ----
    calendar:   i('calendar-days'),
    dollar:     i('dollar-sign'),
    chart:      i('trending-up'),
    search:     i('search'),
    plus:       i('circle-plus'),
    edit:       i('pencil'),
    trash:      i('trash-2'),
    arrowLeft:  i('chevron-left', '', 20),
    arrowRight: i('chevron-right', '', 20),
    lightning:  i('zap'),
    manual:     i('clipboard-list'),
    xCircle:    i('x-circle'),
    refreshCw:  i('refresh-cw'),
    list:       i('list'),
    warning:    i('triangle-alert'),
    user:       i('user'),
    star:       i('star'),
    target:     i('target'),

    // ---- Payout specific ----
    dueDot:      `<span class="icon"><svg viewBox="0 0 10 10" style="width:10px;height:10px;"><circle cx="5" cy="5" r="4" fill="#22C55E"/></svg></span>`,
    pendingDot:  `<span class="icon"><svg viewBox="0 0 10 10" style="width:10px;height:10px;"><circle cx="5" cy="5" r="4" fill="#FCB314"/></svg></span>`,
    paidDot:     `<span class="icon"><svg viewBox="0 0 10 10" style="width:10px;height:10px;"><circle cx="5" cy="5" r="4" fill="#3AA5DC"/></svg></span>`,

    // ---- Raw icon names (for use in product tags, etc.) ----
    raw: {
      fiber:    i('wifi', '', 14),
      directv:  i('monitor', '', 14),
      wireless: i('smartphone', '', 14),
      adt:      i('shield-check', '', 14),
    },

    // ---- Large icons for empty states ----
    lg: {
      chart:    i('trending-up', '', 48),
      calendar: i('calendar-days', '', 48),
      list:     i('clipboard-list', '', 48),
      dollar:   i('dollar-sign', '', 48),
    },

    // Refresh function to hydrate Lucide icons after DOM updates
    refresh
  };
})();

window.Icons = Icons;
