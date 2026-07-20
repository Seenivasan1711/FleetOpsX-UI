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
  utilization_pct?: number
  performance_score?: number
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
  assigned_driver_name?: string   // returned by API when driver is assigned
  weight_kg?: number
  quantity_units?: number
  value?: number
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

// ── AI-1 Planning types ───────────────────────────────────────────────────────

export type PlanningSessionStatus = 'OPEN' | 'LOCKED' | 'COMPLETED' | 'EXPIRED'

export interface PlanningSession {
  id: string
  tenant_id: string
  plan_date: string
  status: PlanningSessionStatus
  current_round: number
  active_plan_id: string | null
  accumulated_hints: Record<string, unknown>
  cutoff_time: string
  created_by: string
  created_at: string
  updated_at: string
}

export type RunStatus =
  | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  | 'RETRYING' | 'BLOCKED_WAITING_USER'

export interface RunAgentCheckpoint {
  agent: string
  phase: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string | null
  completed_at: string | null
  progress_pct: number
  result_summary: string | null
  error: string | null
}

export interface PlanningRun {
  id: string
  session_id: string | null
  plan_date: string
  status: RunStatus
  current_agent: string | null
  progress_pct: number
  error_info: string | null
  checkpoints: RunAgentCheckpoint[]
  created_at: string
  completed_at: string | null
}

export interface PlanningInstruction {
  id: string
  tenant_id: string
  rule_text: string
  priority: number
  is_active: boolean
  created_by: string
  created_at: string
}

export type LearningStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface PlanningLearning {
  id: string
  tenant_id: string
  pattern_type: string
  pattern_text: string
  trigger_conditions: Record<string, unknown>
  status: LearningStatus
  detected_at: string
  approved_by: string | null
}

export interface PlanningChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface PlanningRunEvent {
  event_type: string
  run_id: string
  agent?: string
  phase?: number
  status?: string
  progress_pct?: number
  message?: string
  timestamp: string
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
