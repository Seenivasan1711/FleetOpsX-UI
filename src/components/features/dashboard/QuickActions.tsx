import { useNavigate } from 'react-router-dom'

const ACTIONS = [
  {
    label:    'View Orders',
    subtitle: 'Browse, filter, dispatch',
    path:     '/orders',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label:    'AI Plan Routes',
    subtitle: 'Generate optimised plan',
    path:     '/planning',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17c3-5 5-5 9 0s6 5 9 0"/>
        <path d="M3 7c3 5 5 5 9 0s6-5 9 0"/>
      </svg>
    ),
  },
  {
    label:    'Live Feed',
    subtitle: 'Track every driver',
    path:     '/map',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9"  y1="3"  x2="9"  y2="18"/>
        <line x1="15" y1="6"  x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    label:    'Scenario Sim',
    subtitle: 'What-if mode',
    path:     '/scenarios',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
]

export const QuickActions = () => {
  const navigate = useNavigate()

  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[1.5px] mb-4" style={{ color: 'var(--c-muted)' }}>
        Quick Actions
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map(({ label, subtitle, path, icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col gap-8 p-5 rounded-2xl text-left transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'var(--c-surface)',
              border:     '1px solid var(--c-border)',
              boxShadow:  'var(--shadow-sm)',
            }}
          >
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)' }}
            >
              {icon}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[var(--c-text)] leading-snug">{label}</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--c-muted)' }}>{subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
