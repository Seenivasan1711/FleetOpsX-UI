import { useState, useRef, useEffect, useCallback } from 'react'
import { useUiStore } from '../../store/ui.store'
import { today }      from '../../lib/utils/format'

// ── Design tokens — matte-black fixed palette ─────────────────────────────────
const C = {
  panelBg:   '#0d0d0f',
  bg:        '#0d0d12',
  card:      '#18181b',
  border:    'rgba(255,255,255,0.06)',
  border2:   'rgba(255,255,255,0.09)',
  accent:    '#8b5cf6',
  accentDim: 'rgba(139,92,246,0.15)',
  text:      '#f0f0f5',
  textMid:   '#c8c8d8',
  textDim:   '#a0a0b5',
  textMute:  '#808098',
  textGhost: '#505065',
  green:     '#34d399',
  greenGlow: 'rgba(52,211,153,0.15)',
  amber:     '#f59e0b',
  mono:      "'JetBrains Mono', monospace",
  sans:      "'DM Sans', system-ui, sans-serif",
}

// ── CSS injection (keyframes can't be inline) ─────────────────────────────────
const STYLE_ID = 'fox-chat-styles'
if (!document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes fox-spin  { to { transform: rotate(360deg); } }
    @keyframes fox-blink { 0%,60%,100%{opacity:.3;transform:translateY(0)} 30%{opacity:1;transform:translateY(-2px)} }
    @keyframes fox-up    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fox-in    { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes fox-slide { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
    .fox-msg   { animation: fox-up   .22s ease both; }
    .fox-panel { animation: fox-in   .20s ease both; }
    .fox-slide { animation: fox-slide .25s cubic-bezier(0.4,0,0.2,1) both; }
    .fox-spin  { animation: fox-spin 1s linear infinite; }
  `
  document.head.appendChild(el)
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = 'user' | 'assistant'

type StructuredCard = {
  type:  string
  title: string
  rows:  { label: string; value: string; highlight?: boolean }[]
}

type Msg = {
  id:         string
  role:       Role
  text:       string
  time:       string
  card?:      StructuredCard | null
  followUps?: string[]
  loading?:   boolean
}

// ── Slash commands ─────────────────────────────────────────────────────────────
const SLASH_COMMANDS = [
  { cmd: '/plan',     desc: "Today's dispatch plan summary"        },
  { cmd: '/atrisk',  desc: 'Orders likely to miss SLA window'      },
  { cmd: '/drivers', desc: 'Driver availability & shift status'    },
  { cmd: '/capacity',desc: 'Load vs available vehicle capacity'    },
  { cmd: '/help',    desc: 'Show all available commands'           },
]

const STARTERS = [
  'How many unassigned orders today?',
  'Which drivers are available right now?',
  'Show me at-risk deliveries',
  "What's today's dispatch plan status?",
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function tryParseCard(text: string): StructuredCard | null {
  try {
    const m = text.match(/```json\n([\s\S]*?)\n```/) ?? text.match(/^(\{[\s\S]*\})$/)
    if (!m) return null
    const raw = JSON.parse(m[1] ?? m[0])
    if (!raw.type || !Array.isArray(raw.rows)) return null
    return raw as StructuredCard
  } catch { return null }
}

function inferFollowUps(text: string): string[] {
  const t = text.toLowerCase()
  if (t.includes('unassigned') || t.includes('order'))
    return ['Which are CRITICAL?', 'Generate a plan for today', 'Show me the map']
  if (t.includes('driver') || t.includes('available'))
    return ['Who is closest to Zone A?', 'Show shift schedule', 'Assign to next order']
  if (t.includes('at-risk') || t.includes('sla'))
    return ['Prioritise these orders', 'Alert the drivers', 'Generate a replan']
  if (t.includes('plan') || t.includes('route'))
    return ['Export this plan', 'Show route details', 'Any at-risk orders?']
  return ['Tell me more', 'What should I do next?']
}

// ── Simple inline markdown → JSX ──────────────────────────────────────────────
function renderText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: C.text, fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={i} style={{
          background: C.card, border: `1px solid ${C.border2}`,
          padding: '1px 6px', borderRadius: 4,
          fontSize: 11.5, color: C.accent, fontFamily: C.mono,
        }}>{part.slice(1, -1)}</code>
      )
    return <span key={i}>{part}</span>
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AIAvatar() {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 7, flexShrink: 0, marginTop: 1,
      background: 'linear-gradient(140deg, #8b5cf6, #6d28d9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="fox-msg" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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

function CardBlock({ card }: { card: StructuredCard }) {
  return (
    <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border2}` }}>
      <div style={{
        padding: '7px 12px', background: C.accentDim,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.3px' }}>{card.title}</span>
      </div>
      <div style={{ background: C.card }}>
        {card.rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 12px', borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
          }}>
            <span style={{ fontSize: 11.5, color: C.textMute }}>{row.label}</span>
            <span style={{
              fontSize: 11.5, fontWeight: 600, fontFamily: C.mono,
              color: row.highlight ? '#f87171' : C.textMid,
            }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FollowUps({ chips, onSend }: { chips: string[]; onSend: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 36 }}>
      {chips.map((c) => (
        <button
          key={c}
          onMouseDown={(e) => { e.preventDefault(); onSend(c) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, padding: '4px 10px', borderRadius: 20,
            background: 'transparent', border: `1px solid ${C.border2}`,
            color: C.textDim, cursor: 'pointer', transition: 'all .15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.accentDim
            e.currentTarget.style.borderColor = C.accent
            e.currentTarget.style.color = C.accent
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = C.border2
            e.currentTarget.style.color = C.textDim
          }}
        >
          {c}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

function MessageBubble({ msg, onFollowUp, isLast }: { msg: Msg; onFollowUp: (t: string) => void; isLast: boolean }) {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div className="fox-msg" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          background: C.card, border: `1px solid ${C.border2}`,
          color: C.text, padding: '9px 14px',
          borderRadius: '14px 14px 4px 14px',
          fontSize: 13, maxWidth: '85%', lineHeight: 1.55,
        }}>
          {msg.text.startsWith('/') ? (
            <span>
              <span style={{ color: C.accent, fontFamily: C.mono, fontWeight: 600 }}>
                {msg.text.split(' ')[0]}
              </span>
              {msg.text.includes(' ') ? ' ' + msg.text.slice(msg.text.indexOf(' ') + 1) : ''}
            </span>
          ) : msg.text}
        </div>
      </div>
    )
  }

  return (
    <div className="fox-msg">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AIAvatar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          {msg.text && (
            <div style={{
              color: C.textMid, fontSize: 13, lineHeight: 1.65,
              fontFamily: C.sans,
            }}>
              {msg.text.split('\n').map((line, i) => (
                <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0 }}>
                  {renderText(line)}
                </p>
              ))}
            </div>
          )}
          {msg.card && <CardBlock card={msg.card} />}
          <span style={{ fontSize: 10, color: C.textGhost }}>{msg.time}</span>
        </div>
      </div>
      {isLast && msg.followUps && msg.followUps.length > 0 && (
        <FollowUps chips={msg.followUps} onSend={onFollowUp} />
      )}
    </div>
  )
}

