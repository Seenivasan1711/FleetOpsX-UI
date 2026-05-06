import { Zap, Leaf, Scale, CheckCircle2 } from 'lucide-react'
import type { PlanOption, PlanOptionMode } from '../../types'

const MODE_META: Record<PlanOptionMode, {
  icon: typeof Zap; label: string; color: string; bg: string
}> = {
  fastest: {
    icon: Zap,
    label: 'Fastest',
    color: 'var(--c-accent)',
    bg: 'var(--c-accent-dim)',
  },
  economical: {
    icon: Leaf,
    label: 'Economical',
    color: 'var(--c-green)',
    bg: 'rgba(52,211,153,0.10)',
  },
  balanced: {
    icon: Scale,
    label: 'Balanced',
    color: 'var(--c-purple)',
    bg: 'rgba(167,139,250,0.10)',
  },
}

interface PlanOptionsCardProps {
  option: PlanOption
  selected: boolean
  onSelect: () => void
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--c-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--c-text)]">{value}</span>
    </div>
  )
}

export function PlanOptionsCard({ option, selected, onSelect }: PlanOptionsCardProps) {
  const meta = MODE_META[option.mode]
  const Icon = meta.icon
  const coverage = Math.round((option.assigned_orders / Math.max(option.total_orders, 1)) * 100)

  return (
    <div
      className="flex flex-col flex-1 rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{
        background: 'var(--c-surface)',
        border: `2px solid ${selected ? meta.color : 'var(--c-border)'}`,
        boxShadow: selected ? `0 0 0 4px ${meta.color}22` : 'none',
      }}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: meta.bg }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${meta.color}22` }}
        >
          <Icon size={16} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</p>
          <p className="text-xs text-[var(--c-muted)]">{option.description}</p>
        </div>
        {selected && <CheckCircle2 size={18} style={{ color: meta.color, flexShrink: 0 }} />}
      </div>

      {/* Metrics */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <Metric label="Coverage" value={`${coverage}%`} />
        <Metric label="Routes" value={option.total_routes} />
        <Metric label="Assigned" value={`${option.assigned_orders} / ${option.total_orders}`} />
        {option.estimated_km != null && (
          <Metric label="Est. Distance" value={`${option.estimated_km} km`} />
        )}
        {option.estimated_duration_min != null && (
          <Metric
            label="Est. Time"
            value={`${Math.floor(option.estimated_duration_min / 60)}h ${option.estimated_duration_min % 60}m`}
          />
        )}
      </div>

      {/* Select button */}
      <div className="px-5 pb-5">
        <button
          className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: selected ? meta.color : 'var(--c-elevated)',
            color: selected ? 'white' : 'var(--c-text)',
          }}
        >
          {selected ? 'Selected ✓' : 'Select'}
        </button>
      </div>
    </div>
  )
}
