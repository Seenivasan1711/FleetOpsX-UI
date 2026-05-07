import client from './client'
import type { Vehicle } from '../types'

export const fetchVehicles = (params?: { active_only?: boolean; depot_id?: string }): Promise<Vehicle[]> =>
  client.get('/api/v1/vehicles/', { params }).then(r => r.data)

export const fetchVehicle = (id: string): Promise<Vehicle> =>
  client.get(`/api/v1/vehicles/${id}`).then(r => r.data)

export const createVehicle = (data: Partial<Vehicle>): Promise<Vehicle> =>
  client.post('/api/v1/vehicles/', data).then(r => r.data)

export const updateVehicle = (id: string, data: Partial<Vehicle>): Promise<Vehicle> =>
  client.patch(`/api/v1/vehicles/${id}`, data).then(r => r.data)

export const deleteVehicle = (id: string): Promise<void> =>
  client.delete(`/api/v1/vehicles/${id}`).then(r => r.data)
