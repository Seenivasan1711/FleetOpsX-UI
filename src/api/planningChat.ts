import client from './client'
import type { PlanningChatMessage } from '../types'

interface PlanningChatResponse {
  content: string
  has_active_session: boolean
  session_id: string | null
  tool_calls_made: string[]
}

export async function sendPlanningMessage(message: string, session_id?: string): Promise<PlanningChatResponse> {
  const res = await client.post<PlanningChatResponse>('/chat/planning', { message, session_id })
  return res.data
}

export async function getPlanningHistory(sessionId: string): Promise<PlanningChatMessage[]> {
  const res = await client.get<PlanningChatMessage[]>(`/chat/planning/${sessionId}/history`)
  return res.data
}
