import client from './client'
import type { Order } from '../types'

export const fetchOrders = (params?: {
  plan_date?: string
  status?: string
  unassigned_only?: boolean
}): Promise<Order[]> =>
  client.get('/api/v1/orders/', { params }).then(r => r.data)

export const fetchOrder = (id: string): Promise<Order> =>
  client.get(`/api/v1/orders/${id}`).then(r => r.data)

export const createOrder = (data: Partial<Order>): Promise<Order> =>
  client.post('/api/v1/orders/', data).then(r => r.data)

export const updateOrder = (id: string, data: Partial<Order>): Promise<Order> =>
  client.patch(`/api/v1/orders/${id}`, data).then(r => r.data)
