import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set) => ({
      theme: 'light',
      authToken: null,
      setTheme: (theme: string) => set({ theme }),
      setAuthToken: (token: string | null) => set({ authToken: token }),
    }),
    {
      name: 'app-store',
      partialize: (state: any) => ({
        theme: state.theme,
        authToken: state.authToken,
      }),
    },
  ),
)

export default useAppStore
