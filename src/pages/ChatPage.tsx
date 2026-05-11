import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Trash2, MessageSquare, Bot } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { today }    from '../lib/utils/format'

// ── Design tokens (matte-black, same as ChatPanel) ────────────────────────────
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

// ── Keyframes injection ───────────────────────────────────────────────────────
const STYLE_ID = 'fox-chat-styles'
if (!document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes fox-spin  { to { transform: rotate(360deg); } }
    @keyframes fox-blink { 0%,60%,100%{opacity:.3;transform:translateY(0)} 30%{opacity:1;transform:translateY(-2px)} }
    @keyframes fox-up    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .fox-msg   { animation: fox-up .22s ease both; }
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
}

type Conversation = {
  id:        string
  title:     string
  createdAt: string
  updatedAt: string
  messages:  Msg[]
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

// ── Storage helpers ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'fleetopsx_chat_history'

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos))
}

// ── Utility helpers ───────────────────────────────────────────────────────────
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

function makeTitleFromMessage(text: string): string {
  const trimmed = text.trim().replace(/^\/\w+\s*/, '')
  return trimmed.length > 42 ? trimmed.slice(0, 42) + '…' : trimmed || 'New chat'
}

function groupConversations(convos: Conversation[]) {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yest  = today - 86400000
  const week  = today - 7 * 86400000

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today',        items: [] },
    { label: 'Yesterday',    items: [] },
    { label: 'Past 7 days',  items: [] },
    { label: 'Older',        items: [] },
  ]
  for (const c of convos) {
    const t = new Date(c.updatedAt).getTime()
    if      (t >= today)         groups[0]!.items.push(c)
    else if (t >= yest)          groups[1]!.items.push(c)
    else if (t >= week)          groups[2]!.items.push(c)
    else                         groups[3]!.items.push(c)
  }
  return groups.filter((g) => g.items.length > 0)
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

