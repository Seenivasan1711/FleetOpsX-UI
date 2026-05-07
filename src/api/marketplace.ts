import client from './client'

export type CapacityOffer = {
  id:            string
  tenant_id:     string
  offer_date:    string
  driver_count:  number
  vehicle_type:  string | null
  zone:          string
  rate_per_stop: number | null
  status:        'OPEN' | 'MATCHED' | 'CANCELLED' | 'EXPIRED'
  expires_at:    string
  created_at:    string | null
}

export type CapacityRequest = {
  id:           string
  tenant_id:    string
  request_date: string
  order_count:  number
  zone:         string
  priority:     'HIGH' | 'NORMAL'
  status:       'OPEN' | 'MATCHED' | 'CANCELLED' | 'EXPIRED'
  expires_at:   string
  created_at:   string | null
}

export type CapacityMatch = {
  id:                   string
  offer_id:             string
  request_id:           string
  offering_tenant_id:   string
  requesting_tenant_id: string
  matched_orders:       number
  status:               'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  settled_at:           string | null
  created_at:           string | null
}

// Offers
export const fetchOffers = (zone?: string): Promise<CapacityOffer[]> =>
  client.get('/api/v1/marketplace/offers', { params: zone ? { zone } : {} }).then((r) => r.data)

export const createOffer = (body: {
  offer_date:    string
  driver_count:  number
  zone:          string
  vehicle_type?: string
  rate_per_stop?: number
}): Promise<CapacityOffer> =>
  client.post('/api/v1/marketplace/offers', body).then((r) => r.data)

export const cancelOffer = (id: string): Promise<void> =>
  client.delete(`/api/v1/marketplace/offers/${id}`).then(() => undefined)

// Requests
export const fetchMyRequests = (): Promise<CapacityRequest[]> =>
  client.get('/api/v1/marketplace/requests').then((r) => r.data)

export const createRequest = (body: {
  request_date: string
  order_count:  number
  zone:         string
  priority?:    string
}): Promise<CapacityRequest> =>
  client.post('/api/v1/marketplace/requests', body).then((r) => r.data)

// Matches
export const fetchMatches = (status?: string): Promise<CapacityMatch[]> =>
  client.get('/api/v1/marketplace/matches', { params: status ? { status } : {} }).then((r) => r.data)

export const respondToMatch = (id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<CapacityMatch> =>
  client.patch(`/api/v1/marketplace/matches/${id}`, { status }).then((r) => r.data)

export const triggerMatchEngine = (): Promise<{ matches_created: number }> =>
  client.post('/api/v1/marketplace/match-now').then((r) => r.data)
