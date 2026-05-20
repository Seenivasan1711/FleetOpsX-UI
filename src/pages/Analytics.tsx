import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { BarChart2, RefreshCw, Users } from 'lucide-react'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Skeleton }   from '../components/ui/Skeleton'
import { fetchKpis, fetchDriverPerformance, fetchKpiTrend, triggerEtl } from '../api/analytics'
import { QUERY_KEYS } from '../lib/utils/constants'
import { useMockData } from '../mock/config'

// ── Mock data (matches Figma Image #28) ──────────────────────────────────────

// Trending up to 94.6%
const MOCK_OTD_SPARK    = [91.2, 89.8, 92.4, 93.1, 91.7, 94.3, 93.8, 95.1, 94.2, 95.8, 94.9, 94.6]
// Trending down to ₹38.20
const MOCK_COST_SPARK   = [41.5, 40.2, 42.1, 40.5, 39.8, 40.2, 39.4, 38.5, 40.1, 38.6, 39.0, 38.2]
// Trending down to 8.2%
const MOCK_DETOUR_SPARK = [10.5, 11.2, 9.8, 10.8, 9.4, 10.1, 8.8, 9.5, 8.4, 9.1, 8.6, 8.2]
// Trending down to 3.1 kg
const MOCK_CO2_SPARK    = [3.5, 3.6, 3.4, 3.5, 3.3, 3.4, 3.2, 3.3, 3.1, 3.2, 3.1, 3.1]

const MOCK_KPI_CARDS = [
  { label: 'ON-TIME DELIVERY', value: '94.6%',   color: '#34d399', sparkline: MOCK_OTD_SPARK    },
  { label: 'COST PER STOP',    value: '₹38.20',  color: '#06b6d4', sparkline: MOCK_COST_SPARK   },
  { label: 'AVG DETOUR',       value: '8.2%',    color: '#f59e0b', sparkline: MOCK_DETOUR_SPARK  },
  { label: 'CO₂ PER ROUTE',    value: '3.1 kg',  color: '#7c3aed', sparkline: MOCK_CO2_SPARK    },
]

// Sorted by usage descending (matches Figma)
const MOCK_DRIVER_UTIL = [
  { name: 'Sneha Reddy',  util: 91, color: '#f59e0b' },
  { name: 'Arjun Mehta',  util: 78, color: '#34d399' },
  { name: 'Rohan Das',    util: 72, color: '#34d399' },
  { name: 'Priya Sharma', util: 65, color: '#22d3ee' },
  { name: 'Vikram Singh', util: 45, color: '#7c3aed' },
]

const MOCK_HOURLY = [
  { hour: '8h',  count: 12 }, { hour: '9h',  count: 28 }, { hour: '10h', count: 45 },
  { hour: '11h', count: 52 }, { hour: '12h', count: 38 }, { hour: '13h', count: 31 },
  { hour: '14h', count: 48 }, { hour: '15h', count: 55 }, { hour: '16h', count: 42 },
  { hour: '17h', count: 29 }, { hour: '18h', count: 18 }, { hour: '19h', count: 8  },
]

// ── Full-width area sparkline ─────────────────────────────────────────────────

function Sparkline({ data, color, h = 52 }: { data: number[]; color: string; h?: number }) {
  if (data.length < 2) return null
  const vw = 300
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * vw,
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }))
  const linePts = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const fillPts = `0,${h} ${linePts} ${vw},${h}`
  const id = `sp${color.replace('#', '')}`

  return (
    <svg
      viewBox={`0 0 ${vw} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#${id})`} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, sparkline }: {
  label:     string
  value:     string
  color:     string
  sparkline: number[]
}) {
  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background:  'var(--c-surface)',
        border:      '1px solid var(--c-border)',
        borderTop:   `2px solid ${color}`,
      }}
    >
      <div className="px-5 pt-5 pb-4 flex flex-col gap-3 flex-1">
        {/* Label */}
        <p
          className="text-[9px] font-bold uppercase tracking-[0.13em]"
          style={{ color: 'var(--c-muted)' }}
        >
          {label}
        </p>

        {/* Value — large, wraps naturally for long strings */}
        <p
          className="text-[36px] leading-[1.05] font-black break-words"
          style={{ color }}
        >
          {value}
        </p>

        {/* Full-width sparkline */}
        <div className="mt-auto -mx-5">
          <Sparkline data={sparkline} color={color} h={52} />
        </div>

        {/* Footer */}
        <p className="text-[10px] mt-1" style={{ color: 'var(--c-subtle)' }}>
          last 12 weeks
        </p>
      </div>
    </div>
  )
}

// ── Tooltip styling ───────────────────────────────────────────────────────────

