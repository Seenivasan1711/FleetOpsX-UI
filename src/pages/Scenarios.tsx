import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Layers, Play, Trash2, RefreshCw, ChevronRight } from 'lucide-react'
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

const SCENARIO_TYPES: { value: ScenarioType; label: string; desc: string }[] = [
  { value: 'new_depot',           label: 'New Depot',           desc: 'Simulate adding a new depot location' },
  { value: 'ev_fleet_mix',        label: 'EV Fleet Mix',        desc: 'Model transitioning a % of fleet to electric vehicles' },
  { value: 'driver_count_change', label: 'Driver Count Change', desc: 'Add or remove drivers from the fleet' },
  { value: 'demand_surge',        label: 'Demand Surge',        desc: 'Apply a surge multiplier to a specific zone' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === 'COMPLETED') return 'var(--c-green)'
  if (s === 'RUNNING')   return 'var(--c-accent)'
  if (s === 'FAILED')    return 'var(--c-red)'
  return 'var(--c-muted)'
}

function pct(v: number) { return `${(v * 100).toFixed(1)}%` }
function delta(v: number) {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(3)}`
}
function deltaColor(v: number, higherIsBetter = true) {
  if (Math.abs(v) < 0.001) return 'var(--c-muted)'
  return (v > 0) === higherIsBetter ? 'var(--c-green)' : 'var(--c-red)'
}

// ─── Scenario wizard params ───────────────────────────────────────────────────

function ParamFields({
  type, params, onChange,
}: {
  type: ScenarioType
  params: Record<string, unknown>
  onChange: (p: Record<string, unknown>) => void
}) {
  const set = (key: string, val: unknown) => onChange({ ...params, [key]: val })

  if (type === 'new_depot') return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="field-label">Depot Name</label>
        <Input value={String(params.depot_name ?? '')} onChange={(e) => set('depot_name', e.target.value)} placeholder="Whitefield Hub" />
      </div>
      <div>
        <label className="field-label">Capacity</label>
        <Input type="number" value={String(params.capacity ?? 50)} onChange={(e) => set('capacity', Number(e.target.value))} />
      </div>
      <div>
        <label className="field-label">Latitude</label>
        <Input type="number" step="0.0001" value={String(params.lat ?? 12.9716)} onChange={(e) => set('lat', Number(e.target.value))} />
      </div>
      <div>
        <label className="field-label">Longitude</label>
        <Input type="number" step="0.0001" value={String(params.lng ?? 77.5946)} onChange={(e) => set('lng', Number(e.target.value))} />
      </div>
    </div>
  )

  if (type === 'ev_fleet_mix') return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="field-label">EV Fleet %</label>
        <Input type="number" min={0} max={100} value={String(params.ev_percentage ?? 30)} onChange={(e) => set('ev_percentage', Number(e.target.value))} />
      </div>
      <div>
        <label className="field-label">EV Range (km)</label>
        <Input type="number" value={String(params.ev_range_km ?? 200)} onChange={(e) => set('ev_range_km', Number(e.target.value))} />
      </div>
    </div>
  )

  if (type === 'driver_count_change') return (
    <div>
      <label className="field-label">Driver Delta (negative = remove)</label>
      <Input type="number" value={String(params.delta ?? -2)} onChange={(e) => set('delta', Number(e.target.value))} placeholder="-5 removes 5 drivers" />
    </div>
  )

  if (type === 'demand_surge') return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="field-label">Zone</label>
        <Input value={String(params.zone ?? '')} onChange={(e) => set('zone', e.target.value)} placeholder="e.g. Koramangala" />
      </div>
      <div>
        <label className="field-label">Surge Factor</label>
        <Input type="number" step="0.1" min={1} value={String(params.surge_factor ?? 1.4)} onChange={(e) => set('surge_factor', Number(e.target.value))} />
      </div>
    </div>
  )

  return null
}

// ─── Run card ─────────────────────────────────────────────────────────────────

function RunCard({
  run, onSelect, onDelete, selected,
}: {
  run: ScenarioRun
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="rounded-xl px-4 py-3 cursor-pointer transition-colors"
      style={{
        border:     `1px solid ${selected ? 'var(--c-accent)' : 'var(--c-border)'}`,
        background: selected ? 'var(--c-accent-dim)' : 'var(--c-surface)',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--c-muted)' }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--c-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--c-text)] truncate">{run.name}</p>
          <p className="text-xs text-[var(--c-muted)] mt-0.5">
            {run.scenario_type.replace(/_/g, ' ')} · {run.horizon_days}d from {run.horizon_start}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold" style={{ color: statusColor(run.status) }}>{run.status}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="transition-colors text-[var(--c-muted)] hover:text-[var(--c-red)]"
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
    queryFn: () => fetchScenarioResults(run.id),
    enabled: run.status === 'COMPLETED',
    refetchInterval: run.status === 'RUNNING' ? 3000 : false,
  })

  const { data: statusData } = useQuery({
    queryKey: ['scenario-status', run.id],
    queryFn: () => fetchScenarioStatus(run.id),
    enabled: run.status === 'QUEUED' || run.status === 'RUNNING',
    refetchInterval: 2000,
  })

  if (run.status === 'QUEUED' || run.status === 'RUNNING') {
    const progress = statusData?.progress ?? 0
    const total = statusData?.total ?? run.horizon_days
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-4">
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
        <p className="text-sm text-[var(--c-muted)]">
          {run.status === 'QUEUED' ? 'Queued…' : `Running — day ${progress} / ${total}`}
        </p>
        <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
          <div
            className="h-full transition-all rounded-full"
            style={{ width: `${total ? (progress / total) * 100 : 0}%`, background: 'var(--c-accent)' }}
          />
        </div>
      </div>
    )
  }

  if (run.status === 'FAILED') {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm" style={{ color: 'var(--c-red)' }}>Scenario run failed. Try again.</p>
      </div>
    )
  }

  if (isLoading || results.length === 0) {
    return <Skeleton className="h-64 rounded-2xl" />
  }

  const chartData = results.map((r: ScenarioResult) => ({
    date: r.plan_date,
    'On-Time (scenario)': Math.round(r.on_time_rate * 100),
    'On-Time (baseline)': Math.round((r.on_time_rate - (r.kpi_delta?.on_time_rate ?? 0)) * 100),
    'Fleet Util (scenario)': Math.round(r.fleet_utilization * 100),
  }))

  const avgDelta = (key: keyof NonNullable<ScenarioResult['kpi_delta']>) => {
    const vals = results.map((r) => r.kpi_delta?.[key] ?? 0)
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  return (
    <div className="space-y-5">
      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg On-Time Rate', key: 'on_time_rate',        higher: true,  fmt: (v: number) => pct(v) },
          { label: 'Avg Fleet Util',   key: 'fleet_utilization',   higher: true,  fmt: (v: number) => pct(v) },
          { label: 'Distance Δ (km)',  key: 'total_distance_km',   higher: false, fmt: (v: number) => v.toFixed(1) },
        ].map(({ label, key, higher, fmt }) => {
          const d = avgDelta(key as keyof NonNullable<ScenarioResult['kpi_delta']>)
          const lastResult = results[results.length - 1]
          const val = lastResult?.[key as keyof ScenarioResult] as number ?? 0
          return (
            <div
              key={key}
              className="rounded-2xl p-4"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
            >
              <p className="text-xs text-[var(--c-muted)] mb-1">{label}</p>
              <p className="text-lg font-bold text-[var(--c-text)]">{fmt(val)}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: deltaColor(d, higher) }}>
                {delta(d)} vs baseline
              </p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <p className="text-[10px] uppercase tracking-widest text-[var(--c-muted)] mb-4">
          On-Time Rate — Scenario vs Baseline (%)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--c-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--c-muted)' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', borderRadius: 8 }}
              labelStyle={{ color: 'var(--c-muted)', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--c-muted)' }} />
            <Line type="monotone" dataKey="On-Time (scenario)" stroke="var(--c-accent)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="On-Time (baseline)" stroke="var(--c-muted)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-day table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
              {['Date', 'Routes', 'Assigned', 'On-Time', 'Fleet Util', 'Distance km', 'On-Time Δ'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[var(--c-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r: ScenarioResult) => (
              <tr
                key={r.id}
                style={{ borderBottom: '1px solid var(--c-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <td className="px-4 py-2.5 text-[var(--c-text)]">{r.plan_date}</td>
                <td className="px-4 py-2.5 text-[var(--c-muted)]">{r.total_routes}</td>
                <td className="px-4 py-2.5 text-[var(--c-muted)]">{r.assigned_orders}</td>
                <td className="px-4 py-2.5 text-[var(--c-text)]">{pct(r.on_time_rate)}</td>
                <td className="px-4 py-2.5 text-[var(--c-text)]">{pct(r.fleet_utilization)}</td>
                <td className="px-4 py-2.5 text-[var(--c-muted)]">{r.total_distance_km.toFixed(1)}</td>
                <td className="px-4 py-2.5 font-semibold" style={{ color: deltaColor(r.kpi_delta?.on_time_rate ?? 0, true) }}>
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

// ─── Scenario wizard ──────────────────────────────────────────────────────────

const DEFAULT_PARAMS: Record<ScenarioType, Record<string, unknown>> = {
  new_depot:           { depot_name: 'New Hub', lat: 12.9716, lng: 77.5946, capacity: 50 },
  ev_fleet_mix:        { ev_percentage: 30, ev_range_km: 200 },
  driver_count_change: { delta: -2 },
  demand_surge:        { zone: '', surge_factor: 1.4 },
}

function Wizard({ onCreated }: { onCreated: () => void }) {
  const [type, setType] = useState<ScenarioType>('new_depot')
  const [params, setParams] = useState<Record<string, unknown>>(DEFAULT_PARAMS.new_depot)
  const [name, setName] = useState('')
  const [horizonStart, setHorizonStart] = useState(new Date().toISOString().slice(0, 10))
  const [horizonDays, setHorizonDays] = useState(7)

  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: (body: CreateScenarioBody) => createScenario(body),
    onSuccess: () => {
      toast.success('Scenario queued!')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
      onCreated()
    },
    onError: () => toast.error('Failed to create scenario'),
  })

  const handleTypeSelect = (t: ScenarioType) => {
    setType(t)
    setParams(DEFAULT_PARAMS[t])
  }

  const handleRun = () => {
    mut.mutate({
      name: name || `${type.replace(/_/g, ' ')} ${new Date().toLocaleDateString()}`,
      scenario_type: type,
      parameters: params,
      horizon_start: horizonStart,
      horizon_days: horizonDays,
    })
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      <h3 className="text-sm font-semibold text-[var(--c-text)]">New Scenario</h3>

      {/* Step 1: Type */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--c-muted)]">Step 1 — Scenario Type</p>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIO_TYPES.map((st) => (
            <button
              key={st.value}
              onClick={() => handleTypeSelect(st.value)}
              className="text-left p-3 rounded-xl transition-colors"
              style={{
                border:     `1px solid ${type === st.value ? 'var(--c-accent)' : 'var(--c-border)'}`,
                background: type === st.value ? 'var(--c-accent-dim)' : 'var(--c-elevated)',
                color:      type === st.value ? 'var(--c-accent)'     : 'var(--c-muted)',
              }}
            >
              <p className="text-xs font-semibold">{st.label}</p>
              <p className="text-[11px] mt-0.5 opacity-70">{st.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Params */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--c-muted)]">Step 2 — Parameters</p>
        <ParamFields type={type} params={params} onChange={setParams} />
      </div>

      {/* Step 3: Horizon */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--c-muted)]">Step 3 — Planning Horizon</p>
        <div className="grid grid-cols-2 gap-3">
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

      <Button onClick={handleRun} disabled={mut.isPending} className="w-full">
        <Play size={14} className="mr-2" />
        {mut.isPending ? 'Queuing…' : 'Run Scenario'}
      </Button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScenariosPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['scenarios'],
    queryFn: fetchScenarios,
    refetchInterval: 5000,
  })

  const deleteMut = useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      toast.success('Scenario deleted')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
      setSelectedId(null)
    },
    onError: () => toast.error('Failed to delete scenario'),
  })

  useEffect(() => {
    if (runs.length > 0 && !selectedId && runs[0]) {
      setSelectedId(runs[0].id)
    }
  }, [runs, selectedId])

  const selectedRun = runs.find((r) => r.id === selectedId) ?? null

  return (
    <AppShell>
      <div className="p-6 space-y-5" style={{ maxWidth: 1280, animation: 'page-slide-in 0.22s ease' }}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <Layers size={20} style={{ color: 'var(--c-accent)' }} />
          <div>
            <h1 className="text-lg font-bold text-[var(--c-text)]">Scenario Simulator</h1>
            <p className="text-xs text-[var(--c-muted)]">Run multi-day "what-if" scenarios before committing to strategic decisions</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Left: wizard + run list */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Wizard onCreated={() => qc.invalidateQueries({ queryKey: ['scenarios'] })} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-[var(--c-muted)]">Past Runs</p>
                <button
                  onClick={() => qc.invalidateQueries({ queryKey: ['scenarios'] })}
                  className="transition-colors text-[var(--c-muted)] hover:text-[var(--c-text)]"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              )}

              {!isLoading && runs.length === 0 && (
                <EmptyState title="No scenarios yet" subtitle="Configure a scenario above and click Run." />
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

          {/* Right: results */}
          <div className="col-span-12 lg:col-span-8">
            {!selectedRun ? (
              <div className="flex flex-col items-center justify-center h-72 gap-3 text-[var(--c-muted)]">
                <Layers size={36} style={{ opacity: 0.4 }} />
                <p className="text-sm">Select a scenario run to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-[var(--c-muted)]">
                  <span className="text-[var(--c-text)] font-semibold">{selectedRun.name}</span>
                  <ChevronRight size={14} />
                  <span>{selectedRun.scenario_type.replace(/_/g, ' ')}</span>
                  <ChevronRight size={14} />
                  <span>{selectedRun.horizon_days} days from {selectedRun.horizon_start}</span>
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
