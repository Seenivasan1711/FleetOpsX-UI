import { create } from 'zustand'
import type { PlanResult } from '../types'

type PlanState = {
  lastPlan:     PlanResult | null
  lastPlanDate: string | null
  setLastPlan:  (plan: PlanResult, date: string) => void
  clearPlan:    () => void
}

export const usePlanStore = create<PlanState>()((set) => ({
  lastPlan:     null,
  lastPlanDate: null,
  setLastPlan:  (plan, date) => set({ lastPlan: plan, lastPlanDate: date }),
  clearPlan:    ()           => set({ lastPlan: null, lastPlanDate: null }),
}))
