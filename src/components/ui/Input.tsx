import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  containerClass?: string
}

const inputBase = [
  'w-full h-9 px-3 rounded-[10px] text-sm text-[var(--c-text)] outline-none',
  'bg-[var(--c-surface)] border border-[var(--c-border)]',
  'placeholder:text-[var(--c-muted)]',
  'focus:border-[var(--c-accent)] transition-colors duration-150',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ')

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, containerClass, ...props }, ref) => (
    <div className={cn('flex flex-col gap-1 w-full', containerClass)}>
      <input
        ref={ref}
        className={cn(inputBase, error && 'border-[var(--c-red)]', className)}
        {...props}
      />
      {error && <p className="text-xs text-[var(--c-red)]">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  containerClass?: string
}

export const SearchInput = ({ containerClass, className, ...props }: SearchInputProps) => (
  <div
    className={cn(
      'flex items-center gap-2 h-9 px-3 rounded-[10px]',
      'bg-[var(--c-surface)] border border-[var(--c-border)]',
      'focus-within:border-[var(--c-accent)] transition-colors',
      containerClass
    )}
  >
    <Search size={14} className="text-[var(--c-muted)] shrink-0" />
    <input
      className={cn(
        'flex-1 bg-transparent outline-none text-sm',
        'text-[var(--c-text)] placeholder:text-[var(--c-muted)]',
        className
      )}
      {...props}
    />
  </div>
)
