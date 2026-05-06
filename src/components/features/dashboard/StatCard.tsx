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

const colorTokens: Record<Color, { text: string; bg: string; bar: string }> = {
  accent:  { text: 'var(--c-accent)',  bg: 'var(--c-accent-dim)',  bar: 'var(--c-accent)'  },
  danger:  { text: 'var(--c-red)',     bg: 'var(--c-red-dim)',     bar: 'var(--c-red)'     },
  success: { text: 'var(--c-green)',   bg: 'var(--c-green-dim)',   bar: 'var(--c-green)'   },
  info:    { text: 'var(--c-purple)',  bg: 'var(--c-purple-dim)',  bar: 'var(--c-purple)'  },
}

export const StatCard = ({ label, value, color, icon, trend, delay = 0 }: StatCardProps) => {
  const animated = useCounterAnimation(value, 900, delay)
  const c        = colorTokens[color]

  return (
    <div
      className="relative flex-1 rounded-2xl overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-70" style={{ background: c.bar }} />

      <div className="p-5">
        <div className="flex justify-between items-start mb-3.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.9px] text-[var(--c-muted)]">
            {label}
          </span>
          <div
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{ background: c.bg, color: c.text }}
          >
            {icon}
          </div>
        </div>

        <div
          className="text-[38px] font-extrabold leading-none tracking-[-1.5px] font-mono"
          style={{ color: c.text }}
        >
          {animated}
        </div>

        {trend && (
          <div className="flex items-center gap-1 mt-2.5 text-[11px] text-[var(--c-muted)]">
            <span
              className="font-semibold"
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
