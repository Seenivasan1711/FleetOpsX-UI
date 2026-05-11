import { useLocation } from 'react-router-dom'
import { Sparkles, Search } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserMenu }         from './UserMenu'
import { useUiStore }       from '../../store'

const PAGE_META: Record<string, { title: string; subtitle: (date: string) => string }> = {
  '/':              { title: "Today's Overview",      subtitle: (d) => d },
  '/orders':        { title: 'Orders',                subtitle: () => 'Manage delivery orders' },
  '/planning':      { title: 'Planning',              subtitle: () => 'AI-powered route optimization' },
  '/map':           { title: 'Live Fleet Map',        subtitle: () => 'Real-time driver tracking' },
  '/analytics':     { title: 'Analytics',             subtitle: () => 'Last 30 days' },
  '/drivers':       { title: 'Drivers',               subtitle: () => 'Driver management' },
  '/vehicles':      { title: 'Vehicles',              subtitle: () => 'Fleet management' },
  '/depots':        { title: 'Depots',                subtitle: () => 'Depot locations' },
  '/settings':      { title: 'Settings',              subtitle: () => 'Preferences & configuration' },
  '/plan-history':  { title: 'Plan History',          subtitle: () => 'Past dispatch plans & feedback' },
  '/integrations':  { title: 'Partner Integrations',  subtitle: () => 'Webhooks & ERP/WMS connectors' },
  '/marketplace':   { title: 'Capacity Marketplace',  subtitle: () => 'Offer & request capacity' },
  '/governance':    { title: 'Governance & Audit',    subtitle: () => 'Audit log & compliance' },
  '/scenarios':     { title: 'Scenario Simulator',    subtitle: () => 'What-if planning simulations' },
  '/admin/ai-providers': { title: 'AI Providers',     subtitle: () => 'Manage LLM provider registry' },
  '/team':          { title: 'Team',                  subtitle: () => 'User management' },
}

type TopbarProps = {
  onShowShortcuts:   () => void
  onOpenCommandPalette?: () => void
}

const LivePulse = () => (
  <div
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
    style={{ background: 'var(--c-green-dim)', border: '1px solid rgba(52,211,153,0.2)' }}
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

export const Topbar = ({ onShowShortcuts, onOpenCommandPalette }: TopbarProps) => {
  const location           = useLocation()
  const { chatOpen, toggleChat } = useUiStore()
  const meta  = PAGE_META[location.pathname] ?? { title: location.pathname.slice(1), subtitle: () => '' }
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header
      className="h-[64px] flex items-center px-6 gap-4 shrink-0"
      style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-[var(--c-text)] leading-tight">{meta.title}</h1>
        <p className="text-[11px] text-[var(--c-muted)] mt-0.5">{meta.subtitle(today)}</p>
      </div>

      {/* Search trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--c-muted)] text-sm transition-colors"
        style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
      >
        <Search size={13} />
        <span className="text-xs">Search…</span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <LivePulse />

        {/* Ask AI — sole AI chat entry point */}
        <button
          onClick={toggleChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background:  chatOpen ? 'var(--c-accent)' : 'var(--c-accent-dim)',
            color:       chatOpen ? '#fff'             : 'var(--c-accent)',
            border:      '1px solid var(--c-accent)',
          }}
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline text-[12px]">Ask AI</span>
        </button>

        <NotificationBell />
        <UserMenu onShowShortcuts={onShowShortcuts} />
      </div>
    </header>
  )
}
