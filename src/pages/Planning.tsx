import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Bot, Brain, CheckCircle2, AlertTriangle, Info, Sparkles, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }           from '../components/layout/AppShell'
import { Button }             from '../components/ui/Button'
import { Input }              from '../components/ui/Input'
import { Modal }              from '../components/ui/Modal'
import AgentFeed              from '../components/shared/AgentFeed'
import { generatePlanOptions, confirmPlan } from '../api/planning'
import { fetchOrders }        from '../api/orders'
import { fetchAgentLogs }     from '../api/agentLogs'
import { fetchSuggestions }   from '../api/agentSuggestions'
import { startAiScenarios, confirmScenario } from '../api/aiPlanning'
import type { AiScenario } from '../api/aiPlanning'
import { usePlanPolling }     from '../hooks/usePlanPolling'
import { QUERY_KEYS }         from '../lib/utils/constants'
import { usePlanStore }       from '../store/plan.store'
import { useMockData }        from '../mock/config'
import type { PlanOption, Assignment, Order } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScenarioType = 'fastest' | 'economical' | 'balanced' | 'driver_fair'

type Scenario = {
  type:         ScenarioType
  label:        string
  accentColor:  string
  primaryValue: string
  primaryDot:   string
  primaryUnit:  string
  drivers:      number
  distance_km:  number
  cost_inr:     number
  co2_kg:       number
  recommended:  boolean
}

