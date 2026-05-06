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
  { label: 'View Orders',  icon: <ClipboardList size={14} />, path: '/orders',    color: 'var(--c-accent)',  dim: 'var(--c-accent-dim)'  },
  { label: 'Plan Routes',  icon: <Route size={14} />,         path: '/planning',  color: 'var(--c-purple)',  dim: 'var(--c-purple-dim)'  },
  { label: 'Live Map',     icon: <Map size={14} />,           path: '/map',       color: 'var(--c-green)',   dim: 'var(--c-green-dim)'   },
  { label: 'Analytics',   icon: <BarChart2 size={14} />,      path: '/analytics', color: 'var(--c-orange)',  dim: 'var(--c-orange-dim)'  },
]

export const QuickActions = () => {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-4 gap-3">
      {ACTIONS.map(({ label, icon, path, color, dim }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 hover:-translate-y-px"
          style={{
            background:   'var(--c-surface)',
            border:       '1px solid var(--c-border)',
            color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background   = dim
            e.currentTarget.style.borderColor  = color
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background   = 'var(--c-surface)'
            e.currentTarget.style.borderColor  = 'var(--c-border)'
          }}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
