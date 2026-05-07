import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../store'
import { PAGE_KEY_MAP } from '../lib/utils/constants'

type Options = {
  onShowShortcuts: () => void
}

export function useKeyboardShortcuts({ onShowShortcuts }: Options) {
  const navigate     = useNavigate()
  const { setSidebar, sidebarExpanded } = useUiStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const key = e.key.toLowerCase()

      if (key === '?') { onShowShortcuts(); return }
      if (key === '[') { setSidebar(false); return }
      if (key === ']') { setSidebar(true);  return }
    },
    [onShowShortcuts, setSidebar, sidebarExpanded]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Separate hook for G+key chord navigation — managed by AppShell
export function useGNavigation() {
  const navigate = useNavigate()

  useEffect(() => {
    let gActive  = false
    let gTimeout: ReturnType<typeof setTimeout>

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const key = e.key.toLowerCase()

      if (key === 'g') {
        gActive = true
        clearTimeout(gTimeout)
        gTimeout = setTimeout(() => { gActive = false }, 1500)
        return
      }

      if (gActive && PAGE_KEY_MAP[key]) {
        navigate(PAGE_KEY_MAP[key])
        gActive = false
        clearTimeout(gTimeout)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(gTimeout)
    }
  }, [navigate])
}
