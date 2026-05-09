import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/globals.css'
import AppRoutes from './routes/AppRoutes'
import { Providers } from './app/providers'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn:                     import.meta.env.VITE_SENTRY_DSN,
    integrations:            [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate:        1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

// Register service worker for Driver PWA — production only.
// In dev the SW's cache-first strategy serves stale Vite chunks causing duplicate React.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* not critical */})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppRoutes />
    </Providers>
  </StrictMode>
)