const ttStyle = {
  contentStyle: {
    background:   'var(--c-surface)',
    border:       '1px solid var(--c-border)',
    borderRadius: '10px',
    fontSize:     '12px',
    color:        'var(--c-text)',
  },
  itemStyle:  { color: 'var(--c-text)' },
  labelStyle: { color: 'var(--c-muted)', marginBottom: 4 },
  cursor:     { fill: 'rgba(255,255,255,0.04)' },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const isMock   = useMockData()
  const [etlDate, setEtlDate] = useState(new Date().toISOString().split('T')[0] as string)
  const qc = useQueryClient()

  const refEnd   = new Date().toISOString().split('T')[0] as string
  const refStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] as string

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: [...QUERY_KEYS.analyticsKpis, refStart, refEnd],
    queryFn:  () => fetchKpis(refStart, refEnd),
    enabled:  !isMock,
  })

  const { data: driverPerf = [], isLoading: perfLoading } = useQuery({
    queryKey: [...QUERY_KEYS.driverPerformance, refStart],
    queryFn:  () => fetchDriverPerformance(refStart),
    enabled:  !isMock,
  })

  const { data: kpiTrend = [] } = useQuery({
    queryKey: QUERY_KEYS.kpiTrend(84),
    queryFn:  () => fetchKpiTrend(84),
    staleTime: 5 * 60_000,
    enabled:  !isMock,
  })

  const etlMutation = useMutation({
    mutationFn: () => triggerEtl(etlDate),
    onSuccess: (data) => {
      toast.success(`ETL complete — ${data.upserted} deliveries, ${data.driver_scores_upserted} driver scores`)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.analyticsKpis })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.driverPerformance })
    },
    onError: () => toast.error('ETL failed — check API logs'),
  })

  // ── Live KPI cards ──────────────────────────────────────────────────────────

  const liveOtdSpark  = kpiTrend.map((p) => (p.on_time_pct ?? 0) * 100)
  const liveOtdColor  = kpis?.on_time_rate != null && kpis.on_time_rate >= 0.85 ? '#34d399' : '#f59e0b'

  const liveKpiCards = [
    {
      label:     'ON-TIME DELIVERY',
      value:     kpis?.on_time_rate != null ? `${(kpis.on_time_rate * 100).toFixed(1)}%` : '—',
      color:     liveOtdColor,
      sparkline: liveOtdSpark.length ? liveOtdSpark : MOCK_OTD_SPARK,
    },
    { label: 'COST PER STOP',  value: '—',       color: '#06b6d4', sparkline: MOCK_COST_SPARK   },
    {
      label:     'AVG DETOUR',
      value:     kpis?.avg_delay_minutes != null ? `${kpis.avg_delay_minutes.toFixed(1)} min` : '—',
      color:     '#f59e0b',
      sparkline: MOCK_DETOUR_SPARK,
    },
    { label: 'CO₂ PER ROUTE', value: '—',        color: '#7c3aed', sparkline: MOCK_CO2_SPARK    },
  ]

  const kpiCards = isMock ? MOCK_KPI_CARDS : liveKpiCards

  // ── Live driver utilization ─────────────────────────────────────────────────

  const liveDriverUtil = (
    driverPerf as { driver_id: string; driver_name: string; on_time_rate?: number | null }[]
  )
    .map((d) => ({ name: d.driver_name, util: d.on_time_rate != null ? Math.round(d.on_time_rate * 100) : 0, color: '#06b6d4' }))
    .sort((a, b) => b.util - a.util)
    .slice(0, 5)

  const driverUtilRows  = isMock ? MOCK_DRIVER_UTIL : liveDriverUtil
  const showDriverUtil  = isMock || (!perfLoading && liveDriverUtil.length > 0)

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-4" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* ETL toolbar (live only) */}
        {!isMock && (
          <div
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <p className="text-sm font-semibold text-[var(--c-text)] flex-1">Data Sync</p>
            <Input
              type="date"
              value={etlDate}
              onChange={(e) => setEtlDate(e.target.value)}
              containerClass="w-[155px] shrink-0"
            />
            <Button onClick={() => etlMutation.mutate()} loading={etlMutation.isPending} variant="secondary" size="sm">
              <RefreshCw size={13} className={etlMutation.isPending ? 'animate-spin' : ''} />
              Run ETL
            </Button>
          </div>
        )}

        {/* ── 4 KPI cards ──────────────────────────────────────────────────── */}
        {!isMock && kpisLoading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpiCards.map((card) => <KpiCard key={card.label} {...card} />)}
          </div>
        )}

        {/* ── Bottom two panels ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Driver utilization */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-5"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: 'var(--c-accent)' }} />
                <p className="text-[13px] font-bold text-[var(--c-text)]">Driver utilization</p>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--c-muted)' }}>
                This week · sorted by usage
              </p>
            </div>

            {/* Rows */}
            {!isMock && perfLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 rounded-lg" />)}
              </div>
            ) : !showDriverUtil ? (
              <p className="text-sm text-[var(--c-muted)]">No data — run ETL first.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {driverUtilRows.map((d) => (
                  <div key={d.name} className="flex flex-col gap-1.5">
                    {/* Name + % */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[var(--c-text)]">
                        {d.name}
                      </span>
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--c-muted)' }}>
                        {d.util}%
                      </span>
                    </div>

                    {/* Full-width bar */}
                    <div
                      className="w-full h-[6px] rounded-full overflow-hidden"
                      style={{ background: 'var(--c-elevated)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${d.util}%`, background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hourly throughput */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} style={{ color: 'var(--c-purple)' }} />
                <p className="text-[13px] font-bold text-[var(--c-text)]">Hourly throughput</p>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--c-muted)' }}>
                Stops completed per hour today
              </p>
            </div>

            <div className="flex-1 min-h-0" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_HOURLY} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={10}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: 'var(--c-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--c-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    {...ttStyle}
                    formatter={(v: number) => [`${v} stops`, 'Throughput']}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {MOCK_HOURLY.map((entry) => (
                      <Cell
                        key={entry.hour}
                        fill={entry.count >= 48 ? '#7c3aed' : '#7c3aed55'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
