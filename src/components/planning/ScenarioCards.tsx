import { CheckCircle2, Clock, DollarSign, Truck, Users } from 'lucide-react'
import type { AiScenario, AiPlanResult } from '../../api/aiPlanning'

interface Props {
  planResult:    AiPlanResult
  onSelect:      (type: AiScenario['type']) => void
  selectedType?: AiScenario['type'] | null
  confirming?:   boolean
}

const SCENARIO_META: Record<string, { label: string; icon: React.ReactNode; color: string; accentBg: string }> = {
  fastest: {
    label:    'Fastest',
    icon:     <Clock className="w-4 h-4" />,
    color:    'text-[#3b82f6]',
    accentBg: 'rgba(59,130,246,0.1)',
  },
  economical: {
    label:    'Economical',
    icon:     <DollarSign className="w-4 h-4" />,
    color:    'text-[#10b981]',
    accentBg: 'rgba(16,185,129,0.1)',
  },
  balanced: {
    label:    'Balanced',
    icon:     <CheckCircle2 className="w-4 h-4" />,
    color:    'text-[#7c3aed]',
    accentBg: 'rgba(124,58,237,0.1)',
  },
  driver_availability: {
    label:    'Driver Availability',
    icon:     <Users className="w-4 h-4" />,
    color:    'text-[#f59e0b]',
    accentBg: 'rgba(245,158,11,0.1)',
  },
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10.5px] text-[#6b7280] mb-1">
        <span>AI Confidence</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 65 ? '#f59e0b' : '#ef4444' }}
        />
      </div>
    </div>
  )
}

export function ScenarioCards({ planResult, onSelect, selectedType, confirming }: Props) {
  const { scenarios, constraints_applied } = planResult

  return (
    <div className="space-y-4">
      {constraints_applied.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-[#6b7280]">Constraints applied:</span>
          {constraints_applied.map((c, i) => (
            <span key={i} className="text-xs bg-[#1c1c1c] border border-[#2a2a2a] text-[#a78bfa] px-2 py-0.5 rounded-full">
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {scenarios.map((scenario) => {
          const meta  = SCENARIO_META[scenario.type] ?? {
            label: 'Balanced', icon: <CheckCircle2 className="w-4 h-4" />,
            color: 'text-[#7c3aed]', accentBg: 'rgba(124,58,237,0.1)',
          }
          const isSelected = selectedType === scenario.type

          return (
            <div
              key={scenario.type}
              className={`bg-[#141414] border rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#7c3aed] shadow-lg shadow-[#7c3aed]/10'
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
              }`}
              onClick={() => !confirming && onSelect(scenario.type as AiScenario['type'])}
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: meta.accentBg }}
                >
                  <span className={meta.color}>{meta.icon}</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                  {scenario.type === 'balanced' && (
                    <span className="text-[9px] text-[#6b7280] uppercase tracking-wide">Recommended</span>
                  )}
                </div>
              </div>

              {/* KPIs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6b7280]">Time</span>
                  <span className="font-mono font-semibold text-[#f0f0f0]">
                    {Math.floor(scenario.kpis.total_time_min / 60)}h {scenario.kpis.total_time_min % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6b7280]">Fuel cost</span>
                  <span className="font-mono font-semibold text-[#f0f0f0]">
                    ₹{scenario.kpis.est_fuel_cost_inr.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6b7280]">Coverage</span>
                  <span className="font-mono font-semibold text-[#f0f0f0]">{scenario.kpis.coverage_pct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6b7280] flex items-center gap-1"><Truck className="w-3 h-3" /> Routes</span>
                  <span className="font-mono font-semibold text-[#f0f0f0]">{scenario.total_routes}</span>
                </div>
              </div>

              <ConfidenceBar value={scenario.ai_confidence} />

              {/* Reasoning */}
              <p className="text-[11px] text-[#6b7280] leading-relaxed line-clamp-3">
                {scenario.reasoning}
              </p>

              {/* Select button */}
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(scenario.type as AiScenario['type']) }}
                disabled={confirming}
                className={`mt-auto w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-[#1c1c1c] text-[#6b7280] hover:bg-[#2a2a2a] hover:text-[#f0f0f0]'
                }`}
              >
                {isSelected ? '✓ Selected' : 'Select →'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
