'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  BarChart3, Search, X, Calendar, ChevronRight, ChevronDown,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  RadialBarChart, RadialBar, Legend,
} from 'recharts'
import salesData from '@/data/sales-data.json'
import type { SaleRecord } from '@/lib/types'
import {
  filterByTimeFrame, filterByOffice, filterByRep, filterByMonth, filterByWeek, filterByDate, filterByQuarter,
  aggregateRepStats, getTeamSummary,
  getTrendData, getOffices, getReps, getMonths, getQuarters, getWeeks, getDates,
  getWeeksInMonth, getDatesInWeek,
  formatNumber, formatPct, parseDate
} from '@/lib/data'

const records = salesData as SaleRecord[]

// === ANIMATED COUNTER COMPONENT ===
function AnimatedNumber({ value, decimals = 0, prefix = '', suffix = '' }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const from = 0
    const to = value

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  return (
    <span className="stat-number">
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}{suffix}
    </span>
  )
}

// === CUSTOM SVG ICON COMPONENTS ===

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

function DashboardIcon({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="3" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="3" y="14" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="14" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

function TrophyIcon({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 21h8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 17v4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M7 7H5a2 2 0 0 0-2 2 3 3 0 0 0 3 3h1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M17 7h2a2 2 0 0 1 2 2 3 3 0 0 1-3 3h-1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

function TrendsIcon({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17l5-5 4 4 8-10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6h4v4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CompareIcon({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 3l4 4-4 4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 7H8a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M8 21l-4-4 4-4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17h12a4 4 0 0 0 4-4v-1" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

// === CHART COLORS ===
const PRODUCT_COLORS = {
  fiber: '#009FDB',
  dtv: '#FF7200',
  lines: '#39B54A',
  adt: '#9B59B6',
}

// === TYPES & CONSTANTS ===
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

// === CUSTOM TOOLTIP FOR RECHARTS ===
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e6ec',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    }}>
      <p style={{ color: '#5a6478', fontSize: '12px', fontWeight: 600, margin: '0 0 6px' }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color, fontSize: '14px', fontWeight: 700, margin: '2px 0' }}>
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

// === MAIN COMPONENT ===
export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('YTD')
  const [office, setOffice] = useState<string>('All')
  const [sortBy, setSortBy] = useState<SortBy>('Total')
  
  // Granular drill-down state
  const [selectedMonth, setSelectedMonth] = useState<string>('All')
  const [selectedWeek, setSelectedWeek] = useState<string>('All')
  const [selectedDate, setSelectedDate] = useState<string>('All')
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All')

  // Reset drill-downs when time frame changes
  const handleTimeFrameChange = (tf: TimeFrame) => {
    setTimeFrame(tf)
    setSelectedMonth('All')
    setSelectedWeek('All')
    setSelectedDate('All')
    setSelectedQuarter('All')
  }

  // Build filtered dataset with granular filters chained
  const filtered = useMemo(() => {
    let data = filterByTimeFrame(records, timeFrame)
    data = filterByOffice(data, office)
    if (selectedQuarter !== 'All') data = filterByQuarter(data, selectedQuarter)
    if (selectedMonth !== 'All') data = filterByMonth(data, selectedMonth)
    if (selectedWeek !== 'All') data = filterByWeek(data, selectedWeek)
    if (selectedDate !== 'All') data = filterByDate(data, selectedDate)
    return data
  }, [timeFrame, office, selectedMonth, selectedWeek, selectedDate, selectedQuarter])

  // Compute what's available for drill-down pickers
  const baseFiltered = useMemo(() => {
    let data = filterByTimeFrame(records, timeFrame)
    return filterByOffice(data, office)
  }, [timeFrame, office])

  const offices = useMemo(() => getOffices(records), [])
  const availableMonths = useMemo(() => getMonths(baseFiltered), [baseFiltered])
  const availableQuarters = useMemo(() => getQuarters(baseFiltered), [baseFiltered])
  const availableWeeks = useMemo(() => {
    const monthData = selectedMonth !== 'All' ? filterByMonth(baseFiltered, selectedMonth) : baseFiltered
    return getWeeks(monthData)
  }, [baseFiltered, selectedMonth])
  const availableDates = useMemo(() => {
    let data = baseFiltered
    if (selectedMonth !== 'All') data = filterByMonth(data, selectedMonth)
    if (selectedWeek !== 'All') data = filterByWeek(data, selectedWeek)
    return getDates(data)
  }, [baseFiltered, selectedMonth, selectedWeek])

  const summary = useMemo(() => getTeamSummary(filtered), [filtered])
  const repStats = useMemo(() => aggregateRepStats(filtered, sortBy), [filtered, sortBy])
  
  // Determine the best chart grouping based on active granularity
  const chartGroupBy = useMemo(() => {
    if (selectedDate !== 'All') return 'day' as const
    if (selectedWeek !== 'All') return 'day' as const
    if (selectedMonth !== 'All') return 'day' as const
    if (timeFrame === 'Daily' || timeFrame === 'Weekly') return 'day' as const
    return 'month' as const
  }, [selectedDate, selectedWeek, selectedMonth, timeFrame])
  
  const trendData = useMemo(() => getTrendData(filtered, chartGroupBy), [filtered, chartGroupBy])

  // Active filter label for header
  const activeFilterLabel = useMemo(() => {
    const parts: string[] = []
    if (timeFrame !== 'All') parts.push(timeFrame === 'YTD' ? 'YTD' : timeFrame)
    else parts.push('All Time')
    if (selectedQuarter !== 'All') parts.push(selectedQuarter)
    if (selectedMonth !== 'All') parts.push(selectedMonth)
    if (selectedWeek !== 'All') parts.push(`Wk ${selectedWeek.split(' - ')[0] || selectedWeek}`)
    if (selectedDate !== 'All') parts.push(selectedDate)
    return parts.join(' › ')
  }, [timeFrame, selectedQuarter, selectedMonth, selectedWeek, selectedDate])

  // Common filter props
  const filterProps = {
    offices, office, setOffice,
    timeFrame, setTimeFrame: handleTimeFrameChange,
    sortBy, setSortBy,
    selectedMonth, setSelectedMonth,
    selectedWeek, setSelectedWeek: (w: string) => { setSelectedWeek(w); setSelectedDate('All') },
    selectedDate, setSelectedDate,
    selectedQuarter, setSelectedQuarter: (q: string) => { setSelectedQuarter(q); setSelectedMonth('All'); setSelectedWeek('All'); setSelectedDate('All') },
    availableMonths, availableQuarters, availableWeeks, availableDates,
  }

  return (
    <>
      <Header filterLabel={activeFilterLabel} office={office} />
      
      <main className="content-pb">
        {tab === 'dashboard' && (
          <DashboardView summary={summary} repStats={repStats} trendData={trendData} filterProps={filterProps} />
        )}
        {tab === 'leaderboard' && (
          <LeaderboardView summary={summary} repStats={repStats} filterProps={filterProps} />
        )}
        {tab === 'trends' && (
          <TrendsView trendData={trendData} filterProps={filterProps} />
        )}
        {tab === 'compare' && (
          <CompareView filterProps={filterProps} />
        )}
      </main>

      <TabBar tab={tab} setTab={setTab} />
    </>
  )
}

// === HEADER ===
function Header({ filterLabel, office }: { filterLabel: string; office: string }) {
  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #009FDB, #067AB4)' }}>
          <ATTGlobeIcon size={18} color="#fff" />
        </div>
        <div>
          <div className="font-bold text-base leading-tight" style={{ color: 'var(--color-text)' }}>ASP / RIVVIA</div>
          <div className="text-[11px] font-semibold leading-tight flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            {filterLabel} · {office}
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

// === FILTER BAR (with granular drill-down) ===
interface FilterProps {
  offices: string[]; office: string; setOffice: (v: string) => void;
  timeFrame: TimeFrame; setTimeFrame: (v: TimeFrame) => void;
  sortBy: SortBy; setSortBy: (v: SortBy) => void;
  selectedMonth: string; setSelectedMonth: (v: string) => void;
  selectedWeek: string; setSelectedWeek: (v: string) => void;
  selectedDate: string; setSelectedDate: (v: string) => void;
  selectedQuarter: string; setSelectedQuarter: (v: string) => void;
  availableMonths: string[]; availableQuarters: string[]; availableWeeks: string[];
  availableDates: { raw: string; date: Date; label: string }[];
}

function FilterBar({ filterProps, showSort = true }: { filterProps: FilterProps; showSort?: boolean }) {
  const {
    offices, office, setOffice,
    timeFrame, setTimeFrame,
    sortBy, setSortBy,
    selectedMonth, setSelectedMonth,
    selectedWeek, setSelectedWeek,
    selectedDate, setSelectedDate,
    selectedQuarter, setSelectedQuarter,
    availableMonths, availableQuarters, availableWeeks, availableDates,
  } = filterProps

  // Determine which drill-down pickers to show
  const showQuarter = ['YTD', 'All'].includes(timeFrame)
  const showMonth = ['Monthly', 'Quarterly', 'YTD', 'All'].includes(timeFrame)
  const showWeek = showMonth && (selectedMonth !== 'All' || timeFrame === 'Weekly')
  const showDay = showWeek && (selectedWeek !== 'All' || timeFrame === 'Daily')

  // Active breadcrumbs for drill-down path
  const breadcrumbs: { label: string; onClear: () => void }[] = []
  if (selectedQuarter !== 'All') breadcrumbs.push({ label: selectedQuarter, onClear: () => setSelectedQuarter('All') })
  if (selectedMonth !== 'All') breadcrumbs.push({ label: selectedMonth, onClear: () => { setSelectedMonth('All'); setSelectedWeek('All'); setSelectedDate('All') } })
  if (selectedWeek !== 'All') breadcrumbs.push({ label: `Week: ${selectedWeek}`, onClear: () => { setSelectedWeek('All'); setSelectedDate('All') } })
  if (selectedDate !== 'All') breadcrumbs.push({ label: `Day: ${selectedDate}`, onClear: () => setSelectedDate('All') })

  return (
    <div className="space-y-2">
      {/* Row 1: Time frame + office + sort */}
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

      {/* Row 2: Granular drill-down pickers */}
      <div className="filter-bar" style={{ animation: 'fadeIn 0.2s ease both' }}>
        {showQuarter && availableQuarters.length > 1 && (
          <select className="dropdown" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}
            style={{ borderColor: selectedQuarter !== 'All' ? '#009FDB' : undefined }}>
            <option value="All">All Quarters</option>
            {availableQuarters.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        )}
        {showMonth && availableMonths.length > 0 && (
          <select className="dropdown" value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedWeek('All'); setSelectedDate('All') }}
            style={{ borderColor: selectedMonth !== 'All' ? '#009FDB' : undefined }}>
            <option value="All">All Months</option>
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {showWeek && availableWeeks.length > 0 && (
          <select className="dropdown" value={selectedWeek} onChange={e => { setSelectedWeek(e.target.value); setSelectedDate('All') }}
            style={{ borderColor: selectedWeek !== 'All' ? '#009FDB' : undefined }}>
            <option value="All">All Weeks</option>
            {availableWeeks.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        )}
        {showDay && availableDates.length > 0 && (
          <select className="dropdown" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{ borderColor: selectedDate !== 'All' ? '#009FDB' : undefined }}>
            <option value="All">All Days</option>
            {availableDates.map(d => <option key={d.raw} value={d.raw}>{d.label}</option>)}
          </select>
        )}
      </div>

      {/* Breadcrumb chips */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap" style={{ animation: 'fadeIn 0.15s ease both' }}>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Viewing:</span>
          {breadcrumbs.map((bc, i) => (
            <button key={i} onClick={bc.onClear}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(0, 159, 219, 0.1)', color: '#067AB4', border: '1px solid rgba(0, 159, 219, 0.2)' }}>
              {bc.label}
              <X size={10} />
            </button>
          ))}
          {breadcrumbs.length > 1 && (
            <button onClick={() => { setSelectedQuarter('All'); setSelectedMonth('All'); setSelectedWeek('All'); setSelectedDate('All') }}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all hover:opacity-80"
              style={{ color: 'var(--color-text-muted)' }}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// === DASHBOARD VIEW (MAJOR REDESIGN) ===
function DashboardView({ summary, repStats, trendData, filterProps }: { summary: any; repStats: any; trendData: any; filterProps: FilterProps }) {
  // Product mix data for donut chart
  const productMix = [
    { name: 'Fiber', value: summary.teamFiber, color: PRODUCT_COLORS.fiber },
    { name: 'DTV', value: summary.teamDtv, color: PRODUCT_COLORS.dtv },
    { name: 'Lines', value: summary.teamLines, color: PRODUCT_COLORS.lines },
    { name: 'ADT', value: summary.teamAdt, color: PRODUCT_COLORS.adt },
  ].filter(p => p.value > 0)

  return (
    <div className="page-container">
      <FilterBar filterProps={filterProps} />

      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="stat-card" style={{ borderTop: '3px solid #009FDB' }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Total Sales</div>
          <div className="text-3xl md:text-4xl font-extrabold mt-1" style={{ color: 'var(--color-text)' }}>
            <AnimatedNumber value={summary.totalSales} />
          </div>
          <div className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{summary.activeReps} active reps</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #067AB4' }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Avg / Rep</div>
          <div className="text-3xl md:text-4xl font-extrabold mt-1" style={{ color: 'var(--color-text)' }}>
            <AnimatedNumber value={summary.avgPerRep} decimals={1} />
          </div>
          <div className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>across active reps</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #FCB314' }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Top Performer</div>
          <div className="text-lg md:text-xl font-bold mt-1" style={{ color: '#067AB4' }}>
            {summary.topPerformer.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </div>
          <div className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(summary.topPerformerTotal)} sales</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #FF7200' }}>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>DTV/Fiber %</div>
          <div className="text-3xl md:text-4xl font-extrabold mt-1" style={{ color: 'var(--color-text)' }}>
            <AnimatedNumber value={parseFloat(formatPct(summary.teamDtvFiberPct).replace('%', ''))} decimals={1} suffix="%" />
          </div>
          <div className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Lines/Fiber: {formatPct(summary.teamLinesFiberPct)}</div>
        </div>
      </div>

      {/* Production Area Chart + Product Mix Donut side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Area Chart - Production Over Time */}
        <div className="stat-card md:col-span-2 chart-container">
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>Production Over Time</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Fiber · DTV · Lines</p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradFiber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#009FDB" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#009FDB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradDtv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF7200" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF7200" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradLines" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#39B54A" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#39B54A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8d95a5' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8d95a5' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="fiber" name="Fiber" stroke="#009FDB" strokeWidth={2.5} fill="url(#gradFiber)" dot={false} activeDot={{ r: 5, fill: '#009FDB', stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="dtv" name="DTV" stroke="#FF7200" strokeWidth={2} fill="url(#gradDtv)" dot={false} activeDot={{ r: 4, fill: '#FF7200', stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="lines" name="Lines" stroke="#39B54A" strokeWidth={2} fill="url(#gradLines)" dot={false} activeDot={{ r: 4, fill: '#39B54A', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Mix Donut */}
        <div className="stat-card chart-container">
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>Product Mix</h3>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Distribution breakdown</p>
          <div style={{ width: '100%', height: 190 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={productMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={800}
                >
                  {productMix.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {productMix.map(p => (
              <div key={p.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Cards with progress bars */}
      <h2 className="section-header text-sm font-bold uppercase tracking-wider mt-6 mb-3" style={{ color: 'var(--color-text-muted)' }}>Production by Product</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ProductCard icon={FiberIcon} label="Fiber" value={summary.teamFiber} color="var(--color-fiber)" total={summary.totalSales} />
        <ProductCard icon={DTVIcon} label="DTV" value={summary.teamDtv} color="var(--color-dtv)" total={summary.totalSales} />
        <ProductCard icon={WirelessIcon} label="Lines" value={summary.teamLines} color="var(--color-lines)" total={summary.totalSales} />
        <ProductCard icon={ADTIcon} label="ADT" value={summary.teamAdt} color="var(--color-adt)" total={summary.totalSales} />
      </div>

      {/* Mini leaderboard */}
      <h2 className="section-header text-sm font-bold uppercase tracking-wider mt-6 mb-3" style={{ color: 'var(--color-text-muted)' }}>Top 10 Performers</h2>
      <div className="space-y-1">
        {repStats.slice(0, 10).map((rep: any, i: number) => (
          <LeaderboardRow key={rep.rep} rep={rep} compact style={{ animationDelay: `${i * 0.04}s` }} />
        ))}
      </div>
    </div>
  )
}

// === PRODUCT CARD (with animated progress bar) ===
function ProductCard({ icon: Icon, label, value, color, total }: { icon: any; label: string; value: number; color: string; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="stat-card flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}14` }}>
          <Icon size={22} color={color} />
        </div>
        <div>
          <div className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
          <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            <AnimatedNumber value={value} />
          </div>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
      <div className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>{pct.toFixed(1)}% of total</div>
    </div>
  )
}

// === LEADERBOARD VIEW ===
function LeaderboardView({ summary, repStats, filterProps }: { summary: any; repStats: any; filterProps: FilterProps }) {
  const [search, setSearch] = useState('')
  
  const filteredReps = useMemo(() => {
    if (!search) return repStats
    return repStats.filter((r: any) => r.rep.toLowerCase().includes(search.toLowerCase()))
  }, [repStats, search])

  const top3 = filteredReps.slice(0, 3)
  const rest = filteredReps.slice(3)

  return (
    <div className="page-container">
      <FilterBar filterProps={filterProps} />

      {/* Top 3 Podium */}
      {top3.length === 3 && !search && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 mb-6">
          <PodiumCard rep={top3[1]} place={2} />
          <PodiumCard rep={top3[0]} place={1} />
          <PodiumCard rep={top3[2]} place={3} />
        </div>
      )}

      {/* Search */}
      <div className="relative mt-2 mb-3" style={{ animation: 'fadeIn 0.3s ease both' }}>
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = '#009FDB'; e.target.style.boxShadow = '0 0 0 3px rgba(0,159,219,0.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={16} color="var(--color-text-muted)" />
          </button>
        )}
      </div>

      {/* Full leaderboard */}
      <div className="space-y-1">
        {search && top3.length > 0 && top3.map((rep: any, i: number) => (
          <LeaderboardRow key={rep.rep} rep={rep} style={{ animationDelay: `${i * 0.04}s` }} />
        ))}
        {!search && top3.length > 0 && rest.map((rep: any, i: number) => (
          <LeaderboardRow key={rep.rep} rep={rep} style={{ animationDelay: `${i * 0.03}s` }} />
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
    1: { color: '#FCB314', bg: 'rgba(252, 179, 20, 0.06)', borderColor: '#FCB314', renderIcon: () => <CrownIcon size={24} color="#FCB314" /> },
    2: { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.06)', borderColor: '#94A3B8', renderIcon: () => <MedalIcon size={24} color="#94A3B8" /> },
    3: { color: '#C57A3A', bg: 'rgba(197, 122, 58, 0.06)', borderColor: '#C57A3A', renderIcon: () => <MedalIcon size={24} color="#C57A3A" /> },
  }[place] as any

  const formattedName = rep.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <div className="stat-card podium-card text-center" style={{ background: config.bg, borderColor: config.borderColor + '33', borderTop: `3px solid ${config.borderColor}` }}>
      <div className="flex justify-center mb-2">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center" style={{ background: config.color + '18' }}>
          {config.renderIcon()}
        </div>
      </div>
      <div className="text-xs font-bold mb-0.5" style={{ color: config.color }}>#{place}</div>
      <div className="text-xs md:text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{formattedName}</div>
      <div className="text-lg md:text-xl font-extrabold mt-1" style={{ color: config.color }}>
        <AnimatedNumber value={rep.total} />
      </div>
      <div className="flex justify-center gap-1 mt-1.5">
        {rep.fiber > 0 && <span className="chip chip--fiber">{formatNumber(rep.fiber)}</span>}
        {rep.dtv > 0 && <span className="chip chip--dtv">{formatNumber(rep.dtv)}</span>}
        {rep.lines > 0 && <span className="chip chip--lines">{formatNumber(rep.lines)}</span>}
      </div>
    </div>
  )
}

// === LEADERBOARD ROW ===
function LeaderboardRow({ rep, compact = false, style = {} }: { rep: any; compact?: boolean; style?: React.CSSProperties }) {
  const [expanded, setExpanded] = useState(false)
  const formattedName = rep.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <>
      <div className="lb-row" onClick={() => setExpanded(!expanded)} style={style}>
        <div className={`rank-badge rank-badge--${rep.rank <= 3 ? rep.rank : 'normal'}`}>
          {rep.rank}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{formattedName}</span>
            {!compact && rep.office !== 'Unassigned' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-lighter)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                {rep.office}
              </span>
            )}
          </div>
          {expanded && (
            <div className="flex gap-2 mt-2 flex-wrap" style={{ animation: 'fadeInUp 0.2s ease both' }}>
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
          <div className="ml-2" style={{ transition: 'transform 0.2s ease', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <ChevronRight size={16} color="var(--color-text-muted)" />
          </div>
        )}
      </div>
    </>
  )
}

// === TRENDS VIEW ===
function TrendsView({ trendData, filterProps }: { trendData: any; filterProps: FilterProps }) {
  const [metric, setMetric] = useState<'total' | 'fiber' | 'dtv' | 'lines' | 'adt'>('total')
  
  const metricConfig: Record<string, { color: string; label: string }> = {
    total: { color: '#009FDB', label: 'Total' },
    fiber: { color: '#009FDB', label: 'Fiber' },
    dtv: { color: '#FF7200', label: 'DTV' },
    lines: { color: '#39B54A', label: 'Lines' },
    adt: { color: '#9B59B6', label: 'ADT' },
  }

  return (
    <div className="page-container">
      <FilterBar filterProps={filterProps} showSort={false} />

      {/* Metric selector */}
      <div className="seg-control mt-4">
        {Object.entries(metricConfig).map(([key, cfg]) => (
          <button key={key} className={`seg-control__btn ${metric === key ? 'active' : ''}`} onClick={() => setMetric(key as any)}>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Interactive Bar Chart */}
      <div className="stat-card chart-container mt-4">
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          {metricConfig[metric].label} Production Over Time
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Interactive chart — hover for details</p>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricConfig[metric].color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={metricConfig[metric].color} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8d95a5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8d95a5' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,159,219,0.04)', radius: 6 }} />
              <Bar dataKey={metric} name={metricConfig[metric].label} fill="url(#barGrad)" radius={[6, 6, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked Area Chart for Product Breakdown */}
      <div className="stat-card chart-container mt-4" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>Product Breakdown</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Stacked view of all products</p>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="stackFiber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#009FDB" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#009FDB" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="stackDtv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF7200" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF7200" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="stackLines" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#39B54A" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#39B54A" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8d95a5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8d95a5' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="fiber" name="Fiber" stackId="1" stroke="#009FDB" strokeWidth={2} fill="url(#stackFiber)" />
              <Area type="monotone" dataKey="dtv" name="DTV" stackId="1" stroke="#FF7200" strokeWidth={2} fill="url(#stackDtv)" />
              <Area type="monotone" dataKey="lines" name="Lines" stackId="1" stroke="#39B54A" strokeWidth={2} fill="url(#stackLines)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-4 flex-wrap justify-center">
          <LegendItem color="#009FDB" label="Fiber" />
          <LegendItem color="#FF7200" label="DTV" />
          <LegendItem color="#39B54A" label="Lines" />
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
function CompareView({ filterProps }: { filterProps: FilterProps }) {
  const { office, timeFrame } = filterProps
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
    { key: 'fiber', label: 'Fiber', color: '#009FDB', icon: FiberIcon },
    { key: 'dtv', label: 'DTV', color: '#FF7200', icon: DTVIcon },
    { key: 'lines', label: 'Lines', color: '#39B54A', icon: WirelessIcon },
    { key: 'adt', label: 'ADT', color: '#9B59B6', icon: ADTIcon },
    { key: 'total', label: 'Total', color: '#067AB4', icon: BarChart3 },
  ]

  // Build bar chart data for comparison
  const comparisonChartData = stats1 && stats2 ? metrics.slice(0, 4).map(m => ({
    name: m.label,
    [stats1.rep]: (stats1 as any)[m.key] || 0,
    [stats2.rep]: (stats2 as any)[m.key] || 0,
  })) : []

  return (
    <div className="page-container">
      <FilterBar filterProps={filterProps} showSort={false} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="stat-card" style={{ borderTop: '3px solid #009FDB' }}>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Rep 1</label>
          <select className="dropdown w-full mt-2" value={rep1} onChange={e => setRep1(e.target.value)}>
            {allReps.map(r => <option key={r} value={r}>{r.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          {stats1 && (
            <div className="text-3xl font-extrabold mt-3" style={{ color: '#009FDB' }}>
              <AnimatedNumber value={stats1.total} />
            </div>
          )}
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #FF7200' }}>
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Rep 2</label>
          <select className="dropdown w-full mt-2" value={rep2} onChange={e => setRep2(e.target.value)}>
            {allReps.map(r => <option key={r} value={r}>{r.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          {stats2 && (
            <div className="text-3xl font-extrabold mt-3" style={{ color: '#FF7200' }}>
              <AnimatedNumber value={stats2.total} />
            </div>
          )}
        </div>
      </div>

      {/* Side-by-side Bar Chart */}
      {stats1 && stats2 && comparisonChartData.length > 0 && (
        <div className="stat-card chart-container mt-4">
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>Head-to-Head Comparison</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Side-by-side product breakdown</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={comparisonChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ec" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5a6478', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8d95a5' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={stats1.rep} name={stats1.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())} fill="#009FDB" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Bar dataKey={stats2.rep} name={stats2.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())} fill="#FF7200" radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: '#009FDB' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{stats1.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: '#FF7200' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{stats2.rep.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stat bars */}
      {stats1 && stats2 && (
        <div className="stat-card mt-4" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4,0,0.2,1) both', animationDelay: '0.2s' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--color-text)' }}>Category Breakdown</h3>
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
                    <span className="text-xs font-bold" style={{ color: winner === 1 ? '#009FDB' : winner === 2 ? '#FF7200' : 'var(--color-text-muted)' }}>
                      {winner !== 0 && `+${formatNumber(Math.abs(v1 - v2))}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex justify-end">
                      <div className="rounded-l-lg h-7 flex items-center justify-end pr-2" style={{
                        width: `${(v1 / max) * 100}%`,
                        background: winner === 1 ? 'rgba(0, 159, 219, 0.2)' : 'rgba(0, 159, 219, 0.08)',
                        borderRight: '2px solid #009FDB',
                        minWidth: '32px',
                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                      }}>
                        <span className="text-[11px] font-bold" style={{ color: '#067AB4' }}>{formatNumber(v1)}</span>
                      </div>
                    </div>
                    <div className="vs-badge text-xs" style={{ width: 36, height: 36, fontSize: 11 }}>VS</div>
                    <div className="flex-1">
                      <div className="rounded-r-lg h-7 flex items-center justify-start pl-2" style={{
                        width: `${(v2 / max) * 100}%`,
                        background: winner === 2 ? 'rgba(255, 114, 0, 0.2)' : 'rgba(255, 114, 0, 0.08)',
                        borderLeft: '2px solid #FF7200',
                        minWidth: '32px',
                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                      }}>
                        <span className="text-[11px] font-bold" style={{ color: '#E06500' }}>{formatNumber(v2)}</span>
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
