import { useState } from 'react'
import { Zap, Leaf, Scale, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Star } from 'lucide-react'
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
  recommended?: boolean
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

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    pct >= 80 ? 'var(--c-green)' :
    pct >= 55 ? 'var(--c-orange)' :
    'var(--c-red)'
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}22`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {pct}% confidence
    </span>
  )
}

export function PlanOptionsCard({ option, selected, recommended, onSelect }: PlanOptionsCardProps) {
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const meta = MODE_META[option.mode]
  const Icon = meta.icon
  const coverage = Math.round((option.orders_covered / Math.max(option.total_orders, 1)) * 100)
  const hasReasoning = (option.reasoning_steps?.length ?? 0) > 0
  const hasWarnings = (option.warnings?.length ?? 0) > 0

  return (
    <div
      className="flex flex-col flex-1 rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{
        background: 'var(--c-surface)',
        border: `2px solid ${selected ? meta.color : recommended ? `${meta.color}88` : 'var(--c-border)'}`,
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
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</p>
            {recommended && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${meta.color}22`, color: meta.color }}
              >
                <Star size={9} /> AI Pick
              </span>
            )}
          </div>
          {option.ai_summary && (
            <p className="text-xs text-[var(--c-muted)] mt-0.5 leading-tight line-clamp-2">{option.ai_summary}</p>
          )}
        </div>
        {selected && <CheckCircle2 size={18} style={{ color: meta.color, flexShrink: 0 }} />}
      </div>

      {/* Confidence badge */}
      {option.confidence_score != null && (
        <div className="px-5 pt-3">
          <ConfidenceBadge score={option.confidence_score} />
        </div>
      )}

      {/* Metrics */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <Metric label="Coverage" value={`${coverage}%`} />
        <Metric label="Routes" value={option.total_routes} />
        <Metric label="Assigned" value={`${option.orders_covered} / ${option.total_orders}`} />
        <Metric label="Est. Distance" value={`${option.total_distance_km.toFixed(1)} km`} />
        <Metric
          label="Est. Time"
          value={`${Math.floor(option.est_duration_min / 60)}h ${option.est_duration_min % 60}m`}
        />
        <Metric label="Fuel Cost" value={`₹${option.est_fuel_cost.toFixed(0)}`} />
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <div className="px-5 pb-3 flex flex-col gap-1.5">
          {option.warnings!.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-1.5 text-[11px] px-2.5 py-2 rounded-lg"
              style={{ background: 'rgba(248,113,113,0.10)', color: 'var(--c-red)' }}
            >
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reasoning (expandable) */}
      {hasReasoning && (
        <div className="px-5 pb-3" onClick={(e) => e.stopPropagation()}>
          <button
            className="flex items-center gap-1 text-[11px] text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors"
            onClick={() => setReasoningOpen((v) => !v)}
          >
            {reasoningOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            AI reasoning
          </button>
          {reasoningOpen && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {option.reasoning_steps!.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[11px] text-[var(--c-muted)]"
                >
                  <span className="mt-0.5 shrink-0" style={{ color: meta.color }}>•</span>
                  {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
