import client from './client'

export type AuditLogEntry = {
  id:            string
  created_at:    string
  actor_email:   string
  actor_role:    string
  action:        string
  resource_type: string
  resource_id:   string | null
  before_state:  unknown | null
  after_state:   unknown | null
  ip_address:    string | null
  user_agent:    string | null
  ai_context:    unknown | null
}

export type AuditLogPage = {
  total: number
  items: AuditLogEntry[]
}

export type AuditLogFilters = {
  action?:        string
  actor_email?:   string
  resource_type?: string
  since?:         string
  until?:         string
  page?:          number
  limit?:         number
}

export type DataExportStatus = {
  task_id:      string
  status:       string
  download_url: string | null
  error:        string | null
}

export type RetentionConfig = {
  retention_days: number
  updated_at:     string | null
}

export type RbacRole = {
  id:          string
  name:        string
  permissions: string[]
  is_system:   boolean
  tenant_id:   string
}

// Audit log
export const fetchAuditLog = (filters: AuditLogFilters = {}): Promise<AuditLogPage> =>
  client.get('/api/v1/audit/log', { params: filters }).then((r) => r.data)

// Data export
export const requestDataExport = (): Promise<DataExportStatus> =>
  client.post('/api/v1/governance/data-export').then((r) => r.data)

export const getExportStatus = (taskId: string): Promise<DataExportStatus> =>
  client.get(`/api/v1/governance/data-export/${taskId}`).then((r) => r.data)

// Retention
export const fetchRetention = (): Promise<RetentionConfig> =>
  client.get('/api/v1/governance/retention').then((r) => r.data)

export const updateRetention = (retention_days: number): Promise<RetentionConfig> =>
  client.patch('/api/v1/governance/retention', { retention_days }).then((r) => r.data)

// RBAC roles
export const fetchRoles = (): Promise<RbacRole[]> =>
  client.get('/api/v1/governance/roles').then((r) => r.data)

export const createRole = (body: { name: string; permissions: string[] }): Promise<RbacRole> =>
  client.post('/api/v1/governance/roles', body).then((r) => r.data)

export const deleteRole = (id: string): Promise<void> =>
  client.delete(`/api/v1/governance/roles/${id}`).then(() => undefined)
