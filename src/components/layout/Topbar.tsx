import { useLocation } from 'react-router-dom'
import { MessageSquare }   from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserMenu }         from './UserMenu'
import { useUiStore }       from '../../store'

const PAGE_META: Record<string, { title: string; subtitle: (date: string) => string }> = {
  '/':          { title: "Today's Overview",  subtitle: (d) => d },
  '/orders':    { title: 'Orders',            subtitle: () => 'Manage delivery orders' },
  '/planning':  { title: 'Planning',          subtitle: () => 'AI-powered route optimization' },
  '/map':       { title: 'Live Fleet Map',    subtitle: () => 'Real-time driver tracking' },
  '/analytics': { title: 'Analytics',         subtitle: () => 'Last 30 days' },
  '/drivers':   { title: 'Drivers',           subtitle: () => 'Driver management' },
  '/vehicles':  { title: 'Vehicles',          subtitle: () => 'Fleet management' },
  '/depots':    { title: 'Depots',            subtitle: () => 'Depot locations' },
  '/settings':  { title: 'Settings',          subtitle: () => 'Preferences & configuration' },
}

type TopbarProps = {
  onShowShortcuts: () => void
}

const LivePulse = () => (
  <div
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
    style={{
      background: 'var(--c-green-dim)',
      border:     '1px solid rgba(52,211,153,0.2)',
    }}
  >
    <span
      className="w-[7px] h-[7px] rounded-full block"
      style={{ background: 'var(--c-green)', animation: 'live-pulse 2s infinite' }}
    />
    <span className="text-[11px] font-bold font-mono tracking-wide" style={{ color: 'var(--c-green)' }}>
      LIVE
    </span>
  </div>
)

export const Topbar = ({ onShowShortcuts }: TopbarProps) => {
  const location              = useLocation()
  const { chatOpen, toggleChat } = useUiStore()
  const meta     = PAGE_META[location.pathname] ?? { title: location.pathname.slice(1), subtitle: () => '' }
  const today    = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header
      className="h-[60px] flex items-center px-6 gap-4 shrink-0"
      style={{
        background:   'var(--c-surface)',
        borderBottom: '1px solid var(--c-border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-[var(--c-text)] leading-tight">{meta.title}</h1>
        <p className="text-[11px] text-[var(--c-muted)] mt-0.5">{meta.subtitle(today)}</p>
      </div>

      <div className="flex items-center gap-2">
        <LivePulse />
        <button
          onClick={toggleChat}
          title="Fleet AI Chat"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: chatOpen ? 'var(--c-accent-dim)' : 'transparent',
            color:      chatOpen ? 'var(--c-accent)'     : 'var(--c-muted)',
            border:     '1px solid var(--c-border)',
          }}
          onMouseEnter={(e) => { if (!chatOpen) { e.currentTarget.style.background = 'var(--c-elevated)'; e.currentTarget.style.color = 'var(--c-text)' } }}
          onMouseLeave={(e) => { if (!chatOpen) { e.currentTarget.style.background = 'transparent';       e.currentTarget.style.color = 'var(--c-muted)' } }}
        >
          <MessageSquare size={15} />
        </button>
        <NotificationBell />
        <UserMenu onShowShortcuts={onShowShortcuts} />
      </div>
    </header>
  )
}
