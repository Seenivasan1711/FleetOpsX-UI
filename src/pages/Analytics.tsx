import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, Package, Clock, RefreshCw } from 'lucide-react'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Skeleton }   from '../components/ui/Skeleton'
import { fetchKpis, fetchDriverPerformance, triggerEtl } from '../api/analytics'
import { QUERY_KEYS } from '../lib/utils/constants'

const refEnd   = new Date().toISOString().split('T')[0]
const refStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

// ─── KPI card ──────────────────────────────────────────────────────────────────

type KpiCardProps = {
  label:  string
  value:  string | number
  sub?:   string
  accent: string
  dim:    string
}

const KpiCard = ({ label, value, sub, accent, dim }: KpiCardProps) => (
  <div
    className="rounded-2xl p-5 flex flex-col gap-2"
    style={{ background: dim, border: `1px solid ${accent}33` }}
  >
    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-muted)]">{label}</p>
    <p className="text-3xl font-extrabold" style={{ color: accent }}>{value}</p>
    {sub && <p className="text-xs text-[var(--c-muted)]">{sub}</p>}
  </div>
)

// ─── Chart tooltip styling ─────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    background:   'var(--c-surface)',
    border:       '1px solid var(--c-border)',
    borderRadius: '10px',
    fontSize:     '12px',
    color:        'var(--c-text)',
  },
  itemStyle:  { color: 'var(--c-text)' },
  labelStyle: { color: 'var(--c-muted)', marginBottom: 4 },
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [etlDate, setEtlDate] = useState(refEnd)
  const qc = useQueryClient()

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: [...QUERY_KEYS.analyticsKpis, refStart, refEnd],
    queryFn:  () => fetchKpis(refStart, refEnd),
  })

  const { data: driverPerf = [], isLoading: perfLoading } = useQuery({
    queryKey: [...QUERY_KEYS.driverPerformance, refStart],
    queryFn:  () => fetchDriverPerformance(refStart),
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

  const onTimeRate   = kpis?.on_time_rate != null ? `${(kpis.on_time_rate * 100).toFixed(1)}%` : '—'
  const avgDelay     = kpis?.avg_delay_minutes != null ? `${kpis.avg_delay_minutes.toFixed(1)} min` : '—'
  const isGoodRate   = kpis?.on_time_rate != null && kpis.on_time_rate >= 0.85

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* ETL toolbar */}
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-sm font-semibold text-[var(--c-text)] flex-1">
            Data Sync · Last 30 days
          </p>
          <Input
            type="date"
            value={etlDate}
            onChange={(e) => setEtlDate(e.target.value)}
            className="w-auto"
          />
          <Button
            onClick={() => etlMutation.mutate()}
            loading={etlMutation.isPending}
            variant="secondary"
            size="sm"
          >
            <RefreshCw size={13} className={etlMutation.isPending ? 'animate-spin' : ''} />
            Run ETL
          </Button>
        </div>

        {/* KPI cards */}
        {kpisLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="Total Deliveries"
              value={kpis?.total_deliveries ?? 0}
              accent="var(--c-accent)"
              dim="var(--c-accent-dim)"
            />
            <KpiCard
              label="On-Time Rate"
              value={onTimeRate}
              sub="target ≥ 85%"
              accent={isGoodRate ? 'var(--c-green)' : 'var(--c-orange)'}
              dim={isGoodRate ? 'var(--c-green-dim)' : 'rgba(251,191,36,0.08)'}
            />
            <KpiCard
              label="Avg Delay"
              value={avgDelay}
              sub="when delayed"
              accent="var(--c-orange)"
              dim="rgba(251,191,36,0.08)"
            />
            <KpiCard
              label="Zones Served"
              value={kpis?.deliveries_by_zone.length ?? 0}
              accent="var(--c-purple)"
              dim="var(--c-purple-dim)"
            />
          </div>
        )}

        {/* Daily deliveries chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-sm font-bold text-[var(--c-text)] flex items-center gap-2 mb-4">
            <TrendingUp size={15} style={{ color: 'var(--c-accent)' }} />
            Daily Deliveries
          </p>
          {kpisLoading || !kpis?.deliveries_by_day.length ? (
            <p className="text-sm text-[var(--c-muted)] py-4">No data yet — run ETL to populate.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={kpis.deliveries_by_day} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--c-muted)' }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--c-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(v) => <span style={{ color: 'var(--c-text)' }}>{v}</span>}
                />
                <Line type="monotone" dataKey="total"   stroke="var(--c-accent)" strokeWidth={2} dot={false} name="Total"   />
                <Line type="monotone" dataKey="on_time" stroke="var(--c-green)"  strokeWidth={2} dot={false} name="On-Time" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Zone breakdown chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-sm font-bold text-[var(--c-text)] flex items-center gap-2 mb-4">
            <Package size={15} style={{ color: 'var(--c-purple)' }} />
            Deliveries by Zone · Top 10
          </p>
          {kpisLoading || !kpis?.deliveries_by_zone.length ? (
            <p className="text-sm text-[var(--c-muted)] py-4">No data yet — run ETL to populate.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={kpis.deliveries_by_zone.slice(0, 10)}
                margin={{ top: 4, right: 16, left: -10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="zone" tick={{ fontSize: 10, fill: 'var(--c-muted)' }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--c-muted)' }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="total"   fill="var(--c-accent)" name="Total"   radius={[4, 4, 0, 0]} />
                <Bar dataKey="on_time" fill="var(--c-green)"  name="On-Time" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Driver leaderboard */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <div className="px-5 py-4 border-b border-[var(--c-border)] flex items-center gap-2">
            <Clock size={15} style={{ color: 'var(--c-orange)' }} />
            <p className="text-sm font-bold text-[var(--c-text)]">Driver Performance Leaderboard</p>
          </div>

          {perfLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          ) : driverPerf.length === 0 ? (
            <p className="p-5 text-sm text-[var(--c-muted)]">No performance data yet — run ETL first.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)] w-10">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Driver</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Deliveries</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">On-Time</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Avg Delay</th>
                </tr>
              </thead>
              <tbody>
                {(driverPerf as { driver_id: string; driver_name: string; total_deliveries: number; on_time_rate?: number; avg_delay_minutes?: number }[]).map((d, i) => {
                  const good = d.on_time_rate != null && d.on_time_rate >= 0.85
                  return (
                    <tr
                      key={d.driver_id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--c-border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td className="px-5 py-3 text-xs text-[var(--c-muted)] font-mono">{i + 1}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-[var(--c-text)]">{d.driver_name}</td>
                      <td className="px-5 py-3 text-right text-sm font-mono text-[var(--c-text)]">{d.total_deliveries}</td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: good ? 'var(--c-green)' : 'var(--c-orange)' }}
                        >
                          {d.on_time_rate != null ? `${(d.on_time_rate * 100).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-mono text-[var(--c-muted)]">
                        {d.avg_delay_minutes != null ? `${d.avg_delay_minutes.toFixed(1)} min` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
