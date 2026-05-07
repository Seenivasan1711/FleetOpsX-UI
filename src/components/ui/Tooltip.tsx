import { useState, type ReactNode } from 'react'

type TooltipProps = {
  label:    string
  children: ReactNode
  side?:    'right' | 'top' | 'bottom'
}

export const Tooltip = ({ label, children, side = 'right' }: TooltipProps) => {
  const [visible, setVisible] = useState(false)

  const positionStyles: Record<string, React.CSSProperties> = {
    right:  { left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' },
    top:    { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: 'calc(100% + 8px)',   left: '50%', transform: 'translateX(-50%)' },
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className="absolute z-[9999] pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            ...positionStyles[side],
            background:  'var(--c-elevated)',
            border:      '1px solid var(--c-border)',
            color:       'var(--c-text)',
            boxShadow:   '0 8px 24px rgba(0,0,0,0.4)',
            animation:   'fade-in 0.1s ease',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
