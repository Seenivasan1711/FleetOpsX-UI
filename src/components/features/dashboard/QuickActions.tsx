import { useNavigate } from 'react-router-dom'
import { ClipboardList, Route, Map, BarChart2 } from 'lucide-react'

type Action = {
  label:    string
  subtitle: string
  icon:     React.ReactNode
  path:     string
  color:    string
  dim:      string
}

const ACTIONS: Action[] = [
  { label: 'View Orders',  subtitle: 'Manage & filter deliveries',    icon: <ClipboardList size={16} />, path: '/orders',    color: 'var(--c-accent)',  dim: 'var(--c-accent-dim)'  },
  { label: 'Plan Routes',  subtitle: 'Generate dispatch plans',       icon: <Route size={16} />,         path: '/planning',  color: 'var(--c-purple)',  dim: 'var(--c-purple-dim)'  },
  { label: 'Live Map',     subtitle: 'Track drivers in real-time',    icon: <Map size={16} />,           path: '/map',       color: 'var(--c-green)',   dim: 'var(--c-green-dim)'   },
  { label: 'Analytics',   subtitle: 'KPIs & performance trends',      icon: <BarChart2 size={16} />,     path: '/analytics', color: 'var(--c-orange)',  dim: 'var(--c-orange-dim)'  },
]

export const QuickActions = () => {
  const navigate = useNavigate()

  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[1px] text-[var(--c-muted)] mb-3">
        Quick Actions
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map(({ label, subtitle, icon, path, color, dim }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-start gap-3 p-5 rounded-2xl text-left transition-all duration-150 hover:-translate-y-[2px] group"
            style={{
              background: 'var(--c-surface)',
              border:     '1px solid var(--c-border)',
              boxShadow:  'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background  = dim
              e.currentTarget.style.borderColor = color
              e.currentTarget.style.boxShadow   = '0 8px 24px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background  = 'var(--c-surface)'
              e.currentTarget.style.borderColor = 'var(--c-border)'
              e.currentTarget.style.boxShadow   = 'var(--shadow-sm)'
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110"
              style={{ background: dim, color }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--c-text)] leading-tight mb-1">{label}</p>
              <p className="text-[11px] text-[var(--c-muted)] leading-tight">{subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
