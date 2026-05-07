import client from './client'

export interface KpiPeriod {
  since: string
  until: string
}

export interface DailyDelivery {
  date: string
  total: number
  on_time: number
}

export interface ZoneDelivery {
  zone: string
  total: number
  on_time: number
  on_time_rate: number | null
}

export interface KpiData {
  period: KpiPeriod
  total_deliveries: number
  on_time_rate: number | null
  avg_delay_minutes: number | null
  deliveries_by_day: DailyDelivery[]
  deliveries_by_zone: ZoneDelivery[]
}

export interface DriverPerf {
  driver_id: string
  driver_name: string
  total_deliveries: number
  on_time_rate: number | null
  avg_delay_minutes: number | null
}

export const fetchKpis = (since?: string, until?: string): Promise<KpiData> => {
  const params: Record<string, string> = {}
  if (since) params.since = since
  if (until) params.until = until
  return client.get('/api/v1/analytics/kpis', { params }).then(r => r.data)
}

export const fetchDriverPerformance = (since?: string): Promise<DriverPerf[]> => {
  const params: Record<string, string> = {}
  if (since) params.since = since
  return client.get('/api/v1/analytics/driver-performance', { params }).then(r => r.data)
}

export const triggerEtl = (planDate: string): Promise<{ plan_date: string; upserted: number; driver_scores_upserted: number }> =>
  client.post('/api/v1/analytics/run-etl', null, { params: { plan_date: planDate } }).then(r => r.data)
