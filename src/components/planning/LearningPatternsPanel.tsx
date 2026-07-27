import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { listLearningPatterns, approvePattern, rejectPattern } from '../../api/planningLearning'
import { QUERY_KEYS } from '../../lib/utils/constants'
import type { PlanningLearning } from '../../types'

const PATTERN_TYPE_LABEL: Record<string, string> = {
  DRIVER_PREFERENCE: 'Driver Preference',
  ZONE_ROUTING:      'Zone Routing',
  TIME_WINDOW:       'Time Window',
  CAPACITY:          'Capacity',
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PENDING_APPROVAL: { bg: 'rgba(251,191,36,0.12)', text: 'var(--c-orange)' },
  APPROVED:         { bg: 'rgba(52,211,153,0.12)', text: 'var(--c-green)'  },
  REJECTED:         { bg: 'rgba(248,113,113,0.12)', text: 'var(--c-red)'   },
}

interface Props {
  defaultOpen?: boolean
}

export function LearningPatternsPanel({ defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const qc = useQueryClient()

  const { data: patterns = [] } = useQuery({
    queryKey: QUERY_KEYS.learningPatterns('PENDING_APPROVAL'),
    queryFn: () => listLearningPatterns('PENDING_APPROVAL'),
    refetchInterval: 60_000,
  })

  const approveMut = useMutation({
    mutationFn: (id: string) => approvePattern(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.learningPatterns() })
      toast.success('Pattern approved — will be used in future runs')
    },
    onError: () => toast.error('Failed to approve'),
  })

  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectPattern(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.learningPatterns() })
      toast.success('Pattern rejected')
    },
    onError: () => toast.error('Failed to reject'),
  })

  const pending = (patterns as PlanningLearning[]).length

  if (pending === 0 && !open) return null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      {/* Header */}
      <button
        className="w-full px-5 py-4 flex items-center gap-3 transition-colors text-left"
        style={{
          borderBottom: open ? '1px solid var(--c-border)' : 'none',
          background: 'rgba(251,191,36,0.05)',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(251,191,36,0.15)' }}
        >
          <Sparkles size={13} style={{ color: 'var(--c-orange)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--c-text)]">AI Learning Patterns</p>
          <p className="text-xs text-[var(--c-muted)] mt-0.5">
            {pending} pattern{pending !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
        {pending > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full mr-1"
            style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--c-orange)' }}
          >
            {pending} pending
          </span>
        )}
        {open
          ? <ChevronDown size={14} style={{ color: 'var(--c-muted)' }} />
          : <ChevronRight size={14} style={{ color: 'var(--c-muted)' }} />}
      </button>

      {/* Pattern list */}
      {open && (
        <div className="p-4 flex flex-col gap-3">
          {pending === 0 && (
            <p className="text-sm text-[var(--c-muted)] text-center py-4">
              No pending patterns — the AI will propose patterns after each planning run.
            </p>
          )}
          {(patterns as PlanningLearning[]).map((p) => {
            const sc = STATUS_COLOR[p.status] ?? STATUS_COLOR.PENDING_APPROVAL
            const typeLabel = PATTERN_TYPE_LABEL[p.pattern_type] ?? p.pattern_type
            return (
              <div
                key={p.id}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--c-purple)' }}
                      >
                        {typeLabel}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--c-text)] leading-relaxed">{p.pattern_text}</p>
                    <p className="text-[11px] text-[var(--c-muted)] mt-1.5">
                      Detected {new Date(p.detected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {p.status === 'PENDING_APPROVAL' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveMut.mutate(p.id)}
                      disabled={approveMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(52,211,153,0.12)',
                        border: '1px solid rgba(52,211,153,0.25)',
                        color: 'var(--c-green)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(52,211,153,0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(52,211,153,0.12)')}
                    >
                      <CheckCircle2 size={12} />
                      Approve
                    </button>
                    <button
                      onClick={() => rejectMut.mutate(p.id)}
                      disabled={rejectMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(248,113,113,0.08)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        color: 'var(--c-red)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.15)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                    >
                      <XCircle size={12} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
