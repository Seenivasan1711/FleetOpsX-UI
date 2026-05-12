import { useLocation } from 'react-router-dom'
import { Sparkles, Search } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserMenu }         from './UserMenu'
import { useUiStore }       from '../../store'

const PAGE_META: Record<string, { title: string; section: string }> = {
  '/':              { title: "Today's Operations",     section: 'Overview' },
  '/orders':        { title: 'Orders',                 section: 'Manage delivery orders' },
  '/planning':      { title: 'AI Route Planning',      section: 'AI-powered route optimization' },
  '/map':           { title: 'Live Fleet Map',         section: 'Real-time driver tracking' },
  '/analytics':     { title: 'Analytics',              section: 'Last 30 days' },
  '/drivers':       { title: 'Drivers',                section: 'Driver management' },
  '/vehicles':      { title: 'Vehicles',               section: 'Fleet management' },
  '/depots':        { title: 'Depots',                 section: 'Depot locations' },
  '/settings':      { title: 'Settings',               section: 'Preferences & configuration' },
  '/plan-history':  { title: 'Plan History',           section: 'Past dispatch plans & feedback' },
  '/integrations':  { title: 'Partner Integrations',   section: 'Webhooks & ERP/WMS connectors' },
  '/marketplace':   { title: 'Capacity Marketplace',   section: 'Offer & request capacity' },
  '/governance':    { title: 'Governance & Audit',     section: 'Audit log & compliance' },
  '/scenarios':     { title: 'Scenario Simulator',     section: 'What-if planning simulations' },
  '/admin/ai-providers': { title: 'AI Providers',      section: 'Manage LLM provider registry' },
  '/team':          { title: 'Team',                   section: 'User management' },
}

type TopbarProps = {
  onShowShortcuts:    () => void
  onOpenCommandPalette?: () => void
}

export const Topbar = ({ onShowShortcuts, onOpenCommandPalette }: TopbarProps) => {
  const location           = useLocation()
  const { chatOpen, toggleChat } = useUiStore()
  const meta  = PAGE_META[location.pathname] ?? { title: location.pathname.slice(1), section: '' }
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header
      className="h-[64px] flex items-center px-6 gap-4 shrink-0"
      style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[17px] font-bold text-[var(--c-text)] leading-tight">{meta.title}</h1>
        <p className="text-[11px] text-[var(--c-muted)] mt-0.5">
          {meta.section} · {today} · Updated just now
        </p>
      </div>

      {/* Search trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2.5 px-4 py-2 rounded-xl text-[var(--c-muted)] text-sm transition-colors"
        style={{
          background: 'var(--c-elevated)',
          border: '1px solid var(--c-border)',
          minWidth: 240,
        }}
      >
        <Search size={13} className="shrink-0" />
        <span className="text-xs flex-1 text-left">Search orders, drivers, routes…</span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        {/* Ask AI — sole AI chat entry point */}
        <button
          onClick={toggleChat}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background:  'var(--c-accent)',
            color:       '#fff',
            boxShadow:   chatOpen ? '0 0 0 2px rgba(139,92,246,0.4)' : 'none',
          }}
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline text-[13px]">Ask AI</span>
        </button>

        <NotificationBell />
        <UserMenu onShowShortcuts={onShowShortcuts} />
      </div>
    </header>
  )
}
