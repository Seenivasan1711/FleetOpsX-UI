type EmptyStateProps = {
  title:    string
  subtitle: string
  action?:  React.ReactNode
}

export const EmptyState = ({ title, subtitle, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
    <div className="opacity-20 text-[var(--c-muted)]">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <circle cx="26" cy="26" r="22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" />
        <circle cx="26" cy="26" r="9"  stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M26 17v-5M26 40v5M17 26h-5M40 26h5"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-[var(--c-text)] mb-1">{title}</p>
      <p className="text-xs text-[var(--c-muted)]">{subtitle}</p>
    </div>
    {action && <div className="mt-1">{action}</div>}
  </div>
)
