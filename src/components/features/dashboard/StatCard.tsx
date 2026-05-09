import { type ReactNode } from 'react'
import { useCounterAnimation } from '../../../hooks/useCounterAnimation'

type Color = 'accent' | 'danger' | 'success' | 'info'

type StatCardProps = {
  label:  string
  value:  number
  color:  Color
  icon:   ReactNode
  trend?: { up: boolean; val: string; label: string }
  delay?: number
}

const colorTokens: Record<Color, { text: string; bg: string; bar: string; glow: string }> = {
  accent:  { text: 'var(--c-accent)',  bg: 'var(--c-accent-dim)',  bar: 'var(--c-accent)',  glow: 'var(--c-accent-glow)'  },
  danger:  { text: 'var(--c-red)',     bg: 'var(--c-red-dim)',     bar: 'var(--c-red)',     glow: 'rgba(239,68,68,0.22)'  },
  success: { text: 'var(--c-green)',   bg: 'var(--c-green-dim)',   bar: 'var(--c-green)',   glow: 'rgba(16,185,129,0.22)' },
  info:    { text: 'var(--c-purple)',  bg: 'var(--c-purple-dim)',  bar: 'var(--c-purple)',  glow: 'rgba(167,139,250,0.22)'},
}

export const StatCard = ({ label, value, color, icon, trend, delay = 0 }: StatCardProps) => {
  const animated = useCounterAnimation(value, 900, delay)
  const c        = colorTokens[color]

  return (
    <div
      className="relative min-w-0 rounded-2xl overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-[2px]"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px ${c.bar}30`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: c.bar, boxShadow: `0 1px 8px ${c.glow}` }}
      />

      <div className="p-5 pt-7">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10.5px] font-bold uppercase tracking-[1px] text-[var(--c-muted)]">
            {label}
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: c.bg, color: c.text }}
          >
            {icon}
          </div>
        </div>

        <div
          className="text-[40px] font-extrabold leading-none tracking-[-2px] font-mono"
          style={{ color: c.text }}
        >
          {animated}
        </div>

        {trend && (
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[var(--c-muted)]">
            <span
              className="font-bold"
              style={{ color: trend.up ? 'var(--c-green)' : 'var(--c-red)' }}
            >
              {trend.up ? '↑' : '↓'} {trend.val}
            </span>
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
