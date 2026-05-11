import { type ReactNode } from 'react'
import { useCounterAnimation } from '../../../hooks/useCounterAnimation'

type Color = 'accent' | 'danger' | 'success' | 'info'

type StatCardProps = {
  label:     string
  value:     number
  color:     Color
  icon:      ReactNode
  trend?:    { up: boolean; val: string; label: string }
  delay?:    number
  sparkline?: number[]
  unit?:     string
}

const colorTokens: Record<Color, { text: string; bg: string; bar: string; glow: string }> = {
  accent:  { text: 'var(--c-accent)',  bg: 'var(--c-accent-dim)',  bar: 'var(--c-accent)',  glow: 'var(--c-accent-glow)'  },
  danger:  { text: 'var(--c-red)',     bg: 'var(--c-red-dim)',     bar: 'var(--c-red)',     glow: 'rgba(239,68,68,0.22)'  },
  success: { text: 'var(--c-green)',   bg: 'var(--c-green-dim)',   bar: 'var(--c-green)',   glow: 'rgba(16,185,129,0.22)' },
  info:    { text: 'var(--c-purple)',  bg: 'var(--c-purple-dim)',  bar: 'var(--c-purple)',  glow: 'rgba(167,139,250,0.22)'},
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const w = 80, h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })
  const lastX = w.toString()
  const lastVal = data[data.length - 1] ?? 0
  const lastY = (h - ((lastVal - min) / range) * (h - 4) - 2).toString()

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} opacity="0.9" />
    </svg>
  )
}

export const StatCard = ({ label, value, color, icon, trend, delay = 0, sparkline, unit }: StatCardProps) => {
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

        <div className="flex items-end justify-between gap-2">
          <div
            className="text-[40px] font-extrabold leading-none tracking-[-2px] font-mono"
            style={{ color: c.text }}
          >
            {animated}{unit && <span className="text-[22px] ml-1 opacity-60">{unit}</span>}
          </div>
          {sparkline && sparkline.length >= 2 && (
            <div style={{ opacity: 0.85, marginBottom: 2 }}>
              <Sparkline data={sparkline} color={c.bar} />
            </div>
          )}
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
