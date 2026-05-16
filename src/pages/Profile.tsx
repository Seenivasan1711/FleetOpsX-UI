import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Shield, Building2, KeyRound, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }     from '../components/layout/AppShell'
import { Button }       from '../components/ui/Button'
import { Input }        from '../components/ui/Input'
import FormField        from '../components/shared/FormField'
import { useAuthStore } from '../store/auth.store'
import { changePasswordApi } from '../api/auth'
import { initials }     from '../lib/utils/format'

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-4 py-3.5 border-b border-[var(--c-border)] last:border-0">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: 'var(--c-elevated)' }}
    >
      <Icon size={15} className="text-[var(--c-muted)]" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-[var(--c-muted)] uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-sm text-[var(--c-text)] font-medium truncate">{value}</p>
    </div>
  </div>
)

export default function Profile() {
  const { user } = useAuthStore()

  const [current,     setCurrent]     = useState('')
  const [next,        setNext]        = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext,    setShowNext]    = useState(false)

  const mutation = useMutation({
    mutationFn: () => changePasswordApi(current, next),
    onSuccess: () => {
      toast.success('Password changed successfully')
      setCurrent(''); setNext(''); setConfirm('')
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(detail ?? 'Failed to change password')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (next.length < 8)      { toast.error('New password must be at least 8 characters'); return }
    if (next !== confirm)     { toast.error('Passwords do not match'); return }
    mutation.mutate()
  }

  const avatar = initials(user?.full_name ?? 'U')
  const roleLabel: Record<string, string> = {
    admin: 'Admin', dispatcher: 'Dispatcher', driver: 'Driver', superadmin: 'Super Admin',
  }

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-6 max-w-2xl" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--c-accent) 0%, var(--c-purple, #a78bfa) 100%)' }}
          >
            {avatar}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text)]">{user?.full_name}</h1>
            <p className="text-sm text-[var(--c-muted)]">{roleLabel[user?.role ?? ''] ?? user?.role}</p>
          </div>
        </div>

        {/* Account info card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-muted)] mb-1">
            Account Details
          </p>
          <InfoRow icon={User}      label="Full Name"  value={user?.full_name ?? '—'} />
          <InfoRow icon={Mail}      label="Email"      value={user?.email ?? '—'} />
          <InfoRow icon={Shield}    label="Role"       value={roleLabel[user?.role ?? ''] ?? (user?.role ?? '—')} />
          <InfoRow icon={Building2} label="Tenant ID"  value={user?.tenant_id ?? '—'} />
        </div>

        {/* Change password card */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-muted)] mb-4">
            Change Password
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <FormField label="Current Password">
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)] hover:text-[var(--c-text)]"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>
            <FormField label="New Password">
              <div className="relative">
                <Input
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNext((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-muted)] hover:text-[var(--c-text)]"
                >
                  {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>
            <FormField label="Confirm New Password">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
              />
            </FormField>
            <div className="pt-1">
              <Button
                type="submit"
                loading={mutation.isPending}
                disabled={!current || !next || !confirm}
              >
                <KeyRound size={14} /> Update Password
              </Button>
            </div>
          </form>
        </div>

      </div>
    </AppShell>
  )
}
