import { X } from 'lucide-react'
import { Button } from '../../ui/Button'

type Props = {
  unassignedCount: number
  onDismiss:       () => void
  onGenerate:      () => void
}

export const OnboardingBanner = ({ unassignedCount, onDismiss, onGenerate }: Props) => (
  <div
    className="flex items-center gap-4 px-6 py-5 rounded-2xl"
    style={{
      background: 'linear-gradient(135deg, var(--c-accent-dim), var(--c-purple-dim, rgba(167,139,250,0.08)))',
      border:     '1px solid var(--c-accent)',
      animation:  'page-slide-in 0.35s ease',
    }}
  >
    <span className="text-2xl shrink-0">👋</span>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-[var(--c-text)] mb-0.5">Welcome to FleetOpsX</p>
      <p className="text-xs text-[var(--c-muted)]">
        You have{' '}
        <strong className="text-[var(--c-red)]">{unassignedCount} unassigned orders</strong>{' '}
        for today. Generate a dispatch plan to get started.
      </p>
    </div>

    <div className="flex items-center gap-2 shrink-0">
      <Button onClick={onGenerate} size="sm">Generate Plan</Button>
      <button
        onClick={onDismiss}
        className="p-1.5 rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  </div>
)
