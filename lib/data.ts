import { SaleRecord, RepStats, TeamSummary, TrendPoint, TimeFrame, Category, SortBy, RepPersonalBests, RepConversions } from './types';

// Parse date string — handles multiple formats:
// "10/1/2025", "10/1/25", "2026-07-03 0:00:00", "2026-07-03"
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  
  // Handle ISO-ish format: "2026-07-03 0:00:00" or "2026-07-03"
  if (dateStr.includes('-')) {
    const clean = dateStr.split(' ')[0]; // strip time portion
    const [y, m, d] = clean.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  
  // Handle M/D/YYYY or M/D/YY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let year = parseInt(parts[2]);
    if (year < 100) year += 2000; // 25 → 2025
    return new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  return new Date(dateStr);
}

// Format a Date to a short display label
export function formatDateShort(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear() % 100}`;
}

// Get the current period boundaries
export function getCurrentPeriod(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const start = new Date(2025, 4, 1); // May 1, 2025
  const end = now;
  return { start, end, label: 'All Time' };
}

// Filter records by time frame
export function filterByTimeFrame(records: SaleRecord[], timeFrame: TimeFrame): SaleRecord[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (timeFrame) {
    case 'Daily': {
      // Return records from the most recent date that has data
      const dates = records.map(r => parseDate(r.weekStart).getTime());
      const maxDate = Math.max(...dates);
      return records.filter(r => parseDate(r.weekStart).getTime() === maxDate);
    }
    case 'Weekly': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return records.filter(r => parseDate(r.weekStart) >= weekAgo);
    }
    case 'Monthly': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return records.filter(r => parseDate(r.weekStart) >= monthAgo);
    }
    case 'Quarterly': {
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return records.filter(r => parseDate(r.weekStart) >= quarterAgo);
    }
    case 'YTD': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return records.filter(r => parseDate(r.weekStart) >= yearStart);
    }
    case 'All':
    default:
      return records;
  }
}

// Filter records by specific month
export function filterByMonth(records: SaleRecord[], month: string): SaleRecord[] {
  if (!month || month === 'All') return records;
  return records.filter(r => r.month === month);
}

// Filter records by specific week (weekLabel)
export function filterByWeek(records: SaleRecord[], weekLabel: string): SaleRecord[] {
  if (!weekLabel || weekLabel === 'All') return records;
  return records.filter(r => r.weekLabel === weekLabel);
}

// Filter records by specific date (weekStart)
export function filterByDate(records: SaleRecord[], dateStr: string): SaleRecord[] {
  if (!dateStr || dateStr === 'All') return records;
  const targetDate = parseDate(dateStr).getTime();
  return records.filter(r => parseDate(r.weekStart).getTime() === targetDate);
}

// Filter records by quarter
export function filterByQuarter(records: SaleRecord[], quarter: string): SaleRecord[] {
  if (!quarter || quarter === 'All') return records;
  return records.filter(r => r.quarter === quarter);
}

// Filter records by office
export function filterByOffice(records: SaleRecord[], office: string): SaleRecord[] {
  if (office === 'All') return records;
  return records.filter(r => r.office === office);
}

// Filter records by rep
export function filterByRep(records: SaleRecord[], rep: string): SaleRecord[] {
  if (rep === 'All') return records;
  return records.filter(r => r.rep === rep);
}

// Get unique months, sorted chronologically
export function getMonths(records: SaleRecord[]): string[] {
  const months = Array.from(new Set(records.map(r => r.month)));
  const monthOrder: Record<string, number> = {
    'October 2025': 0, 'November 2025': 1, 'December 2025': 2,
    'January 2026': 3, 'February 2026': 4, 'March 2026': 5,
    'April 2026': 6, 'May 2026': 7, 'June 2026': 8, 'Jun 2026': 8,
    'July 2026': 9, 'Jul 2026': 9, 'August 2026': 10, 'September 2026': 11,
  };
  return months.sort((a, b) => (monthOrder[a] ?? 99) - (monthOrder[b] ?? 99));
}

// Get unique quarters, sorted chronologically
export function getQuarters(records: SaleRecord[]): string[] {
  const quarters = Array.from(new Set(records.map(r => r.quarter)));
  return quarters.sort((a, b) => {
    const [qA, yA] = a.split(' ');
    const [qB, yB] = b.split(' ');
    const yearDiff = parseInt(yA) - parseInt(yB);
    if (yearDiff !== 0) return yearDiff;
    return parseInt(qA.replace('Q', '')) - parseInt(qB.replace('Q', ''));
  });
}

// Get unique week labels within given records, sorted chronologically
export function getWeeks(records: SaleRecord[]): string[] {
  const weeks = Array.from(new Set(records.map(r => r.weekLabel)));
  return weeks.sort((a, b) => {
    // For week-range labels like "1/11/26 - 1/17/26", parse the start
    const dateA = parseDate(a.includes(' - ') ? a.split(' - ')[0] : a.replace(/^(\d+\/\d+\/)(\d{2})$/, '$120$2'));
    const dateB = parseDate(b.includes(' - ') ? b.split(' - ')[0] : b.replace(/^(\d+\/\d+\/)(\d{2})$/, '$120$2'));
    return dateA.getTime() - dateB.getTime();
  });
}

// Get unique dates (weekStart values), sorted chronologically
export function getDates(records: SaleRecord[]): { raw: string; date: Date; label: string }[] {
  const dateMap = new Map<number, { raw: string; date: Date }>();
  for (const r of records) {
    const d = parseDate(r.weekStart);
    const ts = d.getTime();
    if (!dateMap.has(ts)) {
      dateMap.set(ts, { raw: r.weekStart, date: d });
    }
  }
  return Array.from(dateMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(d => ({
      raw: d.raw,
      date: d.date,
      label: formatDateShort(d.date),
    }));
}

// Get weeks available within a specific month
export function getWeeksInMonth(records: SaleRecord[], month: string): string[] {
  const monthRecords = filterByMonth(records, month);
  return getWeeks(monthRecords);
}

// Get dates available within a specific week  
export function getDatesInWeek(records: SaleRecord[], weekLabel: string): { raw: string; date: Date; label: string }[] {
  const weekRecords = filterByWeek(records, weekLabel);
  return getDates(weekRecords);
}

// Aggregate records into rep stats
export function aggregateRepStats(records: SaleRecord[], sortBy: SortBy = 'Total'): RepStats[] {
  const repMap = new Map<string, {
    fiber: number; dtv: number; lines: number; adt: number; total: number;
    activeDays: Set<string>; lastSaleDate: string | null; office: string;
  }>();

  for (const r of records) {
    if (!repMap.has(r.rep)) {
      repMap.set(r.rep, {
        fiber: 0, dtv: 0, lines: 0, adt: 0, total: 0,
        activeDays: new Set(), lastSaleDate: null, office: r.office
      });
    }
    const stats = repMap.get(r.rep)!;
    stats.fiber += r.fiber;
    stats.dtv += r.dtv;
    stats.lines += r.lines;
    stats.adt += r.adt;
    stats.total += r.total;
    if (r.total > 0) {
      stats.activeDays.add(r.weekStart);
      if (!stats.lastSaleDate || parseDate(r.weekStart) > parseDate(stats.lastSaleDate)) {
        stats.lastSaleDate = r.weekStart;
      }
    }
  }

  const results: RepStats[] = [];
  for (const [rep, stats] of repMap) {
    results.push({
      rep,
      fiber: stats.fiber,
      dtv: stats.dtv,
      lines: stats.lines,
      adt: stats.adt,
      total: stats.total,
      dtvFiberPct: stats.fiber > 0 ? (stats.dtv / stats.fiber) * 100 : 0,
      linesFiberPct: stats.fiber > 0 ? (stats.lines / stats.fiber) * 100 : 0,
      rank: 0,
      activeDays: stats.activeDays.size,
      lastSaleDate: stats.lastSaleDate,
      office: stats.office,
    });
  }

  // Sort by selected metric
  const sortKey = sortBy.toLowerCase() as 'total' | 'fiber' | 'dtv' | 'lines' | 'adt';
  results.sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));

  // Assign ranks
  results.forEach((r, i) => { r.rank = i + 1; });

  return results;
}

// Get team summary
export function getTeamSummary(records: SaleRecord[]): TeamSummary {
  const stats = aggregateRepStats(records);
  const activeReps = stats.filter(s => s.total > 0);
  const topPerformer = stats[0] || { rep: '—', total: 0 };

  const fiber = records.reduce((s, r) => s + r.fiber, 0);
  const dtv = records.reduce((s, r) => s + r.dtv, 0);
  const lines = records.reduce((s, r) => s + r.lines, 0);
  const adt = records.reduce((s, r) => s + r.adt, 0);
  const total = records.reduce((s, r) => s + r.total, 0);

  return {
    totalSales: total,
    activeReps: activeReps.length,
    avgPerRep: activeReps.length > 0 ? total / activeReps.length : 0,
    topPerformer: topPerformer.rep,
    topPerformerTotal: topPerformer.total,
    teamFiber: fiber,
    teamDtv: dtv,
    teamLines: lines,
    teamAdt: adt,
    teamDtvFiberPct: fiber > 0 ? (dtv / fiber) * 100 : 0,
    teamLinesFiberPct: fiber > 0 ? (lines / fiber) * 100 : 0,
  };
}

// Get trend data (weekly time series)
export function getTrendData(records: SaleRecord[], groupBy: 'week' | 'month' | 'day' = 'week'): TrendPoint[] {
  const groups = new Map<string, { fiber: number; dtv: number; lines: number; adt: number; total: number; sortKey: number }>();

  for (const r of records) {
    let label: string;
    let sortKey: number;
    
    if (groupBy === 'month') {
      label = r.month;
      const monthOrder: Record<string, number> = {
        'October 2025': 0, 'November 2025': 1, 'December 2025': 2,
        'January 2026': 3, 'February 2026': 4, 'March 2026': 5,
        'April 2026': 6, 'May 2026': 7, 'June 2026': 8, 'Jun 2026': 8,
        'July 2026': 9, 'Jul 2026': 9, 'August 2026': 10, 'September 2026': 11,
      };
      sortKey = monthOrder[label] ?? 99;
    } else if (groupBy === 'day') {
      const d = parseDate(r.weekStart);
      label = formatDateShort(d);
      sortKey = d.getTime();
    } else {
      label = r.weekLabel;
      const d = parseDate(label.includes(' - ') ? label.split(' - ')[0] : r.weekStart);
      sortKey = d.getTime();
    }

    if (!groups.has(label)) {
      groups.set(label, { fiber: 0, dtv: 0, lines: 0, adt: 0, total: 0, sortKey });
    }
    const g = groups.get(label)!;
    g.fiber += r.fiber;
    g.dtv += r.dtv;
    g.lines += r.lines;
    g.adt += r.adt;
    g.total += r.total;
  }

  const sorted = Array.from(groups.entries()).sort((a, b) => a[1].sortKey - b[1].sortKey);

  return sorted.map(([label, data]) => ({
    label,
    fiber: data.fiber,
    dtv: data.dtv,
    lines: data.lines,
    adt: data.adt,
    total: data.total,
  }));
}

// Get unique offices
export function getOffices(records: SaleRecord[]): string[] {
  return Array.from(new Set(records.map(r => r.office))).sort();
}

// Get unique reps
export function getReps(records: SaleRecord[]): string[] {
  return Array.from(new Set(records.map(r => r.rep))).sort((a, b) => a.localeCompare(b));
}

// Format number with commas and optional decimals
export function formatNumber(n: number, decimals = 0): string {
  if (n === 0) return '0';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Format percentage
export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

// Generate URL-safe slug from rep name
export function getRepSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Get avatar URL for a rep (served from public/avatars/)
export function getRepAvatarUrl(name: string): string {
  return `/avatars/${getRepSlug(name)}.jpg`;
}

// Compute personal bests for a rep across all records
export function getRepPersonalBests(records: SaleRecord[], repName: string): RepPersonalBests {
  const repRecords = records.filter(r => r.rep === repName);

  // Best day
  const dayMap = new Map<string, number>();
  for (const r of repRecords) {
    const key = r.weekStart;
    dayMap.set(key, (dayMap.get(key) || 0) + r.total);
  }
  let bestDay = { date: '—', total: 0 };
  for (const [date, total] of dayMap) {
    if (total > bestDay.total) bestDay = { date, total };
  }

  // Best week
  const weekMap = new Map<string, number>();
  for (const r of repRecords) {
    const key = r.weekLabel;
    weekMap.set(key, (weekMap.get(key) || 0) + r.total);
  }
  let bestWeek = { week: '—', total: 0 };
  for (const [week, total] of weekMap) {
    if (total > bestWeek.total) bestWeek = { week, total };
  }

  // Best month
  const monthMap = new Map<string, number>();
  for (const r of repRecords) {
    const key = r.month;
    monthMap.set(key, (monthMap.get(key) || 0) + r.total);
  }
  let bestMonth = { month: '—', total: 0 };
  for (const [month, total] of monthMap) {
    if (total > bestMonth.total) bestMonth = { month, total };
  }

  return { bestDay, bestWeek, bestMonth };
}

// Compute conversion/attach rates for a rep
export function getRepConversions(records: SaleRecord[], repName: string): RepConversions {
  const repRecords = records.filter(r => r.rep === repName);

  const totalFiber = repRecords.reduce((s, r) => s + r.fiber, 0);
  const totalDtv = repRecords.reduce((s, r) => s + r.dtv, 0);
  const totalLines = repRecords.reduce((s, r) => s + r.lines, 0);
  const totalAdt = repRecords.reduce((s, r) => s + r.adt, 0);

  // Count days where fiber AND dtv both had sales (proxy for attach rate)
  let fiberWithDtv = 0;
  let fiberWithLines = 0;
  for (const r of repRecords) {
    if (r.fiber > 0 && r.dtv > 0) fiberWithDtv += Math.min(r.fiber, r.dtv);
    if (r.fiber > 0 && r.lines > 0) fiberWithLines += Math.min(r.fiber, r.lines);
  }

  return {
    dtvFiberPct: totalFiber > 0 ? (totalDtv / totalFiber) * 100 : 0,
    linesFiberPct: totalFiber > 0 ? (totalLines / totalFiber) * 100 : 0,
    fiberWithDtv,
    fiberWithLines,
    totalFiber,
    totalDtv,
    totalLines,
    totalAdt,
  };
}