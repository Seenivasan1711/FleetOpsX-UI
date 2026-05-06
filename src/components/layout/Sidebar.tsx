import { Link, useLocation } from 'react-router-dom'
import { Settings, LogOut, ChevronRight, Lock } from 'lucide-react'
import { cn } from '../../lib/utils/cn'
import { Tooltip } from '../ui/Tooltip'
import { NAV_ITEMS, type NavItemDef } from '../../lib/utils/constants'

type SidebarProps = {
  expanded:      boolean
  onToggle:      () => void
  pendingOrders?: number
}

type NavItemProps = {
  item:     NavItemDef
  active:   boolean
  expanded: boolean
  badge?:   number | null
}

const NavItem = ({ item, active, expanded, badge }: NavItemProps) => {
  const Icon = item.icon

  const button = (
    <Link
      to={item.comingSoon ? '#' : item.path}
      onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
      className={cn(
        'relative flex items-center rounded-[10px] transition-all duration-150 group',
        expanded ? 'w-full px-3 py-2.5 gap-2.5' : 'w-11 h-10 justify-center',
        active
          ? 'bg-[var(--c-accent-dim)] text-[var(--c-accent)]'
          : item.comingSoon
            ? 'text-[var(--c-muted)] opacity-40 cursor-not-allowed'
            : 'text-[var(--c-muted)] hover:bg-[var(--c-elevated)] hover:text-[var(--c-text)]'
      )}
    >
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-[18%] w-[3px] h-[64%] bg-[var(--c-accent)] rounded-r-full" />
      )}

      <Icon size={18} className="shrink-0" />

      {expanded && (
        <>
          <span className={cn('flex-1 text-[13.5px] text-left', active ? 'font-semibold' : 'font-medium')}>
            {item.label}
          </span>
          {item.comingSoon && (
            <span className="text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded bg-[var(--c-elevated)] text-[var(--c-muted)] border border-[var(--c-border)]">
              SOON
            </span>
          )}
          {!item.comingSoon && badge != null && badge > 0 && (
            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-[var(--c-accent)] text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}

      {/* Collapsed badge dot */}
      {!expanded && !item.comingSoon && badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[var(--c-accent)] text-white text-[8px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}

      {/* Coming soon lock (collapsed) */}
      {!expanded && item.comingSoon && (
        <Lock size={8} className="absolute top-1 right-1 text-[var(--c-muted)]" />
      )}
    </Link>
  )

  return expanded ? button : (
    <Tooltip label={item.comingSoon ? `${item.label} — Coming Soon` : item.label}>
      {button}
    </Tooltip>
  )
}

export const Sidebar = ({ expanded, onToggle, pendingOrders }: SidebarProps) => {
  const location = useLocation()

  const mainItems    = NAV_ITEMS.filter((i) => i.section === 'main')
  const roadmapItems = NAV_ITEMS.filter((i) => i.section === 'roadmap')

  const getBadge = (id: string) => {
    if (id === 'orders') return pendingOrders ?? null
    return null
  }

  return (
    <nav
      className="relative flex flex-col border-r border-[var(--c-border)] transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden shrink-0"
      style={{
        width:      expanded ? '224px' : '64px',
        minHeight:  '100vh',
        background: 'var(--c-sidebar-bg)',
      }}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-2.5 mb-5 overflow-hidden',
          expanded ? 'px-4 py-5' : 'py-5 justify-center'
        )}
      >
        <div
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 text-sm font-extrabold text-white"
          style={{ background: 'var(--c-accent)', boxShadow: '0 4px 14px var(--c-accent-glow)' }}
        >
          F
        </div>
        {expanded && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-[var(--c-text)] leading-tight whitespace-nowrap">FleetOpsX</p>
            <p className="text-[11px] text-[var(--c-muted)] whitespace-nowrap mt-0.5">Dispatch Intelligence</p>
          </div>
        )}
      </div>

      {/* Main nav */}
      <div className={cn('flex-1 flex flex-col gap-0.5 px-2.5', !expanded && 'items-center')}>
        {mainItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={location.pathname === item.path}
            expanded={expanded}
            badge={getBadge(item.id)}
          />
        ))}

        {/* Roadmap section */}
        {expanded && (
          <div className="mt-4 mb-1 px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] opacity-50">Roadmap</p>
          </div>
        )}
        {!expanded && <div className="my-2 w-5 h-px bg-[var(--c-border)]" />}

        {roadmapItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={false}
            expanded={expanded}
          />
        ))}
      </div>

      {/* Bottom actions */}
      <div
        className={cn(
          'flex flex-col gap-0.5 border-t border-[var(--c-border)] pt-3 mt-2 mx-2.5 pb-3',
          !expanded && 'items-center'
        )}
      >
        <Tooltip label="Settings" side="right">
          <Link
            to="/settings"
            className={cn(
              'flex items-center rounded-[10px] transition-all duration-150',
              expanded ? 'w-full px-3 py-2.5 gap-2.5' : 'w-11 h-10 justify-center',
              location.pathname === '/settings'
                ? 'bg-[var(--c-accent-dim)] text-[var(--c-accent)]'
                : 'text-[var(--c-muted)] hover:bg-[var(--c-elevated)] hover:text-[var(--c-text)]'
            )}
          >
            <Settings size={18} className="shrink-0" />
            {expanded && <span className="text-[13.5px] font-medium">Settings</span>}
          </Link>
        </Tooltip>
      </div>

      {/* Expand / collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 -right-[13px] -translate-y-1/2 w-[26px] h-[26px] rounded-full flex items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-elevated)] transition-all duration-150 z-20"
        style={{
          background: 'var(--c-surface)',
          border:     '1px solid var(--c-border)',
          boxShadow:  '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        <ChevronRight
          size={12}
          className={cn('transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]', expanded && 'rotate-180')}
        />
      </button>
    </nav>
  )
}
