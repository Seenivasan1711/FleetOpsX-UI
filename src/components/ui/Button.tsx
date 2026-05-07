import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?:    Size
  loading?: boolean
}

const base = [
  'inline-flex items-center justify-center gap-2 font-semibold rounded-[10px]',
  'transition-all duration-150 cursor-pointer select-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)]',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
].join(' ')

const variants: Record<Variant, string> = {
  primary:   'bg-[var(--c-accent)] text-white shadow-[0_4px_14px_var(--c-accent-glow)] hover:-translate-y-px hover:shadow-[0_8px_24px_var(--c-accent-glow)]',
  secondary: 'bg-[var(--c-surface)] text-[var(--c-text)] border border-[var(--c-border)] hover:bg-[var(--c-elevated)] hover:-translate-y-px',
  ghost:     'bg-transparent text-[var(--c-muted)] hover:bg-[var(--c-elevated)] hover:text-[var(--c-text)]',
  danger:    'bg-[var(--c-red-dim)] text-[var(--c-red)] border border-[var(--c-red)] hover:bg-[rgba(248,113,113,0.2)]',
}

const sizes: Record<Size, string> = {
  sm: 'h-8  px-3   text-xs',
  md: 'h-9  px-4   text-sm',
  lg: 'h-11 px-6   text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
