// Central mock data — edit the JSON files in this folder, not this file.
// Each JSON file maps to one feature area and can be changed without touching TypeScript.

import routesJson        from './routes.json'
import atRiskJson        from './at-risk.json'
import fleetJson         from './fleet.json'
import tickerJson        from './ticker.json'
import ordersJson        from './orders.json'
import dashboardJson     from './dashboard.json'
import liveFeedJson      from './live-feed.json'
import notificationsJson from './notifications.json'
import planningJson      from './planning.json'
import type { Order }        from '../types'
import type { LivePosition } from '../api/tracking'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RouteSegment =
  | { type: 'route'; start: number; end: number; stops: number }
  | { type: 'break'; start: number; end: number }

export type MockRoute = {
  id:       string
  name:     string
  color:    string
  segments: RouteSegment[]
}

export type MockAtRiskItem = {
  id:         string
  address:    string
  minsLate:   number
  reason:     string
  suggestion: string
}

export type MockSegment = { label: string; value: number; color: string }

export type MockFleet = {
  drivers:         MockSegment[]
  driversTotal:    number
  vehicles:        MockSegment[]
  vehiclesTotal:   number
  efficiency:      MockSegment[]
  efficiencyTotal: number
}

export type MockTickerItem = {
  id:      string
  type:    'critical' | 'warning' | 'info' | 'success'
  variant: 'truck' | 'check' | 'lightning' | 'warning' | 'dot'
  text:    string
  bold:    string[]
}

export type MockNotification = {
  title: string
  time:  string
  read:  boolean
}

export type DriverStatus = 'onRoute' | 'atRisk' | 'idle' | 'offDuty' | 'onBreak'

export type DriverFeedItem = {
  driver_id:   string
  driver_name: string
  display_id:  string
  area:        string
  status:      DriverStatus
  stops:       number
  eta:         string
  util:        number
  color:       string
}

export type ScenarioType = 'fastest' | 'economical' | 'balanced' | 'driver_fair'

export type Scenario = {
  type:         ScenarioType
  label:        string
  accentColor:  string
  primaryValue: string
  primaryDot:   string
  primaryUnit:  string
  drivers:      number
  distance_km:  number
  cost_inr:     number
  co2_kg:       number
  recommended:  boolean
}

export type PlanRoute = {
  route:       string
  driver:      string
  stops:       number
  departure:   string
  return_time: string
  distance_km: number
  load_pct:    number
  risk:        'low' | 'med' | 'high'
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const MOCK_ROUTES: MockRoute[] = routesJson as MockRoute[]

export const MOCK_AT_RISK: MockAtRiskItem[] = atRiskJson

export const MOCK_FLEET: MockFleet = fleetJson as MockFleet

export const MOCK_TICKER_ITEMS: MockTickerItem[] = tickerJson as MockTickerItem[]

export const MOCK_NOTIFICATIONS: MockNotification[] = notificationsJson

export const MOCK_DASHBOARD = dashboardJson

export const MOCK_DRIVER_FEED: DriverFeedItem[] = liveFeedJson.driverFeed as DriverFeedItem[]

export const MOCK_GPS_SEED: LivePosition[] = liveFeedJson.gpsSeed.map(p => ({
  ...p,
  recorded_at: new Date().toISOString(),
}))

export const MOCK_SCENARIOS: Scenario[] = planningJson.scenarios as Scenario[]

export const MOCK_PLAN_DETAIL: Record<ScenarioType, PlanRoute[]> =
  planningJson.planDetail as Record<ScenarioType, PlanRoute[]>

// ─── Orders ───────────────────────────────────────────────────────────────────
// Stored as params in orders.json; expanded here so scheduled_date reflects today.

const TODAY = new Date().toISOString().slice(0, 10)

const mkOrder = (
  n: number,
  address: string,
  window: [string, string],
  priority: Order['priority'],
  status: Order['status'],
  driver: string | null,
  value: number,
): Order => ({
  id:                   `mock-ord-${n}`,
  tenant_id:            'mock-tenant',
  external_ref:         `ORD-2026-${n}`,
  delivery_address:     address,
  scheduled_date:       TODAY,
  time_window_start:    window[0],
  time_window_end:      window[1],
  priority,
  status,
  assigned_driver_id:   driver ? `mock-driver-${driver.split(' ')[0]!.toLowerCase()}` : undefined,
  assigned_driver_name: driver ?? undefined,
  value,
  created_at:           TODAY + 'T00:00:00Z',
})

export const MOCK_ORDERS: Order[] = ordersJson.map(o =>
  mkOrder(
    o.n,
    o.address,
    o.window as [string, string],
    o.priority as Order['priority'],
    o.status as Order['status'],
    o.driver,
    o.value,
  )
)
