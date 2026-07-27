import { useState, useRef, useEffect, useCallback } from 'react'
import { Brain, X, RotateCcw, Wrench } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { sendPlanningMessage, getPlanningHistory } from '../../api/planningChat'
import { QUERY_KEYS } from '../../lib/utils/constants'
import type { PlanningSession } from '../../types'

const C = {
  bg:       '#0d0d12',
  card:     '#18181b',
  border:   'rgba(255,255,255,0.06)',
  border2:  'rgba(255,255,255,0.09)',
  accent:   '#8b5cf6',
  accentDim:'rgba(139,92,246,0.15)',
  text:     '#f0f0f5',
  textMid:  '#c8c8d8',
  textDim:  '#a0a0b5',
  textMute: '#808098',
  textGhost:'#505065',
  green:    '#34d399',
  sans:     "'DM Sans', system-ui, sans-serif",
  mono:     "'JetBrains Mono', monospace",
}

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls?: string[]
  time: string
  loading?: boolean
}

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function AIAvatar() {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 7, flexShrink: 0, marginTop: 1,
      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Brain size={12} color="#fff" />
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <AIAvatar />
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '10px 14px', background: C.card,
        border: `1px solid ${C.border}`, borderRadius: '14px 14px 14px 4px',
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%', background: C.textGhost,
            display: 'block', animation: `fox-blink 1.2s ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

function ToolCallBadge({ tools }: { tools: string[] }) {
  if (!tools.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {tools.map((t) => (
        <span key={t} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10, padding: '2px 7px', borderRadius: 20,
          background: C.accentDim, border: `1px solid rgba(139,92,246,0.25)`,
          color: C.accent, fontFamily: C.mono,
        }}>
          <Wrench size={8} />
          {t}
        </span>
      ))}
    </div>
  )
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user'
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          background: C.card, border: `1px solid ${C.border2}`,
          color: C.text, padding: '9px 14px',
          borderRadius: '14px 14px 4px 14px',
          fontSize: 13, maxWidth: '85%', lineHeight: 1.55,
        }}>
          {msg.text}
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <AIAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: C.textMid, fontSize: 13, lineHeight: 1.65, fontFamily: C.sans,
        }}>
          {msg.text.split('\n').map((line, i) => (
            <p key={i} style={{ margin: i > 0 ? '5px 0 0' : 0 }}>{line}</p>
          ))}
        </div>
        {msg.toolCalls && <ToolCallBadge tools={msg.toolCalls} />}
        <span style={{ fontSize: 10, color: C.textGhost, display: 'block', marginTop: 4 }}>{msg.time}</span>
      </div>
    </div>
  )
}

const PLANNING_STARTERS = [
  'What does the current plan look like?',
  'Can Driver A take 2 more stops?',
  'Move order #XYZ to Driver B',
  'Which orders are at risk of overtime?',
]

interface Props {
  session: PlanningSession
  onClose: () => void
}

export function PlanningChatPanel({ session, onClose }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  // Load existing history for this session
  const { data: history = [] } = useQuery({
    queryKey: QUERY_KEYS.planningHistory(session.id),
    queryFn: () => getPlanningHistory(session.id),
    enabled: !!session.id,
  })

  useEffect(() => {
    if (history.length && msgs.length === 0) {
      setMsgs(history.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })))
    }
  }, [history])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setInput('')
    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: 'user', text: trimmed, time: ts() }])
    setLoading(true)
    try {
      const res = await sendPlanningMessage(trimmed, session.id)
      setMsgs((m) => [...m, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: res.content,
        toolCalls: res.tool_calls_made,
        time: ts(),
      }])
    } catch {
      setMsgs((m) => [...m, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Planning AI is offline. Ensure the API is running.',
        time: ts(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, session.id])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: C.bg,
        border: `1px solid ${C.border2}`,
        height: 480,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.card, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={13} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Planning AI</p>
            <p style={{ fontSize: 10.5, color: C.textMute }}>
              Session · Round {session.current_round} · {session.status}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {msgs.length > 0 && !loading && (
            <button
              onClick={() => setMsgs([])}
              title="Clear chat"
              style={{ padding: '4px 6px', background: 'transparent', border: 'none', borderRadius: 6, color: C.textGhost, cursor: 'pointer' }}
            >
              <RotateCcw size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{ padding: '4px 6px', background: 'transparent', border: 'none', borderRadius: 6, color: C.textGhost, cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
            <p style={{ fontSize: 12, color: C.textMute, textAlign: 'center' }}>
              Ask me to move orders, check capacity, or explain constraints
            </p>
            {PLANNING_STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10, textAlign: 'left',
                  fontSize: 12.5, background: C.card, border: `1px solid ${C.border}`,
                  color: C.textMid, cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {msgs.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div style={{ flexShrink: 0, padding: '8px 12px 12px', borderTop: `1px solid ${C.border}` }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          padding: '8px 10px 8px 12px', borderRadius: 10,
          background: C.card, border: `1px solid ${C.border2}`,
        }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || session.status !== 'OPEN'}
            placeholder={
              session.status !== 'OPEN'
                ? `Session is ${session.status} — chat disabled`
                : 'Ask about this plan…'
            }
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 13, lineHeight: 1.5, resize: 'none',
              maxHeight: 80, fontFamily: C.sans,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading || session.status !== 'OPEN'}
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: !input.trim() || loading ? C.card : C.accent,
              border: 'none', cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: !input.trim() || loading ? 0.3 : 1, transform: 'rotate(90deg)' }}
            >
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
