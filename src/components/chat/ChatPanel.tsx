import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { useUiStore } from '../../store/ui.store'
import { useAuthStore } from '../../store/auth.store'
import client from '../../api/client'
import {
  fetchConversations,
  createConversation,
  fetchMessages,
  sendMessage,
  deleteConversation,
  type Conversation,
  type ChatMessage,
} from '../../api/conversations'

// ── Design tokens ─────────────────────────────────────────────────────────────
const DARK_C = {
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
  red:       '#f87171',
  mono:      "'JetBrains Mono', monospace",
  sans:      "'DM Sans', system-ui, sans-serif",
}

const LIGHT_C = {
  panelBg:   '#f8f9fc',
  bg:        '#f0f1f6',
  card:      '#ffffff',
  border:    'rgba(0,0,0,0.07)',
  border2:   'rgba(0,0,0,0.10)',
  accent:    '#7c3aed',
  accentDim: 'rgba(124,58,237,0.10)',
  text:      '#0c0c18',
  textMid:   '#1e1e35',
  textDim:   '#424266',
  textMute:  '#6060a0',
  textGhost: '#9090c0',
  green:     '#059669',
  greenGlow: 'rgba(5,150,105,0.10)',
  amber:     '#d97706',
  red:       '#dc2626',
  mono:      "'JetBrains Mono', monospace",
  sans:      "'DM Sans', system-ui, sans-serif",
}

type ColorPalette = typeof DARK_C
const ThemeCtx = createContext<ColorPalette>(DARK_C)
const useC = () => useContext(ThemeCtx)

// ── CSS injection ─────────────────────────────────────────────────────────────
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
    @keyframes fox-hist  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    .fox-msg   { animation: fox-up   .22s ease both; }
    .fox-panel { animation: fox-in   .20s ease both; }
    .fox-slide { animation: fox-slide .25s cubic-bezier(0.4,0,0.2,1) both; }
    .fox-spin  { animation: fox-spin 1s linear infinite; }
    .fox-hist  { animation: fox-hist .18s ease both; }
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
}

// ── Slash commands ─────────────────────────────────────────────────────────────
const SLASH_COMMANDS = [
  { cmd: '/plan',     desc: "Today's dispatch plan summary"     },
  { cmd: '/atrisk',  desc: 'Orders likely to miss SLA window'  },
  { cmd: '/drivers', desc: 'Driver availability & shift status' },
  { cmd: '/capacity',desc: 'Load vs available vehicle capacity' },
  { cmd: '/help',    desc: 'Show all available commands'        },
]

