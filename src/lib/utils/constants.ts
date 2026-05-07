import {
  LayoutDashboard,
  ClipboardList,
  Route,
  Map,
  BarChart2,
  Users,
  Truck,
  Warehouse,
  MessageSquare,
  GitMerge,
  ShieldCheck,
  Layers,
  Plug,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItemDef = {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badge?: number | null
  comingSoon?: boolean
  section?: 'main' | 'roadmap'
}

export const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard',  path: '/',          icon: LayoutDashboard, section: 'main' },
  { id: 'orders',    label: 'Orders',     path: '/orders',    icon: ClipboardList,   section: 'main' },
  { id: 'planning',  label: 'Planning',   path: '/planning',  icon: Route,           section: 'main' },
  { id: 'map',       label: 'Live Map',   path: '/map',       icon: Map,             section: 'main' },
  { id: 'analytics', label: 'Analytics',  path: '/analytics', icon: BarChart2,       section: 'main' },
  { id: 'drivers',   label: 'Drivers',    path: '/drivers',   icon: Users,           section: 'main' },
  { id: 'vehicles',  label: 'Vehicles',   path: '/vehicles',  icon: Truck,           section: 'main' },
  { id: 'depots',    label: 'Depots',     path: '/depots',    icon: Warehouse,       section: 'main' },
  // Phase P — PP-E4 (coming soon)
  { id: 'chat',          label: 'Chat AI',            path: '/chat',         icon: MessageSquare, section: 'roadmap', comingSoon: true },
  // Phase 4 — live
  { id: 'integrations',  label: 'Integrations',        path: '/integrations', icon: Plug,         section: 'roadmap' },
  // Phase 4 — live
  { id: 'marketplace',   label: 'Marketplace',         path: '/marketplace',  icon: GitMerge,     section: 'roadmap' },
  { id: 'governance',    label: 'Governance & Audit',  path: '/governance',   icon: ShieldCheck,  section: 'roadmap' },
  { id: 'scenarios',     label: 'Scenario Simulator',  path: '/scenarios',    icon: Layers,       section: 'roadmap' },
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
  orders:           (date: string) => ['orders', date] as const,
  drivers:          ['drivers'] as const,
  vehicles:         ['vehicles'] as const,
  depots:           ['depots'] as const,
  slaAtRisk:        (date: string) => ['sla-at-risk', date] as const,
  agentLogs:        (planId: string) => ['agent-logs', planId] as const,
  suggestions:      (date: string) => ['agent-suggestions', date] as const,
  analyticsKpis:    ['analytics-kpis'] as const,
  driverPerformance:['driver-performance'] as const,
  livePositions:    ['live-positions'] as const,
}
