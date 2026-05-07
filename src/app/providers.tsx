import { useEffect, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useUiStore } from '../store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          30_000,
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemeSync() {
  const { theme, variant } = useUiStore()

  useEffect(() => {
    const html = document.documentElement
    html.classList.add('theme-transitioning')
    html.setAttribute('data-theme',   theme)
    html.setAttribute('data-variant', variant)
    const t = setTimeout(() => html.classList.remove('theme-transitioning'), 420)
    return () => clearTimeout(t)
  }, [theme, variant])

  return null
}

export const Providers = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeSync />
    {children}
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--c-surface)',
          color:      'var(--c-text)',
          border:     '1px solid var(--c-border)',
          borderRadius: '12px',
          fontSize:   '13px',
          fontFamily: 'var(--font-sans)',
        },
        success: { iconTheme: { primary: 'var(--c-green)', secondary: 'var(--c-surface)' } },
        error:   { iconTheme: { primary: 'var(--c-red)',   secondary: 'var(--c-surface)' } },
      }}
    />
  </QueryClientProvider>
)
