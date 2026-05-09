import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/auth.store'

export type FleetEventType =
  | 'location_update'
  | 'stop_status'
  | 'plan_generated'
  | 'order_at_risk'
  | 'pong'

export type FleetEvent = {
  type:      FleetEventType
  tenant_id?: string
  payload:   Record<string, unknown>
}

const PING_INTERVAL_MS   = 30_000
const RECONNECT_DELAY_MS = 4_000

function buildWsUrl(token: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host  = window.location.host
  return `${proto}://${host}/ws/events?token=${encodeURIComponent(token)}`
}

export function useFleetEvents(onEvent: (e: FleetEvent) => void) {
  const { accessToken } = useAuthStore()
  const wsRef      = useRef<WebSocket | null>(null)
  const pingRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const unmounted  = useRef(false)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    if (unmounted.current || !accessToken) return

    const ws = new WebSocket(buildWsUrl(accessToken))
    wsRef.current = ws

    ws.onopen = () => {
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, PING_INTERVAL_MS)
    }

    ws.onmessage = (e) => {
      if (e.data === 'pong') return
      try {
        const event = JSON.parse(e.data) as FleetEvent
        onEventRef.current(event)
      } catch {/* ignore malformed */}
    }

    ws.onclose = () => {
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null }
      if (!unmounted.current) {
        setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    ws.onerror = () => ws.close()
  }, [accessToken])

  useEffect(() => {
    unmounted.current = false
    connect()
    return () => {
      unmounted.current = true
      if (pingRef.current) clearInterval(pingRef.current)
      wsRef.current?.close()
    }
  }, [connect])
}
