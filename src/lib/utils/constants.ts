import type { ReactElement } from 'react'
import { Icon } from '../../components/ui/icons'
import type { IconProps } from '../../components/ui/icons'

export type NavSection = 'operations' | 'insights' | 'platform'

export type NavItemDef = {
  id: string
  label: string
  path: string
  icon: (props: IconProps) => ReactElement
  badge?: number | null
  comingSoon?: boolean
  section: NavSection
  adminOnly?: boolean
}

export const NAV_ITEMS: NavItemDef[] = [
  // OPERATIONS
  { id: 'dashboard',    label: 'Dashboard',          path: '/',                   icon: Icon.Home,     section: 'operations' },
  { id: 'orders',       label: 'Orders',             path: '/orders',             icon: Icon.Orders,   section: 'operations' },
  { id: 'planning',     label: 'Planning',           path: '/planning',           icon: Icon.Plan,     section: 'operations' },
  { id: 'map',          label: 'Live Feed',          path: '/map',                icon: Icon.Map,      section: 'operations' },
  { id: 'plan-history', label: 'Plan History',       path: '/plan-history',       icon: Icon.History,  section: 'operations' },
  { id: 'drivers',      label: 'Drivers',            path: '/drivers',            icon: Icon.Drivers,  section: 'operations' },
  // INSIGHTS
  { id: 'analytics',    label: 'Analytics',          path: '/analytics',          icon: Icon.Chart,    section: 'insights' },
  { id: 'settings',     label: 'Settings',           path: '/settings',           icon: Icon.Settings, section: 'insights' },
  // FLEET & PLATFORM (collapsible)
  { id: 'vehicles',     label: 'Vehicles',           path: '/vehicles',           icon: Icon.Truck,    section: 'platform' },
  { id: 'depots',       label: 'Depots',             path: '/depots',             icon: Icon.Depot,    section: 'platform' },
  { id: 'integrations', label: 'Integrations',       path: '/integrations',       icon: Icon.Plug,     section: 'platform' },
  { id: 'marketplace',  label: 'Marketplace',        path: '/marketplace',        icon: Icon.Shop,     section: 'platform' },
  { id: 'governance',   label: 'Governance',         path: '/governance',         icon: Icon.Shield,   section: 'platform' },
  { id: 'scenarios',    label: 'Scenarios',          path: '/scenarios',          icon: Icon.Layers,   section: 'platform' },
  { id: 'ai-config',    label: 'AI Configuration',    path: '/ai-config',          icon: Icon.Bolt,     section: 'platform' },
  { id: 'ai-providers', label: 'AI Providers',       path: '/admin/ai-providers', icon: Icon.Bolt,     section: 'platform', adminOnly: true },
  { id: 'team',         label: 'Team',               path: '/team',               icon: Icon.Users,    section: 'platform' },
]

export const KEYBOARD_SHORTCUTS = [
  { key: 'G then D', desc: 'Go to Dashboard' },
  { key: 'G then O', desc: 'Go to Orders' },
  { key: 'G then P', desc: 'Go to Planning' },
  { key: 'G then M', desc: 'Go to Live Feed' },
  { key: 'G then A', desc: 'Go to Analytics' },
  { key: 'G then R', desc: 'Go to Drivers' },
  { key: 'G then V', desc: 'Go to Vehicles' },
  { key: 'G then E', desc: 'Go to Depots' },
  { key: 'G then S', desc: 'Go to Settings' },
  { key: '⌘K',       desc: 'Command palette' },
  { key: '[ / ]',   desc: 'Collapse / expand sidebar' },
  { key: '?',        desc: 'Show keyboard shortcuts' },
  { key: 'Esc',      desc: 'Close modals' },
]

export const PAGE_KEY_MAP: Record<string, string> = {
  d: '/', o: '/orders', p: '/planning', m: '/map',
  a: '/analytics', r: '/drivers', v: '/vehicles',
  e: '/depots', s: '/settings',
}

export const QUERY_KEYS = {
  orders:           (date?: string) => ['orders', date] as const,
  drivers:          ['drivers'] as const,
  vehicles:         ['vehicles'] as const,
  depots:           ['depots'] as const,
  slaAtRisk:        (date: string) => ['sla-at-risk', date] as const,
  agentLogs:        (planId: string) => ['agent-logs', planId] as const,
  suggestions:      (date: string) => ['agent-suggestions', date] as const,
  analyticsKpis:    ['analytics-kpis'] as const,
  driverPerformance:['driver-performance'] as const,
  livePositions:    ['live-positions'] as const,
  kpiTrend:         (days: number) => ['kpi-trend', days] as const,
  routeTimeline:    (date: string) => ['route-timeline', date] as const,
  conversations:    ['chat-conversations'] as const,
}
