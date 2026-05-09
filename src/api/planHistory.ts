import client from './client'

export interface PlanNoteOut {
  id:              string
  plan_history_id: string
  note:            string
  rating:          number | null
  created_by:      string | null
  created_at:      string
}

export interface PlanHistoryOut {
  id:                string
  plan_date:         string
  scenario_type:     string | null
  source:            string
  total_orders:      number | null
  total_routes:      number | null
  coverage_pct:      number | null
  est_fuel_cost_inr: number | null
  total_time_min:    number | null
  ai_confidence:     number | null
  created_by:        string | null
  created_at:        string
  notes:             PlanNoteOut[]
}

export interface PlanHistoryIn {
  plan_date:          string
  scenario_type?:     string
  source?:            string
  total_orders?:      number
  total_routes?:      number
  coverage_pct?:      number
  est_fuel_cost_inr?: number
  total_time_min?:    number
  ai_confidence?:     number
}

export const listPlanHistory = (plan_date?: string, limit = 50): Promise<PlanHistoryOut[]> =>
  client.get('/api/v1/plan/history', { params: { ...(plan_date ? { plan_date } : {}), limit } }).then(r => r.data)

export const createPlanHistory = (body: PlanHistoryIn): Promise<PlanHistoryOut> =>
  client.post('/api/v1/plan/history', body).then(r => r.data)

export const getPlanHistory = (id: string): Promise<PlanHistoryOut> =>
  client.get(`/api/v1/plan/history/${id}`).then(r => r.data)

export const addPlanNote = (history_id: string, note: string, rating?: number): Promise<PlanNoteOut> =>
  client.post(`/api/v1/plan/history/${history_id}/notes`, { note, rating }).then(r => r.data)
