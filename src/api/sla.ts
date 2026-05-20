import client from './client'

export interface AtRiskStop {
  stop_id: string
  order_id: string
  driver_id: string
  driver_name: string
  delivery_address: string
  time_window_end: string
  eta_minutes: number
  overdue_by_minutes: number
  stop_status: string
  priority: string
  reason?: string   // NEW: human-readable reason for risk
}

export const fetchAtRiskStops = (planDate: string): Promise<AtRiskStop[]> =>
  client.get('/api/v1/sla/at-risk', { params: { plan_date: planDate } }).then(r => r.data)
