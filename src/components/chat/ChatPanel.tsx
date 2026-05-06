import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User } from 'lucide-react'
import { useUiStore }  from '../../store/ui.store'
import { today }       from '../../lib/utils/format'

type Msg = {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  time:      string
}

const STARTERS = [
  'How many unassigned orders today?',
  'Which drivers are available?',
  'Show me at-risk deliveries',
  "What's today's plan status?",
]

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatPanel() {
  const { chatOpen, toggleChat } = useUiStore()
  const [msgs,    setMsgs]    = useState<Msg[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => { if (chatOpen) inputRef.current?.focus() }, [chatOpen])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text, time: ts() }
    setMsgs((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const { sendChatMessage } = await import('../../api/chat')
      const res = await sendChatMessage(text, today())
      setMsgs((m) => [...m, { id: res.id, role: 'assistant', content: res.content, time: ts() }])
    } catch {
      setMsgs((m) => [...m, {
        id:      crypto.randomUUID(),
        role:    'assistant',
        content: 'The Fleet AI chat backend is not yet connected. Check back once the chat service is deployed.',
        time:    ts(),
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!chatOpen) return null

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col"
      style={{
        width:      360,
        background: 'var(--c-surface)',
        borderLeft: '1px solid var(--c-border)',
        boxShadow:  '-8px 0 40px rgba(0,0,0,.28)',
        animation:  'dropdown-in 0.22s ease',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--c-accent-dim)' }}
          >
            <Bot size={16} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--c-text)]">Fleet AI</p>
            <p className="text-[11px] text-[var(--c-muted)]">Ask anything about your fleet</p>
          </div>
        </div>
        <button
          onClick={toggleChat}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--c-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-elevated)'; e.currentTarget.style.color = 'var(--c-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent';        e.currentTarget.style.color = 'var(--c-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-[var(--c-muted)] text-center">
              Ask me anything about today's fleet operations.
            </p>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full px-4 py-3 rounded-xl text-left text-sm transition-all"
                style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-accent-dim)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-purple-dim)' }}
            >
              {msg.role === 'user'
                ? <User size={13} className="text-white" />
                : <Bot  size={13} style={{ color: 'var(--c-purple)' }} />
              }
            </div>
            <div
              className="max-w-[268px] px-4 py-3 text-sm leading-relaxed"
              style={{
                background:   msg.role === 'user' ? 'var(--c-accent)' : 'var(--c-elevated)',
                color:        msg.role === 'user' ? '#fff'             : 'var(--c-text)',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              }}
            >
              {msg.content}
              <p className="text-[10px] mt-1.5 opacity-50">{msg.time}</p>
            </div>
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

      {/* Input */}
      <div className="shrink-0 p-4" style={{ borderTop: '1px solid var(--c-border)' }}>
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
        >
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--c-text)' }}
            placeholder="Ask about your fleet…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
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
          Fleet AI · powered by the dispatch backend
        </p>
      </div>
    </div>
  )
}
