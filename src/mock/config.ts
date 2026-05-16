import { useAuthStore } from '../store/auth.store'

/**
 * Returns true when the dashboard should render mock/demo data.
 *
 * Rules:
 *  - Superadmin with demoMode ON  → mock data (for demos & onboarding tours)
 *  - Superadmin with demoMode OFF → live APIs
 *  - Every other role             → live APIs, always
 *
 * Usage inside components:
 *   const isMock = useMockData()
 */
export function useMockData(): boolean {
  return useAuthStore((s) => s.isSuperadmin && s.demoMode)
}
