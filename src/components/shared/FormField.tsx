interface FormFieldProps {
  label:     string
  error?:    string
  required?: boolean
  children:  React.ReactNode
}

export default function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">
        {label}
        {required && <span className="text-[var(--c-red)] ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--c-red)]">{error}</p>}
    </div>
  )
}
