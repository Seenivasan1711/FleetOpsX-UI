import {
  LayoutDashboard,
  ClipboardList,
  Route,
  Map,
  BarChart2,
  Users,
  Truck,
  Warehouse,
  GitMerge,
  ShieldCheck,
  Layers,
  Plug,
  Zap,
  History,
  UserCog,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavSection = 'operations' | 'insights' | 'platform'

export type NavItemDef = {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badge?: number | null
  comingSoon?: boolean
  section: NavSection
}

export const NAV_ITEMS: NavItemDef[] = [
  // OPERATIONS
  { id: 'dashboard',    label: 'Dashboard',          path: '/',                   icon: LayoutDashboard, section: 'operations' },
  { id: 'orders',       label: 'Orders',             path: '/orders',             icon: ClipboardList,   section: 'operations' },
  { id: 'planning',     label: 'Planning',           path: '/planning',           icon: Route,           section: 'operations' },
  { id: 'map',          label: 'Live Map',           path: '/map',                icon: Map,             section: 'operations' },
  { id: 'plan-history', label: 'Plan History',       path: '/plan-history',       icon: History,         section: 'operations' },
  { id: 'drivers',      label: 'Drivers',            path: '/drivers',            icon: Users,           section: 'operations' },
  // INSIGHTS
  { id: 'analytics',    label: 'Analytics',          path: '/analytics',          icon: BarChart2,       section: 'insights' },
  { id: 'settings',     label: 'Settings',           path: '/settings',           icon: Settings,        section: 'insights' },
  // FLEET & PLATFORM (collapsible)
  { id: 'vehicles',     label: 'Vehicles',           path: '/vehicles',           icon: Truck,           section: 'platform' },
  { id: 'depots',       label: 'Depots',             path: '/depots',             icon: Warehouse,       section: 'platform' },
  { id: 'integrations', label: 'Integrations',       path: '/integrations',       icon: Plug,            section: 'platform' },
  { id: 'marketplace',  label: 'Marketplace',        path: '/marketplace',        icon: GitMerge,        section: 'platform' },
  { id: 'governance',   label: 'Governance',         path: '/governance',         icon: ShieldCheck,     section: 'platform' },
  { id: 'scenarios',    label: 'Scenarios',          path: '/scenarios',          icon: Layers,          section: 'platform' },
  { id: 'ai-providers', label: 'AI Providers',       path: '/admin/ai-providers', icon: Zap,             section: 'platform' },
  { id: 'team',         label: 'Team',               path: '/team',               icon: UserCog,         section: 'platform' },
]

export const KEYBOARD_SHORTCUTS = [
  { key: 'G then D', desc: 'Go to Dashboard' },
  { key: 'G then O', desc: 'Go to Orders' },
  { key: 'G then P', desc: 'Go to Planning' },
  { key: 'G then M', desc: 'Go to Live Map' },
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
