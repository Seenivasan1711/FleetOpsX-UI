import { Link, useLocation } from 'react-router-dom'
import { Settings, ChevronRight, Lock, Truck } from 'lucide-react'
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
  compact?: boolean
}

const NavItem = ({ item, active, expanded, badge, compact }: NavItemProps) => {
  const Icon = item.icon
  const iconSize  = compact ? 16 : 18
  const textSize  = compact ? 'text-[12.5px]' : 'text-[13.5px]'
  const rowPad    = compact
    ? (expanded ? 'w-full px-3 py-[5px] gap-2' : 'w-10 h-8 justify-center')
    : (expanded ? 'w-full px-3 py-2.5 gap-2.5'  : 'w-11 h-10 justify-center')

  const button = (
    <Link
      to={item.comingSoon ? '#' : item.path}
      onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
      className={cn(
        'relative flex items-center rounded-[10px] transition-all duration-150 group',
        rowPad,
        active
          ? 'bg-[var(--c-accent-dim)] text-[var(--c-accent)]'
          : item.comingSoon
            ? 'text-[var(--c-muted)] opacity-40 cursor-not-allowed'
            : 'text-[var(--c-muted)] hover:bg-[var(--c-elevated)] hover:text-[var(--c-text)]'
      )}
    >
      {active && (
        <span className="absolute left-0 top-[18%] w-[3px] h-[64%] bg-[var(--c-accent)] rounded-r-full" />
      )}

      <Icon size={iconSize} className="shrink-0" />

      {expanded && (
        <>
          <span className={cn('flex-1 text-left', textSize, active ? 'font-semibold' : 'font-medium')}>
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

      {!expanded && !item.comingSoon && badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[var(--c-accent)] text-white text-[8px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}

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
    // Wrapper owns the width transition. No overflow-hidden here so the
    // toggle button (positioned at -right-[13px]) is never clipped.
    <div
      className="relative flex shrink-0 transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] h-full"
      style={{ width: expanded ? '224px' : '64px' }}
    >
      {/* overflow-hidden on nav clips labels during the width transition */}
      <nav
        className="flex flex-col w-full h-full border-r border-[var(--c-border)] overflow-hidden"
        style={{ background: 'var(--c-sidebar-bg)' }}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center gap-2.5 shrink-0 overflow-hidden border-b border-[var(--c-border)]',
            expanded ? 'px-4 py-4' : 'py-4 justify-center'
          )}
        >
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 text-white"
            style={{
              background: 'linear-gradient(135deg, var(--c-accent), #6d28d9)',
              boxShadow:  '0 2px 10px var(--c-accent-glow)',
            }}
          >
            <Truck size={15} />
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold leading-tight whitespace-nowrap tracking-tight">
                <span className="text-[var(--c-text)]">Fleet</span><span style={{ color: 'var(--c-accent)' }}>OpsX</span>
              </p>
              <p className="text-[10px] text-[var(--c-muted)] whitespace-nowrap tracking-wide uppercase font-medium" style={{ letterSpacing: '0.05em' }}>
                Dispatch Intel
              </p>
            </div>
          )}
        </div>

        {/* Scrollable nav area */}
        <div className={cn('flex-1 flex flex-col gap-0.5 px-2.5 py-3 overflow-y-auto', !expanded && 'items-center')}>
          {mainItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={location.pathname === item.path}
              expanded={expanded}
              badge={getBadge(item.id)}
            />
          ))}

          {/* Roadmap divider */}
          {expanded ? (
            <div className="mt-3 mb-1 px-1 flex items-center gap-2">
              <div className="flex-1 h-px bg-[var(--c-border)]" />
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[var(--c-muted)] opacity-50 shrink-0">Roadmap</p>
              <div className="flex-1 h-px bg-[var(--c-border)]" />
            </div>
          ) : (
            <div className="my-2 w-5 h-px bg-[var(--c-border)]" />
          )}

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
            'flex flex-col gap-1 border-t border-[var(--c-border)] pt-2.5 mx-2.5 pb-2.5 shrink-0',
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
      </nav>

      {/* Toggle button lives outside <nav> so overflow-hidden cannot clip it */}
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
    </div>
  )
}
