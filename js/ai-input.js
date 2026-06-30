/* ============================================================
   ai-input.js — Natural Language Deal Parser
   ============================================================ */

const AIInput = (() => {
  let parsedDeal = null;

  function parse() {
    const textarea = document.getElementById('aiTextarea');
    const text = textarea.value.trim();

    if (!text) {
      window.App.showToast('Please type some deal info first', true);
      return;
    }

    parsedDeal = parseText(text);
    showPreview(parsedDeal);
  }

  function parseText(text) {
    const lower = text.toLowerCase();
    const deal = {
      name: '',
      saleDate: new Date().toISOString().split('T')[0],
      installDate: '',
      installed: false,
      fiber: false,
      fiberTier: '1gig',
      directv: false,
      wireless: false,
      closerLines: 0,
      setterLines: 0,
      adt: false,
      adtPackage: '',
      adtAmount: 0
    };

    // ---- Extract Name ----
    const namePatterns = [
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/,
      /(?:name|customer|for)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i,
      /^([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s*[,\-]/
    ];

    for (const pat of namePatterns) {
      const match = text.match(pat);
      if (match) {
        const candidate = match[1].trim();
        const keywords = ['fiber', 'directv', 'direct', 'wireless', 'adt', 'gig', 'install', 'setter', 'closer', 'line', 'mbps', 'meg', 'secure', 'smart', 'complete', 'nest'];
        if (!keywords.some(k => candidate.toLowerCase().includes(k))) {
          deal.name = candidate;
          break;
        }
      }
    }

    // ---- Detect Products ----

    // Fiber
    if (/fiber|fibe|fibre/i.test(lower)) {
      deal.fiber = true;
      // Check tier
      if (/5\s*g(?:ig)?|five\s*g(?:ig)?/i.test(lower)) {
        deal.fiberTier = '5gig';
      } else if (/1\s*g(?:ig)?|one\s*g(?:ig)?/i.test(lower)) {
        deal.fiberTier = '1gig';
      } else if (/500\s*(?:mbps|meg|mb)/i.test(lower)) {
        deal.fiberTier = '500mbps';
      } else if (/300\s*(?:mbps|meg|mb)/i.test(lower)) {
        deal.fiberTier = '300mbps';
      } else {
        deal.fiberTier = '1gig'; // default
      }
    }

    // DirecTV
    if (/direct\s*tv|directv|dtv|direct tv|satellite/i.test(lower)) {
      deal.directv = true;
    }

    // ADT
    if (/\badt\b|security|alarm/i.test(lower)) {
      deal.adt = true;
      // Detect ADT package
      if (/complete\s*(?:with\s*)?nest|nest\s*aware/i.test(lower)) {
        deal.adtPackage = 'completeNest';
      } else if (/complete/i.test(lower)) {
        deal.adtPackage = 'complete';
      } else if (/smart/i.test(lower)) {
        deal.adtPackage = 'smart';
      } else {
        deal.adtPackage = 'secure'; // default
      }
    }

    // Wireless
    if (/wireless|phone|mobile|cell|line/i.test(lower)) {
      deal.wireless = true;

      const linePatterns = [
        /(\d+)\s*(?:wireless\s*)?lines?/i,
        /(\d+)\s*wireless/i,
        /(\d+)\s*(?:phone|mobile|cell)\s*lines?/i
      ];

      let totalLines = 0;
      for (const pat of linePatterns) {
        const match = lower.match(pat);
        if (match) {
          totalLines = parseInt(match[1]);
          break;
        }
      }

      if (totalLines === 0 && /line/i.test(lower)) {
        totalLines = 1;
      }

      const isSetter = /set(?:ter)?|i\s*set|setting/i.test(lower);
      const isCloser = /clos(?:er|ed|ing)?|i\s*clos/i.test(lower);

      if (isSetter && !isCloser) {
        deal.setterLines = totalLines;
        deal.closerLines = 0;
      } else if (isCloser && !isSetter) {
        deal.closerLines = totalLines;
        deal.setterLines = 0;
      } else if (isSetter && isCloser) {
        const closerMatch = lower.match(/(\d+)\s*clos/i);
        const setterMatch = lower.match(/(\d+)\s*set/i);
        deal.closerLines = closerMatch ? parseInt(closerMatch[1]) : 0;
        deal.setterLines = setterMatch ? parseInt(setterMatch[1]) : 0;
      } else {
        deal.closerLines = totalLines;
      }
    }

    // ---- Extract Install Date ----
    const now = new Date();
    const year = now.getFullYear();

    const datePatterns = [
      /(?:install|inst|scheduled|setup|set\s*up)?\s*(?:on|for|date)?\s*:?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i,
      /(?:install|inst|scheduled|setup|set\s*up)?\s*(?:on|for|date)?\s*:?\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/,
      /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i
    ];

    const monthMap = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
      nov: 10, november: 10, dec: 11, december: 11
    };

    for (const pat of datePatterns) {
      const match = text.match(pat);
      if (match) {
        let month, day, yr;

        if (/[a-z]/i.test(match[1])) {
          month = monthMap[match[1].toLowerCase()];
          day = parseInt(match[2]);
          yr = match[3] ? parseInt(match[3]) : year;
        } else {
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          yr = match[3] ? parseInt(match[3]) : year;
          if (yr < 100) yr += 2000;
        }

        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
          const d = new Date(yr, month, day);
          deal.installDate = d.toISOString().split('T')[0];
          break;
        }
      }
    }

    if (/\btoday\b/i.test(lower) && !deal.installDate) {
      deal.installDate = new Date().toISOString().split('T')[0];
    }
    if (/\btomorrow\b/i.test(lower) && !deal.installDate) {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      deal.installDate = tom.toISOString().split('T')[0];
    }

    if (/\balready\s*installed\b|\binstalled\b|\bgot\s*installed\b|\bwent\s*live\b/i.test(lower)) {
      deal.installed = true;
    }

    // ---- Extract Sale Date ----
    const saleDatePatterns = [
      /(?:sold|sale|closed)\s*(?:on|date)?\s*:?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i,
      /(?:sold|sale|closed)\s*(?:on|date)?\s*:?\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/
    ];

    for (const pat of saleDatePatterns) {
      const match = text.match(pat);
      if (match) {
        let month, day, yr;
        if (/[a-z]/i.test(match[1])) {
          month = monthMap[match[1].toLowerCase()];
          day = parseInt(match[2]);
          yr = match[3] ? parseInt(match[3]) : year;
        } else {
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          yr = match[3] ? parseInt(match[3]) : year;
          if (yr < 100) yr += 2000;
        }
        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
          const d = new Date(yr, month, day);
          deal.saleDate = d.toISOString().split('T')[0];
          break;
        }
      }
    }

    return deal;
  }

  function showPreview(deal) {
    const { totalPayout, breakdown } = Deals.calcDealPayout(deal);

    const preview = document.getElementById('parsedPreview');
    const fields = document.getElementById('parsedFields');
    const total = document.getElementById('parsedTotal');

    let html = '';

    html += makeRow('Customer', deal.name || '(not detected — will prompt)');
    html += makeRow('Sale Date', deal.saleDate ? new Date(deal.saleDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today');
    html += makeRow('Install Date', deal.installDate ? new Date(deal.installDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '(not set)');
    html += makeRow('Installed', deal.installed ? `${Icons.installed} Yes` : `${Icons.pending} Not yet`);

    if (deal.fiber) {
      const tierLabels = { '300mbps': '300 Mbps — $250', '500mbps': '500 Mbps — $300', '1gig': '1 Gig — $430', '5gig': '5 Gig — $505' };
      html += makeRow(`${Icons.fiber} Fiber`, tierLabels[deal.fiberTier] || '1 Gig — $430');
    }
    if (deal.directv) {
      html += makeRow(`${Icons.directv} DirecTV`, '$375');
    }
    if (deal.wireless) {
      const parts = [];
      if (deal.closerLines > 0) parts.push(`${deal.closerLines} closer ($${deal.closerLines * 130})`);
      if (deal.setterLines > 0) parts.push(`${deal.setterLines} setter ($${deal.setterLines * 65})`);
      html += makeRow(`${Icons.wireless} Wireless`, parts.join(' + ') || '0 lines');
    }
    if (deal.adt) {
      const pkg = Deals.COMMISSION.adt.packages[deal.adtPackage];
      const label = pkg ? `${pkg.label} — $${Math.round(Deals.calcAdtCommission(deal.adtPackage))}` : '(no package selected)';
      html += makeRow(`${Icons.adt} ADT`, label);
    }

    if (!deal.fiber && !deal.directv && !deal.wireless && !deal.adt) {
      html += `<div style="color:var(--yellow);font-size:13px;padding:8px 0;">${Icons.warning} No products detected. Try including "fiber", "directv", "wireless", or "adt" in your description.</div>`;
    }

    fields.innerHTML = html;
    total.textContent = '$' + Math.round(totalPayout).toLocaleString();
    preview.classList.add('show');
  }

  function makeRow(label, value) {
    return `
      <div class="parsed-preview__row">
        <span class="parsed-preview__label">${label}</span>
        <span class="parsed-preview__value">${value}</span>
      </div>
    `;
  }

  function confirm() {
    if (!parsedDeal) return;

    if (!parsedDeal.name) {
      const name = prompt('Customer name not detected. Please enter:');
      if (!name) return;
      parsedDeal.name = name.trim();
    }

    if (!parsedDeal.fiber && !parsedDeal.directv && !parsedDeal.wireless && !parsedDeal.adt) {
      window.App.showToast('No products detected. Try again or use Manual mode.', true);
      return;
    }

    Deals.addDeal(parsedDeal);
    window.App.showToast(`Deal saved for ${parsedDeal.name}`);
    cancel();
    window.App.refreshAll();
  }

  function cancel() {
    parsedDeal = null;
    document.getElementById('parsedPreview').classList.remove('show');
    document.getElementById('aiTextarea').value = '';
  }

  return { parse, confirm, cancel };
})();

window.AIInput = AIInput;
