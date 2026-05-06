import client from './client'

export type ScenarioType = 'new_depot' | 'ev_fleet_mix' | 'driver_count_change' | 'demand_surge'

export type ScenarioRun = {
  id:             string
  name:           string
  scenario_type:  ScenarioType
  parameters:     Record<string, unknown>
  horizon_start:  string
  horizon_days:   number
  status:         'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  baseline_kpis:  Record<string, number> | null
  created_by:     string
  completed_at:   string | null
  tenant_id:      string
  created_at:     string
}

export type ScenarioStatus = {
  status:       string
  progress:     number
  total:        number
  current_date: string | null
}

export type ScenarioResult = {
  id:                string
  plan_date:         string
  total_routes:      number
  assigned_orders:   number
  on_time_rate:      number
  avg_delay_min:     number
  total_distance_km: number
  fleet_utilization: number
  kpi_delta:         Record<string, number> | null
}

export type CreateScenarioBody = {
  name:           string
  scenario_type:  ScenarioType
  parameters:     Record<string, unknown>
  horizon_start:  string
  horizon_days:   number
}

export type MultiDayPlanResult = {
  days: {
    plan_date:       string
    plan_id:         string | null
    assigned_orders: number
    total_routes:    number
    total_orders:    number
  }[]
  summary: {
    total_orders:     number
    total_assigned:   number
    avg_on_time_rate: number
  }
}

export const fetchScenarios = (): Promise<ScenarioRun[]> =>
  client.get('/api/v1/scenarios').then((r) => r.data)

export const createScenario = (body: CreateScenarioBody): Promise<ScenarioRun> =>
  client.post('/api/v1/scenarios', body).then((r) => r.data)

export const fetchScenarioStatus = (id: string): Promise<ScenarioStatus> =>
  client.get(`/api/v1/scenarios/${id}/status`).then((r) => r.data)

export const fetchScenarioResults = (id: string): Promise<ScenarioResult[]> =>
  client.get(`/api/v1/scenarios/${id}/results`).then((r) => r.data)

export const deleteScenario = (id: string): Promise<void> =>
  client.delete(`/api/v1/scenarios/${id}`).then(() => undefined)

export const planMultiDay = (body: {
  start_date:   string
  horizon_days: number
  parameters?:  Record<string, unknown>
}): Promise<MultiDayPlanResult> =>
  client.post('/api/v1/plan/multi-day', body).then((r) => r.data)
