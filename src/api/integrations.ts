import client from './client'

export type WebhookRegistration = {
  id:          string
  tenant_id:   string
  url:         string
  event_types: string[]
  is_active:   boolean
  last_error:  string | null
  created_at:  string | null
}

export type IntegrationLog = {
  id:               string
  partner_order_id: string
  source_system:    string
  normalized:       boolean
  order_id:         string | null
  error_message:    string | null
  created_at:       string | null
}

export type IngestResult = {
  order_id:   string | null
  status:     'created' | 'skipped' | 'error'
  idempotent: boolean
}

export type TrackingFeedItem = {
  order_id:     string
  status:       string
  driver_name:  string | null
  eta_minutes:  number | null
  last_ping_at: string | null
}

// Webhooks
export const fetchWebhooks = (): Promise<WebhookRegistration[]> =>
  client.get('/api/v1/integrations/webhooks').then((r) => r.data)

export const createWebhook = (body: {
  url: string
  event_types: string[]
  secret?: string
}): Promise<WebhookRegistration> =>
  client.post('/api/v1/integrations/webhooks', body).then((r) => r.data)

export const deleteWebhook = (id: string): Promise<void> =>
  client.delete(`/api/v1/integrations/webhooks/${id}`).then(() => undefined)

export const testWebhook = (id: string): Promise<{ queued: boolean; message: string }> =>
  client.post(`/api/v1/integrations/webhooks/${id}/test`).then((r) => r.data)

// Integration logs
export const fetchIntegrationLogs = (since?: string): Promise<IntegrationLog[]> =>
  client
    .get('/api/v1/integrations/logs', { params: since ? { since } : {} })
    .then((r) => r.data)

// Ingest
export const ingestOrder = (body: {
  source_system:    string
  partner_order_id: string
  payload:          Record<string, unknown>
}): Promise<IngestResult> =>
  client.post('/api/v1/integrations/ingest', body).then((r) => r.data)

// Tracking feed
export const fetchTrackingFeed = (orderIds: string[]): Promise<TrackingFeedItem[]> =>
  client
    .get('/api/v1/integrations/tracking-feed', {
      params: { 'order_ids[]': orderIds },
    })
    .then((r) => r.data)
