import { useRef, useState } from 'react'
import { Icon } from '../ui/icons'
import { useOutsideClick } from '../../hooks/useOutsideClick'

type Notification = {
  title: string
  time:  string
  read:  boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { title: 'Orders pending dispatch for today',          time: 'Just now',   read: false },
  { title: 'Route plan generation available',            time: '2 min ago',  read: false },
  { title: 'Koramangala Depot: drivers checked in',      time: '18 min ago', read: true  },
  { title: 'ETL last ran — analytics data refreshed',    time: '1 hr ago',   read: true  },
]

export const NotificationBell = () => {
  const [open, setOpen]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false))

  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-[38px] h-[38px] flex items-center justify-center rounded-[10px] text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-elevated)] border border-transparent hover:border-[var(--c-border)] transition-all duration-150"
        style={open ? { background: 'var(--c-elevated)', borderColor: 'var(--c-border)' } : undefined}
      >
        <Icon.Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute top-[7px] right-[7px] w-2 h-2 rounded-full border-2"
            style={{ background: 'var(--c-red)', borderColor: 'var(--c-sidebar-bg)' }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 w-80 rounded-2xl overflow-hidden z-[1000]"
          style={{
            background:  'var(--c-surface)',
            border:      '1px solid var(--c-border)',
            boxShadow:   '0 24px 64px rgba(0,0,0,0.45)',
            animation:   'dropdown-in 0.15s ease',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--c-border)]">
            <span className="text-sm font-bold text-[var(--c-text)]">Notifications</span>
            {unread > 0 && (
              <span className="text-xs font-semibold text-[var(--c-accent)]">{unread} new</span>
            )}
          </div>

          {MOCK_NOTIFICATIONS.map((n, i) => (
            <div
              key={i}
              className="flex gap-3 items-start px-4 py-3"
              style={{
                borderBottom: i < MOCK_NOTIFICATIONS.length - 1 ? '1px solid var(--c-border)' : 'none',
                background:   n.read ? 'transparent' : 'var(--c-accent-dim)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full mt-[5px] shrink-0 block"
                style={{ background: n.read ? 'var(--c-subtle)' : 'var(--c-accent)' }}
              />
              <div>
                <p className={`text-[13px] text-[var(--c-text)] ${n.read ? 'font-normal' : 'font-medium'}`}>
                  {n.title}
                </p>
                <p className="text-[11px] text-[var(--c-muted)] mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
