import client from './client'

export interface PingPayload {
  latitude: number
  longitude: number
  accuracy_m?: number
  speed_kmh?: number
  heading_deg?: number
  vehicle_id?: string
}

export interface LivePosition {
  driver_id: string
  driver_name: string
  latitude: number
  longitude: number
  accuracy_m?: number
  speed_kmh?: number
  heading_deg?: number
  recorded_at: string
}

export const pingLocation = (payload: PingPayload) =>
  client.post('/api/v1/tracking/ping', payload).then(r => r.data)

export const fetchLivePositions = (): Promise<LivePosition[]> =>
  client.get('/api/v1/tracking/live').then(r => r.data)
