import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Collapsible } from '../../ui/Collapsible'
import { EmptyState } from '../../ui/EmptyState'
import { PriorityBadge } from '../../ui/Badge'
import { fetchAtRiskStops } from '../../../api/sla'
import { QUERY_KEYS } from '../../../lib/utils/constants'

type Props = { planDate: string }

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
          {stops.map((s) => (
            <div
              key={s.stop_id}
              className="flex items-start justify-between gap-3 p-3 rounded-xl"
              style={{
                background:   'var(--c-red-dim)',
                border:       '1px solid rgba(248,113,113,0.2)',
              }}
            >
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
          ))}
        </div>
      )}
    </Collapsible>
  )
}
