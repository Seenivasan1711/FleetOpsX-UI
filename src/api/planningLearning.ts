import client from './client'
import type { PlanningLearning } from '../types'

export async function listLearningPatterns(status?: string): Promise<PlanningLearning[]> {
  const res = await client.get<PlanningLearning[]>('/plan/learning', { params: status ? { status } : undefined })
  return res.data
}

export async function approvePattern(id: string): Promise<PlanningLearning> {
  const res = await client.post<PlanningLearning>(`/plan/learning/${id}/approve`)
  return res.data
}

export async function rejectPattern(id: string): Promise<PlanningLearning> {
  const res = await client.post<PlanningLearning>(`/plan/learning/${id}/reject`)
  return res.data
}
