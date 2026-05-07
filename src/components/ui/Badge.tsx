import { cn } from '../../lib/utils/cn'

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
type Status   = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED'

const priorityStyles: Record<Priority, { bg: string; color: string; border: string }> = {
  CRITICAL: { bg: 'rgba(248,113,113,0.15)', color: 'var(--c-red)',    border: 'rgba(248,113,113,0.35)' },
  HIGH:     { bg: 'rgba(251,191,36,0.15)',  color: 'var(--c-orange)', border: 'rgba(251,191,36,0.35)'  },
  NORMAL:   { bg: 'var(--c-elevated)',      color: 'var(--c-muted)',  border: 'var(--c-border)'         },
  LOW:      { bg: 'rgba(52,211,153,0.1)',   color: 'var(--c-green)',  border: 'rgba(52,211,153,0.3)'   },
}

const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
  PENDING:    { bg: 'rgba(251,191,36,0.12)',  color: 'var(--c-orange)', dot: 'var(--c-orange)' },
  ASSIGNED:   { bg: 'rgba(59,130,246,0.12)',  color: 'var(--c-accent)', dot: 'var(--c-accent)' },
  IN_TRANSIT: { bg: 'rgba(167,139,250,0.12)', color: 'var(--c-purple)', dot: 'var(--c-purple)' },
  DELIVERED:  { bg: 'rgba(52,211,153,0.10)',  color: 'var(--c-green)',  dot: 'var(--c-green)'  },
  FAILED:     { bg: 'rgba(248,113,113,0.12)', color: 'var(--c-red)',    dot: 'var(--c-red)'    },
  CANCELLED:  { bg: 'var(--c-elevated)',       color: 'var(--c-muted)', dot: 'var(--c-muted)'  },
}

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const s = priorityStyles[priority] ?? priorityStyles.NORMAL
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-bold font-mono tracking-wide border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {priority}
    </span>
  )
}

export const StatusBadge = ({ status }: { status: string }) => {
  const s = statusStyles[status] ?? statusStyles.PENDING
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full block" style={{ background: s.dot }} />
      {status}
    </span>
  )
}

export const RoleBadge = ({ role }: { role: string }) => (
  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-[var(--c-accent-dim)] text-[var(--c-accent)] uppercase tracking-wide">
    {role}
  </span>
)
