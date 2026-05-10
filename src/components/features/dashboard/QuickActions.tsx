import { useNavigate } from 'react-router-dom'
import { ClipboardList, Route, Map, BarChart2 } from 'lucide-react'

type Action = {
  label: string
  icon:  React.ReactNode
  path:  string
  color: string
  dim:   string
}

const ACTIONS: Action[] = [
  { label: 'View Orders',  icon: <ClipboardList size={15} />, path: '/orders',    color: 'var(--c-accent)',  dim: 'var(--c-accent-dim)'  },
  { label: 'Plan Routes',  icon: <Route size={15} />,         path: '/planning',  color: 'var(--c-purple)',  dim: 'var(--c-purple-dim)'  },
  { label: 'Live Map',     icon: <Map size={15} />,           path: '/map',       color: 'var(--c-green)',   dim: 'var(--c-green-dim)'   },
  { label: 'Analytics',   icon: <BarChart2 size={15} />,      path: '/analytics', color: 'var(--c-orange)',  dim: 'var(--c-orange-dim)'  },
]

export const QuickActions = () => {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {ACTIONS.map(({ label, icon, path, color, dim }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="flex flex-col items-start gap-4 p-5 rounded-2xl text-left transition-all duration-150 hover:-translate-y-[2px]"
          style={{
            background: 'var(--c-surface)',
            border:     '1px solid var(--c-border)',
            boxShadow:  'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background  = dim
            e.currentTarget.style.borderColor = color
            e.currentTarget.style.boxShadow   = `0 8px 24px rgba(0,0,0,0.2)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background  = 'var(--c-surface)'
            e.currentTarget.style.borderColor = 'var(--c-border)'
            e.currentTarget.style.boxShadow   = 'var(--shadow-sm)'
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: dim, color }}
          >
            {icon}
          </div>
          <span className="text-[13px] font-semibold text-[var(--c-text)]">{label}</span>
        </button>
      ))}
    </div>
  )
}
