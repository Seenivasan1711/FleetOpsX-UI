import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Bot, Route, Zap, Leaf, Download, ChevronDown, ChevronRight,
  AlertTriangle, Info, ListOrdered, CheckCircle2, Brain,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }       from '../components/layout/AppShell'
import { Button }         from '../components/ui/Button'
import { Input }          from '../components/ui/Input'
import { Modal }          from '../components/ui/Modal'
import { PriorityBadge }  from '../components/ui/Badge'
import { EmptyState }     from '../components/ui/EmptyState'
import { PlanOptionsCard } from '../components/planning/PlanOptionsCard'
import AgentFeed          from '../components/shared/AgentFeed'
import { ScenarioCards }  from '../components/planning/ScenarioCards'
import { generatePlan, generatePlanOptions, confirmPlan } from '../api/planning'
import { fetchOrders }    from '../api/orders'
import { fetchAgentLogs } from '../api/agentLogs'
import { fetchSuggestions } from '../api/agentSuggestions'
import { exportPlan, triggerBlobDownload } from '../api/exportImport'
import { startAiScenarios, confirmScenario } from '../api/aiPlanning'
import type { AiScenario } from '../api/aiPlanning'
import { usePlanPolling } from '../hooks/usePlanPolling'
import { QUERY_KEYS }     from '../lib/utils/constants'
import { usePlanStore }   from '../store/plan.store'
import type { PlanResult, PlanOption, PlanOptionMode, PlanOptionsApiResponse, Order } from '../types'

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const meta =
    score >= 90 ? { label: 'High Confidence',   color: 'var(--c-green)',  bg: 'rgba(52,211,153,0.15)'  } :
    score >= 70 ? { label: 'Medium Confidence',  color: 'var(--c-orange)', bg: 'rgba(251,191,36,0.15)'  } :
                  { label: 'Low Confidence',     color: 'var(--c-red)',    bg: 'rgba(248,113,113,0.15)' }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
      style={{ background: meta.bg, color: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
      {meta.label} · {score}%
    </span>
  )
}

// ─── Warning row ─────────────────────────────────────────────────────────────