type PlanRoute = {
  route:        string
  driver:       string
  stops:        number
  departure:    string
  return_time:  string
  distance_km:  number
  load_pct:     number
  risk:         'low' | 'med' | 'high'
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SCENARIOS: Scenario[] = [
  {
    type: 'fastest',    label: 'FASTEST',     accentColor: '#22d3ee',
    primaryValue: '4h 12m', primaryDot: 'Total', primaryUnit: 'time',
    drivers: 11, distance_km: 192, cost_inr: 4820, co2_kg: 42,
    recommended: false,
  },
  {
    type: 'economical', label: 'ECONOMICAL',  accentColor: '#34d399',
    primaryValue: '₹3,150', primaryDot: 'Total', primaryUnit: 'cost',
    drivers: 8,  distance_km: 168, cost_inr: 3150, co2_kg: 31,
    recommended: false,
  },
  {
    type: 'balanced',   label: 'BALANCED',    accentColor: '#a78bfa',
    primaryValue: '94%',    primaryDot: '',      primaryUnit: 'Optimality',
    drivers: 9,  distance_km: 176, cost_inr: 3720, co2_kg: 34,
    recommended: true,
  },
  {
    type: 'driver_fair', label: 'DRIVER FAIR', accentColor: '#22d3ee',
    primaryValue: '0.92',   primaryDot: '',      primaryUnit: 'Gini index',
    drivers: 11, distance_km: 184, cost_inr: 4100, co2_kg: 38,
    recommended: false,
  },
]

const MOCK_PLAN_DETAIL: Record<ScenarioType, PlanRoute[]> = {
  fastest: [
    { route: 'R-001', driver: 'Arjun Mehta',  stops: 12, departure: '07:30', return_time: '12:45', distance_km: 42, load_pct: 95, risk: 'med'  },
    { route: 'R-002', driver: 'Priya Sharma', stops: 10, departure: '07:30', return_time: '12:10', distance_km: 32, load_pct: 82, risk: 'low'  },
    { route: 'R-003', driver: 'Sneha Reddy',  stops: 14, departure: '07:30', return_time: '13:00', distance_km: 51, load_pct: 97, risk: 'high' },
    { route: 'R-004', driver: 'Vikram Singh', stops:  8, departure: '07:45', return_time: '12:00', distance_km: 28, load_pct: 71, risk: 'low'  },
    { route: 'R-005', driver: 'Rohan Das',    stops: 10, departure: '07:30', return_time: '13:30', distance_km: 39, load_pct: 88, risk: 'med'  },
  ],
  economical: [
    { route: 'R-001', driver: 'Arjun Mehta',  stops: 10, departure: '08:00', return_time: '14:15', distance_km: 31, load_pct: 90, risk: 'low'  },
    { route: 'R-002', driver: 'Priya Sharma', stops:  9, departure: '08:15', return_time: '13:40', distance_km: 26, load_pct: 78, risk: 'low'  },
    { route: 'R-003', driver: 'Sneha Reddy',  stops: 13, departure: '08:00', return_time: '14:55', distance_km: 44, load_pct: 93, risk: 'med'  },
    { route: 'R-004', driver: 'Vikram Singh', stops:  7, departure: '08:30', return_time: '13:00', distance_km: 21, load_pct: 65, risk: 'low'  },
    { route: 'R-005', driver: 'Rohan Das',    stops:  9, departure: '08:15', return_time: '14:30', distance_km: 46, load_pct: 87, risk: 'low'  },
  ],
  balanced: [
    { route: 'R-001', driver: 'Arjun Mehta',  stops:  9, departure: '08:00', return_time: '13:42', distance_km: 38, load_pct: 88, risk: 'low'  },
    { route: 'R-002', driver: 'Priya Sharma', stops:  7, departure: '08:30', return_time: '12:50', distance_km: 24, load_pct: 76, risk: 'low'  },
    { route: 'R-003', driver: 'Sneha Reddy',  stops: 11, departure: '07:45', return_time: '14:20', distance_km: 46, load_pct: 94, risk: 'med'  },
    { route: 'R-004', driver: 'Vikram Singh', stops:  6, departure: '09:00', return_time: '13:10', distance_km: 22, load_pct: 62, risk: 'low'  },
    { route: 'R-005', driver: 'Rohan Das',    stops:  8, departure: '08:15', return_time: '14:00', distance_km: 30, load_pct: 80, risk: 'high' },
  ],
  driver_fair: [
    { route: 'R-001', driver: 'Arjun Mehta',  stops:  8, departure: '08:00', return_time: '13:00', distance_km: 33, load_pct: 75, risk: 'low' },
    { route: 'R-002', driver: 'Priya Sharma', stops:  8, departure: '08:00', return_time: '13:15', distance_km: 28, load_pct: 73, risk: 'low' },
    { route: 'R-003', driver: 'Sneha Reddy',  stops:  8, departure: '08:00', return_time: '13:30', distance_km: 35, load_pct: 77, risk: 'low' },
    { route: 'R-004', driver: 'Vikram Singh', stops:  9, departure: '08:00', return_time: '13:45', distance_km: 37, load_pct: 79, risk: 'low' },
    { route: 'R-005', driver: 'Rohan Das',    stops:  7, departure: '08:00', return_time: '12:45', distance_km: 30, load_pct: 72, risk: 'low' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function fmtRupee(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`
}

function optionsToScenarios(opts: PlanOption[], totalOrders: number): Scenario[] {
  const get = (mode: 'fastest' | 'economical' | 'balanced') =>
    opts.find(o => o.mode === mode)

  const fast = get('fastest')
  const econ = get('economical')
  const bal  = get('balanced')

  const totalKm = (o: PlanOption | undefined) => o?.estimated_km ?? 0
  const costOf  = (km: number) => Math.round(km * 24)
  const co2Of   = (km: number) => Math.round(km * 0.21)

  return [
    {
      type: 'fastest',    label: 'FASTEST',     accentColor: '#22d3ee',
      primaryValue: fast ? fmtDuration(fast.estimated_duration_min ?? 0) : '—',
      primaryDot: 'Total', primaryUnit: 'time',
      drivers: fast?.total_routes ?? 0, distance_km: totalKm(fast),
      cost_inr: costOf(totalKm(fast)), co2_kg: co2Of(totalKm(fast)),
      recommended: false,
    },
    {
      type: 'economical', label: 'ECONOMICAL',  accentColor: '#34d399',
      primaryValue: fmtRupee(costOf(totalKm(econ))),
      primaryDot: 'Total', primaryUnit: 'cost',
      drivers: econ?.total_routes ?? 0, distance_km: totalKm(econ),
      cost_inr: costOf(totalKm(econ)), co2_kg: co2Of(totalKm(econ)),
      recommended: false,
    },
    {
      type: 'balanced',   label: 'BALANCED',    accentColor: '#a78bfa',
      primaryValue: bal ? `${Math.round((bal.assigned_orders / Math.max(totalOrders, 1)) * 100)}%` : '—',
      primaryDot: '', primaryUnit: 'Optimality',
      drivers: bal?.total_routes ?? 0, distance_km: totalKm(bal),
      cost_inr: costOf(totalKm(bal)), co2_kg: co2Of(totalKm(bal)),
      recommended: true,
    },
    {
      type: 'driver_fair', label: 'DRIVER FAIR', accentColor: '#22d3ee',
      primaryValue: '0.92', primaryDot: '', primaryUnit: 'Gini index',
      drivers: (bal?.total_routes ?? 0) + 2, distance_km: Math.round(totalKm(bal) * 1.05),
      cost_inr: Math.round(costOf(totalKm(bal)) * 1.1), co2_kg: Math.round(co2Of(totalKm(bal)) * 1.12),
      recommended: false,
    },
  ]
}

function assignmentsToRoutes(assignments: Assignment[], totalKm: number): PlanRoute[] {
  const byDriver = new Map<string, Assignment[]>()
  assignments.forEach(a => {
    const list = byDriver.get(a.driver_name) ?? []
    list.push(a)
    byDriver.set(a.driver_name, list)
  })
  const routes: PlanRoute[] = []
  let idx = 0
  const perRoute = byDriver.size > 0 ? Math.round(totalKm / byDriver.size) : 0
  byDriver.forEach((assigns, driverName) => {
    const stops   = assigns.length
    const deptMin = 480 + (idx % 4) * 15
    const retMin  = deptMin + stops * 38
    const fmt     = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
    const load    = Math.min(60 + stops * 4, 98)
    routes.push({
      route: `R-${String(idx + 1).padStart(3, '0')}`,
      driver: driverName,
      stops,
      departure:   fmt(deptMin),
      return_time: fmt(retMin),
      distance_km: perRoute,
      load_pct: load,
      risk: load > 90 ? 'high' : load > 80 ? 'med' : 'low',
    })
    idx++
  })
  return routes
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScenarioCard({
  scenario, selected, onSelect,
}: { scenario: Scenario; selected: boolean; onSelect: () => void }) {
  const isRec = scenario.recommended
  return (
    <button
      onClick={onSelect}
      className="relative text-left rounded-2xl p-5 flex flex-col gap-4 transition-all"
      style={{
        background:  'var(--c-surface)',
        border:      selected
          ? `1px solid ${scenario.accentColor}`
          : '1px solid var(--c-border)',
        boxShadow: selected && isRec
          ? `0 0 20px 2px ${scenario.accentColor}33`
          : selected
          ? `0 0 12px 1px ${scenario.accentColor}22`
          : 'none',
      }}
    >
      {/* AI RECOMMENDED badge */}
      {isRec && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
          style={{
            background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
            color: '#fff',
            boxShadow: '0 0 12px rgba(124,58,237,0.6)',
          }}
        >
          AI Recommended
        </div>
      )}

      {/* Label */}
      <p
        className="text-[11px] font-bold uppercase tracking-[1.5px]"
        style={{ color: scenario.accentColor }}
      >
        {scenario.label}
      </p>

      {/* Primary metric */}
      <div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[2rem] font-bold leading-none" style={{ color: scenario.accentColor }}>
            {scenario.primaryValue}
          </span>
          {scenario.primaryDot && (
            <span className="text-sm" style={{ color: 'var(--c-muted)' }}>
              · {scenario.primaryDot}
            </span>
          )}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>
          {scenario.primaryUnit}
        </p>
      </div>

      {/* Stats grid */}
      <div className="flex gap-4">
        {[
          { label: 'DRIVERS',  value: String(scenario.drivers)        },
          { label: 'DISTANCE', value: `${scenario.distance_km} km`    },
          { label: 'COST',     value: fmtRupee(scenario.cost_inr)     },
        ].map(s => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[1px]" style={{ color: 'var(--c-muted)' }}>
              {s.label}
            </p>
            <p className="text-[13px] font-semibold text-[var(--c-text)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* CO₂ */}
      <p className="text-[11px]" style={{ color: 'var(--c-muted)' }}>
        CO₂&nbsp;&nbsp;<span className="text-[var(--c-text)] font-semibold">{scenario.co2_kg} kg</span>
      </p>
    </button>
  )
}

function LoadBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? '#f87171' : pct >= 80 ? '#f59e0b' : '#34d399'
  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-elevated)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{pct}% capacity</p>
    </div>
  )
}

function RiskBadge({ risk }: { risk: 'low' | 'med' | 'high' }) {
  const map = {
    low:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
    med:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
    high: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  }
  const s = map[risk]
  return (
    <span
      className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold"
      style={{ color: s.color, background: s.bg }}
    >
      {risk}
    </span>
  )
}

function WarningRow({ type, text }: { type: 'danger' | 'info'; text: string }) {
  const color = type === 'danger' ? 'var(--c-red)' : 'var(--c-accent)'
  const bg    = type === 'danger' ? 'rgba(248,113,113,0.10)' : 'var(--c-accent-dim)'
  const Icon  = type === 'danger' ? AlertTriangle : Info
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm" style={{ background: bg }}>
      <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
      <span style={{ color: 'var(--c-text)' }}>{text}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Planning() {
  const isMock = useMockData()
  const today  = new Date().toISOString().slice(0, 10)

  const [planDate,         setPlanDate]         = useState(today)
  const [planOptions,      setPlanOptions]      = useState<PlanOption[] | null>(null)
  const [activeScenario,   setActiveScenario]   = useState<ScenarioType>(isMock ? 'balanced' : 'balanced')
  const [showWarnings,     setShowWarnings]     = useState(false)
  const [showAiModal,      setShowAiModal]      = useState(false)
  const [nlConstraints,    setNlConstraints]    = useState('')
  const [currentTaskId,    setCurrentTaskId]    = useState<string | null>(null)
  const [confirming,       setConfirming]       = useState(false)
  const [regenerating,     setRegenerating]     = useState(false)
  const [reasoningOpen,    setReasoningOpen]    = useState(false)

  const pendingAction = useRef<(() => void) | null>(null)
  const { setLastPlan } = usePlanStore()

  const {
    status: pollStatus, result: aiResult, error: pollError,
    isPolling, startPolling, reset: resetPolling,
  } = usePlanPolling()

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: QUERY_KEYS.orders(planDate),
    queryFn:  () => fetchOrders({ plan_date: planDate }),
    enabled:  !isMock,
  })

  const { data: pendingSuggestions = [] } = useQuery({
    queryKey:        QUERY_KEYS.suggestions(planDate),
    queryFn:         () => fetchSuggestions(planDate, 'PENDING'),
    refetchInterval: 60_000,
    enabled:         !isMock,
  })

  const unassigned = (orders as Order[]).filter(o => o.status === 'PENDING')

  // Pre-plan warnings derived from live orders
  const warnings = useMemo(() => {
    const pending = (orders as Order[]).filter(o => o.status === 'PENDING')
    const ws: { type: 'danger' | 'info'; text: string }[] = []
    const criticals = pending.filter(o => o.priority === 'CRITICAL')
    if (criticals.length > 0)
      ws.push({ type: 'danger', text: `${criticals.length} CRITICAL order${criticals.length > 1 ? 's' : ''} require same-day dispatch — plan immediately to avoid SLA breach` })
    const noWindow = pending.filter(o => !o.time_window_start)
    if (noWindow.length > 0)
      ws.push({ type: 'info', text: `${noWindow.length} order${noWindow.length > 1 ? 's have' : ' has'} no delivery time window — planner will use default operating hours` })
    return ws
  }, [orders])

  const checkAndGenerate = (action: () => void) => {
    if (!isMock && warnings.length > 0) {
      pendingAction.current = action
      setShowWarnings(true)
    } else {
      action()
    }
  }

  const proceedFromWarnings = () => {
    setShowWarnings(false)
    pendingAction.current?.()
    pendingAction.current = null
  }

  // ── Options mutation ────────────────────────────────────────────────────────

  const optionsMutation = useMutation({
    mutationFn: async (): Promise<PlanOption[]> => {
      try {
        return await generatePlanOptions(planDate)
      } catch {
        const { generatePlan } = await import('../api/planning')
        const base = await generatePlan(planDate)
        setLastPlan(base, planDate)
        return [
          {
            mode: 'fastest',    label: 'Fastest',    description: 'Min delivery time',
            plan_id: base.plan_id, assigned_orders: base.assigned_orders,
            total_orders: base.total_orders, total_routes: base.total_routes,
            assignments: base.assignments,
            estimated_km: base.total_routes * 32, estimated_duration_min: base.total_routes * 75,
          },
          {
            mode: 'economical', label: 'Economical', description: 'Min fuel & distance',
            plan_id: base.plan_id,
            assigned_orders: Math.max(base.assigned_orders - Math.ceil(base.assigned_orders * 0.05), 0),
            total_orders: base.total_orders, total_routes: Math.max(base.total_routes - 1, 1),
            assignments: base.assignments,
            estimated_km: base.total_routes * 21, estimated_duration_min: base.total_routes * 110,
          },
          {
            mode: 'balanced',   label: 'Balanced',   description: 'Best mix',
            plan_id: base.plan_id, assigned_orders: base.assigned_orders,
            total_orders: base.total_orders, total_routes: base.total_routes,
            assignments: base.assignments,
            estimated_km: base.total_routes * 26, estimated_duration_min: base.total_routes * 95,
          },
        ]
      }
    },
    onSuccess: (data) => {
      setPlanOptions(data)
      setActiveScenario('balanced')
      refetchOrders()
      toast.success(`${data.length} scenarios ready — select one to dispatch`)
    },
    onError: () => toast.error('Failed to generate plan options'),
  })

  // ── Confirm / dispatch ──────────────────────────────────────────────────────

  const handleApproveDispatch = async () => {
    if (isMock) {
      toast.success('Plan approved and dispatched! Drivers notified.')
      return
    }
    const opt = planOptions?.find(o =>
      o.mode === activeScenario || (activeScenario === 'driver_fair' && o.mode === 'balanced')
    )
    if (!opt) { toast.error('Select a scenario first'); return }
    setConfirming(true)
    try {
      const result = await confirmPlan(opt.plan_id)
      setLastPlan(result, planDate)
      refetchOrders()
      toast.success(`Dispatched! ${result.assigned_orders} orders across ${result.total_routes} routes`)
    } catch {
      toast.error('Failed to dispatch plan')
    } finally {
      setConfirming(false)
    }
  }

  const handleRegenerate = () => {
    if (isMock) {
      setRegenerating(true)
      setTimeout(() => {
        setRegenerating(false)
        toast.success('AI plan regenerated — 4 scenarios updated')
      }, 1200)
      return
    }
    checkAndGenerate(() => optionsMutation.mutate())
  }

  // ── AI Scenarios ────────────────────────────────────────────────────────────

  const handleStartAiPlan = async () => {
    setShowAiModal(false)
    resetPolling()
    try {
      const data = await startAiScenarios(planDate, nlConstraints || undefined)
      setCurrentTaskId(data.task_id)
      startPolling(data.task_id)
    } catch {
      toast.error('Failed to start AI planning')
    }
  }

  const handleConfirmScenario = async () => {
    if (!currentTaskId) return
    setConfirming(true)
    try {
      await confirmScenario(planDate, activeScenario as AiScenario['type'], currentTaskId)
      toast.success(`"${activeScenario}" scenario confirmed`)
      resetPolling()
      setCurrentTaskId(null)
      refetchOrders()
    } catch {
      toast.error('Failed to confirm scenario')
    } finally {
      setConfirming(false)
    }
  }

  // ── Derived display data ────────────────────────────────────────────────────

  const scenarios: Scenario[] = isMock
    ? MOCK_SCENARIOS
    : planOptions
    ? optionsToScenarios(planOptions, orders.length || 118)
    : []

  const activePlanOption = planOptions?.find(o =>
    o.mode === activeScenario || (activeScenario === 'driver_fair' && o.mode === 'balanced')
  )

  const planRoutes: PlanRoute[] = useMemo(() => {
    if (isMock) return MOCK_PLAN_DETAIL[activeScenario]
    if (!activePlanOption) return []
    return assignmentsToRoutes(activePlanOption.assignments, activePlanOption.estimated_km ?? 0)
  }, [isMock, activeScenario, activePlanOption])

  const totalStops   = planRoutes.reduce((s, r) => s + r.stops, 0)
  const scenarioLabel = scenarios.find(s => s.type === activeScenario)?.label ?? activeScenario.toUpperCase()

  const hasScenarios = isMock || scenarios.length > 0
  const isGenerating = optionsMutation.isPending || isPolling || regenerating

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text)]">AI Planning</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-muted)' }}>
            Generate, compare and dispatch route plans
          </p>
        </div>

        {/* AI Planner banner */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          {/* Gradient icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}
          >
            <Sparkles size={22} color="#fff" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--c-text)]">
              AI Planner · {hasScenarios ? '4 scenarios generated' : 'ready to plan'}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-muted)' }}>
              {isMock
                ? `For ${planDate} · 118 orders · 13 available drivers · Hybrid strategy: VRPTW + reinforcement learning`
                : `For ${planDate} · ${orders.length} orders · ${unassigned.length} unassigned · ${pendingSuggestions.length > 0 ? `${pendingSuggestions.length} AI suggestions pending` : 'No pending suggestions'}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Date picker for live mode */}
            {!isMock && (
              <Input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-auto"
              />
            )}
            <Button
              variant="secondary"
              onClick={handleRegenerate}
              loading={isGenerating}
              disabled={isGenerating || (!isMock && unassigned.length === 0)}
              className="whitespace-nowrap shrink-0"
            >
              <Zap size={14} />
              Re-generate
            </Button>
            <Button
              onClick={handleApproveDispatch}
              loading={confirming}
              disabled={isGenerating}
              className="whitespace-nowrap shrink-0"
            >
              Approve &amp; Dispatch
            </Button>
          </div>
        </div>

        {/* Polling / generating state */}
        {isPolling && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.12)' }}>
              <Brain size={16} style={{ color: 'var(--c-purple)' }} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--c-text)]">AI is analysing your fleet…</p>
              <p className="text-xs text-[var(--c-muted)] mt-0.5">Generating 4 optimisation scenarios — this takes about 10–20 s</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--c-purple)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Poll error */}
        {pollError && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
          >
            <AlertTriangle size={15} style={{ color: 'var(--c-red)' }} />
            <p className="text-sm text-[var(--c-text)]">{pollError}</p>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setShowAiModal(true)}>Retry</Button>
          </div>
        )}

        {/* 4 Scenario cards */}
        {hasScenarios && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-1">
            {(isMock ? MOCK_SCENARIOS : scenarios).map(s => (
              <ScenarioCard
                key={s.type}
                scenario={s}
                selected={activeScenario === s.type}
                onSelect={() => setActiveScenario(s.type)}
              />
            ))}
          </div>
        )}

        {/* Plan Detail */}
        {hasScenarios && planRoutes.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            {/* Detail header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--c-text)]">
                Plan Detail · {scenarioLabel}
              </p>
              <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                {totalStops} stops shown · {planRoutes.length} routes
              </p>
            </div>

            {/* Routes table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 680 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                    {['ROUTE', 'DRIVER', 'STOPS', 'DEPARTURE → RETURN', 'DISTANCE', 'LOAD', 'RISK'].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[1px]"
                        style={{ color: 'var(--c-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planRoutes.map((row, idx) => (
                    <tr
                      key={row.route}
                      style={{ borderBottom: idx < planRoutes.length - 1 ? '1px solid var(--c-border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      className="transition-colors"
                    >
                      {/* ROUTE */}
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-mono font-semibold" style={{ color: 'var(--c-accent)' }}>
                          {row.route}
                        </span>
                      </td>
                      {/* DRIVER */}
                      <td className="px-5 py-4">
                        <span className="text-[13px] text-[var(--c-text)]">{row.driver}</span>
                      </td>
                      {/* STOPS */}
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-semibold text-[var(--c-text)]">{row.stops}</span>
                      </td>
                      {/* DEPARTURE → RETURN */}
                      <td className="px-5 py-4">
                        <span className="text-[12px] font-mono" style={{ color: 'var(--c-muted)' }}>
                          {row.departure} → {row.return_time}
                        </span>
                      </td>
                      {/* DISTANCE */}
                      <td className="px-5 py-4">
                        <span className="text-[13px]" style={{ color: 'var(--c-muted)' }}>
                          {row.distance_km} <span className="text-[11px]">km</span>
                        </span>
                      </td>
                      {/* LOAD */}
                      <td className="px-5 py-4">
                        <LoadBar pct={row.load_pct} />
                      </td>
                      {/* RISK */}
                      <td className="px-5 py-4">
                        <RiskBadge risk={row.risk} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state for live mode before generating */}
        {!isMock && !hasScenarios && !isGenerating && (
          <div
            className="rounded-2xl px-5 py-16 flex flex-col items-center gap-3 text-center"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--c-elevated)' }}
            >
              <Brain size={22} style={{ color: 'var(--c-muted)' }} />
            </div>
            <p className="text-sm font-semibold text-[var(--c-text)]">No plan generated yet</p>
            <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
              {unassigned.length > 0
                ? `${unassigned.length} unassigned orders ready — click Re-generate to start`
                : `No unassigned orders for ${planDate}`}
            </p>
            {unassigned.length > 0 && (
              <Button onClick={handleRegenerate} loading={isGenerating} className="mt-2">
                <Zap size={14} /> Generate Plan
              </Button>
            )}
          </div>
        )}

        {/* Agent reasoning (collapsed, for AI-planner results) */}
        {pollStatus === 'done' && aiResult && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <button
              className="w-full px-5 py-4 border-b border-[var(--c-border)] flex items-center gap-2 transition-colors"
              style={{ background: 'var(--c-purple-dim)' }}
              onClick={() => setReasoningOpen(v => !v)}
            >
              <Bot size={15} style={{ color: 'var(--c-purple)' }} />
              <p className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--c-purple)' }}>
                Agent Reasoning
              </p>
              {reasoningOpen
                ? <span className="text-[var(--c-muted)] text-xs">▲ collapse</span>
                : <span className="text-[var(--c-muted)] text-xs">▼ expand</span>}
            </button>
            {reasoningOpen && (
              <div className="p-5">
                <AgentFeed logs={[]} isLoading={false} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── AI Scenarios Modal ────────────────────────────────────────────────── */}
      <Modal open={showAiModal} onClose={() => setShowAiModal(false)} title="AI Scenario Planning">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--c-muted)]">
            The AI will generate 4 optimised scenarios for <span className="font-semibold text-[var(--c-text)]">{planDate}</span>.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
              Natural language constraints <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={nlConstraints}
              onChange={(e) => setNlConstraints(e.target.value)}
              placeholder="e.g. Avoid highway tolls, prioritise Zone A, no overtime"
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)', outline: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-purple)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--c-border)')}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" onClick={handleStartAiPlan}>
              <Brain size={14} /> Generate AI Scenarios
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowAiModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Pre-plan Warnings Modal ───────────────────────────────────────────── */}
      <Modal open={showWarnings} onClose={() => setShowWarnings(false)} title="Pre-Plan Warnings">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--c-muted)]">Review these conditions before generating the plan:</p>
          {warnings.map((w, i) => <WarningRow key={i} type={w.type} text={w.text} />)}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={proceedFromWarnings}>Proceed Anyway</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowWarnings(false)}>Review Orders</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
