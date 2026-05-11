import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, UserCheck, Bell, RotateCcw, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import { Collapsible } from '../../ui/Collapsible'
import { EmptyState } from '../../ui/EmptyState'
import { PriorityBadge } from '../../ui/Badge'
import { fetchAtRiskStops } from '../../../api/sla'
import { QUERY_KEYS } from '../../../lib/utils/constants'

type Props = { planDate: string }

type Action = { label: string; icon: React.ReactNode; onClick: () => void }

function ActionChip({ label, icon, onClick }: Action) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
      style={{
        background: 'var(--c-surface)',
        border:     '1px solid var(--c-border)',
        color:      'var(--c-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background  = 'var(--c-accent-dim)'
        e.currentTarget.style.borderColor = 'var(--c-accent)'
        e.currentTarget.style.color       = 'var(--c-accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background  = 'var(--c-surface)'
        e.currentTarget.style.borderColor = 'var(--c-border)'
        e.currentTarget.style.color       = 'var(--c-muted)'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

export const AtRiskPanel = ({ planDate }: Props) => {
  const { data: stops = [] } = useQuery({
    queryKey:        QUERY_KEYS.slaAtRisk(planDate),
    queryFn:         () => fetchAtRiskStops(planDate),
    refetchInterval: 60_000,
  })

  return (
    <Collapsible
      title="At-Risk Deliveries"
      icon={<AlertTriangle size={16} />}
      badge={stops.length}
      badgeVariant={stops.length > 0 ? 'danger' : undefined}
      refreshLabel="refreshes every 60s"
    >
      {stops.length === 0 ? (
        <EmptyState
          title="All deliveries on track"
          subtitle="No at-risk stops detected — system running smoothly."
        />
      ) : (
        <div className="p-4 flex flex-col gap-2">
          {stops.map((s) => {
            const actions: Action[] = [
              { label: 'Reassign',       icon: <UserCheck size={10} />,  onClick: () => toast('AI: Reassigning to nearest driver…',            { icon: '🤖' }) },
              { label: 'Notify Driver',  icon: <Bell size={10} />,       onClick: () => toast(`Notified ${s.driver_name}`,                     { icon: '🔔' }) },
              { label: 'Reschedule',     icon: <RotateCcw size={10} />,  onClick: () => toast('AI: Finding next available window…',             { icon: '📅' }) },
              { label: 'Navigate',       icon: <Navigation size={10} />, onClick: () => toast('Opening fastest route in dispatch system…',      { icon: '🗺️' }) },
            ]
            return (
              <div
                key={s.stop_id}
                className="flex flex-col gap-2.5 p-3 rounded-xl"
                style={{
                  background: 'var(--c-red-dim)',
                  border:     '1px solid rgba(248,113,113,0.2)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--c-text)] truncate">
                        {s.delivery_address}
                      </span>
                      <PriorityBadge priority={s.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'} />
                    </div>
                    <p className="text-xs text-[var(--c-muted)] mt-0.5">
                      Driver: <span className="font-medium">{s.driver_name}</span>
                      {' · '}
                      Window ends: <span className="font-medium font-mono">{s.time_window_end}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[var(--c-red)]">+{s.overdue_by_minutes} min</p>
                    <p className="text-xs text-[var(--c-muted)]">ETA ~{s.eta_minutes % 60}min</p>
                  </div>
                </div>

                {/* AI action chips */}
                <div className="flex flex-wrap gap-1.5">
                  {actions.map((a) => <ActionChip key={a.label} {...a} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Collapsible>
  )
}
