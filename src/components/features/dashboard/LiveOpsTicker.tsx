import { useMemo } from 'react'
import type { Order } from '../../../types'
import type { Driver } from '../../../types'

type TickerItem = {
  id:    string
  type:  'critical' | 'warning' | 'info' | 'success'
  label: string
}

type Props = {
  orders:  Order[]
  drivers: Driver[]
}

function ItemIcon({ type }: { type: TickerItem['type'] }) {
  if (type === 'info') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
  if (type === 'warning') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
  if (type === 'success') return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
  return (
    <span className="w-[5px] h-[5px] rounded-full shrink-0 inline-block" style={{ background: '#f87171' }} />
  )
}

const TYPE_COLORS: Record<TickerItem['type'], string> = {
  critical: '#f87171',
  warning:  '#f59e0b',
  info:     '#a78bfa',
  success:  '#34d399',
}

export function LiveOpsTicker({ orders, drivers }: Props) {
  const items = useMemo<TickerItem[]>(() => {
    const result: TickerItem[] = []

    const critical  = orders.filter((o) => o.priority === 'CRITICAL' && o.status === 'PENDING')
    const pending   = orders.filter((o) => o.status === 'PENDING')
    const delivered = orders.filter((o) => o.status === 'DELIVERED')
    const assigned  = orders.filter((o) => o.status === 'ASSIGNED')
    const available = drivers.filter((d) => d.is_active && d.availability_status === 'AVAILABLE')
    const onBreak   = drivers.filter((d) => d.availability_status === 'ON_BREAK')

    if (critical.length > 0)
      result.push({ id: 'crit', type: 'critical', label: `${critical.length} CRITICAL order${critical.length > 1 ? 's' : ''} need immediate dispatch` })
    if (assigned.length > 0)
      result.push({ id: 'ai', type: 'info', label: `AI plan active for ${assigned.length} routes` })
    if (pending.length > 0)
      result.push({ id: 'pend', type: 'warning', label: `SLA risk on ${pending.length} unassigned order${pending.length > 1 ? 's' : ''}` })
    if (available.length > 0)
      result.push({ id: 'avail', type: 'success', label: `${available.length} driver${available.length > 1 ? 's' : ''} available for assignment` })
    if (delivered.length > 0)
      result.push({ id: 'del', type: 'success', label: `${delivered.length} deliveries completed on time today` })
    if (onBreak.length > 0)
      result.push({ id: 'brk', type: 'info', label: `${onBreak.length} driver${onBreak.length > 1 ? 's' : ''} on break · back soon` })

    if (result.length === 0)
      result.push({ id: 'ok', type: 'success', label: 'All systems operational — fleet running smoothly' })

    return result
  }, [orders, drivers])

  const doubled  = [...items, ...items]
  const duration = Math.max(items.length * 10, 24)

  return (
    <div
      className="flex items-center rounded-xl overflow-hidden"
      style={{
        background: 'var(--c-surface)',
        border:     '1px solid var(--c-border)',
        height:     40,
      }}
    >
      {/* "LIVE OPS" badge */}
      <div
        className="flex items-center gap-2 px-3 shrink-0 h-full"
        style={{ borderRight: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full notif-pulse relative shrink-0"
          style={{ background: '#f87171' }}
        />
        <span className="text-[10px] font-bold tracking-[1.5px] uppercase whitespace-nowrap" style={{ color: 'var(--c-muted)' }}>
          Live Ops
        </span>
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
          {doubled.map((item, idx) => (
            <span
              key={`${item.id}-${idx}`}
              className="inline-flex items-center gap-2 px-5 h-full text-[12px]"
              style={{ borderRight: '1px solid var(--c-border)', color: TYPE_COLORS[item.type] }}
            >
              <ItemIcon type={item.type} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