function SlashLauncher({
  query,
  activeIndex,
  onSelect,
  onIndexChange,
}: {
  query:         string
  activeIndex:   number
  onSelect:      (cmd: string) => void
  onIndexChange: (i: number) => void
}) {
  const filtered = SLASH_COMMANDS.filter((c) =>
    c.cmd.slice(1).startsWith(query.toLowerCase())
  )
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const item = listRef.current?.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!filtered.length) return null

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 6px)',
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 11,
      boxShadow: '0 12px 28px rgba(0,0,0,0.55)', overflow: 'hidden', zIndex: 50,
    }}>
      {/* header */}
      <div style={{
        padding: '7px 12px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 10.5, color: C.textGhost, fontWeight: 600,
        letterSpacing: '0.5px', textTransform: 'uppercase',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        Commands · /{query || '…'}
      </div>

      {/* list */}
      <div ref={listRef}>
        {filtered.map((item, i) => (
          <button
            key={item.cmd}
            onMouseDown={(e) => { e.preventDefault(); onSelect(item.cmd) }}
            onMouseEnter={() => onIndexChange(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '9px 12px', background: i === activeIndex ? C.card : 'transparent',
              border: 'none', borderLeft: `2px solid ${i === activeIndex ? C.accent : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left', transition: 'background .1s',
            }}
          >
            <span style={{ fontFamily: C.mono, fontSize: 11.5, color: C.accent, fontWeight: 600, width: 80, flexShrink: 0 }}>
              {item.cmd}
            </span>
            <span style={{ flex: 1, fontSize: 12, color: C.textDim }}>{item.desc}</span>
            {i === activeIndex && (
              <kbd style={{ fontSize: 9, color: C.textGhost, fontFamily: C.mono }}>↵</kbd>
            )}
          </button>
        ))}
      </div>

      {/* footer */}
      <div style={{
        padding: '5px 12px', borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: 10, fontSize: 10, color: C.textGhost,
      }}>
        {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'dismiss']].map(([key, label]) => (
          <span key={key} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <kbd style={{
              padding: '1px 5px', background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 4, fontSize: 9, color: C.textDim, fontFamily: C.mono, lineHeight: 1.4,
            }}>{key}</kbd>
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>{filtered.length}/{SLASH_COMMANDS.length}</span>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ChatPanel() {
  const { chatOpen, toggleChat } = useUiStore()
  const [msgs,        setMsgs]       = useState<Msg[]>([])
  const [input,       setInput]      = useState('')
  const [loading,     setLoading]    = useState(false)
  const [slashOpen,   setSlashOpen]  = useState(false)
  const [slashQuery,  setSlashQuery] = useState('')
  const [slashIdx,    setSlashIdx]   = useState(0)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const inputWrap  = useRef<HTMLDivElement>(null)

  // focus on open
  useEffect(() => { if (chatOpen) setTimeout(() => inputRef.current?.focus(), 80) }, [chatOpen])

  // scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

  // auto-resize textarea
  const resizeInput = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    resizeInput()
    if (val.startsWith('/') && !val.includes(' ') && val.length <= 20) {
      setSlashQuery(val.slice(1).toLowerCase())
      setSlashOpen(true)
      setSlashIdx(0)
    } else {
      setSlashOpen(false)
    }
  }

  const selectSlash = (cmd: string) => {
    setInput(cmd + ' ')
    setSlashOpen(false)
    inputRef.current?.focus()
  }

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setSlashOpen(false)
    setInput('')
    if (inputRef.current) { inputRef.current.style.height = 'auto' }

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', text: trimmed, time: ts() }
    setMsgs((m) => [...m, userMsg])
    setLoading(true)

    try {
      const { sendChatMessage } = await import('../../api/chat')
      const res = await sendChatMessage(trimmed, today())
      const card = tryParseCard(res.content)
      const displayText = card ? res.content.replace(/```json[\s\S]*?```/, '').trim() : res.content
      setMsgs((m) => [...m, {
        id:       res.id,
        role:     'assistant',
        text:     displayText,
        time:     ts(),
        card,
        followUps: inferFollowUps(res.content),
      }])
    } catch {
      setMsgs((m) => [...m, {
        id:       crypto.randomUUID(),
        role:     'assistant',
        text:     'Fleet AI is offline — the backend will be available once the API is deployed.',
        time:     ts(),
        followUps: ['Try again', 'Check API status'],
      }])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      const filtered = SLASH_COMMANDS.filter((c) => c.cmd.slice(1).startsWith(slashQuery))
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx((i) => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIdx((i) => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (filtered[slashIdx]) selectSlash(filtered[slashIdx].cmd); return }
      if (e.key === 'Escape') { e.preventDefault(); setSlashOpen(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
    if (e.key === 'Escape') setSlashOpen(false)
  }

  if (!chatOpen) return null

  const lastAssistantIdx = msgs.reduceRight((found, m, i) => found === -1 && m.role === 'assistant' ? i : found, -1)

  return (
    <div
      className="fox-slide"
      style={{
        flexShrink: 0,
        width: 'min(440px, 40vw)',
        display: 'flex', flexDirection: 'column',
        background: C.panelBg,
        borderLeft: `1px solid ${C.border}`,
        boxShadow: '-8px 0 48px rgba(0,0,0,0.55)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', flexShrink: 0,
        borderBottom: `1px solid ${C.border}`, background: C.bg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo */}
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(140deg, #8b5cf6, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>Fleet AI</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: loading ? C.amber : C.green,
                boxShadow: loading ? `0 0 6px ${C.amber}` : `0 0 6px ${C.greenGlow}`,
              }} />
              <span style={{ fontSize: 10.5, color: C.textMute }}>
                {loading ? 'Thinking…' : 'Ready · Claude-powered'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Clear chat */}
          {msgs.length > 0 && !loading && (
            <button
              onClick={() => setMsgs([])}
              title="Clear chat"
              style={{
                padding: '5px 7px', background: 'transparent', border: 'none',
                borderRadius: 7, color: C.textGhost, cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.textDim }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textGhost }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
          {/* Close */}
          <button
            onClick={toggleChat}
            style={{
              padding: '5px 7px', background: 'transparent', border: 'none',
              borderRadius: 7, color: C.textGhost, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textGhost }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Empty state */}
        {msgs.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            <div style={{ textAlign: 'center', paddingBottom: 4 }}>
              <p style={{ fontSize: 20, marginBottom: 4 }}>👋</p>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: C.textMid }}>How can I help?</p>
              <p style={{ fontSize: 11.5, color: C.textMute, marginTop: 3 }}>
                Ask me anything about your fleet · type{' '}
                <kbd style={{
                  padding: '1px 5px', background: C.card, border: `1px solid ${C.border2}`,
                  borderRadius: 4, fontSize: 10, color: C.accent, fontFamily: C.mono,
                }}>/</kbd>
                {' '}for commands
              </p>
            </div>
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 11, textAlign: 'left',
                  fontSize: 13, background: C.card, border: `1px solid ${C.border}`,
                  color: C.textMid, cursor: 'pointer', transition: 'all .15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.accent
                  e.currentTarget.style.background = C.card
                  e.currentTarget.style.color = C.text
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.background = C.card
                  e.currentTarget.style.color = C.textMid
                }}
              >
                <span>{s}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textGhost} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Message list */}
        {msgs.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onFollowUp={send}
            isLast={idx === lastAssistantIdx && !loading}
          />
        ))}

        {/* Typing indicator */}
        {loading && <TypingDots />}

        <div ref={bottomRef} />
      </div>

      {/* ── Composer ── */}
      <div style={{ flexShrink: 0, padding: '10px 14px 14px', borderTop: `1px solid ${C.border}` }}>
        <div ref={inputWrap} style={{ position: 'relative' }}>
          {/* Slash launcher */}
          {slashOpen && (
            <SlashLauncher
              query={slashQuery}
              activeIndex={slashIdx}
              onSelect={selectSlash}
              onIndexChange={setSlashIdx}
            />
          )}

          {/* Input row */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            padding: '10px 12px 10px 14px', borderRadius: 12,
            background: C.card, border: `1px solid ${C.border2}`,
            transition: 'border-color .15s',
          }}
            onFocus={() => {/* border handled by textarea focus */}}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder={loading ? 'Thinking…' : 'Ask about your fleet… or type /'}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: loading ? C.textGhost : C.text, fontSize: 13, lineHeight: 1.5,
                resize: 'none', maxHeight: 100, fontFamily: C.sans,
                ':placeholder': { color: C.textGhost },
              } as React.CSSProperties}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: !input.trim() || loading ? C.card : C.accent,
                border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: !input.trim() || loading ? 0.3 : 1, transform: 'rotate(90deg)' }}
              >
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p style={{ fontSize: 10.5, color: C.textGhost, textAlign: 'center', marginTop: 8 }}>
          <kbd style={{ padding: '1px 4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 9, fontFamily: C.mono }}>Enter</kbd>
          {' '}send · {' '}
          <kbd style={{ padding: '1px 4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 9, fontFamily: C.mono }}>Shift+Enter</kbd>
          {' '}new line
        </p>
      </div>
    </div>
  )
}
