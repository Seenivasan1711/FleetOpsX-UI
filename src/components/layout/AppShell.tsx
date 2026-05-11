import { useState, type ReactNode } from 'react'
import { Sidebar }                  from './Sidebar'
import { Topbar }                   from './Topbar'
import { SuperadminBanner }         from './SuperadminBanner'
import { KeyboardShortcutsModal }   from './KeyboardShortcutsModal'
import { ChatPanel }                from '../chat/ChatPanel'
import { CommandPalette }           from '../shared/CommandPalette'
import { useUiStore }               from '../../store'
import { useAuthStore }             from '../../store/auth.store'
import { useKeyboardShortcuts, useGNavigation } from '../../hooks/useKeyboardShortcuts'

type AppShellProps = {
  children:      ReactNode
  pendingOrders?: number
}

export const AppShell = ({ children, pendingOrders }: AppShellProps) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showPalette,   setShowPalette]   = useState(false)
  const { sidebarExpanded, toggleSidebar } = useUiStore()
  const { isSuperadmin, effectiveTenantId } = useAuthStore()

  useKeyboardShortcuts({
    onShowShortcuts:     () => setShowShortcuts(true),
    onOpenCommandPalette: () => setShowPalette(true),
  })
  useGNavigation()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
        pendingOrders={pendingOrders}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          onShowShortcuts={() => setShowShortcuts(true)}
          onOpenCommandPalette={() => setShowPalette(true)}
        />
        {isSuperadmin && effectiveTenantId && <SuperadminBanner />}

        <div className="flex-1 flex overflow-hidden min-w-0">
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ background: 'var(--c-bg)' }}
          >
            {children}
          </main>
          <ChatPanel />
        </div>
      </div>

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showPalette   && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  )
}
