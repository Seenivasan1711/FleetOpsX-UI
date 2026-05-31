import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain, Play, CheckCircle2, Trash2, RefreshCw, ChevronDown, ChevronRight,
  Clock, Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { QUERY_KEYS } from '../../lib/utils/constants'
import {
  getActiveSession, createSession, runSessionRound, confirmSession, discardSession,
} from '../../api/planningSessions'
import type { PlanningSession } from '../../types'

// ── design tokens (match Planning.tsx var(--c-*) system) ──────────────────────
const PHASE_COLORS: Record<PlanningSession['status'], { bg: string; text: string; dot: string }> = {
  OPEN:      { bg: 'rgba(139,92,246,0.12)', text: 'var(--c-purple)', dot: 'var(--c-purple)' },
  LOCKED:    { bg: 'rgba(251,191,36,0.12)', text: 'var(--c-orange)', dot: 'var(--c-orange)' },
  COMPLETED: { bg: 'rgba(52,211,153,0.12)', text: 'var(--c-green)',  dot: 'var(--c-green)'  },
  EXPIRED:   { bg: 'rgba(248,113,113,0.12)', text: 'var(--c-red)',   dot: 'var(--c-red)'    },
}

function StatusBadge({ status }: { status: PlanningSession['status'] }) {
  const c = PHASE_COLORS[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {status}
    </span>
  )
}

interface Props {
  planDate: string
  onRunStarted: (runId: string) => void
}

export function PlanningSessionPanel({ planDate, onRunStarted }: Props) {
  const qc = useQueryClient()
  const [hintsOpen, setHintsOpen] = useState(false)
  const [hints, setHints] = useState('')
  const [roundsOpen, setRoundsOpen] = useState(false)

  const { data: session, isLoading } = useQuery({
    queryKey: QUERY_KEYS.activeSession,
    queryFn: getActiveSession,
    refetchInterval: 30_000,
  })

  const createMut = useMutation({
    mutationFn: () => createSession(planDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activeSession })
      toast.success('Planning session started')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg ?? 'Failed to start session')
    },
  })

  const runMut = useMutation({
    mutationFn: () => runSessionRound(session!.id, hints || undefined),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activeSession })
      setHints('')
      setHintsOpen(false)
      onRunStarted(data.run_id)
      toast.success('Planning round started')
    },
    onError: () => toast.error('Failed to start round'),
  })

  const confirmMut = useMutation({
    mutationFn: () => confirmSession(session!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activeSession })
      toast.success('Session confirmed — plan is live')
    },
    onError: () => toast.error('Failed to confirm session'),
  })

  const discardMut = useMutation({
    mutationFn: () => discardSession(session!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.activeSession })
      toast.success('Session discarded')
    },
    onError: () => toast.error('Failed to discard session'),
  })

  if (isLoading) return null

  const sessionDateMatches = session?.plan_date === planDate

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      {/* ── Header ── */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-3"
        style={{
          borderBottom: '1px solid var(--c-border)',
          background: 'rgba(139,92,246,0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            <Brain size={15} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--c-text)]">AI Planning Session</p>
            <p className="text-xs text-[var(--c-muted)] mt-0.5">
              Iterative AI-powered dispatch planning
            </p>
          </div>
        </div>
        {session && sessionDateMatches && <StatusBadge status={session.status} />}
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4 flex flex-col gap-4">

        {/* No session or wrong date */}
        {(!session || !sessionDateMatches) && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[var(--c-text)]">No active session for <span className="font-semibold">{planDate}</span></p>
              <p className="text-xs text-[var(--c-muted)] mt-0.5">
                Start a session to use iterative AI rounds, chat replanning, and carry-forward.
              </p>
            </div>
            <Button
              onClick={() => createMut.mutate()}
              loading={createMut.isPending}
              className="shrink-0"
            >
              <Play size={14} />
              Start Session
            </Button>
          </div>
        )}

        {/* Active session */}
        {session && sessionDateMatches && (
          <>
            {/* Session meta row */}
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-1.5 text-[var(--c-muted)]">
                <Layers size={13} />
                <span>Round <span className="font-bold text-[var(--c-text)]">{session.current_round}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--c-muted)]">
                <Clock size={13} />
                <span>Cutoff <span className="font-semibold text-[var(--c-text)]">{session.cutoff_time}</span></span>
              </div>
              {session.active_plan_id && (
                <span className="text-xs font-mono text-[var(--c-muted)]">
                  plan: {session.active_plan_id.slice(0, 8)}…
                </span>
              )}
            </div>

            {/* Hints expander */}
            {session.status === 'OPEN' && (
              <div>
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--c-muted)] mb-2"
                  onClick={() => setHintsOpen((v) => !v)}
                >
                  {hintsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Round hints <span className="font-normal">(optional)</span>
                </button>
                {hintsOpen && (
                  <textarea
                    value={hints}
                    onChange={(e) => setHints(e.target.value)}
                    placeholder="e.g. Prioritise cold-chain vehicles for Zone B, avoid overtime for Driver A"
                    rows={2}
                    className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                    style={{
                      background: 'var(--c-elevated)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-purple)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                  />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {session.status === 'OPEN' && (
                <>
                  <Button
                    onClick={() => runMut.mutate()}
                    loading={runMut.isPending}
                  >
                    <RefreshCw size={14} />
                    Run Round {session.current_round + 1}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => confirmMut.mutate()}
                    loading={confirmMut.isPending}
                    disabled={!session.active_plan_id}
                  >
                    <CheckCircle2 size={14} />
                    Confirm Session
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => discardMut.mutate()}
                    loading={discardMut.isPending}
                  >
                    <Trash2 size={14} />
                    Discard
                  </Button>
                </>
              )}
              {(session.status === 'COMPLETED' || session.status === 'LOCKED') && (
                <Button
                  variant="secondary"
                  onClick={() => createMut.mutate()}
                  loading={createMut.isPending}
                >
                  <Play size={14} />
                  New Session for {planDate}
                </Button>
              )}
            </div>

            {/* Round history toggle */}
            {session.current_round > 0 && (
              <button
                className="flex items-center gap-1.5 text-xs text-[var(--c-muted)] font-semibold"
                onClick={() => setRoundsOpen((v) => !v)}
              >
                {roundsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {session.current_round} round{session.current_round > 1 ? 's' : ''} completed
              </button>
            )}
            {roundsOpen && (
              <div className="flex flex-col gap-1">
                {Array.from({ length: session.current_round }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'var(--c-elevated)' }}
                  >
                    <span
                      className="w-4 h-4 rounded flex items-center justify-center font-bold"
                      style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--c-purple)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[var(--c-muted)]">Round {i + 1} completed</span>
                    <CheckCircle2 size={11} className="ml-auto" style={{ color: 'var(--c-green)' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
