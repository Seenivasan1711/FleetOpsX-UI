import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../ui/icons'
import { cn } from '../../lib/utils/cn'
import { Tooltip } from '../ui/Tooltip'
import { NAV_ITEMS, type NavItemDef } from '../../lib/utils/constants'
import { useAuthStore } from '../../store/auth.store'

type SidebarProps = {
  expanded:          boolean
  onToggle:          () => void
  pendingOrders?:    number
  onShowShortcuts?:  () => void
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
        'relative flex items-center rounded-lg transition-all duration-150 group',
        expanded ? 'w-full px-3 py-[11px] gap-3' : 'w-10 h-10 justify-center',
        active
          ? ''
          : item.comingSoon
            ? 'opacity-35 cursor-not-allowed'
            : 'hover:brightness-110'
      )}
      style={
        active
          ? {
              background: 'var(--c-accent-dim)',
              color: 'var(--c-accent)',
              borderTop:    '1.5px solid rgba(255,255,255,0.10)',
              borderLeft:   '1.5px solid rgba(255,255,255,0.10)',
              borderBottom: '1.5px solid rgba(0,0,0,0.45)',
              borderRight:  '1.5px solid rgba(0,0,0,0.45)',
            }
          : {
              background: 'var(--c-elevated)',
              color: 'var(--c-muted)',
              borderTop:    '1.5px solid rgba(255,255,255,0.08)',
              borderLeft:   '1.5px solid rgba(255,255,255,0.08)',
              borderBottom: '1.5px solid rgba(0,0,0,0.40)',
              borderRight:  '1.5px solid rgba(0,0,0,0.40)',
            }
      }
    >
      <Icon size={17} className="shrink-0" />

      {expanded && (
        <>
          <span
            className={cn('flex-1 text-left text-[13px]', active ? 'font-semibold' : 'font-medium')}
            style={active ? { color: 'var(--c-accent)' } : { color: 'var(--c-text)' }}
          >
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
              className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full min-w-[22px] text-center"
              style={{
                background: active ? 'rgba(255,255,255,0.2)' : 'var(--c-elevated)',
                color: active ? '#fff' : 'var(--c-text)',
              }}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {dot && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: dot,
                boxShadow:  `0 0 0 2px color-mix(in srgb, ${dot} 30%, transparent)`,
                animation:  'pulse-dot 2s ease-in-out infinite',
              }}
            />
          )}
        </>
      )}

      {!expanded && badge != null && badge > 0 && (
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--c-accent)] text-white text-[8px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {/* Live dot in collapsed mode — top-right corner of icon */}
      {!expanded && dot && (
        <span
          className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
          style={{
            background: dot,
            boxShadow:  `0 0 0 2px color-mix(in srgb, ${dot} 30%, transparent)`,
            animation:  'pulse-dot 2s ease-in-out infinite',
          }}
        />
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
    <p className="text-[9px] font-bold uppercase tracking-[1.4px] px-3 pt-5 pb-1.5 select-none" style={{ color: 'var(--c-muted)', opacity: 0.5 }}>
      {label}
    </p>
  ) : (
    <div className="my-3 w-4 h-px mx-auto" style={{ background: 'var(--c-border)' }} />
  )

export const Sidebar = ({ expanded, onToggle, pendingOrders, onShowShortcuts }: SidebarProps) => {
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = useAuthStore((s) => s.user)
  const clearAuth  = useAuthStore((s) => s.clearAuth)
  const { effectiveTenantId } = useAuthStore()

  const handleLogout = () => { clearAuth(); navigate('/login') }

  const [platformOpen,  setPlatformOpen]  = useState(false)
  const [userMenuOpen,  setUserMenuOpen]  = useState(false)

  const isAdmin  = user?.role === 'superadmin' || user?.role === 'admin'
  const ops      = NAV_ITEMS.filter((i) => i.section === 'operations')
  const insights = NAV_ITEMS.filter((i) => i.section === 'insights')
  const platform = NAV_ITEMS.filter((i) => i.section === 'platform' && (!i.adminOnly || isAdmin))
  const isPlatformActive = platform.some((i) => location.pathname === i.path)

  const getBadge = (id: string) => id === 'orders' ? (pendingOrders ?? null) : null

  const getExtraBadge = (id: string) => {
    if (id === 'planning') return (
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
        style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)', border: '1px solid rgba(139,92,246,0.4)' }}
      >
        AI
      </span>
    )
    return undefined
  }

  const getDot = (id: string) => id === 'map' ? 'var(--c-green)' : undefined

  const initials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?'

  const tenantName = user?.tenants?.find((t) => t.id === effectiveTenantId)?.name
  const subtitle = tenantName
    ?? (user?.role === 'superadmin' || user?.role === 'admin' ? 'Platform Admin' : 'Dispatch Intel')

  const roleLabel = (() => {
    const r = user?.role ?? ''
    if (r === 'superadmin' || r === 'admin') return 'Admin'
    if (r === 'dispatcher') return 'Dispatcher'
    if (r === 'driver') return 'Driver'
    return r.charAt(0).toUpperCase() + r.slice(1)
  })()

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
            className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 text-white"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              boxShadow:  '0 3px 12px rgba(124,58,237,0.45)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 17 L12 4 L21 17 L17 17 L12 10 L7 17 Z" fill="white" />
              <path d="M7 17 L17 17 L17 20 L7 20 Z" fill="white" opacity=".6" />
            </svg>
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-[13.5px] font-bold leading-tight whitespace-nowrap tracking-tight">
                <span className="text-[var(--c-text)]">Fleet</span>
                <span style={{ color: 'var(--c-accent)' }}>OpsX</span>
              </p>
              <p className="text-[10px] whitespace-nowrap truncate max-w-[140px]" style={{ color: 'var(--c-muted)', letterSpacing: '0.02em' }}>
                {subtitle}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable nav area */}
        <div className={cn('flex-1 flex flex-col px-2.5 pb-3 overflow-y-auto', !expanded && 'items-center')}>
          {/* OPERATIONS */}
          <SectionLabel label="Operations" expanded={expanded} />
          <div className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-2">
            {insights.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={location.pathname === item.path}
                expanded={expanded}
              />
            ))}
          </div>

          {/* FLEET & PLATFORM — collapsed by default */}
          {platform.length > 0 && (
            <>
              {expanded ? (
                <button
                  onClick={() => setPlatformOpen((v) => !v)}
                  className="flex items-center gap-2 mt-2 mb-0.5 px-3 py-2 rounded-xl transition-colors w-full text-left hover:bg-white/5"
                  style={{ color: isPlatformActive ? 'var(--c-accent)' : 'var(--c-muted)' }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-[1.4px] opacity-50 flex-1 select-none">
                    Fleet &amp; Platform
                  </span>
                  {platformOpen
                    ? <Icon.ChevU size={11} className="opacity-40" />
                    : <Icon.ChevD size={11} className="opacity-40" />}
                </button>
              ) : (
                <div className="my-3 w-4 h-px mx-auto" style={{ background: 'var(--c-border)' }} />
              )}
              {(platformOpen || !expanded) && (
                <div className="flex flex-col gap-2">
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
            </>
          )}
        </div>

        {/* User profile footer — click to open menu */}
        <div
          className="relative shrink-0 px-2.5 pb-3 pt-2"
          style={{ borderTop: '1px solid var(--c-border)' }}
        >
          {/* User menu popup — opens upward */}
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div
                className="absolute left-2.5 right-2.5 bottom-[calc(100%+6px)] z-50 rounded-xl overflow-hidden"
                style={{
                  background: 'var(--c-elevated)',
                  border:     '1px solid var(--c-border)',
                  boxShadow:  '0 -4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                  animation:  'menu-up 0.16s cubic-bezier(0.22,1,0.36,1) both',
                }}
              >
                {/* Compact user header */}
                <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--c-accent), #06b6d4)' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: 'var(--c-text)' }}>
                      {user?.full_name}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--c-muted)' }}>
                      {roleLabel}
                    </p>
                  </div>
                </div>

                {/* Menu items — compact */}
                <div className="p-1">
                  {([
                    {
                      label: 'Profile',
                      hint:  null as string | null,
                      icon:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                      action: () => { setUserMenuOpen(false); navigate('/profile') },
                    },
                    {
                      label: 'Settings',
                      hint:  null as string | null,
                      icon:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
                      action: () => { setUserMenuOpen(false); navigate('/settings') },
                    },
                    {
                      label: 'Shortcuts',
                      hint:  '?',
                      icon:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8M6 14h.01M18 14h.01"/></svg>,
                      action: () => { setUserMenuOpen(false); onShowShortcuts?.() },
                    },
                  ] as const).map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12.5px] text-left transition-colors hover:bg-white/[0.06] group"
                      style={{ color: 'var(--c-text)' }}
                    >
                      <span className="shrink-0 transition-colors" style={{ color: 'var(--c-muted)' }}>{item.icon}</span>
                      <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      {item.hint && (
                        <kbd className="text-[9px] font-mono px-1 py-px rounded shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--c-border)', color: 'var(--c-subtle)' }}>
                          {item.hint}
                        </kbd>
                      )}
                    </button>
                  ))}
                </div>

                {/* Sign out — separated, danger */}
                <div className="p-1" style={{ borderTop: '1px solid var(--c-border)' }}>
                  <button
                    onClick={() => { setUserMenuOpen(false); handleLogout() }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12.5px] text-left transition-colors hover:bg-red-500/10"
                    style={{ color: 'var(--c-red)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span className="whitespace-nowrap">Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Clickable user card */}
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all',
              !expanded && 'justify-center px-0',
              userMenuOpen ? 'bg-white/5' : 'hover:bg-white/5'
            )}
            style={{ background: userMenuOpen ? 'rgba(255,255,255,0.05)' : 'var(--c-elevated)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-[12px] font-bold"
              style={{ background: 'linear-gradient(135deg, var(--c-accent), #06b6d4)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}
            >
              {initials}
            </div>
            {expanded && user && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[12.5px] font-semibold truncate leading-tight" style={{ color: 'var(--c-text)' }}>
                    {user.full_name}
                  </p>
                  <p className="text-[10.5px] truncate leading-tight mt-0.5" style={{ color: 'var(--c-muted)' }}>
                    {roleLabel}
                  </p>
                </div>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={cn('shrink-0 transition-transform duration-200', userMenuOpen && 'rotate-180')}
                  style={{ color: 'var(--c-muted)' }}
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </>
            )}
          </button>
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
        <Icon.ChevR
          size={12}
          className={cn('transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]', expanded && 'rotate-180')}
        />
      </button>
    </div>
  )
}
