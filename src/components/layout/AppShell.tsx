import { useState, type ReactNode } from 'react'
import { Sidebar }                  from './Sidebar'
import { Topbar }                   from './Topbar'
import { KeyboardShortcutsModal }   from './KeyboardShortcutsModal'
import { ChatPanel }                from '../chat/ChatPanel'
import { useUiStore }               from '../../store'
import { useKeyboardShortcuts, useGNavigation } from '../../hooks/useKeyboardShortcuts'

type AppShellProps = {
  children:      ReactNode
  pendingOrders?: number
}

export const AppShell = ({ children, pendingOrders }: AppShellProps) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { sidebarExpanded, toggleSidebar } = useUiStore()

  useKeyboardShortcuts({ onShowShortcuts: () => setShowShortcuts(true) })
  useGNavigation()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-bg)' }}>
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
        pendingOrders={pendingOrders}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onShowShortcuts={() => setShowShortcuts(true)} />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: 'var(--c-bg)' }}
        >
          {children}
        </main>
      </div>

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
      <ChatPanel />
    </div>
  )
}
