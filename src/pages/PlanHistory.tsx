import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { History, Star, MessageSquarePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal }      from '../components/ui/Modal'
import { listPlanHistory, addPlanNote } from '../api/planHistory'
import type { PlanHistoryOut } from '../api/planHistory'
import { useMockData } from '../mock/config'

// ── Mock data (matches Figma Image #26) ──────────────────────────────────────

const MOCK_HISTORY = [
  { id: 'ph-1', type: 'Balanced',   routes: 11, datetime: '10 May 2026 · 07:42', orders: 118, drivers: 13, otd: 94.6, savedHr: 4.2 },
  { id: 'ph-2', type: 'Fastest',    routes: 12, datetime: '09 May 2026 · 07:38', orders: 97,  drivers: 14, otd: 92.1, savedHr: 3.5 },
  { id: 'ph-3', type: 'Economical', routes: 9,  datetime: '08 May 2026 · 07:50', orders: 84,  drivers: 11, otd: 96.3, savedHr: 5.1 },
  { id: 'ph-4', type: 'Balanced',   routes: 10, datetime: '07 May 2026 · 07:35', orders: 112, drivers: 13, otd: 91.7, savedHr: 3.8 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const SCENARIO_LABELS: Record<string, string> = {
  balanced:    'Balanced',
  fastest:     'Fastest',
  economical:  'Economical',
  driver_fair: 'Driver Fair',
}

function planTypeLabel(source: string, scenarioType: string | null): string {
  if (source === 'ai_scenario' && scenarioType) return SCENARIO_LABELS[scenarioType] ?? scenarioType
  if (source === 'or_tools') return 'OR-Tools'
  return 'Manual'
}

function fmtDatetime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${time}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlanIcon() {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: 'rgba(124,58,237,0.18)' }}
    >
      <History size={16} style={{ color: '#7c3aed' }} />
    </div>
  )
}

function MetricCol({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center min-w-[52px]">
      <span className="text-[9px] uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--c-subtle)' }}>
        {label}
      </span>
      <span className="text-[13px] font-bold tabular-nums text-[var(--c-text)]">{children}</span>
    </div>
  )
}

function OtdValue({ value }: { value: number }) {
  const green = value >= 94
  return (
    <span className="text-[13px] font-bold tabular-nums" style={{ color: green ? '#34d399' : '#f59e0b' }}>
      {value.toFixed(1)}%
    </span>
  )
}

function SavedValue({ hr }: { hr: number }) {
  return (
    <span className="text-[13px] font-bold tabular-nums" style={{ color: '#34d399' }}>
      +{hr.toFixed(1)} hr
    </span>
  )
}

function ViewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:opacity-80"
      style={{
        background: 'var(--c-elevated)',
        border:     '1px solid var(--c-border)',
        color:      'var(--c-text)',
      }}
    >
      View
    </button>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <Star size={18} fill={s <= value ? '#f59e0b' : 'none'} stroke={s <= value ? '#f59e0b' : '#6b7280'} />
        </button>
      ))}
    </div>
  )
}

// ── Live detail modal ─────────────────────────────────────────────────────────