const STARTERS = [
  'Which deliveries are at risk right now?',
  "Show me today's driver utilization.",
  'How much time did AI planning save today?',
  "What's the on-time rate this week?",
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

function renderText(text: string, C: ColorPalette) {
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

function apiMsgToMsg(m: ChatMessage): Msg {
  const card = tryParseCard(m.content)
  const displayText = card ? m.content.replace(/```json[\s\S]*?```/, '').trim() : m.content
  return {
    id:       m.id,
    role:     m.role,
    text:     displayText,
    time:     new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    card,
    followUps: m.role === 'assistant' ? inferFollowUps(m.content) : undefined,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AIAvatar({ size = 26 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0, marginTop: 1,
      background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
    }}>
      <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/>
      </svg>
    </div>
  )
}

function TypingDots() {
  const C = useC()
  return (
    <div className="fox-msg" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <AIAvatar size={26} />
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
  const C = useC()
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
              color: row.highlight ? C.red : C.textMid,
            }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FollowUps({ chips, onSend }: { chips: string[]; onSend: (t: string) => void }) {
  const C = useC()
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
  const C = useC()
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
            <div style={{ color: C.textMid, fontSize: 13, lineHeight: 1.65, fontFamily: C.sans }}>
              {msg.text.split('\n').map((line, i) => (
                <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0 }}>
                  {renderText(line, C)}
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
  query, activeIndex, onSelect, onIndexChange,
}: {
  query: string; activeIndex: number; onSelect: (cmd: string) => void; onIndexChange: (i: number) => void
}) {
  const C = useC()
  const filtered = SLASH_COMMANDS.filter((c) => c.cmd.slice(1).startsWith(query.toLowerCase()))
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
            {i === activeIndex && <kbd style={{ fontSize: 9, color: C.textGhost, fontFamily: C.mono }}>↵</kbd>}
          </button>
        ))}
      </div>
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

// ── Conversation History Dropdown ─────────────────────────────────────────────

function HistoryDropdown({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
  onClose,
}: {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (conv: Conversation) => void
  onDelete: (id: string) => void
  onNew: () => void
  onClose: () => void
}) {
  const C = useC()
  return (
    <div
      className="fox-hist"
      style={{
        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4,
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)', overflow: 'hidden',
        maxHeight: 320, display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '9px 12px 8px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Chat History
        </span>
        <button
          onClick={onNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px',
            background: C.accentDim, border: `1px solid ${C.accent}`,
            borderRadius: 6, cursor: 'pointer', fontSize: 11, color: C.accent, fontWeight: 600,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {conversations.length === 0 ? (
          <p style={{ fontSize: 12, color: C.textGhost, textAlign: 'center', padding: '20px 12px' }}>
            No past conversations
          </p>
        ) : conversations.map((conv) => (
          <div
            key={conv.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: conv.id === activeId ? C.accentDim : 'transparent',
              borderLeft: `2px solid ${conv.id === activeId ? C.accent : 'transparent'}`,
              cursor: 'pointer', transition: 'background .12s',
            }}
            onClick={() => { onSelect(conv); onClose() }}
            onMouseEnter={(e) => { if (conv.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = 'rgba(128,128,128,0.06)' }}
            onMouseLeave={(e) => { if (conv.id !== activeId) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={conv.id === activeId ? C.accent : C.textGhost} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{
              flex: 1, fontSize: 12.5,
              color: conv.id === activeId ? C.accent : C.textMid,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {conv.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
              style={{
                padding: '2px 4px', background: 'transparent', border: 'none',
                color: C.textGhost, cursor: 'pointer', borderRadius: 4,
                flexShrink: 0, display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.red }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textGhost }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ChatPanel() {
  const { chatOpen, toggleChat, theme } = useUiStore()
  const user = useAuthStore((s) => s.user)
  const C = theme === 'dark' ? DARK_C : LIGHT_C

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'
  const [msgs,         setMsgs]        = useState<Msg[]>([])
  const [input,        setInput]       = useState('')
  const [loading,      setLoading]     = useState(false)
  const [slashOpen,    setSlashOpen]   = useState(false)
  const [slashQuery,   setSlashQuery]  = useState('')
  const [slashIdx,     setSlashIdx]    = useState(0)
  const [convId,       setConvId]      = useState<string | null>(null)
  const [convTitle,    setConvTitle]   = useState<string>('New Chat')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [histOpen,     setHistOpen]    = useState(false)
  const [histLoading,  setHistLoading] = useState(false)
  const [mongoActive,  setMongoActive] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const inputWrap  = useRef<HTMLDivElement>(null)
  const headerRef  = useRef<HTMLDivElement>(null)

  // On open: detect MongoDB mode and load conversation list
  useEffect(() => {
    if (!chatOpen) { setHistOpen(false); return }
    setTimeout(() => inputRef.current?.focus(), 80)

    const init = async () => {
      try {
        const { data } = await client.get<{ mongodb_active: boolean }>('/api/v1/chat/conversations/status')
        setMongoActive(data.mongodb_active)
        if (data.mongodb_active) {
          const convs = await fetchConversations()
          setConversations(convs)
        }
      } catch { /* ignore — service may not be running */ }
    }
    init()
  }, [chatOpen])

  // Close history dropdown on outside click
  useEffect(() => {
    if (!histOpen) return
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setHistOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [histOpen])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])

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

  // Ensure conversation exists before sending
  const ensureConv = useCallback(async (): Promise<string> => {
    if (convId) return convId
    const conv = await createConversation()
    setConvId(conv.id)
    setConvTitle(conv.title)
    if (mongoActive && conv.id !== 'session') {
      setConversations((prev) => [conv, ...prev])
    }
    return conv.id
  }, [convId, mongoActive])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setSlashOpen(false)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', text: trimmed, time: ts() }
    setMsgs((m) => [...m, userMsg])
    setLoading(true)

    try {
      const cid = await ensureConv()
      const returned: ChatMessage[] = await sendMessage(cid, trimmed)
      const assistantMsg = returned.find((m) => m.role === 'assistant')
      if (assistantMsg) {
        const mapped = apiMsgToMsg(assistantMsg)
        setMsgs((m) => [...m, mapped])

        // Update conversation title in list after first message
        if (mongoActive && cid !== 'session') {
          setConversations((prev) => prev.map((c) =>
            c.id === cid ? { ...c, title: trimmed.slice(0, 60), updated_at: new Date().toISOString() } : c
          ))
          setConvTitle(trimmed.slice(0, 60))
        }
      }
    } catch {
      setMsgs((m) => [...m, {
        id:   crypto.randomUUID(),
        role: 'assistant',
        text: 'Fleet AI is offline — the backend will be available once the API is deployed.',
        time: ts(),
        followUps: ['Try again', 'Check API status'],
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, ensureConv, mongoActive])

  const loadConversation = async (conv: Conversation) => {
    setHistLoading(true)
    setConvId(conv.id)
    setConvTitle(conv.title)
    setMsgs([])
    try {
      const apiMsgs = await fetchMessages(conv.id)
      setMsgs(apiMsgs.map(apiMsgToMsg))
    } catch { /* ignore */ } finally {
      setHistLoading(false)
    }
  }

  const startNewChat = async () => {
    setConvId(null)
    setConvTitle('New Chat')
    setMsgs([])
    setHistOpen(false)
  }

  const handleDeleteConv = async (id: string) => {
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (convId === id) startNewChat()
    } catch { /* ignore */ }
  }

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
    <ThemeCtx.Provider value={C}>
      <>
        {/* Backdrop — z-index 1000 so it sits above Leaflet controls and map overlays */}
        <div
          onClick={toggleChat}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
        />
      <div
        className="fox-slide"
        style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 1001,
          width: 'min(460px, 42vw)',
          display: 'flex', flexDirection: 'column',
          background: C.panelBg,
          borderLeft: `1px solid ${C.border}`,
          boxShadow: '-12px 0 60px rgba(0,0,0,0.65)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          ref={headerRef}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', flexShrink: 0,
            borderBottom: `1px solid ${C.border}`, background: C.bg,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <AIAvatar size={36} />

            {/* Title — clickable to open history when MongoDB active */}
            <div
              onClick={() => mongoActive && setHistOpen((o) => !o)}
              style={{
                cursor: mongoActive ? 'pointer' : 'default',
                display: 'flex', flexDirection: 'column', minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <p style={{
                  fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: mongoActive ? 140 : 180,
                }}>
                  FleetOpsX AI
                </p>
                {mongoActive && (
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={C.textGhost} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: histOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ fontSize: 10.5, color: C.textMute }}>
                  {loading ? 'Thinking…' : 'Operations assistant · live context'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* New Chat (always visible) */}
            <button
              onClick={startNewChat}
              title="New chat"
              style={{
                padding: '5px 7px', background: 'transparent', border: 'none',
                borderRadius: 7, color: C.textGhost, cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.accent }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textGhost }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            {/* Clear messages */}
            {msgs.length > 0 && !loading && (
              <button
                onClick={() => setMsgs([])}
                title="Clear messages"
                style={{
                  padding: '5px 7px', background: 'transparent', border: 'none',
                  borderRadius: 7, color: C.textGhost, cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.textDim }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textGhost }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
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

          {/* History dropdown */}
          {histOpen && mongoActive && (
            <HistoryDropdown
              conversations={conversations}
              activeId={convId}
              onSelect={loadConversation}
              onDelete={handleDeleteConv}
              onNew={startNewChat}
              onClose={() => setHistOpen(false)}
            />
          )}
        </div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {histLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', color: C.textGhost, fontSize: 12 }}>
              <span className="fox-spin" style={{ marginRight: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              </span>
              Loading conversation…
            </div>
          ) : msgs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <AIAvatar size={32} />
                  <div style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: '12px 12px 12px 4px', padding: '12px 14px',
                    flex: 1,
                  }}>
                    <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
                      Hi {firstName} — ready to help with today's ops. I can answer questions on orders, drivers, routes, and SLA risks. What's on your mind?
                    </p>
                  </div>
                </div>
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
                    e.currentTarget.style.color = C.text
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border
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
          ) : (
            msgs.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onFollowUp={send}
                isLast={idx === lastAssistantIdx && !loading}
              />
            ))
          )}

          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {/* ── Composer ── */}
        <div style={{ flexShrink: 0, padding: '10px 14px 14px', borderTop: `1px solid ${C.border}` }}>
          <div ref={inputWrap} style={{ position: 'relative' }}>
            {slashOpen && (
              <SlashLauncher
                query={slashQuery}
                activeIndex={slashIdx}
                onSelect={selectSlash}
                onIndexChange={setSlashIdx}
              />
            )}
            <div style={{
              display: 'flex', alignItems: 'flex-end', gap: 8,
              padding: '10px 12px 10px 14px', borderRadius: 14,
              background: C.card,
              border: `1.5px solid ${C.accent}`,
              transition: 'border-color .15s',
            }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                placeholder={loading ? 'Thinking…' : 'Ask anything about your fleet…'}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: loading ? C.textGhost : C.text, fontSize: 13, lineHeight: 1.5,
                  resize: 'none', maxHeight: 100, fontFamily: C.sans,
                } as React.CSSProperties}
              />
              {/* Mic icon */}
              <button
                style={{
                  padding: '4px', background: 'transparent', border: 'none',
                  color: C.textGhost, cursor: 'pointer', borderRadius: 6,
                  display: 'flex', alignItems: 'center', flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.textDim }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.textGhost }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Send button + footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
            <p style={{ fontSize: 10, color: C.textGhost, flex: 1, lineHeight: 1.4 }}>
              FleetOpsX AI uses live ops data. Always cites its source. Press{' '}
              <kbd style={{ padding: '1px 4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 9, fontFamily: C.mono }}>⌘K</kbd>
              {' '}for command palette.
            </p>
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: !input.trim() || loading ? C.card : C.accent,
                border: `1px solid ${!input.trim() || loading ? C.border : C.accent}`,
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                transition: 'background .15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: !input.trim() || loading ? 0.3 : 1, transform: 'rotate(90deg)' }}
              >
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </>
    </ThemeCtx.Provider>
  )
}
