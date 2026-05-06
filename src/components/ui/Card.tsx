import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  accent?: 'accent' | 'danger' | 'success' | 'warning' | 'info'
  noPad?:  boolean
}

const accentColors: Record<string, string> = {
  accent:  'var(--c-accent)',
  danger:  'var(--c-red)',
  success: 'var(--c-green)',
  warning: 'var(--c-orange)',
  info:    'var(--c-purple)',
}

export const Card = ({ accent, noPad, className, children, ...props }: CardProps) => (
  <div
    className={cn(
      'relative bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl overflow-hidden',
      !noPad && 'p-5',
      className
    )}
    {...props}
  >
    {accent && (
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-70"
        style={{ background: accentColors[accent] }}
      />
    )}
    {children}
  </div>
)
