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

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Register SW for Driver PWA in production only.
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {/* not critical */})
    })
  } else {
    // In dev: unregister any stale SW — its cache-first strategy causes duplicate React.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister())
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppRoutes />
    </Providers>
  </StrictMode>
)
