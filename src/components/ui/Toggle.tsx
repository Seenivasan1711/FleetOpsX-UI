type ToggleProps = {
  value:    boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}

export const Toggle = ({ value, onChange, disabled }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={value}
    disabled={disabled}
    onClick={() => onChange(!value)}
    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ background: value ? 'var(--c-accent)' : 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
  >
    <span
      className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
      style={{ transform: value ? 'translateX(22px)' : 'translateX(4px)' }}
    />
  </button>
)
