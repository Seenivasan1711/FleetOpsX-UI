import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

type AuthState = {
  accessToken: string | null
  user:        User | null

  setAuth:   (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user:        null,

      setAuth:   (user) => set({ accessToken: user.access_token, user }),
      clearAuth: ()     => set({ accessToken: null, user: null }),
    }),
    {
      name: 'fleetopsx-auth',
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
    }
  )
)
