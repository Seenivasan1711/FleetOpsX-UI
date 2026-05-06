import client from './client'

export interface FleetAvailabilitySummary {
  drivers: { available: number; on_break: number; off_duty: number; total: number }
  vehicles: { available: number; in_use: number; maintenance: number; low_fuel: number; total: number }
}

export const fetchFleetAvailability = (): Promise<FleetAvailabilitySummary> =>
  client.get('/api/v1/fleet/availability').then(r => r.data)
