import { cn } from '../../lib/utils/cn'

type SkeletonProps = {
  className?: string
  rounded?:   'sm' | 'md' | 'full'
}

export const Skeleton = ({ className, rounded = 'md' }: SkeletonProps) => (
  <div
    className={cn(
      'bg-[var(--c-elevated)] animate-pulse',
      rounded === 'sm'   && 'rounded',
      rounded === 'md'   && 'rounded-xl',
      rounded === 'full' && 'rounded-full',
      className
    )}
    style={{
      background: 'linear-gradient(90deg, var(--c-elevated) 25%, var(--c-subtle) 50%, var(--c-elevated) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.8s infinite',
    }}
  />
)

export const StatCardSkeleton = () => (
  <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-7" rounded="sm" />
    </div>
    <Skeleton className="h-10 w-16" />
    <Skeleton className="h-3 w-32" />
  </div>
)

export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
  <div className="flex gap-4 px-5 py-3.5 border-b border-[var(--c-border)]">
    {Array.from({ length: cols }).map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === 0 ? 'flex-[2]' : 'flex-1'}`} />
    ))}
  </div>
)
