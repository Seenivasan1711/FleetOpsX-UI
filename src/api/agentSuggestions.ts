import client from './client'
import type { AgentSuggestion } from '../types'

export const fetchSuggestions = (planDate: string, status?: string): Promise<AgentSuggestion[]> => {
  const params: Record<string, string> = { plan_date: planDate }
  if (status) params.status = status
  return client.get('/api/v1/agent/suggestions', { params }).then(r => r.data)
}

export const respondToSuggestion = (
  id: string,
  status: 'ACCEPTED' | 'DISMISSED',
): Promise<AgentSuggestion> =>
  client.patch(`/api/v1/agent/suggestions/${id}`, { status }).then(r => r.data)
