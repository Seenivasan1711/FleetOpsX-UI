import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Zap, ChevronRight } from 'lucide-react'
import { useUiStore }  from '../../store/ui.store'
import { today }       from '../../lib/utils/format'

// ─── types ────────────────────────────────────────────────────────────────────

type Msg = {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  time:       string
  structured?: StructuredCard | null
  followUps?: string[]
}

type StructuredCard = {
  type:  string
  title: string
  rows:  { label: string; value: string; highlight?: boolean }[]
}

// ─── slash commands ──────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { cmd: '/plan',      label: 'Plan status',      desc: "Today's plan summary"          },
  { cmd: '/atrisk',   label: 'At-risk deliveries', desc: 'Orders likely to miss SLA'   },
  { cmd: '/drivers',  label: 'Driver availability', desc: 'Who is available now'        },
  { cmd: '/capacity', label: 'Capacity check',     desc: 'Load vs available capacity'  },
  { cmd: '/help',     label: 'Help',               desc: 'List all commands'            },
]

const STARTERS = [
  'How many unassigned orders today?',
  'Which drivers are available?',
  'Show me at-risk deliveries',
  "What's today's plan status?",
]

// ─── helpers ──────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function tryParseCard(content: string): StructuredCard | null {
  try {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ?? content.match(/^(\{[\s\S]*\})$/)
    if (!jsonMatch) return null
    const raw = JSON.parse(jsonMatch[1] ?? jsonMatch[0])
    if (!raw.type || !Array.isArray(raw.rows)) return null
    return raw as StructuredCard
  } catch {
    return null
  }
}

function inferFollowUps(content: string): string[] {
  const lower = content.toLowerCase()
  if (lower.includes('unassigned') || lower.includes('order'))
    return ['Which are CRITICAL?', 'Generate a plan for today', 'Show me the map']
  if (lower.includes('driver') || lower.includes('available'))
    return ['Who is closest to Zone A?', 'Show shift schedule', 'Assign to next order']
  if (lower.includes('at-risk') || lower.includes('sla'))
    return ['Prioritise these orders', 'Alert the drivers', 'Generate a replan']
  if (lower.includes('plan') || lower.includes('route'))
    return ['Export this plan', 'Show route details', 'Any at-risk orders?']
  return ['Tell me more', 'What should I do next?']
}

// ─── Structured card renderer ────────────────────────────────────────────────

