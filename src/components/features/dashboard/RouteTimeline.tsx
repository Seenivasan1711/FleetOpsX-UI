import { useQuery } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { fetchRouteTimeline } from '../../../api/analytics'
import { QUERY_KEYS } from '../../../lib/utils/constants'

type Props = { planDate: string }

const STATUS_COLORS: Record<string, string> = {
  DELIVERED:  'var(--c-green)',
  IN_TRANSIT: 'var(--c-accent)',
  PENDING:    'var(--c-orange)',
  ASSIGNED:   'var(--c-purple)',
  FAILED:     'var(--c-red)',
}

function timeToMinutes(t: string | null): number | null {
  if (!t) return null
  const parts = t.slice(11, 16).split(':').map(Number)
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0
  return h * 60 + m
}

export function RouteTimeline({ planDate }: Props) {
  const { data: timelines = [], isLoading } = useQuery({
    queryKey:     QUERY_KEYS.routeTimeline(planDate),
    queryFn:      () => fetchRouteTimeline(planDate),
    staleTime:    60_000,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-accent-dim)' }}>
            <Clock size={14} style={{ color: 'var(--c-accent)' }} />
          </div>
          <p className="text-sm font-semibold text-[var(--c-text)]">Today's Route Timeline</p>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[1,2,3].map((i) => (
            <div key={i} className="skeleton h-8 rounded-xl" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (timelines.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--c-accent-dim)' }}>
            <Clock size={14} style={{ color: 'var(--c-accent)' }} />
          </div>
          <p className="text-sm font-semibold text-[var(--c-text)] flex-1">Today's Route Timeline</p>
          <span className="text-[10px] font-mono px-2 py-1 rounded-full" style={{ background: 'var(--c-elevated)', color: 'var(--c-muted)' }}>
            No data
          </span>
        </div>
        <p className="p-5 text-sm text-[var(--c-muted)] text-center py-8">
          No route plans generated for today.
        </p>
      </div>
    )
  }

  // Determine time bounds across all stops
  const allMins: number[] = []
  timelines.forEach((tl) => tl.stops.forEach((s) => {
    const start = timeToMinutes(s.start_time)
    const end   = timeToMinutes(s.end_time)
    if (start !== null) allMins.push(start)
    if (end   !== null) allMins.push(end)
  }))
  const dayStart = allMins.length ? Math.min(...allMins) - 30 : 480
  const dayEnd   = allMins.length ? Math.max(...allMins) + 30 : 1080
  const daySpan  = dayEnd - dayStart || 60

  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60) % 24
    const m = mins % 60
    return `${h}:${String(m).padStart(2, '0')}`
  }

  // Hour tick marks
  const firstHour = Math.ceil(dayStart / 60)
  const lastHour  = Math.floor(dayEnd / 60)
  const hours     = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--c-accent-dim)' }}>
          <Clock size={14} style={{ color: 'var(--c-accent)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--c-text)] flex-1">Today's Route Timeline</p>
        <span className="text-[10px] font-mono px-2 py-1 rounded-full" style={{ background: 'var(--c-green-dim)', color: 'var(--c-green)' }}>
          {timelines.length} drivers
        </span>
      </div>

      <div className="p-4 overflow-x-auto">
        {/* Time axis */}
        <div className="flex mb-2" style={{ paddingLeft: 110 }}>
          <div className="relative flex-1" style={{ minWidth: 400 }}>
            {hours.map((h) => (
              <span
                key={h}
                className="absolute text-[9px] text-[var(--c-subtle)] font-mono"
                style={{ left: `${((h * 60 - dayStart) / daySpan) * 100}%`, transform: 'translateX(-50%)' }}
              >
                {fmt(h * 60)}
              </span>
            ))}
          </div>
        </div>

        {/* Driver rows */}
        <div className="flex flex-col gap-2">
          {timelines.slice(0, 8).map((tl) => (
            <div key={tl.driver_id} className="flex items-center gap-3">
              {/* Driver name */}
              <div className="shrink-0 flex items-center gap-2" style={{ width: 100 }}>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                  style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)' }}
                >
                  {tl.driver_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
                </div>
                <span className="text-[11px] text-[var(--c-muted)] truncate">{tl.driver_name.split(' ')[0]}</span>
              </div>

              {/* Gantt track */}
              <div className="relative flex-1 h-7 rounded-lg overflow-visible" style={{ background: 'var(--c-elevated)', minWidth: 400 }}>
                {tl.stops.map((stop) => {
                  const start = timeToMinutes(stop.start_time)
                  const end   = timeToMinutes(stop.end_time)
                  if (start === null) return null
                  const left    = ((start - dayStart) / daySpan) * 100
                  const width   = end !== null ? ((end - start) / daySpan) * 100 : 2
                  const color   = STATUS_COLORS[stop.status] ?? 'var(--c-muted)'

                  return (
                    <div
                      key={stop.order_id}
                      title={`${stop.address} · ${stop.status}${stop.start_time ? ` · ${stop.start_time.slice(11,16)}` : ''}`}
                      className="absolute top-[4px] h-[19px] rounded-md cursor-default transition-opacity hover:opacity-80"
                      style={{
                        left:       `${Math.max(0, left)}%`,
                        width:      `${Math.max(width, 1.5)}%`,
                        background: color,
                        opacity:    0.85,
                        minWidth:   6,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--c-border)' }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: color, opacity: 0.85 }} />
              <span className="text-[10px] text-[var(--c-muted)]">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
