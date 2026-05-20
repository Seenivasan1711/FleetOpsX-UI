import client from './client'

export interface FleetAvailabilitySummary {
  drivers: {
    available: number
    on_route:  number   // NEW: drivers actively delivering
    on_break:  number
    off_duty:  number
    total:     number
  }
  vehicles: {
    available:   number
    in_use:      number
    maintenance: number
    low_fuel:    number
    total:       number
  }
  efficiency?: {           // NEW: optional until BE implements
    capacity_used_pct: number
    idle_time_pct:     number
    avg_detour_pct:    number
  }
}

export const fetchFleetAvailability = (): Promise<FleetAvailabilitySummary> =>
  client.get('/api/v1/fleet/availability').then(r => r.data)
