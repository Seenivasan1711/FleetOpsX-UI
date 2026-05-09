import client from './client'

export interface AiProviderOut {
  id: string
  tenant_id: string | null
  provider_name: string
  model_id: string
  task_type: string
  is_active: boolean
  is_platform_default: boolean
  key_set: boolean
  created_at: string
  updated_at: string
}

export interface AiProviderIn {
  provider_name: string
  model_id: string
  api_key?: string
  task_type: string
  is_active?: boolean
  is_platform_default?: boolean
}

export interface TenantAiConfigOut {
  platform_defaults: Record<string, string | null>
  tenant_overrides:  Record<string, string | null>
  own_keys_configured: string[]
}

export const listAiProviders = (): Promise<AiProviderOut[]> =>
  client.get('/api/v1/admin/ai-providers').then(r => r.data)

export const createAiProvider = (data: AiProviderIn): Promise<AiProviderOut> =>
  client.post('/api/v1/admin/ai-providers', data).then(r => r.data)

export const updateAiProvider = (id: string, data: Partial<AiProviderIn>): Promise<AiProviderOut> =>
  client.put(`/api/v1/admin/ai-providers/${id}`, data).then(r => r.data)

export const deleteAiProvider = (id: string): Promise<void> =>
  client.delete(`/api/v1/admin/ai-providers/${id}`).then(r => r.data)

export const getTenantAiConfig = (): Promise<TenantAiConfigOut> =>
  client.get('/api/v1/tenants/settings/ai-config').then(r => r.data)

export const updateTenantAiConfig = (data: {
  task_type: string
  model_id?: string
  api_key?: string
  provider_name?: string
}): Promise<void> =>
  client.patch('/api/v1/tenants/settings/ai-config', data).then(r => r.data)
