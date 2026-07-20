<<<<<<< HEAD
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
  Zap,
  History,
  UserCog,
  BookOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
=======
import type { ReactElement } from 'react'
import { Icon } from '../../components/ui/icons'
import type { IconProps } from '../../components/ui/icons'

export type NavSection = 'operations' | 'insights' | 'platform'
>>>>>>> origin/main

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
<<<<<<< HEAD
  { id: 'dashboard', label: 'Dashboard',  path: '/',          icon: LayoutDashboard, section: 'main' },
  { id: 'orders',    label: 'Orders',     path: '/orders',    icon: ClipboardList,   section: 'main' },
  { id: 'planning',  label: 'Planning',   path: '/planning',  icon: Route,           section: 'main' },
  { id: 'map',       label: 'Live Map',   path: '/map',       icon: Map,             section: 'main' },
  { id: 'analytics', label: 'Analytics',  path: '/analytics', icon: BarChart2,       section: 'main' },
  { id: 'drivers',   label: 'Drivers',    path: '/drivers',   icon: Users,           section: 'main' },
  { id: 'vehicles',  label: 'Vehicles',   path: '/vehicles',  icon: Truck,           section: 'main' },
  { id: 'depots',    label: 'Depots',     path: '/depots',    icon: Warehouse,       section: 'main' },
  // Phase P — PP-E4 (coming soon)
  { id: 'chat',          label: 'Chat AI',            path: '/chat',         icon: MessageSquare, section: 'roadmap' },
  // Phase 4 — live
  { id: 'integrations',  label: 'Integrations',        path: '/integrations', icon: Plug,         section: 'roadmap' },
  // Phase 4 — live
  { id: 'marketplace',   label: 'Marketplace',         path: '/marketplace',  icon: GitMerge,     section: 'roadmap' },
  { id: 'governance',    label: 'Governance & Audit',  path: '/governance',        icon: ShieldCheck,  section: 'roadmap' },
  { id: 'scenarios',     label: 'Scenario Simulator',  path: '/scenarios',         icon: Layers,       section: 'roadmap' },
  { id: 'ai-providers',  label: 'AI Providers',         path: '/admin/ai-providers', icon: Zap,          section: 'roadmap' },
  { id: 'instructions',  label: 'AI Instructions',      path: '/admin/instructions', icon: BookOpen,     section: 'roadmap' },
  { id: 'plan-history',  label: 'Plan History',         path: '/plan-history',       icon: History,      section: 'roadmap' },
  { id: 'team',          label: 'Team',                 path: '/team',               icon: UserCog,      section: 'roadmap' },
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
  orders:              (date?: string) => ['orders', date] as const,
  drivers:             ['drivers'] as const,
  vehicles:            ['vehicles'] as const,
  depots:              ['depots'] as const,
  slaAtRisk:           (date: string) => ['sla-at-risk', date] as const,
  agentLogs:           (planId: string) => ['agent-logs', planId] as const,
  suggestions:         (date: string) => ['agent-suggestions', date] as const,
  analyticsKpis:       ['analytics-kpis'] as const,
  driverPerformance:   ['driver-performance'] as const,
  livePositions:       ['live-positions'] as const,
  activeSession:       ['planning-active-session'] as const,
  planningSessions:    (date?: string) => ['planning-sessions', date] as const,
  planningRun:         (runId: string) => ['planning-run', runId] as const,
  planningRunAgents:   (runId: string) => ['planning-run-agents', runId] as const,
  instructions:        ['planning-instructions'] as const,
  learningPatterns:    (status?: string) => ['planning-learning', status] as const,
  planningHistory:     (sessionId: string) => ['planning-chat-history', sessionId] as const,
=======
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
>>>>>>> origin/main
}
