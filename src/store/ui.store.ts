import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme   = 'dark' | 'light'
type Variant = 'obsidian' | 'midnight' | 'storm' | 'amethyst'

type DisplayPrefs = {
  compactSidebar:  boolean
  reduceMotion:    boolean
  keyboardHints:   boolean
}

type NotificationPrefs = {
  atRiskAlerts:      boolean
  aiSuggestions:     boolean
  planReady:         boolean
  driverOffline:     boolean
  etlComplete:       boolean
}

type UiState = {
  theme:           Theme
  variant:         Variant
  sidebarExpanded: boolean
  chatOpen:        boolean
  display:         DisplayPrefs
  notifications:   NotificationPrefs

  setTheme:        (theme: Theme) => void
  setVariant:      (variant: Variant) => void
  toggleSidebar:   () => void
  setSidebar:      (expanded: boolean) => void
  toggleChat:      () => void
  setDisplay:      (key: keyof DisplayPrefs, value: boolean) => void
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme:           'dark',
      variant:         'obsidian',
      sidebarExpanded: false,
      chatOpen:        false,

      display: {
        compactSidebar: false,
        reduceMotion:   false,
        keyboardHints:  true,
      },

      notifications: {
        atRiskAlerts:  true,
        aiSuggestions: true,
        planReady:     true,
        driverOffline: false,
        etlComplete:   false,
      },

      setTheme:    (theme)    => set({ theme }),
      setVariant:  (variant)  => set({ variant }),
      toggleSidebar:           () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
      setSidebar:  (expanded)  => set({ sidebarExpanded: expanded }),
      toggleChat:              () => set((s) => ({ chatOpen: !s.chatOpen })),

      setDisplay: (key, value) =>
        set((s) => ({ display: { ...s.display, [key]: value } })),

      setNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
    }),
    {
      name: 'fleetopsx-ui',
      partialize: (s) => ({
        theme:           s.theme,
        variant:         s.variant,
        sidebarExpanded: s.sidebarExpanded,
        display:         s.display,
        notifications:   s.notifications,
      }),
    }
  )
)
