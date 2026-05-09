import client from './client'

export interface ScenarioKpis {
  total_time_min:     number
  est_fuel_cost_inr:  number
  coverage_pct:       number
}

export interface AiScenario {
  type:           'fastest' | 'economical' | 'balanced' | 'driver_availability'
  total_routes:   number
  total_orders:   number
  kpis:           ScenarioKpis
  ai_confidence:  number
  reasoning:      string
}

export interface AiPlanResult {
  plan_date:           string
  total_orders:        number
  total_drivers:       number
  scenarios:           AiScenario[]
  constraints_applied: string[]
}

export interface TaskStatusResponse {
  status: 'pending' | 'running' | 'done' | 'failed'
  result?: AiPlanResult
  error?:  string
}

export const startAiScenarios = (plan_date: string, nl_constraints?: string): Promise<{ task_id: string; status: string }> =>
  client.post('/api/v1/plan/ai-scenarios', null, {
    params: { plan_date, ...(nl_constraints ? { nl_constraints } : {}) },
  }).then(r => r.data)

export const getTaskStatus = (task_id: string): Promise<TaskStatusResponse> =>
  client.get(`/api/v1/plan/task-status/${task_id}`).then(r => r.data)

export const confirmScenario = (plan_date: string, scenario_type: string, task_id: string): Promise<unknown> =>
  client.post('/api/v1/plan/confirm-scenario', { plan_date, scenario_type, task_id }).then(r => r.data)
