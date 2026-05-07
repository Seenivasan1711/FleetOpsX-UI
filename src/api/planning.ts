import client from './client'
import type { PlanResult, PlanOption } from '../types'

export const generatePlan = (plan_date: string): Promise<PlanResult> =>
  client.post('/api/v1/plan/day', null, { params: { plan_date } }).then(r => r.data)

export const generatePlanOptions = (plan_date: string): Promise<PlanOption[]> =>
  client.post('/api/v1/plan/options', null, { params: { plan_date } }).then(r => r.data)

export const confirmPlan = (plan_id: string): Promise<PlanResult> =>
  client.post('/api/v1/plan/confirm', null, { params: { plan_id } }).then(r => r.data)
