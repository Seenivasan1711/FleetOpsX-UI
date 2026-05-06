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
  if (s === 'COMPLETED') return 'text-emerald-400'
  if (s === 'RUNNING')   return 'text-sky-400'
  if (s === 'FAILED')    return 'text-rose-400'
  return 'text-zinc-500'
}

function pct(v: number) { return `${(v * 100).toFixed(1)}%` }
function delta(v: number) {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(3)}`
}
function deltaColor(v: number, higherIsBetter = true) {
  if (Math.abs(v) < 0.001) return 'text-zinc-400'
  return (v > 0) === higherIsBetter ? 'text-emerald-400' : 'text-rose-400'
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
        <Input value={String(params.depot_name ?? '')} onChange={(e) => set('depot_name', e.target.value)} className="mt-1" placeholder="Whitefield Hub" />
      </div>
      <div>
        <label className="field-label">Capacity</label>
        <Input type="number" value={String(params.capacity ?? 50)} onChange={(e) => set('capacity', Number(e.target.value))} className="mt-1" />
      </div>
      <div>
        <label className="field-label">Latitude</label>
        <Input type="number" step="0.0001" value={String(params.lat ?? 12.9716)} onChange={(e) => set('lat', Number(e.target.value))} className="mt-1" />
      </div>
      <div>
        <label className="field-label">Longitude</label>
        <Input type="number" step="0.0001" value={String(params.lng ?? 77.5946)} onChange={(e) => set('lng', Number(e.target.value))} className="mt-1" />
      </div>
    </div>
  )

  if (type === 'ev_fleet_mix') return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="field-label">EV Fleet % </label>
        <Input type="number" min={0} max={100} value={String(params.ev_percentage ?? 30)} onChange={(e) => set('ev_percentage', Number(e.target.value))} className="mt-1" />
      </div>
      <div>
        <label className="field-label">EV Range (km)</label>
        <Input type="number" value={String(params.ev_range_km ?? 200)} onChange={(e) => set('ev_range_km', Number(e.target.value))} className="mt-1" />
      </div>
    </div>
  )

  if (type === 'driver_count_change') return (
    <div>
      <label className="field-label">Driver Delta (negative = remove)</label>
      <Input type="number" value={String(params.delta ?? -2)} onChange={(e) => set('delta', Number(e.target.value))} className="mt-1" placeholder="-5 removes 5 drivers" />
    </div>
  )

  if (type === 'demand_surge') return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="field-label">Zone</label>
        <Input value={String(params.zone ?? '')} onChange={(e) => set('zone', e.target.value)} className="mt-1" placeholder="e.g. Koramangala" />
      </div>
      <div>
        <label className="field-label">Surge Factor</label>
        <Input type="number" step="0.1" min={1} value={String(params.surge_factor ?? 1.4)} onChange={(e) => set('surge_factor', Number(e.target.value))} className="mt-1" />
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
      className={`border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
        selected
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-zinc-800 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{run.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {run.scenario_type.replace(/_/g, ' ')} · {run.horizon_days}d from {run.horizon_start}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold ${statusColor(run.status)}`}>{run.status}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-zinc-600 hover:text-rose-400 transition-colors"
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
        <RefreshCw size={24} className="text-indigo-400 animate-spin" />
        <p className="text-sm text-zinc-400">
          {run.status === 'QUEUED' ? 'Queued…' : `Running — day ${progress} / ${total}`}
        </p>
        <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
          />
        </div>
      </div>
    )
  }

  if (run.status === 'FAILED') {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-rose-400">Scenario run failed. Try again.</p>
      </div>
    )
  }

  if (isLoading || results.length === 0) {
    return <Skeleton className="h-64 rounded-xl" />
  }

  // Build chart data — scenario vs baseline
  const chartData = results.map((r: ScenarioResult) => ({
    date: r.plan_date,
    'On-Time (scenario)': Math.round(r.on_time_rate * 100),
    'On-Time (baseline)': Math.round((r.on_time_rate - (r.kpi_delta?.on_time_rate ?? 0)) * 100),
    'Fleet Util (scenario)': Math.round(r.fleet_utilization * 100),
  }))

  // Summary KPI delta row
  const avgDelta = (key: keyof NonNullable<ScenarioResult['kpi_delta']>) => {
    const vals = results.map((r) => r.kpi_delta?.[key] ?? 0)
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg On-Time Rate', key: 'on_time_rate', higher: true, fmt: (v: number) => pct(v) },
          { label: 'Avg Fleet Util',   key: 'fleet_utilization', higher: true, fmt: (v: number) => pct(v) },
          { label: 'Distance Δ (km)',  key: 'total_distance_km', higher: false, fmt: (v: number) => v.toFixed(1) },
        ].map(({ label, key, higher, fmt }) => {
          const d = avgDelta(key as keyof NonNullable<ScenarioResult['kpi_delta']>)
          const lastResult = results[results.length - 1]
          const val = lastResult?.[key as keyof ScenarioResult] as number ?? 0
          return (
            <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className="text-lg font-bold text-zinc-100">{fmt(val)}</p>
              <p className={`text-xs font-semibold mt-0.5 ${deltaColor(d, higher)}`}>
                {delta(d)} vs baseline
              </p>
            </div>
          )
        })}
      </div>

      {/* Recharts line chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">On-Time Rate — Scenario vs Baseline (%)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} />
            <YAxis tick={{ fontSize: 11, fill: '#71717a' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
              labelStyle={{ color: '#a1a1aa', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} />
            <Line type="monotone" dataKey="On-Time (scenario)" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="On-Time (baseline)" stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-day table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
              {['Date', 'Routes', 'Assigned', 'On-Time', 'Fleet Util', 'Distance km', 'On-Time Δ'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r: ScenarioResult) => (
              <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-2 text-zinc-300">{r.plan_date}</td>
                <td className="px-4 py-2 text-zinc-400">{r.total_routes}</td>
                <td className="px-4 py-2 text-zinc-400">{r.assigned_orders}</td>
                <td className="px-4 py-2 text-zinc-300">{pct(r.on_time_rate)}</td>
                <td className="px-4 py-2 text-zinc-300">{pct(r.fleet_utilization)}</td>
                <td className="px-4 py-2 text-zinc-400">{r.total_distance_km.toFixed(1)}</td>
                <td className={`px-4 py-2 font-semibold ${deltaColor(r.kpi_delta?.on_time_rate ?? 0, true)}`}>
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
  const [step, setStep] = useState(1)
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <h3 className="text-sm font-semibold text-zinc-100">New Scenario</h3>

      {/* Step 1: Type */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Step 1 — Scenario Type</p>
        <div className="grid grid-cols-2 gap-2">
          {SCENARIO_TYPES.map((st) => (
            <button
              key={st.value}
              onClick={() => handleTypeSelect(st.value)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                type === st.value
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <p className="text-xs font-semibold">{st.label}</p>
              <p className="text-[11px] mt-0.5 opacity-70">{st.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Params */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Step 2 — Parameters</p>
        <ParamFields type={type} params={params} onChange={setParams} />
      </div>

      {/* Step 3: Horizon */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-widest">Step 3 — Planning Horizon</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Start Date</label>
            <Input type="date" value={horizonStart} onChange={(e) => setHorizonStart(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="field-label">Days (1–14)</label>
            <Input type="number" min={1} max={14} value={horizonDays} onChange={(e) => setHorizonDays(Number(e.target.value))} className="mt-1" />
          </div>
        </div>
        <div>
          <label className="field-label">Scenario Name (optional)</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${type.replace(/_/g, ' ')} run`} className="mt-1" />
        </div>
      </div>

      <Button
        onClick={handleRun}
        disabled={mut.isPending}
        className="w-full"
      >
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

  // Auto-select latest run
  useEffect(() => {
    if (runs.length > 0 && !selectedId && runs[0]) {
      setSelectedId(runs[0].id)
    }
  }, [runs, selectedId])

  const selectedRun = runs.find((r) => r.id === selectedId) ?? null

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Layers size={22} className="text-violet-400" />
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Scenario Simulator</h1>
            <p className="text-xs text-zinc-500">Run multi-day "what-if" scenarios before committing to strategic decisions</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: wizard + run list */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Wizard onCreated={() => qc.invalidateQueries({ queryKey: ['scenarios'] })} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Past Runs</p>
                <button onClick={() => qc.invalidateQueries({ queryKey: ['scenarios'] })} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <RefreshCw size={13} />
                </button>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              )}

              {!isLoading && runs.length === 0 && (
                <EmptyState
                  title="No scenarios yet"
                  subtitle="Configure a scenario above and click Run."
                />
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
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600 gap-2">
                <Layers size={32} />
                <p className="text-sm">Select a scenario run to see results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="text-zinc-100 font-semibold">{selectedRun.name}</span>
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