function CardBlock({ card }: { card: StructuredCard }) {
  return (
    <div
      className="mt-2 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--c-border)' }}
    >
      <div
        className="px-3 py-2 flex items-center gap-1.5"
        style={{ background: 'var(--c-accent-dim)' }}
      >
        <Zap size={11} style={{ color: 'var(--c-accent)' }} />
        <span className="text-[11px] font-semibold" style={{ color: 'var(--c-accent)' }}>{card.title}</span>
      </div>
      <div className="divide-y" style={{ background: 'var(--c-elevated)' }}>
        {card.rows.map((row, i) => (
          <div key={i} className="flex justify-between px-3 py-2">
            <span className="text-[11px] text-[var(--c-muted)]">{row.label}</span>
            <span
              className="text-[11px] font-semibold font-mono"
              style={{ color: row.highlight ? 'var(--c-red)' : 'var(--c-text)' }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Follow-up chips ──────────────────────────────────────────────────────────

function FollowUps({ chips, onSend }: { chips: string[]; onSend: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
      {chips.map((c) => (
        <button
          key={c}
          onClick={() => onSend(c)}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-colors"
          style={{
            background: 'var(--c-elevated)',
            border:     '1px solid var(--c-border)',
            color:      'var(--c-muted)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-accent-dim)'; e.currentTarget.style.color = 'var(--c-accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--c-elevated)';   e.currentTarget.style.color = 'var(--c-muted)' }}
        >
          {c} <ChevronRight size={9} />
        </button>
      ))}
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function ChatPanel() {
  const { chatOpen, toggleChat } = useUiStore()
  const [msgs,         setMsgs]         = useState<Msg[]>([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { if (chatOpen) inputRef.current?.focus() }, [chatOpen])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  const handleInputChange = (val: string) => {
    setInput(val)
    setShowCommands(val.startsWith('/') && val.length <= 20)
  }

  const filteredCommands = SLASH_COMMANDS.filter(
    (c) => input === '/' || c.cmd.startsWith(input.toLowerCase()) || c.label.toLowerCase().includes(input.slice(1).toLowerCase())
  )

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setShowCommands(false)
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text, time: ts() }
    setMsgs((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { sendChatMessage } = await import('../../api/chat')
      const res = await sendChatMessage(text, today())
      const structured = tryParseCard(res.content)
      const displayContent = structured
        ? res.content.replace(/```json[\s\S]*?```/, '').trim()
        : res.content
      setMsgs((m) => [
        ...m,
        {
          id:         res.id,
          role:       'assistant',
          content:    displayContent,
          time:       ts(),
          structured,
          followUps:  inferFollowUps(res.content),
        },
      ])
    } catch {
      setMsgs((m) => [
        ...m,
        {
          id:       crypto.randomUUID(),
          role:     'assistant',
          content:  'Fleet AI is not connected yet — the chat backend will be available once deployed.',
          time:     ts(),
          followUps: ['Try again', 'Check API status'],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!chatOpen) return null

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col"
      style={{
        width:      'min(420px, 100vw)',
        background: 'var(--c-surface)',
        borderLeft: '1px solid var(--c-border)',
        boxShadow:  '-8px 0 48px rgba(0,0,0,.4)',
        animation:  'chat-slide-in 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--c-accent-dim)' }}
          >
            <Bot size={17} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--c-text)]">Fleet AI</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
              <p className="text-[10px] text-[var(--c-muted)]">Online · LLM connected</p>
            </div>
          </div>
        </div>
        <button
          onClick={toggleChat}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--c-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-surface)'; e.currentTarget.style.color = 'var(--c-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent';       e.currentTarget.style.color = 'var(--c-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.length === 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-[var(--c-muted)] text-center pb-1">
              Ask me anything · type <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}>/</kbd> for commands
            </p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full px-4 py-3 rounded-xl text-left text-sm flex items-center justify-between gap-2 transition-all group"
                style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--c-border)')}
              >
                <span>{s}</span>
                <ChevronRight size={13} style={{ color: 'var(--c-muted)' }} />
              </button>
            ))}
          </div>
        )}

        {msgs.map((msg, idx) => (
          <div key={msg.id}>
            <div className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-purple-dim)' }}
              >
                {msg.role === 'user'
                  ? <User size={13} className="text-white" />
                  : <Bot  size={13} style={{ color: 'var(--c-purple)' }} />
                }
              </div>
              <div className="flex flex-col max-w-[75%]">
                <div
                  className="px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background:   msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-elevated)',
                    color:        msg.role === 'user' ? '#fff'             : 'var(--c-text)',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    borderLeft:   msg.role === 'assistant' ? '3px solid var(--c-accent)' : undefined,
                  }}
                >
                  {msg.content && <span>{msg.content}</span>}
                  {msg.structured && <CardBlock card={msg.structured} />}
                  <p className="text-[10px] mt-1.5 opacity-50">{msg.time}</p>
                </div>
              </div>
            </div>

            {/* Follow-up chips — only last assistant message */}
            {msg.role === 'assistant' && msg.followUps && idx === msgs.length - 1 && !loading && (
              <FollowUps chips={msg.followUps} onSend={send} />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--c-purple-dim)' }}
            >
              <Bot size={13} style={{ color: 'var(--c-purple)' }} />
            </div>
            <div
              className="px-4 py-3 rounded-[18px_18px_18px_4px] flex items-center gap-1.5"
              style={{ background: 'var(--c-elevated)' }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full block"
                  style={{ background: 'var(--c-muted)', animation: `live-pulse 1.2s infinite ${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Slash command palette */}
      {showCommands && filteredCommands.length > 0 && (
        <div
          className="mx-4 mb-1 rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--c-border)', background: 'var(--c-elevated)' }}
        >
          {filteredCommands.map((c) => (
            <button
              key={c.cmd}
              onClick={() => { send(c.cmd); setShowCommands(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-accent-dim)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-xs font-mono font-semibold" style={{ color: 'var(--c-accent)', minWidth: 72 }}>{c.cmd}</span>
              <span className="text-xs text-[var(--c-muted)]">{c.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-4" style={{ borderTop: '1px solid var(--c-border)' }}>
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
          style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
        >
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--c-text)' }}
            placeholder="Ask about your fleet… or type /"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
              if (e.key === 'Escape') setShowCommands(false)
            }}
            disabled={loading}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-40"
            style={{ background: 'var(--c-accent)' }}
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-[var(--c-muted)] text-center mt-2">
          Fleet AI · Claude-powered · <kbd className="opacity-60">Enter</kbd> to send
        </p>
      </div>
    </div>
  )
}
