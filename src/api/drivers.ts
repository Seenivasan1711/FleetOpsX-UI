import client from './client'
import type { Driver } from '../types'

export const fetchDrivers = (params?: { active_only?: boolean; depot_id?: string }): Promise<Driver[]> =>
  client.get('/api/v1/drivers/', { params }).then(r => r.data)

export const fetchDriver = (id: string): Promise<Driver> =>
  client.get(`/api/v1/drivers/${id}`).then(r => r.data)

export const createDriver = (data: Partial<Driver>): Promise<Driver> =>
  client.post('/api/v1/drivers/', data).then(r => r.data)

export const updateDriver = (id: string, data: Partial<Driver>): Promise<Driver> =>
  client.patch(`/api/v1/drivers/${id}`, data).then(r => r.data)

export const deleteDriver = (id: string): Promise<void> =>
  client.delete(`/api/v1/drivers/${id}`).then(r => r.data)
