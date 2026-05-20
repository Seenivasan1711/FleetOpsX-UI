import { useQuery } from '@tanstack/react-query'
import { fetchRouteTimeline } from '../../../api/analytics'
import { useMockData }        from '../../../mock/config'
import { MOCK_ROUTES }        from '../../../mock/data'
import type { MockRoute, RouteSegment } from '../../../mock/data'

// 07:00–18:00 operating window
const DAY_START = 7  * 60   // 420 min
const DAY_END   = 18 * 60   // 1080 min
const DAY_SPAN  = DAY_END - DAY_START  // 660 min

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

const NAME_COL_W = 148

// Colors assigned to live drivers by index when not mocked
const DRIVER_COLORS = [
  '#8b5cf6', '#34d399', '#60a5fa', '#f472b6',
  '#f59e0b', '#22d3ee', '#818cf8', '#fb923c',
]

function pctOf(mins: number) {
  return `${(((mins - DAY_START) / DAY_SPAN) * 100).toFixed(4)}%`
}

function wPctOf(start: number, end: number) {
  return `${(((end - start) / DAY_SPAN) * 100).toFixed(4)}%`
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Convert an ISO timestamp string to minutes-from-midnight (local time). */
function isoToMins(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

type BlockState = 'past' | 'active' | 'future'

function classifyBlock(nowMins: number, start: number, end: number): BlockState {
  if (nowMins > end)    return 'past'
  if (nowMins >= start) return 'active'
  return 'future'
}

function stripesBg(color: string) {
  return `repeating-linear-gradient(-45deg, ${hexToRgba(color, 0.45)} 0px, ${hexToRgba(color, 0.45)} 3px, ${hexToRgba(color, 0.15)} 3px, ${hexToRgba(color, 0.15)} 8px)`
}

// Shift all MOCK_ROUTES segments so the midpoint of activity aligns with nowMins.
// This ensures the demo always shows past + active + future bars regardless of time of day.
function shiftedMockRoutes(nowMins: number): MockRoute[] {
  const allMins   = MOCK_ROUTES.flatMap(r => r.segments.flatMap(s => [s.start, s.end]))
  const staticMid = (Math.min(...allMins) + Math.max(...allMins)) / 2
  const targetMid = Math.max(DAY_START + 90, Math.min(DAY_END - 90, nowMins))
  const shift     = Math.round(targetMid - staticMid)
  return MOCK_ROUTES.map(r => ({
    ...r,
    segments: (r.segments
      .map(s => ({
        ...s,
        start: Math.max(DAY_START, Math.min(DAY_END, s.start + shift)),
        end:   Math.max(DAY_START, Math.min(DAY_END, s.end   + shift)),
      }))
      .filter(s => s.end > s.start)) as MockRoute['segments'],
  }))
}

export function RouteTimeline({ planDate }: { planDate?: string }) {
  const isMock  = useMockData()
  const now     = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const showNow = nowMins >= DAY_START && nowMins <= DAY_END

  const { data: timelineData } = useQuery({
    queryKey: ['route-timeline', planDate],
    queryFn:  () => fetchRouteTimeline(planDate ?? new Date().toISOString().slice(0, 10)),
    enabled:  !isMock,
    refetchInterval: 30_000,
  })

  // Map API DriverTimeline[] → MockRoute shape for unified rendering
  const routes: MockRoute[] = isMock
    ? shiftedMockRoutes(nowMins)
    : (timelineData ?? []).map((tl, idx) => {
        const bStartMins = tl.break_start ? isoToMins(tl.break_start) : null
        const bEndMins   = tl.break_end   ? isoToMins(tl.break_end)   : null

        const allStopMins = tl.stops
          .flatMap(s => [
            s.start_time ? isoToMins(s.start_time) : null,
            s.end_time   ? isoToMins(s.end_time)   : null,
          ])
          .filter((m): m is number => m !== null)

        const segments: RouteSegment[] = []

        if (bStartMins != null && bEndMins != null) {
          const preStops  = allStopMins.filter(m => m <= bStartMins)
          const postStops = allStopMins.filter(m => m >= bEndMins)

          if (preStops.length) {
            segments.push({
              type:  'route',
              start: Math.min(...preStops),
              end:   Math.max(...preStops),
              stops: tl.stops.filter(s => s.start_time && isoToMins(s.start_time) <= bStartMins).length,
            })
          }

          segments.push({ type: 'break', start: bStartMins, end: bEndMins })

          if (postStops.length) {
            segments.push({
              type:  'route',
              start: Math.min(...postStops),
              end:   Math.max(...postStops),
              stops: tl.stops.filter(s => s.start_time && isoToMins(s.start_time) >= bEndMins).length,
            })
          }
        } else {
          if (allStopMins.length) {
            segments.push({
              type:  'route',
              start: Math.min(...allStopMins),
              end:   Math.max(...allStopMins),
              stops: tl.stops.length,
            })
          } else {
            segments.push({ type: 'route', start: DAY_START, end: DAY_START + 60, stops: 0 })
          }
        }

        return {
          id:       tl.driver_id,
          name:     tl.driver_name,
          color:    DRIVER_COLORS[idx % DRIVER_COLORS.length] ?? '#8b5cf6',
          segments,
        }
      })

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--c-border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[var(--c-text)]">Today's Route Timeline</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
            {routes.length} active routes · auto-refreshes every 30s
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[1px] uppercase px-3 py-1.5 rounded-full"
          style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)' }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full shrink-0"
            style={{ background: 'var(--c-accent)', animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          LIVE
        </span>
      </div>

      {/* Timeline body */}
      <div className="px-5 pt-5 pb-4 overflow-x-auto">
        <div style={{ minWidth: 560 }}>

          {/* Hour axis */}
          <div className="flex" style={{ paddingLeft: NAME_COL_W, marginBottom: 10 }}>
            <div className="relative flex-1">
              {HOURS.map((h) => (
                <span
                  key={h}
                  className="absolute text-[10px] font-mono select-none"
                  style={{
                    left:      `${(((h * 60) - DAY_START) / DAY_SPAN) * 100}%`,
                    transform: 'translateX(-50%)',
                    color:     'var(--c-subtle)',
                  }}
                >
                  {`${String(h).padStart(2, '0')}:00`}
                </span>
              ))}
            </div>
          </div>

          {/* Driver rows */}
          {routes.map((route, idx) => {
            const lastSeg   = route.segments[route.segments.length - 1]
            const allDone   = lastSeg ? nowMins > lastSeg.end : false
            const anyActive = route.segments.some(s => classifyBlock(nowMins, s.start, s.end) === 'active')

            const dotColor = anyActive  ? '#34d399'
                           : allDone    ? 'var(--c-subtle)'
                           :              'rgba(148,163,184,0.4)'

            return (
            <div
              key={route.id}
              className="flex items-center"
              style={{
                paddingTop:    10,
                paddingBottom: 10,
                borderBottom:  idx < routes.length - 1 ? '1px dashed var(--c-border)' : 'none',
              }}
            >
              {/* Driver name */}
              <div
                className="flex items-center gap-2.5 shrink-0"
                style={{ width: NAME_COL_W }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: dotColor, transition: 'background 0.3s' }}
                />
                <span
                  className="text-[13px] font-medium truncate"
                  style={{
                    color:          allDone ? 'var(--c-muted)' : 'var(--c-text)',
                    textDecoration: allDone ? 'line-through'   : 'none',
                    opacity:        allDone ? 0.55 : 1,
                    transition:     'all 0.3s',
                  }}
                >
                  {route.name}
                </span>
              </div>

              {/* Gantt track */}
              <div
                className="relative flex-1 overflow-hidden"
                style={{ height: 34, borderRadius: 8, background: 'var(--c-elevated)' }}
              >
                {route.segments.map((seg, sIdx) => {
                  const state = classifyBlock(nowMins, seg.start, seg.end)

                  if (seg.type === 'route') {
                    const bg = state === 'past'   ? stripesBg(route.color)
                             : state === 'future'  ? hexToRgba(route.color, 0.45)
                             :                       hexToRgba(route.color, 1)
                    return (
                      <div
                        key={sIdx}
                        className="absolute top-[5px] bottom-[5px] rounded-md flex items-center px-2.5"
                        style={{ left: pctOf(seg.start), width: wPctOf(seg.start, seg.end), background: bg, transition: 'background 0.4s' }}
                      >
                        <span
                          className="text-[11px] font-semibold whitespace-nowrap truncate select-none"
                          style={{
                            color:   state === 'active' ? '#fff' : route.color,
                            opacity: state === 'past'   ? 0.6    : 1,
                          }}
                        >
                          {seg.stops} stops
                        </span>
                      </div>
                    )
                  }

                  // break segment — only render when it has non-zero width
                  if (seg.end <= seg.start) return null
                  const bg = state === 'past'   ? stripesBg(route.color)
                           : state === 'future'  ? hexToRgba(route.color, 0.28)
                           :                       hexToRgba(route.color, 0.92)
                  return (
                    <div
                      key={sIdx}
                      className="absolute top-[5px] bottom-[5px] rounded-md flex items-center justify-center"
                      style={{ left: pctOf(seg.start), width: wPctOf(seg.start, seg.end), background: bg, transition: 'background 0.4s' }}
                    >
                      <span
                        className="text-[9px] font-semibold text-center leading-[1.2] select-none"
                        style={{
                          color:   state === 'active' ? '#fff' : route.color,
                          opacity: state === 'past'   ? 0.55   : 1,
                        }}
                      >
                        depot<br />break
                      </span>
                    </div>
                  )
                })}

                {/* Current time marker */}
                {showNow && (
                  <div
                    className="absolute top-0 bottom-0 z-10 pointer-events-none"
                    style={{
                      left:         pctOf(nowMins),
                      width:        2,
                      background:   '#f87171',
                      borderRadius: 1,
                      boxShadow:    '0 0 5px rgba(248,113,113,0.55)',
                    }}
                  />
                )}
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
