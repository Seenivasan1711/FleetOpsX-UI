import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, User, Settings, Keyboard, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { initials } from '../../lib/utils/format'

type UserMenuProps = {
  onShowShortcuts: () => void
}

export const UserMenu = ({ onShowShortcuts }: UserMenuProps) => {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const navigate        = useNavigate()
  const { user, clearAuth } = useAuthStore()

  useOutsideClick(ref, () => setOpen(false))

  const displayName = user?.full_name ?? 'Dispatcher'
  const avatar      = initials(displayName)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const items = [
    { label: 'Profile',            icon: User,     action: () => {} },
    { label: 'Settings',           icon: Settings, action: () => navigate('/settings') },
    { label: 'Keyboard Shortcuts', icon: Keyboard, action: onShowShortcuts },
    { label: 'Sign out',           icon: LogOut,   action: handleLogout, danger: true },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-[10px] text-[var(--c-text)] hover:bg-[var(--c-elevated)] border border-transparent hover:border-[var(--c-border)] transition-all duration-150"
        style={open ? { background: 'var(--c-elevated)', borderColor: 'var(--c-border)' } : undefined}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--c-accent) 0%, var(--c-purple, #a78bfa) 100%)' }}
        >
          {avatar}
        </div>
        <span className="text-[13px] font-medium whitespace-nowrap">{displayName}</span>
        <ChevronDown size={14} className="text-[var(--c-muted)]" />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 w-52 rounded-xl p-1.5 z-[1000]"
          style={{
            background: 'var(--c-surface)',
            border:     '1px solid var(--c-border)',
            boxShadow:  '0 24px 64px rgba(0,0,0,0.45)',
            animation:  'dropdown-in 0.15s ease',
          }}
        >
          {items.map(({ label, icon: Icon, action, danger }) => (
            <button
              key={label}
              onClick={() => { action(); setOpen(false) }}
              className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-100 hover:bg-[var(--c-elevated)]"
              style={{ color: danger ? 'var(--c-red)' : 'var(--c-text)' }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
