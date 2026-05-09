type EmptyStateProps = {
  title:    string
  subtitle: string
  action?:  React.ReactNode
}

export const EmptyState = ({ title, subtitle, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-5">
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center"
      style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
    >
      <svg width="26" height="26" viewBox="0 0 52 52" fill="none" style={{ opacity: 0.4 }}>
        <circle cx="26" cy="26" r="22" stroke="var(--c-muted)" strokeWidth="1.5" strokeDasharray="5 4" />
        <circle cx="26" cy="26" r="9"  stroke="var(--c-muted)" strokeWidth="1.5" />
        <path
          d="M26 17v-5M26 40v5M17 26h-5M40 26h5"
          stroke="var(--c-muted)" strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-[var(--c-text)] mb-1.5">{title}</p>
      <p className="text-xs text-[var(--c-muted)] max-w-[260px] leading-relaxed mx-auto">{subtitle}</p>
    </div>
    {action && <div>{action}</div>}
  </div>
)
