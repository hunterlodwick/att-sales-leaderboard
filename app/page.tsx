'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  BarChart3,
  Search, X, Calendar, ChevronRight,
} from 'lucide-react'
import salesData from '@/data/sales-data.json'
import type { SaleRecord } from '@/lib/types'
import {
  filterByTimeFrame, filterByOffice, filterByRep, aggregateRepStats, getTeamSummary,
  getTrendData, getOffices, getReps, getMonths, formatNumber, formatPct,
  parseDate
} from '@/lib/data'

const records = salesData as SaleRecord[]

// === CUSTOM SVG ICON COMPONENTS (AT&T-branded, professional) ===

function ATTGlobeIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4" ry="9.5" stroke={color} strokeWidth="1.5" />
      <path d="M3.5 9h17M3.5 15h17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FiberIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20V14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14C12 10 8 8 5 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14C12 10 16 8 19 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="10" y="20" width="4" height="2" rx="1" fill={color} />
    </svg>
  )
}

function DTVIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="13" rx="2" stroke={color} strokeWidth="2" />
      <path d="M8 20h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="10.5" r="1" fill={color} />
    </svg>
  )
}

function WirelessIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="14" width="6" height="8" rx="1.5" stroke={color} strokeWidth="2" />
      <path d="M12 14V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7a5.66 5.66 0 0 1 8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 4a9.43 9.43 0 0 1 14 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ADTIcon({ size = 22, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4C16.6 21.15 20 16.25 20 11V6l-8-4z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrownIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 18L5 8l4 4 3-6 3 6 4-4 2 10H3z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="6" r="1.5" fill={color} />
    </svg>
  )
}

function MedalIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="14" r="6" stroke={color} strokeWidth="2" />
      <path d="M8 2h2l2 5-2 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 2h-2l-2 5 2 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 14l1.5 1.5L14 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashboardIcon({ size = 20, strokeWidth = 2, color = 'currentColor' }: { size?: number; strokeWidth?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="14" y="3" width="7" height="4" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="3" y="14" width="7" height="4" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
      <rect x="14" y="11" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  )
}

function TrophyIcon({ size = 20, strokeWidth = 2, color = 'currentColor' }: { size?: number; strokeWidth?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 21h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 17v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" stroke={color} strokeWidth={strokeWidth} />
      <path d="M7 7H5a2 2 0 0 0-2 2 3 3 0 0 0 3 3h1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M17 7h2a2 2 0 0 1 2 2 3 3 0 0 1-3 3h-1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

function TrendsIcon({ size = 20, strokeWidth = 2, color = 'currentColor' }: { size?: number; strokeWidth?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17l5-5 4 4 8-10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6h4v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CompareIcon({ size = 20, strokeWidth = 2, color = 'currentColor' }: { size?: number; strokeWidth?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 3l4 4-4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 7H8a4 4 0 0 0-4 4v1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M8 21l-4-4 4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17h12a4 4 0 0 0 4-4v-1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

type Tab = 'dashboard' | 'leaderboard' | 'trends' | 'compare'
type TimeFrame = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'YTD' | 'All'
type SortBy = 'Total' | 'Fiber' | 'DTV' | 'Lines' | 'ADT'

const TIME_FRAMES: TimeFrame[] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'YTD', 'All']
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'Total', label: 'Total' },
  { value: 'Fiber', label: 'Fiber' },
  { value: 'DTV', label: 'DTV' },
  { value: 'Lines', label: 'Lines' },
  { value: 'ADT', label: 'ADT' },
]

// === MAIN COMPONENT ===
export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('YTD')
  const [office, setOffice] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortBy>('Total')

  const filtered = useMemo(() => {
    let data = filterByTimeFrame(records, timeFrame)
    data = filterByOffice(data, office)
    return data
  }, [timeFrame, office])

  const offices = useMemo(() => getOffices(records), [])
  const summary = useMemo(() => getTeamSummary(filtered), [filtered])
  const repStats = useMemo(() => aggregateRepStats(filtered, sortBy), [filtered, sortBy])
  const trendData = useMemo(() => getTrendData(filtered, timeFrame === 'Monthly' || timeFrame === 'Quarterly' || timeFrame === 'YTD' || timeFrame === 'All' ? 'month' : 'week'), [filtered, timeFrame])

  return (
    <>
      <Header timeFrame={timeFrame} office={office} />
      
      <main className="content-pb">
        {tab === 'dashboard' && (
          <DashboardView summary={summary} offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} sortBy={sortBy} setSortBy={setSortBy} repStats={repStats} />
        )}
        {tab === 'leaderboard' && (
          <LeaderboardView summary={summary} offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} sortBy={sortBy} setSortBy={setSortBy} repStats={repStats} />
        )}
        {tab === 'trends' && (
          <TrendsView offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} trendData={trendData} />
        )}
        {tab === 'compare' && (
          <CompareView offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} />
        )}
      </main>

      <TabBar tab={tab} setTab={setTab} />
    </>
  )
}

