import client from './client'
import type { PlanResult } from '../types'

export const generatePlan = (plan_date: string): Promise<PlanResult> =>
  client.post('/api/v1/plan/day', null, { params: { plan_date } }).then(r => r.data)
