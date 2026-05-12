import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils/cn'
import { Tooltip } from '../ui/Tooltip'
import { NAV_ITEMS, type NavItemDef } from '../../lib/utils/constants'
import { useAuthStore } from '../../store/auth.store'

type SidebarProps = {
  expanded:       boolean
  onToggle:       () => void
  pendingOrders?: number
}

type NavItemProps = {
  item:       NavItemDef
  active:     boolean
  expanded:   boolean
  badge?:     number | null
  extraBadge?: React.ReactNode
  dot?:       string
}

const NavItem = ({ item, active, expanded, badge, extraBadge, dot }: NavItemProps) => {
  const Icon = item.icon

  const button = (
    <Link
      to={item.comingSoon ? '#' : item.path}
      onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
      className={cn(
        'relative flex items-center rounded-[10px] transition-all duration-150 group',
        expanded ? 'w-full px-3 py-2.5 gap-2.5' : 'w-11 h-10 justify-center',
        active
          ? 'text-white'
          : item.comingSoon
            ? 'text-[var(--c-muted)] opacity-40 cursor-not-allowed'
            : 'text-[var(--c-muted)] hover:bg-[var(--c-elevated)] hover:text-[var(--c-text)]'
      )}
      style={active ? { background: 'var(--c-accent)' } : undefined}
    >
      <Icon size={17} className="shrink-0" />

      {expanded && (
        <>
          <span className={cn('flex-1 text-left text-[13px]', active ? 'font-semibold' : 'font-medium')}>
            {item.label}
          </span>
          {item.comingSoon && (
            <span className="text-[9px] font-bold font-mono tracking-wide px-1.5 py-0.5 rounded bg-[var(--c-elevated)] text-[var(--c-muted)] border border-[var(--c-border)]">
              SOON
            </span>
          )}
          {extraBadge}
          {!item.comingSoon && badge != null && badge > 0 && (
            <span
              className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full"
              style={{ background: active ? 'rgba(255,255,255,0.25)' : 'var(--c-elevated)', color: active ? '#fff' : 'var(--c-text)', border: '1px solid var(--c-border)' }}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {dot && (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
          )}
        </>
      )}

      {!expanded && badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[var(--c-accent)] text-white text-[8px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )

  return expanded ? button : (
    <Tooltip label={item.comingSoon ? `${item.label} — Coming Soon` : item.label}>
      {button}
    </Tooltip>
  )
}

const SectionLabel = ({ label, expanded }: { label: string; expanded: boolean }) =>
  expanded ? (
    <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[var(--c-muted)] opacity-40 px-3 pt-4 pb-1.5 select-none">
      {label}
    </p>
  ) : (
    <div className="my-2 w-5 h-px bg-[var(--c-border)] mx-auto" />
  )

export const Sidebar = ({ expanded, onToggle, pendingOrders }: SidebarProps) => {
  const location  = useLocation()
  const user      = useAuthStore((s) => s.user)
  const { effectiveTenantId } = useAuthStore()
  const [platformOpen, setPlatformOpen] = useState(false)

  const ops      = NAV_ITEMS.filter((i) => i.section === 'operations')
  const insights = NAV_ITEMS.filter((i) => i.section === 'insights')
  const platform = NAV_ITEMS.filter((i) => i.section === 'platform')

  const getBadge = (id: string) => id === 'orders' ? (pendingOrders ?? null) : null

  const getExtraBadge = (id: string) => {
    if (id === 'planning') return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)', border: '1px solid var(--c-accent)' }}>
        AI
      </span>
    )
    return undefined
  }

  const getDot = (id: string) => {
    if (id === 'map') return 'var(--c-green)'
    return undefined
  }

  const isPlatformActive = platform.some((i) => location.pathname === i.path)

  const initials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'

  const tenantName = user?.tenants?.find((t) => t.id === effectiveTenantId)?.name
  const subtitle = tenantName ?? (user?.role === 'superadmin' ? 'Platform Admin' : 'Dispatch Intel')

  return (
    <div
      className="relative flex shrink-0 transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] h-full"
      style={{ width: expanded ? '224px' : '64px' }}
    >
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
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow:  '0 2px 10px rgba(124,58,237,0.4)',
            }}
          >
            {/* Triangle / arrow icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L3 20h18L12 2z" />
            </svg>
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold leading-tight whitespace-nowrap tracking-tight">
                <span className="text-[var(--c-text)]">Fleet</span>
                <span style={{ color: 'var(--c-accent)' }}>OpsX</span>
              </p>
              <p className="text-[10px] text-[var(--c-muted)] whitespace-nowrap truncate max-w-[140px]" style={{ letterSpacing: '0.02em' }}>
                {subtitle}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable nav area */}
        <div className={cn('flex-1 flex flex-col px-2.5 pb-3 overflow-y-auto', !expanded && 'items-center')}>
          {/* OPERATIONS */}
          <SectionLabel label="Operations" expanded={expanded} />
          <div className="flex flex-col gap-0.5">
            {ops.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={location.pathname === item.path}
                expanded={expanded}
                badge={getBadge(item.id)}
                extraBadge={getExtraBadge(item.id)}
                dot={getDot(item.id)}
              />
            ))}
          </div>

          {/* INSIGHTS */}
          <SectionLabel label="Insights" expanded={expanded} />
          <div className="flex flex-col gap-0.5">
            {insights.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={location.pathname === item.path}
                expanded={expanded}
              />
            ))}
          </div>

          {/* FLEET & PLATFORM (collapsible) */}
          {expanded ? (
            <button
              onClick={() => setPlatformOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 mt-3 mb-1 px-3 py-1 rounded-lg transition-colors w-full text-left',
                isPlatformActive ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'
              )}
            >
              <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] opacity-40 flex-1 select-none">
                Fleet &amp; Platform
              </span>
              {platformOpen
                ? <ChevronUp size={12} className="opacity-50" />
                : <ChevronDown size={12} className="opacity-50" />}
            </button>
          ) : (
            <div className="my-2 w-5 h-px bg-[var(--c-border)] mx-auto" />
          )}

          {(platformOpen || !expanded) && (
            <div className="flex flex-col gap-0.5">
              {platform.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={location.pathname === item.path}
                  expanded={expanded}
                />
              ))}
            </div>
          )}
        </div>

        {/* User profile footer */}
        <div
          className={cn(
            'flex items-center gap-2.5 border-t border-[var(--c-border)] px-3 py-3 shrink-0 overflow-hidden',
            !expanded && 'justify-center'
          )}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
            style={{ background: 'linear-gradient(135deg, var(--c-accent), #4f46e5)' }}
          >
            {initials}
          </div>
          {expanded && user && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[var(--c-text)] truncate leading-tight">
                {user.full_name}
              </p>
              <p className="text-[10px] text-[var(--c-muted)] truncate leading-tight capitalize">
                {user.role}
              </p>
            </div>
          )}
          {expanded && (
            <button className="shrink-0 text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors">
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </nav>

      {/* Toggle button */}
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
