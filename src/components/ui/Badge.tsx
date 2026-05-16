import { cn } from '../../lib/utils/cn'

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'

const priorityStyles: Record<Priority, { bg: string; color: string; border: string }> = {
  CRITICAL: { bg: 'rgba(248,113,113,0.15)', color: 'var(--c-red)',    border: 'rgba(248,113,113,0.35)' },
  HIGH:     { bg: 'rgba(251,191,36,0.15)',  color: '#f59e0b',         border: 'rgba(251,191,36,0.35)'  },
  NORMAL:   { bg: 'var(--c-elevated)',      color: 'var(--c-muted)',  border: 'var(--c-border)'         },
  LOW:      { bg: 'transparent',            color: 'var(--c-muted)',  border: 'var(--c-border)'         },
}

const statusStyles: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  PENDING:    { bg: 'rgba(251,191,36,0.12)',  color: '#f59e0b',         dot: '#f59e0b',          label: 'Unassigned' },
  ASSIGNED:   { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa',         dot: '#60a5fa',          label: 'Assigned'   },
  IN_TRANSIT: { bg: 'rgba(167,139,250,0.12)', color: 'var(--c-purple)', dot: 'var(--c-purple)', label: 'In Transit' },
  DELIVERED:  { bg: 'rgba(52,211,153,0.10)',  color: 'var(--c-green)',  dot: 'var(--c-green)',  label: 'Delivered'  },
  FAILED:     { bg: 'rgba(248,113,113,0.12)', color: 'var(--c-red)',    dot: 'var(--c-red)',    label: 'Failed'     },
  CANCELLED:  { bg: 'var(--c-elevated)',       color: 'var(--c-muted)', dot: 'var(--c-muted)',  label: 'Cancelled'  },
  AT_RISK:    { bg: 'rgba(245,158,11,0.14)',  color: '#f59e0b',         dot: '#f59e0b',          label: 'At Risk'    },
}

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const s = priorityStyles[priority] ?? priorityStyles.NORMAL
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold tracking-wide border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {priority}
    </span>
  )
}

export const StatusBadge = ({ status }: { status: string }) => {
  const s = statusStyles[status] ?? { bg: 'var(--c-elevated)', color: 'var(--c-muted)', dot: 'var(--c-muted)', label: status }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

export const RoleBadge = ({ role }: { role: string }) => (
  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-[var(--c-accent-dim)] text-[var(--c-accent)] uppercase tracking-wide">
    {role}
  </span>
)
