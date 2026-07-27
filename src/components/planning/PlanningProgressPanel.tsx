import { useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, Clock, Zap, Brain, Shield, BarChart2, MessageSquare } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { usePlanningRunWS } from '../../hooks/usePlanningRunWS'
import { useAuthStore } from '../../store'
import type { RunAgentCheckpoint } from '../../types'

// Friendly display names for agents
const AGENT_META: Record<string, { label: string; phase: number }> = {
  order_collector:       { label: 'Order Collector',       phase: 1 },
  driver_collector:      { label: 'Driver Collector',      phase: 1 },
  vehicle_collector:     { label: 'Vehicle Collector',     phase: 1 },
  forecast_agent:        { label: 'Forecast Agent',        phase: 1 },
  constraint_validator:  { label: 'Constraint Validator',  phase: 2 },
  ortools_optimizer:     { label: 'Route Optimizer',       phase: 2 },
  baseline_computer:     { label: 'Baseline Computer',     phase: 2 },
  explain_agent:         { label: 'Explain Agent',         phase: 3 },
  risk_scorer:           { label: 'Risk Scorer',           phase: 3 },
  carry_forward_agent:   { label: 'Carry-Forward Agent',   phase: 3 },
  learning_updater:      { label: 'Learning Updater',      phase: 3 },
}

const PHASE_LABELS = ['Data Collection', 'Route Optimization', 'Analysis & Enrichment']
const PHASE_RANGES = [[0, 35], [35, 80], [80, 100]]

function AgentCard({ cp }: { cp: RunAgentCheckpoint }) {
  const meta = AGENT_META[cp.agent] ?? { label: cp.agent, phase: cp.phase }
  const isRunning   = cp.status === 'running'
  const isCompleted = cp.status === 'completed'
  const isFailed    = cp.status === 'failed'
  const isPending   = cp.status === 'pending'

  const iconColor = isCompleted ? 'var(--c-green)' : isFailed ? 'var(--c-red)' : isRunning ? 'var(--c-purple)' : 'var(--c-muted)'

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{
        background: isRunning ? 'rgba(139,92,246,0.08)' : 'var(--c-elevated)',
        border: `1px solid ${isRunning ? 'rgba(139,92,246,0.25)' : 'transparent'}`,
      }}
    >
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        {isCompleted && <CheckCircle2 size={16} style={{ color: iconColor }} />}
        {isFailed    && <XCircle      size={16} style={{ color: iconColor }} />}
        {isRunning   && <Loader2      size={16} style={{ color: iconColor }} className="animate-spin" />}
        {isPending   && <Clock        size={16} style={{ color: iconColor }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--c-text)] truncate">{meta.label}</p>
        {cp.result_summary && (
          <p className="text-[11px] text-[var(--c-muted)] truncate mt-0.5">{cp.result_summary}</p>
        )}
        {cp.error && (
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--c-red)' }}>{cp.error}</p>
        )}
      </div>
      <span
        className="text-[10px] font-mono shrink-0"
        style={{ color: iconColor }}
      >
        {isCompleted ? '✓' : isFailed ? '✗' : isRunning ? `${cp.progress_pct}%` : '—'}
      </span>
    </div>
  )
}

interface Props {
  runId: string | null
  open: boolean
  onClose: () => void
  onComplete?: () => void
}

export function PlanningProgressPanel({ runId, open, onClose, onComplete }: Props) {
  const token = useAuthStore((s) => s.accessToken)
  const { progressPct, agents, status, currentAgent } = usePlanningRunWS(
    open ? runId : null,
    token,
  )

  useEffect(() => {
    if (status === 'completed') onComplete?.()
  }, [status, onComplete])

  // Determine which phase we're in from progress
  const phaseIdx =
    progressPct < 35 ? 0 :
    progressPct < 80 ? 1 : 2

  // Group agent checkpoints by phase
  const byPhase: RunAgentCheckpoint[][] = [[], [], []]
  Object.values(agents).forEach((cp) => {
    const ph = (AGENT_META[cp.agent]?.phase ?? cp.phase) - 1
    byPhase[Math.min(ph, 2)].push(cp)
  })

  const isDone   = status === 'completed'
  const isFailed = status === 'failed'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Planning Run Progress"
    >
      <div className="flex flex-col gap-5" style={{ minWidth: 480 }}>

        {/* Overall progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain size={14} style={{ color: 'var(--c-purple)' }} />
              <span className="text-xs font-semibold text-[var(--c-text)]">
                {isDone ? 'Plan ready' : isFailed ? 'Run failed' : currentAgent
                  ? `Running ${AGENT_META[currentAgent]?.label ?? currentAgent}…`
                  : 'Initialising…'}
              </span>
            </div>
            <span className="text-xs font-bold font-mono" style={{ color: 'var(--c-purple)' }}>
              {progressPct}%
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--c-elevated)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: isFailed
                  ? 'var(--c-red)'
                  : isDone
                  ? 'var(--c-green)'
                  : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              }}
            />
          </div>
        </div>

        {/* Phase tabs */}
        <div className="flex gap-2">
          {PHASE_LABELS.map((label, i) => {
            const [lo, hi] = PHASE_RANGES[i]
            const phasePct = Math.min(100, Math.max(0, ((progressPct - lo) / (hi - lo)) * 100))
            const active   = i === phaseIdx && !isDone
            const done     = progressPct >= hi || (isDone && i <= 2)
            return (
              <div
                key={i}
                className="flex-1 rounded-xl p-3 flex flex-col gap-2"
                style={{
                  background: active ? 'rgba(139,92,246,0.08)' : 'var(--c-elevated)',
                  border: `1px solid ${active ? 'rgba(139,92,246,0.2)' : 'transparent'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--c-muted)]">
                    Phase {i + 1}
                  </span>
                  {done && <CheckCircle2 size={11} style={{ color: 'var(--c-green)' }} />}
                  {active && <Loader2 size={11} className="animate-spin" style={{ color: 'var(--c-purple)' }} />}
                </div>
                <p className="text-[11px] font-semibold text-[var(--c-text)]">{label}</p>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--c-surface)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${done ? 100 : active ? phasePct : 0}%`,
                      background: done ? 'var(--c-green)' : 'var(--c-purple)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Agent cards */}
        {Object.keys(agents).length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--c-muted)]">Agents</p>
            {Object.values(agents).map((cp) => (
              <AgentCard key={cp.agent} cp={cp} />
            ))}
          </div>
        )}

        {/* Status messages */}
        {status === 'connecting' && (
          <div className="flex items-center gap-2 text-xs text-[var(--c-muted)]">
            <Loader2 size={12} className="animate-spin" />
            Connecting to planning run…
          </div>
        )}
        {isDone && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)' }}
          >
            <CheckCircle2 size={14} style={{ color: 'var(--c-green)' }} />
            <span style={{ color: 'var(--c-text)' }}>Plan generated successfully. Review results below.</span>
          </div>
        )}
        {isFailed && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
          >
            <XCircle size={14} style={{ color: 'var(--c-red)' }} />
            <span style={{ color: 'var(--c-text)' }}>Planning run failed. Use Resume in Runs history to retry.</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {isDone || isFailed ? 'Close' : 'Minimise'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
