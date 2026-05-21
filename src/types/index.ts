export interface Tenant {
  id: string
  name: string
  slug: string
}

export interface TenantBrief {
  id: string
  name: string
  slug: string
  is_active: boolean
  order_count_today: number
  driver_count: number
}

export interface User {
  user_id: string
  tenant_id: string | null
  role: 'dispatcher' | 'driver' | 'admin' | 'superadmin'
  full_name: string
  email?: string
  access_token: string
  tenants?: TenantBrief[]
}

export interface Depot {
  id: string
  tenant_id: string
  name: string
  address?: string
  city?: string
  latitude?: number
  longitude?: number
  is_active: boolean
  created_at: string
}

export type DriverAvailability = 'AVAILABLE' | 'ON_BREAK' | 'OFF_DUTY'

export interface Driver {
  id: string
  tenant_id: string
  full_name: string
  phone?: string
  email?: string
  home_depot_id?: string
  is_active: boolean
  availability_status?: DriverAvailability
}

export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'LOW_FUEL'

export interface Vehicle {
  id: string
  tenant_id: string
  registration_number: string
  vehicle_type: string
  capacity_kg?: number
  capacity_units?: number
  is_refrigerated?: boolean
  home_depot_id?: string
  is_active: boolean
  vehicle_status?: VehicleStatus
  fuel_level_pct?: number
}

export interface Order {
  id: string
  tenant_id: string
  external_ref?: string
  customer_id?: string
  delivery_address: string
  delivery_latitude?: number
  delivery_longitude?: number
  scheduled_date: string
  time_window_start?: string
  time_window_end?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED'
  assigned_driver_id?: string
  weight_kg?: number
  quantity_units?: number
  notes?: string
  created_at: string
}

export interface Assignment {
  order_id: string
  driver_id: string
  driver_name: string
  sequence: number
}

export interface PlanResult {
  plan_id: string
  plan_date: string
  status: 'DRAFT' | 'PUBLISHED'
  total_orders: number
  assigned_orders: number
  total_routes: number
  assignments: Assignment[]
  planner?: string
  explanation?: string
  confidence_score?: number
  warnings?: string[]
}

export type PlanOptionMode = 'fastest' | 'economical' | 'balanced'

export interface PlanOption {
  mode: PlanOptionMode
  plan_id: string
  orders_covered: number
  total_orders: number
  total_routes: number
  total_distance_km: number
  est_duration_min: number
  est_fuel_cost: number
  // AI-enriched fields — null when no LLM configured
  ai_summary?: string | null
  confidence_score?: number | null
  reasoning_steps?: string[]
  warnings?: string[]
  // Legacy FE-only fields for display
  label?: string
  description?: string
  assignments?: Assignment[]
}

export interface PlanOptionsApiResponse {
  plan_date: string
  options: PlanOption[]
  recommendation?: string | null
  naive_distance_km?: number | null
}

export interface AgentLogEntry {
  id: string
  plan_id?: string
  step: string
  role: 'agent' | 'tool' | 'llm'
  content: string
  llm_provider?: string
  created_at: string
}

export interface AgentSuggestion {
  id: string
  tenant_id: string
  plan_date: string
  suggestion_type: 'REPLAN_DRIVER' | 'EARLY_SLA_WARNING' | 'DEMAND_WARNING' | 'RESCHEDULE_STOP'
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED'
  priority: 'HIGH' | 'NORMAL'
  title: string
  detail: string | null
  context: Record<string, unknown> | null
  expires_at: string | null
  acted_by: string | null
  created_at: string | null
}
