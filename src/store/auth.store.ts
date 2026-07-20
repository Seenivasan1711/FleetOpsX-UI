import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

type AuthState = {
  accessToken:       string | null
  user:              User | null
  effectiveTenantId: string | null
  isReadOnly:        boolean
  isSuperadmin:      boolean
  // Superadmin-only: show mock/demo data instead of live APIs
  demoMode:          boolean

  setAuth:              (user: User) => void
  clearAuth:            () => void
  setEffectiveTenant:   (tenantId: string, readOnly: boolean) => void
  clearEffectiveTenant: () => void
  setReadOnly:          (readOnly: boolean) => void
  setDemoMode:          (on: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken:       null,
      user:              null,
      effectiveTenantId: null,
      isReadOnly:        false,
      isSuperadmin:      false,
      demoMode:          false,

      setAuth: (user) => set({
        accessToken:  user.access_token,
        user,
        isSuperadmin: user.role === 'superadmin',
        // Non-superadmin always gets live data
        demoMode: false,
      }),

      clearAuth: () => set({
        accessToken:       null,
        user:              null,
        effectiveTenantId: null,
        isReadOnly:        false,
        isSuperadmin:      false,
        demoMode:          false,
      }),

      setEffectiveTenant: (tenantId, readOnly) => set({
        effectiveTenantId: tenantId,
        isReadOnly:        readOnly,
      }),

      clearEffectiveTenant: () => set({
        effectiveTenantId: null,
        isReadOnly:        false,
      }),

      setReadOnly: (readOnly) => set({ isReadOnly: readOnly }),

      // Only meaningful when isSuperadmin=true; non-superadmin can't set this
      setDemoMode: (on) => set((s) => ({ demoMode: s.isSuperadmin ? on : false })),
    }),
    {
      name:        'fleetopsx-auth',
      partialize:  (s) => ({
        accessToken:       s.accessToken,
        user:              s.user,
        effectiveTenantId: s.effectiveTenantId,
        isReadOnly:        s.isReadOnly,
        isSuperadmin:      s.isSuperadmin,
        demoMode:          s.demoMode,
      }),
    }
  )
)
