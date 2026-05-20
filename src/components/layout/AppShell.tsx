import { useState, type ReactNode } from 'react'
import { useQuery }                  from '@tanstack/react-query'
import { Sidebar }                  from './Sidebar'
import { Topbar }                   from './Topbar'
import { SuperadminBanner }         from './SuperadminBanner'
import { KeyboardShortcutsModal }   from './KeyboardShortcutsModal'
import { ChatPanel }                from '../chat/ChatPanel'
import { CommandPalette }           from '../shared/CommandPalette'
import { useUiStore }               from '../../store'
import { useAuthStore }             from '../../store/auth.store'
import { useKeyboardShortcuts, useGNavigation } from '../../hooks/useKeyboardShortcuts'
import { fetchOrders }              from '../../api/orders'
import { MOCK_ORDERS }              from '../../mock/data'
import { useMockData }              from '../../mock/config'
import { QUERY_KEYS }               from '../../lib/utils/constants'

type AppShellProps = {
  children: ReactNode
}

export const AppShell = ({ children }: AppShellProps) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showPalette,   setShowPalette]   = useState(false)
  const { sidebarExpanded, toggleSidebar } = useUiStore()
  const { isSuperadmin, effectiveTenantId } = useAuthStore()
  const isMock = useMockData()

  // Always-on unassigned order count for the sidebar badge
  const { data: liveOrders } = useQuery({
    queryKey:        [...QUERY_KEYS.orders(), 'unassigned'] as const,
    queryFn:         () => fetchOrders({ status: 'PENDING' }),
    refetchInterval: 60_000,
    enabled:         !isMock,
  })
  const unassignedCount = isMock
    ? MOCK_ORDERS.filter(o => o.status === 'PENDING').length
    : (liveOrders?.length ?? 0)

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
        pendingOrders={unassignedCount}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 max-w-full">
        <Topbar
          onShowShortcuts={() => setShowShortcuts(true)}
          onOpenCommandPalette={() => setShowPalette(true)}
        />
        {isSuperadmin && effectiveTenantId && <SuperadminBanner />}

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: 'var(--c-bg)' }}
        >
          {children}
        </main>
      </div>

      <ChatPanel />

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showPalette   && <CommandPalette onClose={() => setShowPalette(false)} />}
    </div>
  )
}
