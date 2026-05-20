import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Icon } from '../ui/icons'
import { NAV_ITEMS } from '../../lib/utils/constants'
import type { Order, Driver } from '../../types'

type Result = {
  id:    string
  label: string
  sub?:  string
  path:  string
  icon:  React.ReactNode
  type:  'page' | 'order' | 'driver'
}

const PAGE_ICONS: Record<string, React.ReactNode> = {
  '/':              <Icon.Dashboard size={14} />,
  '/orders':        <Icon.Orders   size={14} />,
  '/drivers':       <Icon.Users    size={14} />,
  '/map':           <Icon.Map      size={14} />,
  '/analytics':     <Icon.Chart    size={14} />,
  '/settings':      <Icon.Settings size={14} />,
  '/vehicles':      <Icon.Truck    size={14} />,
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query,    setQuery]   = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef               = useRef<HTMLInputElement>(null)
  const navigate               = useNavigate()
  const qc                     = useQueryClient()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const q = query.toLowerCase().trim()

  const pageResults: Result[] = NAV_ITEMS
    .filter((i) => !i.comingSoon && (q === '' || i.label.toLowerCase().includes(q)))
    .map((i) => ({
      id:    i.id,
      label: i.label,
      path:  i.path,
      icon:  PAGE_ICONS[i.path] ?? <Icon.Dashboard size={14} />,
      type:  'page' as const,
    }))

  const allOrders = (qc.getQueryData<Order[]>(['orders']) ?? []) as Order[]
  const orderResults: Result[] = q.length < 2 ? [] : allOrders
    .filter((o) =>
      o.delivery_address.toLowerCase().includes(q) ||
      (o.external_ref ?? '').toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map((o) => ({
      id:    o.id,
      label: o.external_ref ?? o.id.slice(0, 8),
      sub:   o.delivery_address,
      path:  '/orders',
      icon:  <Icon.Orders size={14} />,
      type:  'order' as const,
    }))

  const allDrivers = (qc.getQueryData<Driver[]>(['drivers']) ?? []) as Driver[]
  const driverResults: Result[] = q.length < 2 ? [] : allDrivers
    .filter((d) =>
      d.full_name.toLowerCase().includes(q) ||
      (d.phone ?? '').includes(q)
    )
    .slice(0, 5)
    .map((d) => ({
      id:    d.id,
      label: d.full_name,
      sub:   d.phone,
      path:  '/drivers',
      icon:  <Icon.Users size={14} />,
      type:  'driver' as const,
    }))

  const results: Result[] = [...pageResults, ...orderResults, ...driverResults]

  useEffect(() => { setSelected(0) }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].path)
      onClose()
    }
  }

  const groups = [
    { label: 'Pages',   items: results.filter((r) => r.type === 'page') },
    { label: 'Orders',  items: results.filter((r) => r.type === 'order') },
    { label: 'Drivers', items: results.filter((r) => r.type === 'driver') },
  ].filter((g) => g.items.length > 0)

  let globalIdx = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl overflow-hidden shadow-2xl anim-scale-in"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--c-border)]">
          <Icon.Search size={16} className="text-[var(--c-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, orders, drivers…"
            className="flex-1 bg-transparent text-[var(--c-text)] text-sm outline-none placeholder:text-[var(--c-muted)]"
          />
          <button onClick={onClose} className="text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors">
            <Icon.X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="text-center text-sm text-[var(--c-muted)] py-8">No results found</p>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--c-muted)] opacity-50 px-4 py-1.5">
                {group.label}
              </p>
              {group.items.map((result) => {
                const idx = globalIdx++
                return (
                  <button
                    key={result.id}
                    onClick={() => { navigate(result.path); onClose() }}
                    onMouseEnter={() => setSelected(idx)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                    style={{ background: selected === idx ? 'var(--c-elevated)' : 'transparent' }}
                  >
                    <span className="text-[var(--c-muted)] shrink-0">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--c-text)] truncate">{result.label}</p>
                      {result.sub && (
                        <p className="text-xs text-[var(--c-muted)] truncate">{result.sub}</p>
                      )}
                    </div>
                    {selected === idx && (
                      <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded text-[var(--c-muted)]"
                        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                        ↵
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--c-border)] text-[10px] text-[var(--c-muted)]">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