// === HEADER ===
function Header({ timeFrame, office }: { timeFrame: TimeFrame; office: string }) {
  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #009FDB, #067AB4)' }}>
          <ATTGlobeIcon size={18} color="#fff" />
        </div>
        <div>
          <div className="font-bold text-base leading-tight" style={{ color: 'var(--color-text)' }}>ASP / RIVVIA</div>
          <div className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-text-muted)' }}>
            {timeFrame === 'All' ? 'All Time' : timeFrame} · {office}
          </div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
        <Calendar size={14} />
        <span className="text-xs font-semibold">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>
    </header>
  )
}

// === TAB BAR ===
function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; renderIcon: (active: boolean) => React.ReactNode; label: string }[] = [
    { id: 'dashboard', renderIcon: (active) => <DashboardIcon size={20} strokeWidth={active ? 2.5 : 2} />, label: 'Home' },
    { id: 'leaderboard', renderIcon: (active) => <TrophyIcon size={20} strokeWidth={active ? 2.5 : 2} />, label: 'Rank' },
    { id: 'trends', renderIcon: (active) => <TrendsIcon size={20} strokeWidth={active ? 2.5 : 2} />, label: 'Trends' },
    { id: 'compare', renderIcon: (active) => <CompareIcon size={20} strokeWidth={active ? 2.5 : 2} />, label: 'Compare' },
  ]
  return (
    <nav className="tab-bar">
      {tabs.map(t => {
        const isActive = tab === t.id
        return (
          <button key={t.id} className={`tab-bar__btn ${isActive ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.renderIcon(isActive)}
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

// === FILTER BAR ===
function FilterBar({ offices, office, setOffice, timeFrame, setTimeFrame, sortBy, setSortBy, showSort = true }: {
  offices: string[]; office: string; setOffice: (v: string) => void;
  timeFrame: TimeFrame; setTimeFrame: (v: TimeFrame) => void;
  sortBy: SortBy; setSortBy: (v: SortBy) => void; showSort?: boolean
}) {
  return (
    <div className="filter-bar">
      <div className="seg-control">
        {TIME_FRAMES.map(tf => (
          <button key={tf} className={`seg-control__btn ${timeFrame === tf ? 'active' : ''}`} onClick={() => setTimeFrame(tf)}>
            {tf === 'YTD' ? 'YTD' : tf === 'All' ? 'All' : tf}
          </button>
        ))}
      </div>
      <select className="dropdown" value={office} onChange={e => setOffice(e.target.value)}>
        <option value="All">All Offices</option>
        {offices.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {showSort && (
        <select className="dropdown" value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
        </select>
      )}
    </div>
  )
}

// === DASHBOARD VIEW ===
function DashboardView({ summary, offices, office, setOffice, timeFrame, setTimeFrame, sortBy, setSortBy, repStats }: any) {
  return (
    <div className="page-container">
      <FilterBar offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="stat-card">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Total Sales</div>
          <div className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: 'var(--color-text)' }}>{formatNumber(summary.totalSales)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{summary.activeReps} active reps</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Avg / Rep</div>
          <div className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: 'var(--color-text)' }}>{formatNumber(summary.avgPerRep, 1)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>across active reps</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Top Performer</div>
          <div className="text-lg md:text-xl font-bold mt-1 capitalize" style={{ color: 'var(--color-gold)' }}>{summary.topPerformer.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(summary.topPerformerTotal)} sales</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>DTV/Fiber %</div>
          <div className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: 'var(--color-text)' }}>{formatPct(summary.teamDtvFiberPct)}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Lines/Fiber: {formatPct(summary.teamLinesFiberPct)}</div>
        </div>
      </div>

      {/* Product breakdown */}
      <h2 className="text-sm font-bold uppercase tracking-wider mt-6 mb-3" style={{ color: 'var(--color-text-muted)' }}>Production by Product</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ProductCard icon={FiberIcon} label="Fiber" value={summary.teamFiber} color="var(--color-fiber)" />
        <ProductCard icon={DTVIcon} label="DTV" value={summary.teamDtv} color="var(--color-dtv)" />
        <ProductCard icon={WirelessIcon} label="Lines" value={summary.teamLines} color="var(--color-lines)" />
        <ProductCard icon={ADTIcon} label="ADT" value={summary.teamAdt} color="var(--color-adt)" />
      </div>

      {/* Mini leaderboard */}
      <h2 className="text-sm font-bold uppercase tracking-wider mt-6 mb-3" style={{ color: 'var(--color-text-muted)' }}>Top 10 Performers</h2>
      <div className="space-y-1">
        {repStats.slice(0, 10).map((rep: any) => (
          <LeaderboardRow key={rep.rep} rep={rep} compact />
        ))}
      </div>
    </div>
  )
}

// === PRODUCT CARD ===
function ProductCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
        <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{formatNumber(value)}</div>
      </div>
    </div>
  )
}

// === LEADERBOARD VIEW ===
function LeaderboardView({ summary, offices, office, setOffice, timeFrame, setTimeFrame, sortBy, setSortBy, repStats }: any) {
  const [search, setSearch] = useState('')
  
  const filteredReps = useMemo(() => {
    if (!search) return repStats
    return repStats.filter((r: any) => r.rep.toLowerCase().includes(search.toLowerCase()))
  }, [repStats, search])

  const top3 = filteredReps.slice(0, 3)
  const rest = filteredReps.slice(3)

  return (
    <div className="page-container">
      <FilterBar offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} sortBy={sortBy} setSortBy={setSortBy} />

      {/* Top 3 Podium */}
      {top3.length === 3 && !search && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 mb-6">
          <PodiumCard rep={top3[1]} place={2} />
          <PodiumCard rep={top3[0]} place={1} />
          <PodiumCard rep={top3[2]} place={3} />
        </div>
      )}

      {/* Search */}
      <div className="relative mt-2 mb-3">
        <Search size={16} color="var(--color-text-muted)" className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search reps..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={16} color="var(--color-text-muted)" />
          </button>
        )}
      </div>

      {/* Full leaderboard */}
      <div className="space-y-1">
        {search && top3.length > 0 && top3.map((rep: any) => (
          <LeaderboardRow key={rep.rep} rep={rep} />
        ))}
        {!search && top3.length > 0 && rest.map((rep: any) => (
          <LeaderboardRow key={rep.rep} rep={rep} />
        ))}
        {search && filteredReps.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            <Search size={32} className="mx-auto mb-2 opacity-50" />
            <div className="text-sm font-medium">No reps found</div>
          </div>
        )}
      </div>
    </div>
  )
}

// === PODIUM CARD ===
function PodiumCard({ rep, place }: { rep: any; place: number }) {
  const config = {
    1: { color: 'var(--color-gold)', bg: 'rgba(252, 179, 20, 0.08)', renderIcon: () => <CrownIcon size={24} color="var(--color-gold)" />, size: 'md:scale-110' },
    2: { color: 'var(--color-silver)', bg: 'rgba(184, 192, 204, 0.06)', renderIcon: () => <MedalIcon size={24} color="var(--color-silver)" />, size: '' },
    3: { color: 'var(--color-bronze)', bg: 'rgba(197, 122, 58, 0.06)', renderIcon: () => <MedalIcon size={24} color="var(--color-bronze)" />, size: '' },
  }[place] as any

  const formattedName = rep.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <div className="stat-card text-center" style={{ background: config.bg, borderColor: config.color + '33' }}>
      <div className="flex justify-center mb-2">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center" style={{ background: config.color + '20' }}>
          {config.renderIcon()}
        </div>
      </div>
      <div className="text-xs font-bold mb-0.5" style={{ color: config.color }}>#{place}</div>
      <div className="text-xs md:text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{formattedName}</div>
      <div className="text-lg md:text-xl font-extrabold mt-1" style={{ color: config.color }}>{formatNumber(rep.total)}</div>
      <div className="flex justify-center gap-1 mt-1.5">
        {rep.fiber > 0 && <span className="chip chip--fiber">{formatNumber(rep.fiber)}</span>}
        {rep.dtv > 0 && <span className="chip chip--dtv">{formatNumber(rep.dtv)}</span>}
        {rep.lines > 0 && <span className="chip chip--lines">{formatNumber(rep.lines)}</span>}
      </div>
    </div>
  )
}

// === LEADERBOARD ROW ===
function LeaderboardRow({ rep, compact = false }: { rep: any; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const formattedName = rep.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <>
      <div className="lb-row" onClick={() => setExpanded(!expanded)}>
        <div className={`rank-badge rank-badge--${rep.rank <= 3 ? rep.rank : 'normal'}`}>
          {rep.rank}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{formattedName}</span>
            {!compact && rep.office !== 'Unassigned' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-lighter)', color: 'var(--color-text-muted)' }}>
                {rep.office}
              </span>
            )}
          </div>
          {expanded && (
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="chip chip--fiber"><FiberIcon size={11} /> {formatNumber(rep.fiber)}</span>
              <span className="chip chip--dtv"><DTVIcon size={11} /> {formatNumber(rep.dtv)}</span>
              <span className="chip chip--lines"><WirelessIcon size={11} /> {formatNumber(rep.lines)}</span>
              {rep.adt > 0 && <span className="chip chip--adt"><ADTIcon size={11} /> {formatNumber(rep.adt)}</span>}
              <span className="chip" style={{ background: 'var(--color-surface-lighter)', color: 'var(--color-text-secondary)' }}>
                DTV/F: {formatPct(rep.dtvFiberPct)}
              </span>
              <span className="chip" style={{ background: 'var(--color-surface-lighter)', color: 'var(--color-text-secondary)' }}>
                Lines/F: {formatPct(rep.linesFiberPct)}
              </span>
              {rep.lastSaleDate && (
                <span className="chip" style={{ background: 'var(--color-surface-lighter)', color: 'var(--color-text-muted)' }}>
                  Last: {rep.lastSaleDate}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-extrabold" style={{ color: 'var(--color-text)' }}>{formatNumber(rep.total)}</div>
          {!compact && (
            <div className="flex justify-end gap-1 mt-0.5">
              {rep.fiber > 0 && !expanded && <span className="chip chip--fiber">{formatNumber(rep.fiber)}</span>}
              {rep.dtv > 0 && !expanded && <span className="chip chip--dtv">{formatNumber(rep.dtv)}</span>}
              {rep.lines > 0 && !expanded && <span className="chip chip--lines">{formatNumber(rep.lines)}</span>}
            </div>
          )}
        </div>
        {!compact && (
          <div className="ml-2">
            <ChevronRight size={16} color="var(--color-text-muted)" className={expanded ? 'rotate-90 transition-transform' : 'transition-transform'} />
          </div>
        )}
      </div>
    </>
  )
}

// === TRENDS VIEW ===
function TrendsView({ offices, office, setOffice, timeFrame, setTimeFrame, trendData }: any) {
  const [metric, setMetric] = useState<'total' | 'fiber' | 'dtv' | 'lines' | 'adt'>('total')
  
  const maxTotal = Math.max(...trendData.map((d: any) => d[metric] || 0), 1)

  const metricConfig = {
    total: { color: 'var(--color-accent)', label: 'Total' },
    fiber: { color: 'var(--color-fiber)', label: 'Fiber' },
    dtv: { color: 'var(--color-dtv)', label: 'DTV' },
    lines: { color: 'var(--color-lines)', label: 'Lines' },
    adt: { color: 'var(--color-adt)', label: 'ADT' },
  }

  return (
    <div className="page-container">
      <FilterBar offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} sortBy={'Total' as SortBy} setSortBy={() => {}} showSort={false} />

      {/* Metric selector */}
      <div className="seg-control mt-4">
        {Object.entries(metricConfig).map(([key, cfg]) => (
          <button key={key} className={`seg-control__btn ${metric === key ? 'active' : ''}`} onClick={() => setMetric(key as any)}>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="stat-card mt-4">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>
          {metricConfig[metric].label} Production Over Time
        </h3>
        <div className="space-y-2">
          {trendData.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-xs font-medium w-24 md:w-32 truncate flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                {d.label}
              </div>
              <div className="flex-1 progress-bar" style={{ height: '24px' }}>
                <div
                  className="progress-bar__fill flex items-center justify-end pr-2"
                  style={{
                    width: `${(d[metric] / maxTotal) * 100}%`,
                    background: `linear-gradient(90deg, ${metricConfig[metric].color}44, ${metricConfig[metric].color})`,
                    minWidth: d[metric] > 0 ? '32px' : '0',
                  }}
                >
                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>
                    {formatNumber(d[metric])}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-metric comparison */}
      <div className="stat-card mt-4">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Product Breakdown</h3>
        <div className="space-y-2">
          {trendData.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-xs font-medium w-24 md:w-32 truncate flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                {d.label}
              </div>
              <div className="flex-1 flex gap-1 h-6">
                {d.fiber > 0 && (
                  <div className="flex items-center justify-center rounded" style={{
                    width: `${(d.fiber / d.total) * 100}%`,
                    background: 'rgba(0, 159, 219, 0.3)',
                    minWidth: '20px',
                  }}>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-fiber)' }}>{formatNumber(d.fiber)}</span>
                  </div>
                )}
                {d.dtv > 0 && (
                  <div className="flex items-center justify-center rounded" style={{
                    width: `${(d.dtv / d.total) * 100}%`,
                    background: 'rgba(255, 114, 0, 0.3)',
                    minWidth: '20px',
                  }}>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-dtv)' }}>{formatNumber(d.dtv)}</span>
                  </div>
                )}
                {d.lines > 0 && (
                  <div className="flex items-center justify-center rounded" style={{
                    width: `${(d.lines / d.total) * 100}%`,
                    background: 'rgba(57, 181, 74, 0.3)',
                    minWidth: '20px',
                  }}>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--color-lines)' }}>{formatNumber(d.lines)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          <LegendItem color="var(--color-fiber)" label="Fiber" />
          <LegendItem color="var(--color-dtv)" label="DTV" />
          <LegendItem color="var(--color-lines)" label="Lines" />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ background: color }} />
      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </div>
  )
}

// === COMPARE VIEW ===
function CompareView({ offices, office, setOffice, timeFrame, setTimeFrame }: any) {
  const allReps = useMemo(() => {
    const data = filterByOffice(filterByTimeFrame(records, timeFrame), office)
    return getReps(data)
  }, [office, timeFrame])

  const [rep1, setRep1] = useState('ZACK EVANS')
  const [rep2, setRep2] = useState('LUIS MONTALVAN')

  const filtered = useMemo(() => {
    let data = filterByTimeFrame(records, timeFrame)
    data = filterByOffice(data, office)
    return data
  }, [timeFrame, office])

  const stats1 = useMemo(() => {
    const repData = filterByRep(filtered, rep1)
    return aggregateRepStats(repData)[0]
  }, [filtered, rep1])

  const stats2 = useMemo(() => {
    const repData = filterByRep(filtered, rep2)
    return aggregateRepStats(repData)[0]
  }, [filtered, rep2])

  const metrics = [
    { key: 'fiber', label: 'Fiber', color: 'var(--color-fiber)', icon: FiberIcon },
    { key: 'dtv', label: 'DTV', color: 'var(--color-dtv)', icon: DTVIcon },
    { key: 'lines', label: 'Lines', color: 'var(--color-lines)', icon: WirelessIcon },
    { key: 'adt', label: 'ADT', color: 'var(--color-adt)', icon: ADTIcon },
    { key: 'total', label: 'Total', color: 'var(--color-accent)', icon: BarChart3 },
  ]

  return (
    <div className="page-container">
      <FilterBar offices={offices} office={office} setOffice={setOffice} timeFrame={timeFrame} setTimeFrame={setTimeFrame} sortBy={'Total' as SortBy} setSortBy={() => {}} showSort={false} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Rep selectors */}
        <div className="stat-card">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Rep 1</label>
          <select className="dropdown w-full mt-2" value={rep1} onChange={e => setRep1(e.target.value)}>
            {allReps.map(r => <option key={r} value={r}>{r.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          {stats1 && (
            <div className="text-3xl font-extrabold mt-3" style={{ color: 'var(--color-accent)' }}>{formatNumber(stats1.total)}</div>
          )}
        </div>
        <div className="stat-card">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Rep 2</label>
          <select className="dropdown w-full mt-2" value={rep2} onChange={e => setRep2(e.target.value)}>
            {allReps.map(r => <option key={r} value={r}>{r.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          {stats2 && (
            <div className="text-3xl font-extrabold mt-3" style={{ color: 'var(--color-warning)' }}>{formatNumber(stats2.total)}</div>
          )}
        </div>
      </div>

      {/* Head to head */}
      {stats1 && stats2 && (
        <div className="stat-card mt-4">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Head-to-Head Comparison</h3>
          <div className="space-y-3">
            {metrics.map(m => {
              const v1 = (stats1 as any)[m.key] || 0
              const v2 = (stats2 as any)[m.key] || 0
              const max = Math.max(v1, v2, 1)
              const winner = v1 > v2 ? 1 : v2 > v1 ? 2 : 0
              const Icon = m.icon
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      <Icon size={13} color={m.color} /> {m.label}
                    </span>
                    <span className="text-xs font-bold" style={{ color: winner === 1 ? 'var(--color-accent)' : winner === 2 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                      {winner === 1 ? stats1.rep : winner === 2 ? stats2.rep : 'TIE'}
                      {winner !== 0 && ` +${formatNumber(Math.abs(v1 - v2))}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex justify-end">
                      <div className="rounded h-6 flex items-center justify-end pr-2" style={{
                        width: `${(v1 / max) * 100}%`,
                        background: winner === 1 ? 'rgba(0, 159, 219, 0.5)' : 'rgba(0, 159, 219, 0.2)',
                        minWidth: '28px',
                      }}>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>{formatNumber(v1)}</span>
                      </div>
                    </div>
                    <div className="vs-badge text-xs">VS</div>
                    <div className="flex-1">
                      <div className="rounded h-6 flex items-center justify-start pl-2" style={{
                        width: `${(v2 / max) * 100}%`,
                        background: winner === 2 ? 'rgba(255, 114, 0, 0.5)' : 'rgba(255, 114, 0, 0.2)',
                        minWidth: '28px',
                      }}>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>{formatNumber(v2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

