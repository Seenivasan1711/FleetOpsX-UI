import { useState, type ReactNode } from 'react'
import { Bot }                      from 'lucide-react'
import { Sidebar }                  from './Sidebar'
import { Topbar }                   from './Topbar'
import { SuperadminBanner }         from './SuperadminBanner'
import { KeyboardShortcutsModal }   from './KeyboardShortcutsModal'
import { ChatPanel }                from '../chat/ChatPanel'
import { useUiStore }               from '../../store'
import { useAuthStore }             from '../../store/auth.store'
import { useKeyboardShortcuts, useGNavigation } from '../../hooks/useKeyboardShortcuts'

type AppShellProps = {
  children:      ReactNode
  pendingOrders?: number
}

export const AppShell = ({ children, pendingOrders }: AppShellProps) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { sidebarExpanded, toggleSidebar, chatOpen, toggleChat } = useUiStore()
  const { isSuperadmin, effectiveTenantId } = useAuthStore()

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

      {/* Floating AI chat button (hidden when panel is open) */}
      {!chatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95"
          style={{
            width:      52,
            height:     52,
            background: 'linear-gradient(135deg, var(--c-accent), var(--c-purple))',
            boxShadow:  '0 4px 24px rgba(124,58,237,0.4)',
          }}
          title="Fleet AI (⌘K)"
        >
          <Bot size={22} className="text-white" />
        </button>
      )}
    </div>
  )
}
