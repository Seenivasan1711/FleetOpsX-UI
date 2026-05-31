import { useEffect, useRef, useState } from 'react'
import type { PlanningRunEvent, RunAgentCheckpoint } from '../types'

interface WSState {
  events: PlanningRunEvent[]
  agents: Record<string, RunAgentCheckpoint>
  progressPct: number
  currentAgent: string | null
  status: 'connecting' | 'live' | 'completed' | 'failed' | 'closed'
}

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws')

export function usePlanningRunWS(runId: string | null, token: string | null) {
  const [state, setState] = useState<WSState>({
    events: [],
    agents: {},
    progressPct: 0,
    currentAgent: null,
    status: 'connecting',
  })
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!runId || !token) return

    const url = `${WS_BASE}/ws/planning-run/${runId}?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    setState({ events: [], agents: {}, progressPct: 0, currentAgent: null, status: 'connecting' })

    ws.onopen = () => setState((s) => ({ ...s, status: 'live' }))

    ws.onmessage = (e) => {
      try {
        const ev: PlanningRunEvent = JSON.parse(e.data)
        if (ev.event_type === 'heartbeat') return

        setState((s) => {
          const next = { ...s, events: [...s.events, ev] }

          if (ev.progress_pct != null) next.progressPct = ev.progress_pct
          if (ev.agent) next.currentAgent = ev.agent

          if (ev.agent && ev.event_type === 'agent_started') {
            next.agents = {
              ...s.agents,
              [ev.agent]: {
                agent: ev.agent,
                phase: ev.phase ?? 1,
                status: 'running',
                started_at: ev.timestamp,
                completed_at: null,
                progress_pct: ev.progress_pct ?? 0,
                result_summary: null,
                error: null,
              },
            }
          }

          if (ev.agent && ev.event_type === 'agent_completed') {
            next.agents = {
              ...s.agents,
              [ev.agent]: {
                ...(s.agents[ev.agent] ?? { agent: ev.agent, phase: ev.phase ?? 1, started_at: null }),
                status: 'completed',
                completed_at: ev.timestamp,
                progress_pct: ev.progress_pct ?? 100,
                result_summary: ev.message ?? null,
                error: null,
              },
            }
          }

          if (ev.agent && ev.event_type === 'agent_failed') {
            next.agents = {
              ...s.agents,
              [ev.agent]: {
                ...(s.agents[ev.agent] ?? { agent: ev.agent, phase: ev.phase ?? 1, started_at: null }),
                status: 'failed',
                completed_at: ev.timestamp,
                progress_pct: s.agents[ev.agent]?.progress_pct ?? 0,
                result_summary: null,
                error: ev.message ?? 'Failed',
              },
            }
          }

          if (ev.event_type === 'run_completed') next.status = 'completed'
          if (ev.event_type === 'run_failed')    next.status = 'failed'

          return next
        })
      } catch { /* ignore malformed frames */ }
    }

    ws.onerror = () => setState((s) => ({ ...s, status: 'failed' }))
    ws.onclose = () => setState((s) => s.status === 'live' || s.status === 'connecting' ? { ...s, status: 'closed' } : s)

    return () => { ws.close() }
  }, [runId, token])

  return state
}
