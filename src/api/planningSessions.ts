import client from './client'
import type { PlanningSession } from '../types'

export async function getActiveSession(): Promise<PlanningSession | null> {
  const res = await client.get<PlanningSession | null>('/plan/sessions/active')
  return res.data
}

export async function listSessions(params?: { plan_date?: string; status?: string }): Promise<PlanningSession[]> {
  const res = await client.get<PlanningSession[]>('/plan/sessions', { params })
  return res.data
}

export async function createSession(plan_date: string): Promise<PlanningSession> {
  const res = await client.post<PlanningSession>('/plan/sessions', { plan_date })
  return res.data
}

export async function runSessionRound(sessionId: string, hints?: string): Promise<{ run_id: string }> {
  const res = await client.post<{ run_id: string }>(`/plan/sessions/${sessionId}/rounds`, { hints })
  return res.data
}

export async function confirmSession(sessionId: string): Promise<PlanningSession> {
  const res = await client.post<PlanningSession>(`/plan/sessions/${sessionId}/confirm`)
  return res.data
}

export async function discardSession(sessionId: string): Promise<void> {
  await client.delete(`/plan/sessions/${sessionId}`)
}
