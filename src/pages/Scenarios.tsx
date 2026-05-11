import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  Layers, Play, Trash2, RefreshCw, ChevronRight,
  Warehouse, Zap, Users, TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Skeleton }   from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import {
  fetchScenarios, createScenario, deleteScenario,
  fetchScenarioStatus, fetchScenarioResults,
} from '../api/scenarios'
import type { ScenarioRun, ScenarioResult, ScenarioType, CreateScenarioBody } from '../api/scenarios'

// ─── Constants ────────────────────────────────────────────────────────────────
const SCENARIO_TYPES: {
  value: ScenarioType; label: string; desc: string; icon: React.ElementType; color: string; dim: string
}[] = [
  { value: 'new_depot',           label: 'New Depot',          desc: 'Simulate adding a new depot location',               icon: Warehouse,  color: 'var(--c-accent)',  dim: 'var(--c-accent-dim)'  },
  { value: 'ev_fleet_mix',        label: 'EV Fleet Mix',       desc: 'Model transitioning a % of fleet to electric',        icon: Zap,        color: 'var(--c-green)',   dim: 'var(--c-green-dim)'   },
  { value: 'driver_count_change', label: 'Driver Change',      desc: 'Add or remove drivers from the fleet',               icon: Users,      color: 'var(--c-orange)',  dim: 'var(--c-orange-dim)'  },
  { value: 'demand_surge',        label: 'Demand Surge',       desc: 'Apply a surge multiplier to a specific zone',        icon: TrendingUp, color: 'var(--c-red)',     dim: 'var(--c-red-dim)'     },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusColor(s: string) {
  if (s === 'COMPLETED') return 'var(--c-green)'
  if (s === 'RUNNING')   return 'var(--c-accent)'
  if (s === 'FAILED')    return 'var(--c-red)'
  return 'var(--c-muted)'
}
function statusBg(s: string) {
  if (s === 'COMPLETED') return 'var(--c-green-dim)'
  if (s === 'RUNNING')   return 'var(--c-accent-dim)'
  if (s === 'FAILED')    return 'var(--c-red-dim)'
  return 'var(--c-elevated)'
}

function pct(v: number) { return `${(v * 100).toFixed(1)}%` }
function delta(v: number) { return `${v > 0 ? '+' : ''}${v.toFixed(3)}` }
function deltaColor(v: number, higherIsBetter = true) {
  if (Math.abs(v) < 0.001) return 'var(--c-muted)'
  return (v > 0) === higherIsBetter ? 'var(--c-green)' : 'var(--c-red)'
}

// ─── Param fields ──────────────────────────────────────────────────────────────
function ParamFields({ type, params, onChange }: {
  type: ScenarioType; params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void
}) {
  const set = (key: string, val: unknown) => onChange({ ...params, [key]: val })

  if (type === 'new_depot') return (
    <div className="grid grid-cols-2 gap-3">
      <div><label className="field-label">Depot Name</label>
        <Input value={String(params.depot_name ?? '')} onChange={(e) => set('depot_name', e.target.value)} placeholder="Whitefield Hub" /></div>
      <div><label className="field-label">Capacity</label>
        <Input type="number" value={String(params.capacity ?? 50)} onChange={(e) => set('capacity', Number(e.target.value))} /></div>
      <div><label className="field-label">Latitude</label>
        <Input type="number" step="0.0001" value={String(params.lat ?? 12.9716)} onChange={(e) => set('lat', Number(e.target.value))} /></div>
      <div><label className="field-label">Longitude</label>
        <Input type="number" step="0.0001" value={String(params.lng ?? 77.5946)} onChange={(e) => set('lng', Number(e.target.value))} /></div>
    </div>
  )
  if (type === 'ev_fleet_mix') return (
    <div className="grid grid-cols-2 gap-3">
      <div><label className="field-label">EV Fleet %</label>
        <Input type="number" min={0} max={100} value={String(params.ev_percentage ?? 30)} onChange={(e) => set('ev_percentage', Number(e.target.value))} /></div>
      <div><label className="field-label">EV Range (km)</label>
        <Input type="number" value={String(params.ev_range_km ?? 200)} onChange={(e) => set('ev_range_km', Number(e.target.value))} /></div>
    </div>
  )
  if (type === 'driver_count_change') return (
    <div><label className="field-label">Driver Delta (negative = remove)</label>
      <Input type="number" value={String(params.delta ?? -2)} onChange={(e) => set('delta', Number(e.target.value))} placeholder="-5 removes 5 drivers" /></div>
  )
  if (type === 'demand_surge') return (
    <div className="grid grid-cols-2 gap-3">
      <div><label className="field-label">Zone</label>
        <Input value={String(params.zone ?? '')} onChange={(e) => set('zone', e.target.value)} placeholder="e.g. Koramangala" /></div>
      <div><label className="field-label">Surge Factor</label>
        <Input type="number" step="0.1" min={1} value={String(params.surge_factor ?? 1.4)} onChange={(e) => set('surge_factor', Number(e.target.value))} /></div>
    </div>
  )
  return null
}

// ─── Run card ─────────────────────────────────────────────────────────────────
function RunCard({ run, onSelect, onDelete, selected }: {
  run: ScenarioRun; selected: boolean; onSelect: () => void; onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="rounded-xl px-4 py-3 cursor-pointer transition-all"
      style={{
        border:     `1px solid ${selected ? 'var(--c-accent)' : 'var(--c-border)'}`,
        background: selected ? 'var(--c-accent-dim)' : 'var(--c-surface)',
        boxShadow:  selected ? '0 0 0 1px var(--c-accent)' : 'none',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--c-muted)' }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--c-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--c-text)] truncate">{run.name}</p>
          <p className="text-[11px] text-[var(--c-muted)] mt-0.5">
            {run.scenario_type.replace(/_/g, ' ')} · {run.horizon_days}d from {run.horizon_start}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: statusColor(run.status), background: statusBg(run.status) }}
          >
            {run.status}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-[var(--c-muted)] hover:text-[var(--c-red)] transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Results panel ────────────────────────────────────────────────────────────
function ResultsPanel({ run }: { run: ScenarioRun }) {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['scenario-results', run.id],
    queryFn:  () => fetchScenarioResults(run.id),
    enabled:  run.status === 'COMPLETED',
  })

  const { data: statusData } = useQuery({
    queryKey:       ['scenario-status', run.id],
    queryFn:        () => fetchScenarioStatus(run.id),
    enabled:        run.status === 'QUEUED' || run.status === 'RUNNING',
    refetchInterval: 2000,
  })

  if (run.status === 'QUEUED' || run.status === 'RUNNING') {
    const progress = statusData?.progress ?? 0
    const total    = statusData?.total ?? run.horizon_days
    const pctDone  = total ? (progress / total) * 100 : 0
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-5">
        <div className="relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--c-accent-dim)', border: '1px solid var(--c-accent)' }}
          >
            <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--c-text)] mb-1">
            {run.status === 'QUEUED' ? 'Queued — waiting to start' : `Running — Day ${progress} of ${total}`}
          </p>
          <p className="text-xs text-[var(--c-muted)]">Results will appear automatically when complete</p>
        </div>
        <div className="w-56 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pctDone}%`, background: 'var(--c-accent)' }}
          />
        </div>
        <p className="text-xs font-mono text-[var(--c-muted)]">{pctDone.toFixed(0)}%</p>
      </div>
    )
  }

  if (run.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--c-red-dim)' }}>
          <Layers size={20} style={{ color: 'var(--c-red)' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--c-red)' }}>Scenario run failed</p>
        <p className="text-xs text-[var(--c-muted)]">Check your parameters and try again</p>
      </div>
    )
  }

  if (isLoading || results.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  const chartData = results.map((r: ScenarioResult) => ({
    date: r.plan_date,
    'Scenario': Math.round(r.on_time_rate * 100),
    'Baseline': Math.round((r.on_time_rate - (r.kpi_delta?.on_time_rate ?? 0)) * 100),
  }))

  const avgDelta = (key: keyof NonNullable<ScenarioResult['kpi_delta']>) => {
    const vals = results.map((r) => r.kpi_delta?.[key] ?? 0)
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const kpiCards = [
    { label: 'Avg On-Time Rate', key: 'on_time_rate'      as const, higher: true,  fmt: pct },
    { label: 'Avg Fleet Util',   key: 'fleet_utilization' as const, higher: true,  fmt: pct },
    { label: 'Distance Δ (km)',  key: 'total_distance_km' as const, higher: false, fmt: (v: number) => v.toFixed(1) },
  ]

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {kpiCards.map(({ label, key, higher, fmt }) => {
          const d   = avgDelta(key)
          const val = (results[results.length - 1]?.[key as keyof ScenarioResult] as number) ?? 0
          return (
            <div key={key} className="rounded-2xl p-4" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <p className="text-[10px] uppercase tracking-widest text-[var(--c-muted)] mb-2">{label}</p>
              <p className="text-2xl font-bold text-[var(--c-text)] font-mono">{fmt(val)}</p>
              <p className="text-xs font-semibold mt-1.5 flex items-center gap-1" style={{ color: deltaColor(d, higher) }}>
                {d > 0 ? '↑' : d < 0 ? '↓' : '—'} {delta(d)}
                <span className="text-[var(--c-muted)] font-normal">vs baseline</span>
              </p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] mb-4">
          On-Time Rate — Scenario vs Baseline (%)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--c-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--c-muted)' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: 'var(--c-text)', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--c-muted)' }} />
            <Line type="monotone" dataKey="Scenario" stroke="var(--c-accent)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Baseline" stroke="var(--c-muted)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-day table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Daily Breakdown</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
              {['Date', 'Routes', 'Assigned', 'On-Time', 'Fleet Util', 'Dist (km)', 'On-Time Δ'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-[var(--c-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r: ScenarioResult) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--c-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                <td className="px-4 py-2.5 text-[var(--c-text)] font-mono">{r.plan_date}</td>
                <td className="px-4 py-2.5 text-[var(--c-muted)]">{r.total_routes}</td>
                <td className="px-4 py-2.5 text-[var(--c-muted)]">{r.assigned_orders}</td>
                <td className="px-4 py-2.5 text-[var(--c-text)] font-semibold">{pct(r.on_time_rate)}</td>
                <td className="px-4 py-2.5 text-[var(--c-text)]">{pct(r.fleet_utilization)}</td>
                <td className="px-4 py-2.5 text-[var(--c-muted)]">{r.total_distance_km.toFixed(1)}</td>
                <td className="px-4 py-2.5 font-semibold font-mono" style={{ color: deltaColor(r.kpi_delta?.on_time_rate ?? 0, true) }}>
                  {delta(r.kpi_delta?.on_time_rate ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Wizard ───────────────────────────────────────────────────────────────────
const DEFAULT_PARAMS: Record<ScenarioType, Record<string, unknown>> = {
  new_depot:           { depot_name: 'New Hub', lat: 12.9716, lng: 77.5946, capacity: 50 },
  ev_fleet_mix:        { ev_percentage: 30, ev_range_km: 200 },
  driver_count_change: { delta: -2 },
  demand_surge:        { zone: '', surge_factor: 1.4 },
}

function Wizard({ onCreated }: { onCreated: () => void }) {
  const [type,         setType]         = useState<ScenarioType>('new_depot')
  const [params,       setParams]       = useState<Record<string, unknown>>(DEFAULT_PARAMS.new_depot)
  const [name,         setName]         = useState('')
  const [horizonStart, setHorizonStart] = useState(new Date().toISOString().slice(0, 10))
  const [horizonDays,  setHorizonDays]  = useState(7)

  const qc  = useQueryClient()
  const mut = useMutation({
    mutationFn: (body: CreateScenarioBody) => createScenario(body),
    onSuccess:  () => { toast.success('Scenario queued!'); qc.invalidateQueries({ queryKey: ['scenarios'] }); onCreated() },
    onError:    () => toast.error('Failed to create scenario'),
  })

  const selectedMeta = SCENARIO_TYPES.find((s) => s.value === type)!

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
      {/* Wizard header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: selectedMeta.dim }}>
            <selectedMeta.icon size={16} style={{ color: selectedMeta.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--c-text)]">New Scenario</p>
            <p className="text-[11px] text-[var(--c-muted)]">{selectedMeta.desc}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Step 1: Type */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] mb-3">
            Step 1 — Scenario Type
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SCENARIO_TYPES.map((st) => {
              const isSelected = type === st.value
              const Icon = st.icon
              return (
                <button
                  key={st.value}
                  onClick={() => { setType(st.value); setParams(DEFAULT_PARAMS[st.value]) }}
                  className="text-left p-3 rounded-xl transition-all"
                  style={{
                    border:     `1px solid ${isSelected ? st.color : 'var(--c-border)'}`,
                    background: isSelected ? st.dim : 'var(--c-elevated)',
                    boxShadow:  isSelected ? `0 0 0 1px ${st.color}30` : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={13} style={{ color: isSelected ? st.color : 'var(--c-muted)', flexShrink: 0 }} />
                    <p className="text-xs font-semibold" style={{ color: isSelected ? st.color : 'var(--c-text)' }}>
                      {st.label}
                    </p>
                  </div>
                  <p className="text-[10.5px] leading-tight" style={{ color: 'var(--c-muted)' }}>{st.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 2: Params */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] mb-3">
            Step 2 — Parameters
          </p>
          <ParamFields type={type} params={params} onChange={setParams} />
        </div>

        {/* Step 3: Horizon */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] mb-3">
            Step 3 — Planning Horizon
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="field-label">Start Date</label>
              <Input type="date" value={horizonStart} onChange={(e) => setHorizonStart(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Days (1–14)</label>
              <Input type="number" min={1} max={14} value={horizonDays} onChange={(e) => setHorizonDays(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="field-label">Scenario Name (optional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${type.replace(/_/g, ' ')} run`} />
          </div>
        </div>

        <Button
          onClick={() => mut.mutate({
            name: name || `${type.replace(/_/g, ' ')} ${new Date().toLocaleDateString()}`,
            scenario_type: type, parameters: params,
            horizon_start: horizonStart, horizon_days: horizonDays,
          })}
          disabled={mut.isPending}
          className="w-full"
        >
          <Play size={14} />
          {mut.isPending ? 'Queuing…' : 'Run Scenario'}
        </Button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ScenariosPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: runs = [], isLoading } = useQuery({
    queryKey:       ['scenarios'],
    queryFn:        fetchScenarios,
    refetchInterval: 5000,
  })

  const deleteMut = useMutation({
    mutationFn: deleteScenario,
    onSuccess:  () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['scenarios'] }); setSelectedId(null) },
    onError:    () => toast.error('Failed to delete'),
  })

  useEffect(() => {
    if (runs.length > 0 && !selectedId && runs[0]) setSelectedId(runs[0].id)
  }, [runs, selectedId])

  const selectedRun = runs.find((r) => r.id === selectedId) ?? null

  return (
    <AppShell>
      <div className="p-7 flex flex-col gap-6" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--c-accent-dim)' }}>
            <Layers size={18} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--c-text)]">Scenario Simulator</h1>
            <p className="text-xs text-[var(--c-muted)]">Run multi-day "what-if" scenarios before committing to strategic decisions</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: wizard + run list */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            <Wizard onCreated={() => qc.invalidateQueries({ queryKey: ['scenarios'] })} />

            {/* Past runs */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)]">Past Runs</p>
                <button
                  onClick={() => qc.invalidateQueries({ queryKey: ['scenarios'] })}
                  className="text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
              <div className="p-3 space-y-2">
                {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                {!isLoading && runs.length === 0 && (
                  <EmptyState title="No scenarios yet" subtitle="Configure and run a scenario above." />
                )}
                {runs.map((run) => (
                  <RunCard
                    key={run.id}
                    run={run}
                    selected={run.id === selectedId}
                    onSelect={() => setSelectedId(run.id)}
                    onDelete={() => deleteMut.mutate(run.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: results */}
          <div className="col-span-12 lg:col-span-8">
            {!selectedRun ? (
              <div
                className="rounded-2xl flex flex-col items-center justify-center h-64 gap-4"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--c-elevated)' }}>
                  <Layers size={22} style={{ color: 'var(--c-muted)' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--c-text)] mb-1">No scenario selected</p>
                  <p className="text-xs text-[var(--c-muted)]">Run a scenario or select one from the list</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Breadcrumb */}
                <div
                  className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl"
                  style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
                >
                  <span className="font-semibold text-[var(--c-text)]">{selectedRun.name}</span>
                  <ChevronRight size={12} className="text-[var(--c-muted)]" />
                  <span className="text-[var(--c-muted)]">{selectedRun.scenario_type.replace(/_/g, ' ')}</span>
                  <ChevronRight size={12} className="text-[var(--c-muted)]" />
                  <span className="text-[var(--c-muted)]">{selectedRun.horizon_days} days from {selectedRun.horizon_start}</span>
                  <span
                    className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: statusColor(selectedRun.status), background: statusBg(selectedRun.status) }}
                  >
                    {selectedRun.status}
                  </span>
                </div>
                <ResultsPanel run={selectedRun} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
