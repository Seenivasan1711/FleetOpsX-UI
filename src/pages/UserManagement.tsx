import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Shield, Eye, Truck, Package, ToggleLeft, ToggleRight, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Modal }      from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { listUsers, inviteUser, updateUser, deactivateUser } from '../api/userManagement'
import type { UserOut } from '../api/userManagement'

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  admin:          { label: 'Admin',          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: <Shield size={11} /> },
  dispatcher:     { label: 'Dispatcher',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: <Package size={11} /> },
  driver:         { label: 'Driver',         color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: <Truck size={11} /> },
  readonly:       { label: 'Read-only',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: <Eye size={11} /> },
  packaging_team: { label: 'Packaging',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Package size={11} /> },
}

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META['dispatcher']!
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.icon} {meta.label}
    </span>
  )
}

// ─── Copy temp password ───────────────────────────────────────────────────────

function CopyPassword({ password }: { password: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2 mt-1 p-3 rounded-xl" style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}>
      <code className="flex-1 text-sm font-mono text-[var(--c-text)]">{password}</code>
      <button onClick={copy} className="shrink-0 transition-colors" style={{ color: copied ? 'var(--c-green)' : 'var(--c-muted)' }}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  )
}

// ─── User row ─────────────────────────────────────────────────────────────────

const ROLES = ['dispatcher', 'driver', 'admin', 'readonly', 'packaging_team']

function UserRow({ user }: { user: UserOut }) {
  const [editing,   setEditing]   = useState(false)
  const [editRole,  setEditRole]  = useState(user.role)
  const [editName,  setEditName]  = useState(user.full_name ?? '')
  const qc = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: () => updateUser(user.id, { role: editRole, full_name: editName }),
    onSuccess: () => { toast.success('User updated'); setEditing(false); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError:   () => toast.error('Failed to update user'),
  })

  const toggleMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (user.is_active) await deactivateUser(user.id)
      else await updateUser(user.id, { is_active: true })
    },
    onSuccess: () => { toast.success(user.is_active ? 'User deactivated' : 'User reactivated'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError:   () => toast.error('Failed to update user'),
  })

  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid var(--c-border)', opacity: user.is_active ? 1 : 0.5 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      <td className="px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-[var(--c-text)]">{user.full_name ?? '—'}</p>
          <p className="text-xs text-[var(--c-muted)]">{user.email}</p>
        </div>
      </td>
      <td className="px-5 py-3"><RoleBadge role={user.role} /></td>
      <td className="px-5 py-3">
        <span className="text-xs font-semibold" style={{ color: user.is_active ? 'var(--c-green)' : 'var(--c-red)' }}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          <button
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className="transition-colors"
            style={{ color: user.is_active ? 'var(--c-red)' : 'var(--c-green)' }}
          >
            {user.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      </td>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit User">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">Full Name</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm"
              style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
              Save changes
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [showInvite,    setShowInvite]    = useState(false)
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteName,    setInviteName]    = useState('')
  const [inviteRole,    setInviteRole]    = useState('dispatcher')
  const [tempPassword,  setTempPassword]  = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  listUsers,
  })

  const inviteMutation = useMutation({
    mutationFn: () => inviteUser({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
    onSuccess: (data) => {
      setTempPassword(data.temp_password)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('dispatcher')
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(`${data.user.full_name} invited`)
    },
    onError: () => toast.error('Failed to invite user'),
  })

  const activeUsers   = users.filter((u) => u.is_active)
  const inactiveUsers = users.filter((u) => !u.is_active)

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Users size={18} style={{ color: 'var(--c-accent)' }} />
            <h1 className="text-lg font-bold text-[var(--c-text)]">User Management</h1>
            <span className="text-xs text-[var(--c-muted)]">{activeUsers.length} active · {inactiveUsers.length} inactive</span>
          </div>
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus size={15} /> Invite User
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--c-accent)] border-t-transparent animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState title="No users yet" subtitle="Invite your first team member." />
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  {['User', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--c-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => <UserRow key={u.id} user={u} />)}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); setTempPassword(null) }} title="Invite Team Member">
        {tempPassword ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Check size={18} style={{ color: 'var(--c-green)' }} />
              <p className="text-sm text-[var(--c-text)]">User invited! Share this temporary password:</p>
            </div>
            <CopyPassword password={tempPassword} />
            <p className="text-xs text-[var(--c-muted)]">The user should change their password after first login.</p>
            <Button onClick={() => { setShowInvite(false); setTempPassword(null) }}>Done</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">Email</label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@company.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">Full Name</label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="John Smith" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => inviteMutation.mutate()}
                loading={inviteMutation.isPending}
                disabled={!inviteEmail.trim() || !inviteName.trim()}
              >
                <UserPlus size={14} /> Send Invite
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
