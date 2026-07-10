export interface SaleRecord {
  rep: string;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  month: string;
  quarter: string;
  fiber: number;
  dtv: number;
  lines: number;
  adt: number;
  total: number;
  match: number;
  office: string;
}

export type TimeFrame = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'YTD' | 'All';
export type Category = 'Total' | 'Fiber' | 'DTV' | 'Lines' | 'ADT' | 'DTV/Fiber %' | 'Lines/Fiber %';
export type SortBy = 'Total' | 'Fiber' | 'DTV' | 'Lines' | 'ADT';

export interface RepStats {
  rep: string;
  fiber: number;
  dtv: number;
  lines: number;
  adt: number;
  total: number;
  dtvFiberPct: number;
  linesFiberPct: number;
  rank: number;
  activeDays: number;
  lastSaleDate: string | null;
  office: string;
}

export interface TeamSummary {
  totalSales: number;
  activeReps: number;
  avgPerRep: number;
  topPerformer: string;
  topPerformerTotal: number;
  teamFiber: number;
  teamDtv: number;
  teamLines: number;
  teamAdt: number;
  teamDtvFiberPct: number;
  teamLinesFiberPct: number;
}

export interface TrendPoint {
  label: string;
  fiber: number;
  dtv: number;
  lines: number;
  adt: number;
  total: number;
}

export interface RepPersonalBests {
  bestDay: { date: string; total: number };
  bestWeek: { week: string; total: number };
  bestMonth: { month: string; total: number };
}

export interface RepConversions {
  dtvFiberPct: number;
  linesFiberPct: number;
  fiberWithDtv: number;
  fiberWithLines: number;
  totalFiber: number;
  totalDtv: number;
  totalLines: number;
  totalAdt: number;
}