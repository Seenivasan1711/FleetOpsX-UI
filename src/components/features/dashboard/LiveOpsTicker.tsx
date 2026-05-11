import { useMemo } from 'react'
import type { Order } from '../../../types'
import type { Driver } from '../../../types'

type TickerItem = {
  id:    string
  type:  'critical' | 'warning' | 'info' | 'success'
  label: string
}

const TYPE_COLORS = {
  critical: { text: 'var(--c-red)',    bg: 'rgba(248,113,113,0.12)',  dot: '#f87171' },
  warning:  { text: 'var(--c-orange)', bg: 'rgba(245,158,11,0.12)',   dot: '#f59e0b' },
  info:     { text: 'var(--c-accent)', bg: 'rgba(139,92,246,0.12)',   dot: '#8b5cf6' },
  success:  { text: 'var(--c-green)',  bg: 'rgba(52,211,153,0.12)',   dot: '#34d399' },
}

type Props = {
  orders:  Order[]
  drivers: Driver[]
}

export function LiveOpsTicker({ orders, drivers }: Props) {
  const items = useMemo<TickerItem[]>(() => {
    const result: TickerItem[] = []

    const critical  = orders.filter((o) => o.priority === 'CRITICAL' && o.status === 'PENDING')
    const pending   = orders.filter((o) => o.status === 'PENDING')
    const delivered = orders.filter((o) => o.status === 'DELIVERED')
    const available = drivers.filter((d) => d.is_active && d.availability_status === 'AVAILABLE')
    const onBreak   = drivers.filter((d) => d.availability_status === 'ON_BREAK')

    if (critical.length > 0)
      result.push({ id: 'crit', type: 'critical', label: `${critical.length} CRITICAL order${critical.length > 1 ? 's' : ''} awaiting dispatch` })
    if (pending.length > 0)
      result.push({ id: 'pend', type: 'warning', label: `${pending.length} unassigned order${pending.length > 1 ? 's' : ''} need routing` })
    if (available.length > 0)
      result.push({ id: 'avail', type: 'success', label: `${available.length} driver${available.length > 1 ? 's' : ''} available for assignment` })
    if (delivered.length > 0)
      result.push({ id: 'del', type: 'info', label: `${delivered.length} deliveries completed today` })
    if (onBreak.length > 0)
      result.push({ id: 'brk', type: 'info', label: `${onBreak.length} driver${onBreak.length > 1 ? 's' : ''} currently on break` })

    if (result.length === 0)
      result.push({ id: 'ok', type: 'success', label: 'All systems operational — fleet running smoothly' })

    return result
  }, [orders, drivers])

  // Duplicate for seamless loop
  const doubled = [...items, ...items]

  const totalItems = items.length
  const duration   = Math.max(totalItems * 8, 20)

  return (
    <div
      className="flex items-center rounded-xl overflow-hidden"
      style={{
        background: 'var(--c-surface)',
        border:     '1px solid var(--c-border)',
        height:     36,
      }}
    >
      {/* "LIVE" badge */}
      <div
        className="flex items-center gap-2 px-3 shrink-0 h-full"
        style={{ borderRight: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full notif-pulse relative"
          style={{ background: 'var(--c-red)', flexShrink: 0 }}
        />
        <span className="text-[10px] font-bold tracking-[1px] text-[var(--c-muted)] uppercase">Live</span>
      </div>

      {/* Scrolling strip */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div
          className="flex items-center h-full whitespace-nowrap"
          style={{
            animation: `ticker-scroll ${duration}s linear infinite`,
            width: 'max-content',
          }}
        >
          {doubled.map((item, idx) => {
            const c = TYPE_COLORS[item.type]
            return (
              <span
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2 px-4 h-full"
                style={{ borderRight: '1px solid var(--c-border)' }}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{ background: c.dot }}
                />
                <span className="text-[12px]" style={{ color: c.text }}>{item.label}</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