function CardBlock({ card }: { card: StructuredCard }) {
  return (
    <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border2}` }}>
      <div style={{ padding: '7px 12px', background: C.accentDim, display: 'flex', alignItems: 'center', gap: 6 }}>
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
            <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: C.mono, color: row.highlight ? '#f87171' : C.textMid }}>
              {row.value}
            </span>
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
        <button key={c} onMouseDown={(e) => { e.preventDefault(); onSend(c) }} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, padding: '4px 10px', borderRadius: 20,
          background: 'transparent', border: `1px solid ${C.border2}`,
          color: C.textDim, cursor: 'pointer', transition: 'all .15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.accentDim; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textDim }}
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
          background: C.card, border: `1px solid ${C.border2}`, color: C.text,
          padding: '9px 14px', borderRadius: '14px 14px 4px 14px',
          fontSize: 13, maxWidth: '80%', lineHeight: 1.55,
        }}>
          {msg.text.startsWith('/') ? (
            <span>
              <span style={{ color: C.accent, fontFamily: C.mono, fontWeight: 600 }}>{msg.text.split(' ')[0]}</span>
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
                <p key={i} style={{ margin: i > 0 ? '6px 0 0' : 0 }}>{renderText(line)}</p>
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

function SlashLauncher({ query, activeIndex, onSelect, onIndexChange }: {
  query: string; activeIndex: number; onSelect: (cmd: string) => void; onIndexChange: (i: number) => void
}) {
  const filtered = SLASH_COMMANDS.filter((c) => c.cmd.slice(1).startsWith(query.toLowerCase()))
  const listRef  = useRef<HTMLDivElement>(null)

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
        fontSize: 10.5, color: C.textGhost, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        Commands · /{query || '…'}
      </div>
      <div ref={listRef}>
        {filtered.map((item, i) => (
          <button key={item.cmd}
            onMouseDown={(e) => { e.preventDefault(); onSelect(item.cmd) }}
            onMouseEnter={() => onIndexChange(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '9px 12px', background: i === activeIndex ? C.card : 'transparent',
              border: 'none', borderLeft: `2px solid ${i === activeIndex ? C.accent : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left', transition: 'background .1s',
            }}
          >
            <span style={{ fontFamily: C.mono, fontSize: 11.5, color: C.accent, fontWeight: 600, width: 80, flexShrink: 0 }}>{item.cmd}</span>
            <span style={{ flex: 1, fontSize: 12, color: C.textDim }}>{item.desc}</span>
            {i === activeIndex && <kbd style={{ fontSize: 9, color: C.textGhost, fontFamily: C.mono }}>↵</kbd>}
          </button>
        ))}
      </div>
      <div style={{ padding: '5px 12px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, fontSize: 10, color: C.textGhost }}>
        {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'dismiss']].map(([key, label]) => (
          <span key={key} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <kbd style={{ padding: '1px 5px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 9, color: C.textDim, fontFamily: C.mono, lineHeight: 1.4 }}>{key}</kbd>
            {label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>{filtered.length}/{SLASH_COMMANDS.length}</span>
      </div>
    </div>
  )
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [convos,      setConvos]      = useState<Conversation[]>(() => loadConversations())
  const [activeId,    setActiveId]    = useState<string | null>(() => loadConversations()[0]?.id ?? null)
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [slashOpen,   setSlashOpen]   = useState(false)
  const [slashQuery,  setSlashQuery]  = useState('')
  const [slashIdx,    setSlashIdx]    = useState(0)
  const [deleteHover, setDeleteHover] = useState<string | null>(null)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const inputWrap  = useRef<HTMLDivElement>(null)

  const activeConvo = convos.find((c) => c.id === activeId) ?? null
  const msgs        = activeConvo?.messages ?? []

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80) }, [activeId])

  const resizeInput = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
  }, [])

  const createNewConvo = useCallback(() => {
    const id  = crypto.randomUUID()
    const now = new Date().toISOString()
    const c: Conversation = { id, title: 'New chat', createdAt: now, updatedAt: now, messages: [] }
    setConvos((prev) => {
      const next = [c, ...prev]
      saveConversations(next)
      return next
    })
    setActiveId(id)
    setInput('')
  }, [])

  const deleteConvo = useCallback((id: string) => {
    setConvos((prev) => {
      const next = prev.filter((c) => c.id !== id)
      saveConversations(next)
      if (activeId === id) setActiveId(next[0]?.id ?? null)
      return next
    })
  }, [activeId])

  const updateConvo = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConvos((prev) => {
      const next = prev.map((c) => c.id === id ? updater(c) : c)
      saveConversations(next)
      return next
    })
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
    if (inputRef.current) inputRef.current.style.height = 'auto'

    let targetId = activeId
    if (!targetId) {
      const id  = crypto.randomUUID()
      const now = new Date().toISOString()
      const c: Conversation = { id, title: makeTitleFromMessage(trimmed), createdAt: now, updatedAt: now, messages: [] }
      setConvos((prev) => { const next = [c, ...prev]; saveConversations(next); return next })
      setActiveId(id)
      targetId = id
    }

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', text: trimmed, time: ts() }
    updateConvo(targetId, (c) => ({
      ...c,
      title:     c.messages.length === 0 ? makeTitleFromMessage(trimmed) : c.title,
      updatedAt: new Date().toISOString(),
      messages:  [...c.messages, userMsg],
    }))
    setLoading(true)

    try {
      const { sendChatMessage } = await import('../api/chat')
      const res  = await sendChatMessage(trimmed, today())
      const card = tryParseCard(res.content)
      const displayText = card ? res.content.replace(/```json[\s\S]*?```/, '').trim() : res.content
      const aiMsg: Msg = { id: res.id, role: 'assistant', text: displayText, time: ts(), card, followUps: inferFollowUps(res.content) }
      updateConvo(targetId, (c) => ({ ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, aiMsg] }))
    } catch {
      const errMsg: Msg = {
        id: crypto.randomUUID(), role: 'assistant', time: ts(),
        text: 'Fleet AI is offline — the backend will be available once the API is deployed.',
        followUps: ['Try again', 'Check API status'],
      }
      updateConvo(targetId, (c) => ({ ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, errMsg] }))
    } finally {
      setLoading(false)
    }
  }, [loading, activeId, updateConvo])

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

  const lastAssistantIdx = msgs.reduceRight((found, m, i) => found === -1 && m.role === 'assistant' ? i : found, -1)
  const groups           = groupConversations(convos)

  return (
    <AppShell>
      <div style={{ display: 'flex', height: '100%', background: C.panelBg, overflow: 'hidden' }}>

        {/* ── Conversation sidebar ── */}
        <div style={{
          width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: C.bg, borderRight: `1px solid ${C.border}`, overflow: 'hidden',
        }}>
          {/* New chat */}
          <div style={{ padding: '14px 12px 10px', flexShrink: 0 }}>
            <button
              onClick={createNewConvo}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.border2}`,
                background: 'transparent', color: C.textMid, cursor: 'pointer',
                fontSize: 13, fontWeight: 500, transition: 'all .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMid }}
            >
              <Plus size={14} style={{ flexShrink: 0 }} />
              New chat
            </button>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
            {convos.length === 0 && (
              <div style={{ padding: '32px 12px', textAlign: 'center' }}>
                <MessageSquare size={22} style={{ color: C.textGhost, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: C.textGhost }}>No conversations yet</p>
              </div>
            )}
            {groups.map((group) => (
              <div key={group.label}>
                <p style={{
                  fontSize: 10, fontWeight: 700, color: C.textGhost, textTransform: 'uppercase',
                  letterSpacing: '0.6px', padding: '10px 8px 4px',
                }}>{group.label}</p>
                {group.items.map((c) => {
                  const isActive = c.id === activeId
                  return (
                    <div key={c.id} style={{ position: 'relative', marginBottom: 1 }}
                      onMouseEnter={() => setDeleteHover(c.id)}
                      onMouseLeave={() => setDeleteHover(null)}
                    >
                      <button
                        onClick={() => setActiveId(c.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px', paddingRight: 32, borderRadius: 8,
                          background: isActive ? C.accentDim : 'transparent',
                          border: `1px solid ${isActive ? 'rgba(139,92,246,0.2)' : 'transparent'}`,
                          color: isActive ? C.text : C.textDim, cursor: 'pointer', textAlign: 'left',
                          transition: 'all .12s',
                        }}
                        onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.textMid } }}
                        onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textDim } }}
                      >
                        <MessageSquare size={12} style={{ flexShrink: 0, color: isActive ? C.accent : C.textGhost }} />
                        <span style={{
                          fontSize: 12.5, fontWeight: isActive ? 500 : 400,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                        }}>{c.title}</span>
                      </button>
                      {deleteHover === c.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteConvo(c.id) }}
                          title="Delete"
                          style={{
                            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                            width: 22, height: 22, borderRadius: 6, border: 'none',
                            background: 'rgba(248,113,113,0.12)', color: '#f87171',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer branding */}
          <div style={{
            padding: '10px 14px', borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: 'linear-gradient(140deg, #8b5cf6, #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: C.textMid, lineHeight: 1.2 }}>Fleet AI</p>
              <p style={{ fontSize: 10, color: C.textGhost }}>Claude-powered</p>
            </div>
          </div>
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', flexShrink: 0,
            borderBottom: `1px solid ${C.border}`, background: C.bg,
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                {activeConvo?.title ?? 'Fleet AI Chat'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
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
            {msgs.length > 0 && !loading && (
              <button
                onClick={() => updateConvo(activeId!, (c) => ({ ...c, messages: [] }))}
                title="Clear this conversation"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.textGhost, cursor: 'pointer',
                  fontSize: 11.5, transition: 'all .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border2 }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textGhost; e.currentTarget.style.borderColor = C.border }}
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* No conversation selected */}
            {!activeConvo && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(140deg, #8b5cf6, #6d28d9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
                }}>
                  <Bot size={24} color="#fff" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>Fleet AI Assistant</p>
                  <p style={{ fontSize: 12.5, color: C.textMute }}>Start a new chat or select one from the sidebar</p>
                </div>
                <button onClick={createNewConvo} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 10,
                  background: C.accent, border: 'none', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(139,92,246,0.4)',
                }}>
                  <Plus size={14} /> Start new chat
                </button>
              </div>
            )}

            {/* Empty conversation */}
            {activeConvo && msgs.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8, maxWidth: 520, margin: '0 auto', width: '100%' }}>
                <div style={{ textAlign: 'center', paddingBottom: 4 }}>
                  <p style={{ fontSize: 20, marginBottom: 4 }}>👋</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>How can I help?</p>
                  <p style={{ fontSize: 12, color: C.textMute, marginTop: 4 }}>
                    Ask me anything about your fleet · type{' '}
                    <kbd style={{ padding: '1px 5px', background: C.card, border: `1px solid ${C.border2}`, borderRadius: 4, fontSize: 10, color: C.accent, fontFamily: C.mono }}>/</kbd>
                    {' '}for commands
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)} style={{
                      padding: '11px 14px', borderRadius: 11, textAlign: 'left',
                      fontSize: 12.5, background: C.card, border: `1px solid ${C.border}`,
                      color: C.textMid, cursor: 'pointer', transition: 'all .15s', lineHeight: 1.45,
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMid }}
                    >{s}</button>
                  ))}
                </div>
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

            {loading && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          {(activeConvo || true) && (
            <div style={{ flexShrink: 0, padding: '10px 20px 16px', borderTop: `1px solid ${C.border}` }}>
              <div ref={inputWrap} style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
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
                  padding: '10px 12px 10px 16px', borderRadius: 14,
                  background: C.card, border: `1px solid ${C.border2}`,
                }}>
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
                      color: loading ? C.textGhost : C.text, fontSize: 13.5, lineHeight: 1.5,
                      resize: 'none', maxHeight: 100, fontFamily: C.sans,
                    }}
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: !input.trim() || loading ? 'rgba(139,92,246,0.12)' : C.accent,
                      border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                      transition: 'background .15s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                      style={{ opacity: !input.trim() || loading ? 0.3 : 1, transform: 'rotate(90deg)' }}>
                      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                    </svg>
                  </button>
                </div>
                <p style={{ fontSize: 10.5, color: C.textGhost, textAlign: 'center', marginTop: 8 }}>
                  <kbd style={{ padding: '1px 4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 9, fontFamily: C.mono }}>Enter</kbd>
                  {' '}send ·{' '}
                  <kbd style={{ padding: '1px 4px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 9, fontFamily: C.mono }}>Shift+Enter</kbd>
                  {' '}new line
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
