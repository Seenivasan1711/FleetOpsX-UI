import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { History, Star, ChevronDown, ChevronRight, Brain, Zap, ListOrdered, MessageSquarePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }    from '../components/layout/AppShell'
import { Button }      from '../components/ui/Button'
import { EmptyState }  from '../components/ui/EmptyState'
import { Modal }       from '../components/ui/Modal'
import { listPlanHistory, addPlanNote } from '../api/planHistory'
import type { PlanHistoryOut } from '../api/planHistory'

// ─── helpers ─────────────────────────────────────────────────────────────────

function sourceIcon(source: string) {
  if (source === 'ai_scenario')  return <Brain size={13} style={{ color: '#7c3aed' }} />
  if (source === 'or_tools')     return <Zap   size={13} style={{ color: '#3b82f6' }} />
  return <ListOrdered size={13} style={{ color: '#6b7280' }} />
}

function sourceLabel(source: string, scenario_type: string | null) {
  if (source === 'ai_scenario' && scenario_type)
    return `AI · ${scenario_type.replace('_', ' ')}`
  if (source === 'or_tools') return 'OR-Tools'
  return 'Manual'
}

function fmtTime(min: number | null) {
  if (min == null) return '—'
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={18}
            fill={s <= value ? '#f59e0b' : 'none'}
            stroke={s <= value ? '#f59e0b' : '#6b7280'}
          />
        </button>
      ))}
    </div>
  )
}

// ─── expanded row ─────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: PlanHistoryOut }) {
  const [open,       setOpen]       = useState(false)
  const [showNote,   setShowNote]   = useState(false)
  const [noteText,   setNoteText]   = useState('')
  const [noteRating, setNoteRating] = useState(0)
  const qc = useQueryClient()

  const noteMutation = useMutation({
    mutationFn: () => addPlanNote(entry.id, noteText, noteRating || undefined),
    onSuccess: () => {
      toast.success('Note saved')
      setShowNote(false)
      setNoteText('')
      setNoteRating(0)
      qc.invalidateQueries({ queryKey: ['plan-history'] })
    },
    onError: () => toast.error('Failed to save note'),
  })

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      {/* Header row */}
      <button
        className="w-full px-5 py-4 flex items-center gap-3 text-left transition-colors"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ background: 'var(--c-elevated)' }}>
          {sourceIcon(entry.source)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--c-text)]">
            {sourceLabel(entry.source, entry.scenario_type)}
            <span className="ml-2 text-xs font-normal text-[var(--c-muted)]">{entry.plan_date}</span>
          </p>
          <p className="text-xs text-[var(--c-muted)] mt-0.5">
            {entry.total_routes ?? '—'} routes · {entry.total_orders ?? '—'} orders · {fmtTime(entry.total_time_min)}
            {entry.notes.length > 0 && (
              <span className="ml-2 text-[#f59e0b]">★ {entry.notes.length} note{entry.notes.length > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <span className="text-xs text-[var(--c-muted)] shrink-0">{fmtDate(entry.created_at)}</span>
        {open
          ? <ChevronDown size={14} style={{ color: 'var(--c-muted)' }} />
          : <ChevronRight size={14} style={{ color: 'var(--c-muted)' }} />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-[var(--c-border)] px-5 py-4 flex flex-col gap-4">
          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Orders',    value: entry.total_orders?.toString() ?? '—' },
              { label: 'Routes',    value: entry.total_routes?.toString() ?? '—' },
              { label: 'Coverage',  value: entry.coverage_pct != null ? `${entry.coverage_pct}%` : '—' },
              { label: 'Fuel cost', value: entry.est_fuel_cost_inr != null ? `₹${entry.est_fuel_cost_inr.toLocaleString()}` : '—' },
              { label: 'Time',      value: fmtTime(entry.total_time_min) },
              { label: 'AI confidence', value: entry.ai_confidence != null ? `${Math.round(entry.ai_confidence * 100)}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl" style={{ background: 'var(--c-elevated)' }}>
                <span className="text-[10px] uppercase tracking-wide text-[var(--c-muted)]">{label}</span>
                <span className="text-sm font-semibold font-mono text-[var(--c-text)]">{value}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {entry.notes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Dispatcher Notes</p>
              {entry.notes.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--c-elevated)' }}>
                  {n.rating && (
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} fill={s <= n.rating! ? '#f59e0b' : 'none'} stroke={s <= n.rating! ? '#f59e0b' : '#6b7280'} />
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-[var(--c-text)] leading-relaxed">{n.note}</p>
                  <span className="text-xs text-[var(--c-muted)] shrink-0 ml-auto">{fmtDate(n.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          <Button variant="secondary" size="sm" className="self-start" onClick={() => setShowNote(true)}>
            <MessageSquarePlus size={13} />
            Add note
          </Button>
        </div>
      )}

      {/* Add note modal */}
      <Modal open={showNote} onClose={() => setShowNote(false)} title="Add Note">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Rating</label>
            <StarRating value={noteRating} onChange={setNoteRating} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Note</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="How did this plan perform? Any issues?"
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)', outline: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-purple)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--c-border)')}
            />
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => noteMutation.mutate()}
              loading={noteMutation.isPending}
              disabled={!noteText.trim()}
            >
              Save note
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowNote(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanHistory() {
  const [dateFilter, setDateFilter] = useState('')

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['plan-history', dateFilter],
    queryFn:  () => listPlanHistory(dateFilter || undefined),
  })

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <History size={18} style={{ color: 'var(--c-accent)' }} />
            <h1 className="text-lg font-bold text-[var(--c-text)]">Plan History</h1>
            <span className="text-xs text-[var(--c-muted)]">Past planning sessions and dispatcher feedback</span>
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
          />
          {dateFilter && (
            <Button variant="secondary" size="sm" onClick={() => setDateFilter('')}>
              Clear
            </Button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--c-elevated)' }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            title="No plan history yet"
            subtitle="Plan history is recorded when you generate and confirm plans."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
