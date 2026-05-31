import client from './client'
import type { PlanningRun, RunAgentCheckpoint } from '../types'

export async function listRuns(params?: { session_id?: string; status?: string; limit?: number }): Promise<PlanningRun[]> {
  const res = await client.get<PlanningRun[]>('/plan/runs', { params })
  return res.data
}

export async function getRun(runId: string): Promise<PlanningRun> {
  const res = await client.get<PlanningRun>(`/plan/runs/${runId}`)
  return res.data
}

export async function getRunAgents(runId: string): Promise<RunAgentCheckpoint[]> {
  const res = await client.get<RunAgentCheckpoint[]>(`/plan/runs/${runId}/agents`)
  return res.data
}

export async function resumeRun(runId: string): Promise<{ new_run_id: string }> {
  const res = await client.post<{ new_run_id: string }>(`/plan/runs/${runId}/resume`)
  return res.data
}
