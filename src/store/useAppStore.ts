import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AppState {
  theme: 'light' | 'dark'
  accessToken: string | null
  user: User | null
  setTheme: (theme: 'light' | 'dark') => void
  setAuth: (user: User) => void
  clearAuth: () => void
}

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      accessToken: null,
      user: null,
      setTheme: (theme) => set({ theme }),
      setAuth: (user) => set({ accessToken: user.access_token, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({ theme: state.theme, accessToken: state.accessToken, user: state.user }),
    }
  )
)

export default useAppStore
