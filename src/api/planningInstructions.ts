import client from './client'
import type { PlanningInstruction } from '../types'

export async function listInstructions(): Promise<PlanningInstruction[]> {
  const res = await client.get<PlanningInstruction[]>('/plan/instructions')
  return res.data
}

export async function createInstruction(data: { rule_text: string; priority?: number }): Promise<PlanningInstruction> {
  const res = await client.post<PlanningInstruction>('/plan/instructions', data)
  return res.data
}

export async function updateInstruction(id: string, data: { rule_text?: string; priority?: number }): Promise<PlanningInstruction> {
  const res = await client.put<PlanningInstruction>(`/plan/instructions/${id}`, data)
  return res.data
}

export async function toggleInstruction(id: string): Promise<PlanningInstruction> {
  const res = await client.post<PlanningInstruction>(`/plan/instructions/${id}/toggle`)
  return res.data
}

export async function deleteInstruction(id: string): Promise<void> {
  await client.delete(`/plan/instructions/${id}`)
}
