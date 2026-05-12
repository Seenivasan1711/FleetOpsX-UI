import { type ReactNode } from 'react'
import { useCounterAnimation } from '../../../hooks/useCounterAnimation'

type Color = 'accent' | 'danger' | 'success' | 'info' | 'white'

type StatCardProps = {
  label:     string
  value:     number
  color:     Color
  icon:      ReactNode
  trend?:    { up: boolean; val: string; label: string }
  delay?:    number
  sparkline?: number[]
  unit?:     string
  suffix?:   string
}

const colorTokens: Record<Color, { text: string; bg: string }> = {
  accent:  { text: '#8b5cf6',  bg: 'rgba(139,92,246,0.12)'  },
  danger:  { text: '#f87171',  bg: 'rgba(248,113,113,0.12)' },
  success: { text: '#34d399',  bg: 'rgba(52,211,153,0.12)'  },
  info:    { text: '#f59e0b',  bg: 'rgba(245,158,11,0.12)'  },
  white:   { text: '#f0f0f0',  bg: 'rgba(240,240,240,0.08)' },
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const w = 200, h = 40
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 6) - 3
    return `${x},${y}`
  })
  const lastVal = data[data.length - 1] ?? 0
  const lastX = ((data.length - 1) / (data.length - 1)) * w
  const lastY = h - ((lastVal - min) / range) * (h - 6) - 3

  const areaPoints = `0,${h} ${pts.join(' ')} ${w},${h}`

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi, '')})`} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

export const StatCard = ({ label, value, color, icon, trend, delay = 0, sparkline, unit, suffix }: StatCardProps) => {
  const animated = useCounterAnimation(value, 900, delay)
  const c        = colorTokens[color]

  return (
    <div
      className="relative min-w-0 rounded-2xl overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-[2px] flex flex-col"
      style={{
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.25), 0 0 0 1px ${c.text}30`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
    >
      <div className="p-5 flex-1">
        {/* Label + Icon */}
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-[var(--c-muted)]">
            {label}
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: c.bg, color: c.text }}
          >
            {icon}
          </div>
        </div>

        {/* Large value */}
        <div
          className="text-[42px] font-extrabold leading-none tracking-[-2px] font-mono mb-1"
          style={{ color: c.text }}
        >
          {animated}
          {unit && <span className="text-[20px] ml-0.5 opacity-70">{unit}</span>}
          {suffix && <span className="text-[22px] opacity-50 font-bold">{suffix}</span>}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[var(--c-muted)]">
            <span className="font-bold" style={{ color: trend.up ? '#34d399' : '#f87171' }}>
              {trend.up ? '↑' : '↓'} {trend.val}
            </span>
            <span>{trend.label}</span>
          </div>
        )}
      </div>

      {/* Full-width sparkline at bottom */}
      {sparkline && sparkline.length >= 2 && (
        <div style={{ height: 44, marginTop: 'auto' }}>
          <Sparkline data={sparkline} color={c.text} />
        </div>
      )}
    </div>
  )
}