function WarningRow({ type, text }: { type: 'danger' | 'info'; text: string }) {
  const color = type === 'danger' ? 'var(--c-red)' : 'var(--c-accent)'
  const bg    = type === 'danger' ? 'rgba(248,113,113,0.10)' : 'var(--c-accent-dim)'
  const Icon  = type === 'danger' ? AlertTriangle : Info
  return (
    <div
      className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
      style={{ background: bg }}
    >
      <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
      <span style={{ color: 'var(--c-text)' }}>{text}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Planning() {
  const [planDate,       setPlanDate]      = useState(new Date().toISOString().slice(0, 10))
  const [planResult,     setPlanResult]    = useState<PlanResult | null>(null)
  const [planOptions,       setPlanOptions]      = useState<PlanOption[] | null>(null)
  const [selectedOption,    setSelectedOption]   = useState<PlanOptionMode | null>(null)
  const [recommendation,    setRecommendation]   = useState<string | null>(null)
  const [naiveDistanceKm,   setNaiveDistanceKm]  = useState<number | null>(null)
  const [showWarnings,   setShowWarnings]  = useState(false)
  const [reasoningOpen,  setReasoningOpen] = useState(true)
  const [exporting,      setExporting]     = useState(false)

  // P5-E2 — AI Scenario Planning
  const [showAiModal,      setShowAiModal]      = useState(false)
  const [nlConstraints,    setNlConstraints]    = useState('')
  const [selectedScenario, setSelectedScenario] = useState<AiScenario['type'] | null>(null)
  const [confirming,       setConfirming]       = useState(false)
  const [currentTaskId,    setCurrentTaskId]    = useState<string | null>(null)

  const {
    status: pollStatus, result: aiResult, error: pollError,
    isPolling, startPolling, reset: resetPolling,
  } = usePlanPolling()

  const pendingAction = useRef<(() => void) | null>(null)
  const { setLastPlan } = usePlanStore()

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: QUERY_KEYS.orders(planDate),
    queryFn:  () => fetchOrders({ plan_date: planDate }),
  })

  const isAgentPlanner = planResult?.planner?.startsWith('langgraph') || planResult?.planner === 'multi_agent'

  const { data: agentLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: QUERY_KEYS.agentLogs(planResult?.plan_id ?? ''),
    queryFn:  () => fetchAgentLogs(planResult!.plan_id),
    enabled:  !!planResult?.plan_id && isAgentPlanner,
  })

  const { data: pendingSuggestions = [] } = useQuery({
    queryKey:        QUERY_KEYS.suggestions(planDate),
    queryFn:         () => fetchSuggestions(planDate, 'PENDING'),
    refetchInterval: 60_000,
  })

  // ── Pre-plan warnings ───────────────────────────────────────────────────────

  const warnings = useMemo(() => {
    const pending = (orders as Order[]).filter((o) => o.status === 'PENDING')
    const ws: { type: 'danger' | 'info'; text: string }[] = []

    const criticals = pending.filter((o) => o.priority === 'CRITICAL')
    if (criticals.length > 0) {
      ws.push({
        type: 'danger',
        text: `${criticals.length} CRITICAL order${criticals.length > 1 ? 's' : ''} require same-day dispatch — plan immediately to avoid SLA breach`,
      })
    }

    const noWindow = pending.filter((o) => !o.time_window_start)
    if (noWindow.length > 0) {
      ws.push({
        type: 'info',
        text: `${noWindow.length} order${noWindow.length > 1 ? 's have' : ' has'} no delivery time window — the planner will use default operating hours`,
      })
    }

    return ws
  }, [orders])

  const checkAndGenerate = (action: () => void) => {
    if (warnings.length > 0) {
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

  // ── Single plan mutation ────────────────────────────────────────────────────

  const planMutation = useMutation({
    mutationFn: () => generatePlan(planDate),
    onSuccess: (data) => {
      setPlanResult(data)
      setPlanOptions(null)
      setSelectedOption(null)
      setLastPlan(data, planDate)
      refetchOrders()
      toast.success(`Plan generated — ${data.assigned_orders} orders across ${data.total_routes} routes.`)
    },
    onError: () => toast.error('Failed to generate plan'),
  })

  // ── Options mutation ────────────────────────────────────────────────────────

  const optionsMutation = useMutation({
    mutationFn: (): Promise<PlanOptionsApiResponse> => generatePlanOptions(planDate),
    onSuccess: (data) => {
      setPlanOptions(data.options)
      setRecommendation(data.recommendation ?? null)
      setNaiveDistanceKm(data.naive_distance_km ?? null)
      setPlanResult(null)
      setSelectedOption(data.recommendation as PlanOptionMode ?? null)
      refetchOrders()
      toast.success(`${data.options.length} plan options ready — select one to confirm`)
    },
    onError: () => toast.error('Failed to generate plan options'),
  })

  // ── Confirm mutation ────────────────────────────────────────────────────────

  const confirmMutation = useMutation({
    mutationFn: async (): Promise<PlanResult> => {
      const opt = planOptions?.find((o) => o.mode === selectedOption)
      if (!opt) throw new Error('No option selected')
      return confirmPlan(opt.plan_id, planDate)
    },
    onSuccess: (data) => {
      setPlanResult(data)
      setPlanOptions(null)
      setSelectedOption(null)
      setRecommendation(null)
      setNaiveDistanceKm(null)
      setLastPlan(data, planDate)
      refetchOrders()
      toast.success(`Plan confirmed — ${data.assigned_orders} orders assigned`)
    },
    onError: () => toast.error('Failed to confirm plan'),
  })

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportPlan(planDate)
      triggerBlobDownload(blob, `fleet-plan-${planDate}.xlsx`)
    } catch {
      toast.error('Export not yet available — backend coming soon')
    } finally {
      setExporting(false)
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const unassigned = (orders as Order[]).filter((o) => o.status === 'PENDING')

  const confidence = planResult
    ? planResult.confidence_score ?? Math.round((planResult.assigned_orders / Math.max(planResult.total_orders, 1)) * 100)
    : null

  const planSummary = planResult?.explanation
    ?? (planResult
        ? `Dispatched ${planResult.assigned_orders} of ${planResult.total_orders} orders across ${planResult.total_routes} routes. ` +
          (planResult.assigned_orders < planResult.total_orders
            ? `${planResult.total_orders - planResult.assigned_orders} order${planResult.total_orders - planResult.assigned_orders > 1 ? 's' : ''} could not be assigned due to capacity or time window constraints.`
            : 'All orders successfully assigned.')
        : null)

  // P5-E2 handlers
  const handleStartAiPlan = async () => {
    setShowAiModal(false)
    resetPolling()
    setSelectedScenario(null)
    try {
      const data = await startAiScenarios(planDate, nlConstraints || undefined)
      setCurrentTaskId(data.task_id)
      startPolling(data.task_id)
    } catch {
      toast.error('Failed to start AI planning')
    }
  }

  const handleConfirmScenario = async () => {
    if (!selectedScenario || !currentTaskId) return
    setConfirming(true)
    try {
      await confirmScenario(planDate, selectedScenario, currentTaskId)
      toast.success(`"${selectedScenario}" scenario confirmed`)
      resetPolling()
      setSelectedScenario(null)
      setCurrentTaskId(null)
      refetchOrders()
    } catch {
      toast.error('Failed to confirm scenario')
    } finally {
      setConfirming(false)
    }
  }

  const isGenerating = planMutation.isPending || optionsMutation.isPending

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="date"
            value={planDate}
            onChange={(e) => setPlanDate(e.target.value)}
            className="w-auto"
          />

          {/* Generate Plan */}
          <div className="relative">
            <Button
              onClick={() => checkAndGenerate(() => planMutation.mutate())}
              loading={planMutation.isPending}
              disabled={isGenerating || unassigned.length === 0}
            >
              <Zap size={15} />
              {planMutation.isPending ? 'Generating…' : `Generate Plan · ${unassigned.length} unassigned`}
            </Button>
            {pendingSuggestions.length > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold"
                style={{ background: 'var(--c-red)' }}
              >
                {pendingSuggestions.length}
              </span>
            )}
          </div>

          {/* Generate Options — PP-E2 */}
          <Button
            variant="secondary"
            onClick={() => checkAndGenerate(() => optionsMutation.mutate())}
            loading={optionsMutation.isPending}
            disabled={isGenerating || unassigned.length === 0}
          >
            <ListOrdered size={15} />
            {optionsMutation.isPending ? 'Generating options…' : 'Generate Options'}
          </Button>

          {/* AI Scenarios — P5-E2 */}
          <Button
            variant="secondary"
            onClick={() => setShowAiModal(true)}
            disabled={isGenerating || isPolling}
          >
            <Brain size={15} />
            AI Scenarios
          </Button>
        </div>

        {/* ── AI Planning: thinking state ──────────────────────────────────── */}
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
              <p className="text-xs text-[var(--c-muted)] mt-0.5">
                Generating 4 optimisation scenarios — this takes about 10–20 s
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: 'var(--c-purple)',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── AI Planning: error state ─────────────────────────────────────── */}
        {pollError && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
          >
            <AlertTriangle size={15} style={{ color: 'var(--c-red)' }} />
            <p className="text-sm text-[var(--c-text)]">{pollError}</p>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setShowAiModal(true)}>
              Retry
            </Button>
          </div>
        )}

        {/* ── AI Scenarios result ──────────────────────────────────────────── */}
        {pollStatus === 'done' && aiResult && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Brain size={15} style={{ color: 'var(--c-purple)' }} />
              <p className="text-sm font-bold text-[var(--c-text)]">AI Scenario Recommendations</p>
              <p className="text-xs text-[var(--c-muted)]">
                Select a scenario and confirm to apply
              </p>
            </div>
            <ScenarioCards
              planResult={aiResult}
              onSelect={setSelectedScenario}
              selectedType={selectedScenario}
              confirming={confirming}
            />
            {selectedScenario && (
              <div className="flex items-center gap-3">
                <Button onClick={handleConfirmScenario} loading={confirming}>
                  <CheckCircle2 size={15} />
                  Confirm {selectedScenario.replace('_', ' ')} scenario
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { resetPolling(); setSelectedScenario(null); setCurrentTaskId(null) }}
                  disabled={confirming}
                >
                  Discard
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Unassigned orders ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <div className="px-5 py-4 border-b border-[var(--c-border)] flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--c-text)]">Unassigned Orders</p>
              <p className="text-xs text-[var(--c-muted)] mt-0.5">{planDate}</p>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: unassigned.length > 0 ? 'var(--c-red)' : 'var(--c-green)' }}
            >
              {unassigned.length} pending
            </span>
          </div>

          {unassigned.length === 0 ? (
            <EmptyState
              title="All orders dispatched"
              subtitle="No unassigned orders for this date — the plan is fully covered."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Address</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Priority</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Time Window</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.slice(0, 12).map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--c-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td className="px-5 py-3 text-[var(--c-text)] truncate max-w-xs">{order.delivery_address}</td>
                    <td className="px-5 py-3"><PriorityBadge priority={order.priority} /></td>
                    <td className="px-5 py-3 text-sm text-[var(--c-muted)] font-mono">
                      {order.time_window_start ? `${order.time_window_start} – ${order.time_window_end}` : '—'}
                    </td>
                  </tr>
                ))}
                {unassigned.length > 12 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-xs text-[var(--c-muted)]">
                      +{unassigned.length - 12} more orders…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Plan Options (PP-E2 / AI-1-T7) ─────────────────────────────── */}
        {planOptions && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ListOrdered size={15} style={{ color: 'var(--c-accent)' }} />
              <p className="text-sm font-bold text-[var(--c-text)]">Choose a Plan</p>
              <p className="text-xs text-[var(--c-muted)]">Select one of the optimisation strategies below</p>
              {recommendation && (
                <span
                  className="ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(167,139,250,0.15)', color: 'var(--c-purple)' }}
                >
                  AI recommends: {recommendation}
                </span>
              )}
            </div>

            {/* Savings banner (AI-1-T8) */}
            {naiveDistanceKm != null && planOptions.length > 1 && (() => {
              const economical = planOptions.find((o) => o.mode === 'economical')
              const savedKm = economical
                ? (naiveDistanceKm - economical.total_distance_km).toFixed(1)
                : null
              if (!savedKm || parseFloat(savedKm) <= 0) return null
              const pct = Math.round(parseFloat(savedKm) / naiveDistanceKm * 100)
              return (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  <Leaf size={14} style={{ color: 'var(--c-green)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--c-text)' }}>
                    <span className="font-bold" style={{ color: 'var(--c-green)' }}>
                      AI saved {savedKm} km ({pct}%)
                    </span>
                    {' '}vs unoptimised baseline of {naiveDistanceKm.toFixed(1)} km — less fuel, faster deliveries.
                  </span>
                </div>
              )
            })()}

            <div className="grid grid-cols-3 gap-4">
              {planOptions.map((opt) => (
                <PlanOptionsCard
                  key={opt.mode}
                  option={opt}
                  selected={selectedOption === opt.mode}
                  recommended={opt.mode === recommendation}
                  onSelect={() => setSelectedOption(opt.mode)}
                />
              ))}
            </div>
            {selectedOption && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => confirmMutation.mutate()}
                  loading={confirmMutation.isPending}
                >
                  <CheckCircle2 size={15} />
                  Confirm {selectedOption} plan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setPlanOptions(null); setSelectedOption(null); setRecommendation(null); setNaiveDistanceKm(null) }}
                >
                  Discard
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Plan Result (PP-E1-S2 + S4) ─────────────────────────────────── */}
        {planResult && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--c-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--c-accent-dim)' }}
                >
                  <Route size={15} style={{ color: 'var(--c-accent)' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--c-text)]">
                    Plan Result · {planResult.assigned_orders}/{planResult.total_orders} assigned · {planResult.total_routes} routes
                  </p>
                  {planResult.planner && (
                    <p className="text-xs text-[var(--c-muted)] font-mono mt-0.5">
                      planner: {planResult.planner}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Confidence badge — PP-E1-S2 */}
                {confidence !== null && <ConfidenceBadge score={confidence} />}
                <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}>
                  <Download size={13} /> Export
                </Button>
                <span
                  className="text-[11px] font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--c-orange)' }}
                >
                  DRAFT
                </span>
              </div>
            </div>

            {/* AI Summary block — PP-E1-S4 */}
            {planSummary && (
              <div
                className="px-5 py-4 border-b border-[var(--c-border)] flex items-start gap-3"
                style={{ background: 'var(--c-elevated)' }}
              >
                <Bot size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--c-purple)' }} />
                <p className="text-sm text-[var(--c-muted)] leading-relaxed">{planSummary}</p>
              </div>
            )}

            {/* Assignments table */}
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)] w-10">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Driver</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Order ID</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">Stop</th>
                </tr>
              </thead>
              <tbody>
                {planResult.assignments.map((a, i) => (
                  <tr
                    key={i}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--c-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td className="px-5 py-3 text-xs text-[var(--c-muted)] font-mono">{i + 1}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-[var(--c-text)]">{a.driver_name}</td>
                    <td className="px-5 py-3 text-xs text-[var(--c-muted)] font-mono">{a.order_id.slice(0, 8)}…</td>
                    <td className="px-5 py-3 text-xs text-[var(--c-muted)]">Stop {a.sequence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Agent Reasoning panel (PP-E1-S1) — collapsible ──────────────── */}
        {planResult && isAgentPlanner && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <button
              className="w-full px-5 py-4 border-b border-[var(--c-border)] flex items-center gap-2 transition-colors"
              style={{ background: 'var(--c-purple-dim)' }}
              onClick={() => setReasoningOpen((v) => !v)}
            >
              <Bot size={15} style={{ color: 'var(--c-purple)' }} />
              <p className="text-sm font-semibold flex-1 text-left" style={{ color: 'var(--c-purple)' }}>
                Agent Reasoning
              </p>
              {planResult.planner && (
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded mr-1"
                  style={{ background: 'var(--c-elevated)', color: 'var(--c-muted)' }}
                >
                  {planResult.planner}
                </span>
              )}
              {reasoningOpen
                ? <ChevronDown size={14} style={{ color: 'var(--c-muted)' }} />
                : <ChevronRight size={14} style={{ color: 'var(--c-muted)' }} />}
            </button>
            {reasoningOpen && (
              <div className="p-5">
                <AgentFeed
                  logs={agentLogs}
                  isLoading={logsLoading}
                  {...(planResult.explanation !== undefined && { explanation: planResult.explanation })}
                  {...(planResult.planner     !== undefined && { planner:     planResult.planner     })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── AI Scenarios Modal — P5-E2 ──────────────────────────────────────── */}
      <Modal open={showAiModal} onClose={() => setShowAiModal(false)} title="AI Scenario Planning">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--c-muted)]">
            The AI will generate 4 optimised scenarios — fastest, economical, balanced, and driver-availability — for <span className="font-semibold text-[var(--c-text)]">{planDate}</span>.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
              Natural language constraints <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={nlConstraints}
              onChange={(e) => setNlConstraints(e.target.value)}
              placeholder="e.g. Avoid highway tolls, prioritise Zone A deliveries, no overtime for drivers"
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{
                background:  'var(--c-elevated)',
                border:      '1px solid var(--c-border)',
                color:       'var(--c-text)',
                outline:     'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-purple)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--c-border)')}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button className="flex-1 whitespace-nowrap" onClick={handleStartAiPlan}>
              <Brain size={14} />
              Generate AI Scenarios
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowAiModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Pre-plan Warnings Modal (PP-E1-S3) ──────────────────────────────── */}
      <Modal open={showWarnings} onClose={() => setShowWarnings(false)} title="Pre-Plan Warnings">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[var(--c-muted)]">
            Review these conditions before generating the plan:
          </p>
          {warnings.map((w, i) => <WarningRow key={i} type={w.type} text={w.text} />)}
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={proceedFromWarnings}>
              Proceed Anyway
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowWarnings(false)}>
              Review Orders
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
