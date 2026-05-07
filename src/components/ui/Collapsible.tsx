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

const badgeColors: Record<string, string> = {
  danger:  'bg-[var(--c-red)]    text-white',
  warning: 'bg-[var(--c-orange)] text-white',
  accent:  'bg-[var(--c-accent)] text-white',
}

export const Collapsible = ({
  title, icon, badge, badgeVariant, refreshLabel,
  defaultOpen = true, children, className,
}: CollapsibleProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl overflow-hidden', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--c-elevated)] transition-colors"
      >
        {icon && <span className="text-[var(--c-muted)] flex shrink-0">{icon}</span>}

        <span className="flex-1 text-sm font-semibold text-[var(--c-text)]">{title}</span>

        {badge != null && (
          <span
            className={cn(
              'text-[11px] font-bold font-mono px-2 py-0.5 rounded-full',
              badge > 0 && badgeVariant ? badgeColors[badgeVariant] : 'bg-[var(--c-elevated)] text-[var(--c-muted)]'
            )}
          >
            {badge}
          </span>
        )}

        {refreshLabel && (
          <span className="text-[11px] text-[var(--c-muted)] font-mono">{refreshLabel}</span>
        )}

        <ChevronDown
          size={16}
          className={cn('text-[var(--c-muted)] transition-transform duration-200 shrink-0', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--c-border)]">
          {children}
        </div>
      )}
    </div>
  )
}