function LiveDetailModal({ entry, onClose }: { entry: PlanHistoryOut; onClose: () => void }) {
  const [noteText,   setNoteText]   = useState('')
  const [noteRating, setNoteRating] = useState(0)
  const [showNote,   setShowNote]   = useState(false)
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

  const typeLabel = planTypeLabel(entry.source, entry.scenario_type)
  const datetime  = fmtDatetime(entry.created_at)

  return (
    <Modal open onClose={onClose} title={`${typeLabel} · ${entry.total_routes ?? '—'} routes`}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-[var(--c-muted)]">{datetime}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Orders',        value: entry.total_orders?.toString()  ?? '—' },
            { label: 'Routes',        value: entry.total_routes?.toString()  ?? '—' },
            { label: 'OTD %',         value: entry.coverage_pct != null ? `${entry.coverage_pct}%` : '—' },
            { label: 'Fuel est.',     value: entry.est_fuel_cost_inr != null ? `₹${entry.est_fuel_cost_inr.toLocaleString('en-IN')}` : '—' },
            { label: 'Time',          value: entry.total_time_min != null ? `${Math.floor(entry.total_time_min / 60)}h ${entry.total_time_min % 60}m` : '—' },
            { label: 'AI confidence', value: entry.ai_confidence != null ? `${Math.round(entry.ai_confidence * 100)}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl" style={{ background: 'var(--c-elevated)' }}>
              <span className="text-[9px] uppercase tracking-wide text-[var(--c-muted)]">{label}</span>
              <span className="text-sm font-semibold font-mono text-[var(--c-text)]">{value}</span>
            </div>
          ))}
        </div>

        {entry.notes.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--c-muted)]">Dispatcher Notes</p>
            {entry.notes.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--c-elevated)' }}>
                {n.rating && (
                  <div className="flex gap-0.5 shrink-0">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={12} fill={s <= n.rating! ? '#f59e0b' : 'none'} stroke={s <= n.rating! ? '#f59e0b' : '#6b7280'} />
                    ))}
                  </div>
                )}
                <p className="text-sm text-[var(--c-text)] leading-relaxed flex-1">{n.note}</p>
                <span className="text-xs text-[var(--c-muted)] shrink-0">{fmtDatetime(n.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {showNote ? (
          <div className="flex flex-col gap-3 pt-1">
            <StarRating value={noteRating} onChange={setNoteRating} />
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
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => noteMutation.mutate()} loading={noteMutation.isPending} disabled={!noteText.trim()}>
                Save note
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setShowNote(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" className="self-start" onClick={() => setShowNote(true)}>
            <MessageSquarePlus size={13} />
            Add note
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ── Mock detail modal ─────────────────────────────────────────────────────────

function MockDetailModal({ entry, onClose }: { entry: typeof MOCK_HISTORY[number]; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`${entry.type} · ${entry.routes} routes`}>
      <p className="text-xs text-[var(--c-muted)] mb-4">{entry.datetime}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Orders',  value: String(entry.orders)          },
          { label: 'Drivers', value: String(entry.drivers)         },
          { label: 'OTD %',   value: `${entry.otd.toFixed(1)}%`    },
          { label: 'Saved',   value: `+${entry.savedHr.toFixed(1)} hr` },
          { label: 'Routes',  value: String(entry.routes)          },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl" style={{ background: 'var(--c-elevated)' }}>
            <span className="text-[9px] uppercase tracking-wide text-[var(--c-muted)]">{label}</span>
            <span className="text-sm font-semibold font-mono text-[var(--c-text)]">{value}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlanHistory() {
  const isMock = useMockData()
  const [dateFilter, setDateFilter] = useState('')
  const [viewEntry,  setViewEntry]  = useState<typeof MOCK_HISTORY[number] | null>(null)
  const [viewLive,   setViewLive]   = useState<PlanHistoryOut | null>(null)

  const { data: liveHistory = [], isLoading } = useQuery({
    queryKey: ['plan-history', dateFilter],
    queryFn:  () => listPlanHistory(dateFilter || undefined),
    enabled:  !isMock,
  })

  const showLoading = !isMock && isLoading
  const showEmpty   = !isMock && !isLoading && liveHistory.length === 0

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Outer card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>

          {/* Card header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--c-border)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--c-text)]">Plan history</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                Past dispatch plans · auto-saved at generation
              </p>
            </div>
            {!isMock && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                />
                {dateFilter && (
                  <Button variant="secondary" size="sm" onClick={() => setDateFilter('')}>Clear</Button>
                )}
              </div>
            )}
          </div>

          {/* Rows */}
          {showLoading ? (
            <div className="flex flex-col">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[68px] mx-5 my-3 rounded-xl animate-pulse"
                  style={{ background: 'var(--c-elevated)' }}
                />
              ))}
            </div>
          ) : showEmpty ? (
            <div className="p-6">
              <EmptyState
                title="No plan history yet"
                subtitle="Plan history is recorded when you generate and confirm plans."
              />
            </div>
          ) : isMock ? (
            MOCK_HISTORY.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < MOCK_HISTORY.length - 1 ? '1px solid var(--c-border)' : undefined }}
              >
                <PlanIcon />

                {/* Title + datetime */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[var(--c-text)]">
                    {entry.type} · {entry.routes} routes
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                    {entry.datetime}
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-5 sm:gap-7">
                  <MetricCol label="Orders">{entry.orders}</MetricCol>
                  <MetricCol label="Drivers">{entry.drivers}</MetricCol>
                  <MetricCol label="OTD"><OtdValue value={entry.otd} /></MetricCol>
                  <MetricCol label="Saved"><SavedValue hr={entry.savedHr} /></MetricCol>
                </div>

                <ViewButton onClick={() => setViewEntry(entry)} />
              </div>
            ))
          ) : (
            liveHistory.map((entry, i) => {
              const typeLabel = planTypeLabel(entry.source, entry.scenario_type)
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i < liveHistory.length - 1 ? '1px solid var(--c-border)' : undefined }}
                >
                  <PlanIcon />

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[var(--c-text)]">
                      {typeLabel} · {entry.total_routes ?? '—'} routes
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
                      {fmtDatetime(entry.created_at)}
                      {entry.notes.length > 0 && (
                        <span className="ml-2 text-[#f59e0b]">★ {entry.notes.length}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 sm:gap-7">
                    <MetricCol label="Orders">{entry.total_orders ?? '—'}</MetricCol>
                    <MetricCol label="Routes">{entry.total_routes ?? '—'}</MetricCol>
                    <MetricCol label="OTD">
                      {entry.coverage_pct != null
                        ? <OtdValue value={entry.coverage_pct} />
                        : <span className="text-[var(--c-muted)]">—</span>}
                    </MetricCol>
                    <MetricCol label="Fuel est.">
                      {entry.est_fuel_cost_inr != null
                        ? `₹${entry.est_fuel_cost_inr.toLocaleString('en-IN')}`
                        : '—'}
                    </MetricCol>
                  </div>

                  <ViewButton onClick={() => setViewLive(entry)} />
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {viewEntry  && <MockDetailModal entry={viewEntry}  onClose={() => setViewEntry(null)} />}
      {viewLive   && <LiveDetailModal entry={viewLive}   onClose={() => setViewLive(null)}  />}
    </AppShell>
  )
}
