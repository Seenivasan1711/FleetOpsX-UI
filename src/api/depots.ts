import client from './client'
import type { Depot } from '../types'

export const fetchDepots = (params?: { active_only?: boolean }): Promise<Depot[]> =>
  client.get('/api/v1/depots/', { params }).then(r => r.data)

export const fetchDepot = (id: string): Promise<Depot> =>
  client.get(`/api/v1/depots/${id}`).then(r => r.data)

export const createDepot = (data: Partial<Depot>): Promise<Depot> =>
  client.post('/api/v1/depots/', data).then(r => r.data)

export const updateDepot = (id: string, data: Partial<Depot>): Promise<Depot> =>
  client.patch(`/api/v1/depots/${id}`, data).then(r => r.data)

export const deleteDepot = (id: string): Promise<void> =>
  client.delete(`/api/v1/depots/${id}`).then(r => r.data)
