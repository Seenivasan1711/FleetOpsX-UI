import client from './client'

export const fetchMyStops = (plan_date?: string) =>
  client.get('/api/v1/driver/my-stops', { params: plan_date ? { plan_date } : {} }).then(r => r.data)

export const updateStopStatus = (stop_id: string, status: string) =>
  client.patch(`/api/v1/driver/stops/${stop_id}/status`, { status }).then(r => r.data)
