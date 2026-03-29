import client from './client'
import type { AgentLogEntry } from '../types'

export const fetchAgentLogs = (planId: string, limit = 50): Promise<AgentLogEntry[]> =>
  client.get('/api/v1/agent-logs', { params: { plan_id: planId, limit } }).then(r => r.data)
