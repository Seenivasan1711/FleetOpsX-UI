import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils/cn'

type CollapsibleProps = {
  title:         string
  icon?:         ReactNode
  badge?:        number | null
  badgeVariant?: 'danger' | 'warning' | 'accent'
  refreshLabel?: string
  defaultOpen?:  boolean
  children:      ReactNode
  className?:    string
}

const badgeStyle: Record<string, { bg: string; color: string }> = {
  danger:  { bg: 'var(--c-red-dim)',    color: 'var(--c-red)'    },
  warning: { bg: 'var(--c-orange-dim)', color: 'var(--c-orange)' },
  accent:  { bg: 'var(--c-accent-dim)', color: 'var(--c-accent)' },
}

export const Collapsible = ({
  title, icon, badge, badgeVariant, refreshLabel,
  defaultOpen = true, children, className,
}: CollapsibleProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const bs = badgeVariant ? badgeStyle[badgeVariant] : null

  return (
    <div
      className={cn('rounded-2xl overflow-hidden', className)}
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {icon && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--c-elevated)', color: 'var(--c-muted)' }}
          >
            {icon}
          </span>
        )}

        <span className="flex-1 text-sm font-semibold text-[var(--c-text)]">{title}</span>

        {badge != null && (
          <span
            className="text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-full"
            style={
              badge > 0 && bs
                ? { background: bs.bg, color: bs.color }
                : { background: 'var(--c-elevated)', color: 'var(--c-muted)' }
            }
          >
            {badge}
          </span>
        )}

        {refreshLabel && (
          <span className="text-[10px] text-[var(--c-subtle)] font-mono hidden sm:inline">
            {refreshLabel}
          </span>
        )}

        <ChevronDown
          size={15}
          className={cn('text-[var(--c-muted)] transition-transform duration-200 shrink-0', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--c-border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}
