export interface Tenant {
  id: string
  name: string
  slug: string
}

export interface User {
  user_id: string
  tenant_id: string
  role: 'dispatcher' | 'driver' | 'admin'
  full_name: string
  access_token: string
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

export interface Driver {
  id: string
  tenant_id: string
  full_name: string
  phone?: string
  email?: string
  home_depot_id?: string
  is_active: boolean
}

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
  planner?: string        // "rule_based" | "ortools" | "langgraph" | ...
  explanation?: string    // LLM-generated summary (langgraph only)
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
