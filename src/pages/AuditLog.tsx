import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ShieldCheck, ChevronDown, ChevronRight, Download,
  RefreshCw, Trash2, Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Modal }      from '../components/ui/Modal'
import { Skeleton }   from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import {
  fetchAuditLog, requestDataExport, fetchRetention, updateRetention,
  fetchRoles, createRole, deleteRole,
} from '../api/audit'
import type { AuditLogEntry, AuditLogFilters, RbacRole } from '../api/audit'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function actionColor(action: string) {
  if (action.includes('accept')) return 'text-emerald-400'
  if (action.includes('dismiss') || action.includes('cancel') || action.includes('delete'))
    return 'text-rose-400'
  if (action.includes('create') || action.includes('generate')) return 'text-sky-400'
  return 'text-zinc-300'
}

// ─── Audit row with expandable AI context ────────────────────────────────────

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const [open, setOpen] = useState(false)
  const hasContext = entry.ai_context != null || entry.before_state != null || entry.after_state != null

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
        onClick={() => hasContext && setOpen((o) => !o)}
      >
        {hasContext
          ? (open ? <ChevronDown size={14} className="text-zinc-400 shrink-0" /> : <ChevronRight size={14} className="text-zinc-400 shrink-0" />)
          : <span className="w-3.5" />
        }
        <span className={`text-xs font-mono font-semibold ${actionColor(entry.action)} shrink-0 w-48 truncate`}>
          {entry.action}
        </span>
        <span className="text-xs text-zinc-500 shrink-0 w-32 truncate">{entry.resource_type}</span>
        <span className="text-xs text-zinc-400 flex-1 truncate">{entry.actor_email}</span>
        <span className="text-xs text-zinc-500 shrink-0">{fmtDate(entry.created_at)}</span>
      </button>

      {open && (
        <div className="px-8 pb-4 space-y-2 bg-zinc-900/50">
          {entry.ai_context != null && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">AI Context</p>
              <pre className="text-xs text-zinc-300 bg-zinc-800 rounded-lg p-3 overflow-auto">
                {JSON.stringify(entry.ai_context, null, 2)}
              </pre>
            </div>
          )}
          {entry.before_state != null && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Before</p>
              <pre className="text-xs text-rose-300 bg-zinc-800 rounded-lg p-3 overflow-auto">
                {JSON.stringify(entry.before_state, null, 2)}
              </pre>
            </div>
          )}
          {entry.after_state != null && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">After</p>
              <pre className="text-xs text-emerald-300 bg-zinc-800 rounded-lg p-3 overflow-auto">
                {JSON.stringify(entry.after_state, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type Filters = {
  action: string
  actor_email: string
  resource_type: string
  since: string
}

function FilterBar({
  filters, onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Input
        placeholder="Action (e.g. suggestion.accept)"
        value={filters.action}
        onChange={(e) => onChange({ ...filters, action: e.target.value })}
      />
      <Input
        placeholder="Actor email"
        value={filters.actor_email}
        onChange={(e) => onChange({ ...filters, actor_email: e.target.value })}
      />
      <Input
        placeholder="Resource type"
        value={filters.resource_type}
        onChange={(e) => onChange({ ...filters, resource_type: e.target.value })}
      />
      <Input
        type="date"
        value={filters.since}
        onChange={(e) => onChange({ ...filters, since: e.target.value })}
        title="Since date"
      />
    </div>
  )
}

// ─── Retention panel ──────────────────────────────────────────────────────────

function RetentionPanel() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['retention-config'],
    queryFn: fetchRetention,
  })
  const [days, setDays] = useState<number | null>(null)
  const mut = useMutation({
    mutationFn: updateRetention,
    onSuccess: () => {
      toast.success('Retention policy updated')
      qc.invalidateQueries({ queryKey: ['retention-config'] })
      setDays(null)
    },
    onError: () => toast.error('Failed to update retention'),
  })

  const current = days ?? data?.retention_days ?? 365

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-100">Data Retention</h3>
      <p className="text-xs text-zinc-400">
        Records older than this window are swept daily at 02:00 UTC.
      </p>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          min={30}
          max={3650}
          value={current}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-28"
        />
        <span className="text-sm text-zinc-400">days</span>
        <Button
          size="sm"
          onClick={() => mut.mutate(current)}
          disabled={mut.isPending}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

// ─── RBAC roles panel ─────────────────────────────────────────────────────────

const roleSchema = z.object({
  name:        z.string().min(1, 'Required'),
  permissions: z.string().min(1, 'Required'),
})
type RoleForm = z.infer<typeof roleSchema>

function RbacPanel() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: fetchRoles,
  })

  const createMut = useMutation({
    mutationFn: (body: { name: string; permissions: string[] }) => createRole(body),
    onSuccess: () => {
      toast.success('Role created')
      qc.invalidateQueries({ queryKey: ['rbac-roles'] })
      setShowModal(false)
      reset()
    },
    onError: () => toast.error('Failed to create role'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast.success('Role deleted')
      qc.invalidateQueries({ queryKey: ['rbac-roles'] })
    },
    onError: () => toast.error('Cannot delete system role'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  })

  const onSubmit = (data: RoleForm) => {
    const permissions = data.permissions.split(',').map((p) => p.trim()).filter(Boolean)
    createMut.mutate({ name: data.name, permissions })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">RBAC Roles</h3>
        <Button size="sm" variant="ghost" onClick={() => setShowModal(true)}>
          <Plus size={14} className="mr-1" /> New Role
        </Button>
      </div>

      {isLoading && <Skeleton className="h-20 rounded-xl" />}

      {!isLoading && roles.length === 0 && (
        <p className="text-xs text-zinc-500">No custom roles defined — built-in roles apply.</p>
      )}

      {roles.map((role: RbacRole) => (
        <div key={role.id} className="flex items-start gap-3 border border-zinc-800 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100">{role.name}
              {role.is_system && (
                <span className="ml-2 text-[10px] uppercase tracking-wider bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                  system
                </span>
              )}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 break-all">{role.permissions.join(', ')}</p>
          </div>
          {!role.is_system && (
            <button
              className="text-zinc-600 hover:text-rose-400 transition-colors"
              onClick={() => deleteMut.mutate(role.id)}
              title="Delete role"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      <Modal open={showModal} onClose={() => { setShowModal(false); reset() }} title="New RBAC Role">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="field-label">Role Name</label>
            <Input {...register('name')} placeholder="e.g. analyst" className="mt-1" />
            {errors.name && <p className="err">{errors.name.message}</p>}
          </div>
          <div>
            <label className="field-label">Permissions (comma-separated)</label>
            <Input
              {...register('permissions')}
              placeholder="order:read, plan:read, audit:read"
              className="mt-1"
            />
            {errors.permissions && <p className="err">{errors.permissions.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setShowModal(false); reset() }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMut.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = ['Audit Log', 'Governance'] as const
type Tab = typeof TABS[number]

export default function AuditLogPage() {
  const [tab, setTab] = useState<Tab>('Audit Log')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({
    action: '', actor_email: '', resource_type: '', since: '',
  })

  const qc = useQueryClient()

  const queryFilters: AuditLogFilters = {
    page,
    limit: 50,
    ...(filters.action        ? { action:        filters.action }        : {}),
    ...(filters.actor_email   ? { actor_email:   filters.actor_email }   : {}),
    ...(filters.resource_type ? { resource_type: filters.resource_type } : {}),
    ...(filters.since         ? { since: new Date(filters.since).toISOString() } : {}),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', queryFilters],
    queryFn: () => fetchAuditLog(queryFilters),
    enabled: tab === 'Audit Log',
  })

  const exportMut = useMutation({
    mutationFn: requestDataExport,
    onSuccess: (res) => {
      toast.success(`Export queued — task ${res.task_id.slice(0, 8)}…`)
    },
    onError: () => toast.error('Export request failed'),
  })

  const handleFilterChange = (f: Filters) => {
    setFilters(f)
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.total / 50) : 1

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-indigo-400" />
            <div>
              <h1 className="text-xl font-bold text-zinc-100">Governance & Audit</h1>
              <p className="text-xs text-zinc-500">Immutable action log · RBAC · Retention · GDPR export</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'Audit Log' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => qc.invalidateQueries({ queryKey: ['audit-log'] })}
              >
                <RefreshCw size={14} className="mr-1" /> Refresh
              </Button>
            )}
            {tab === 'Governance' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => exportMut.mutate()}
                disabled={exportMut.isPending}
              >
                <Download size={14} className="mr-1" />
                {exportMut.isPending ? 'Queuing…' : 'Export Data'}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              {t}
              {t === 'Audit Log' && data && (
                <span className="ml-2 text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
                  {data.total.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Audit Log tab ── */}
        {tab === 'Audit Log' && (
          <div className="space-y-4">
            <FilterBar filters={filters} onChange={handleFilterChange} />

            {/* Column headers */}
            <div className="hidden md:flex items-center gap-3 px-4 text-[10px] uppercase tracking-widest text-zinc-600">
              <span className="w-3.5" />
              <span className="w-48">Action</span>
              <span className="w-32">Resource</span>
              <span className="flex-1">Actor</span>
              <span>Time</span>
            </div>

            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            )}

            {!isLoading && data?.items.length === 0 && (
              <EmptyState
                title="No audit entries"
                subtitle="Actions taken by dispatchers, drivers, and AI will appear here."
              />
            )}

            {!isLoading && data && data.items.length > 0 && (
              <div className="space-y-1">
                {data.items.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.total > 50 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-zinc-500">
                  Page {page} of {totalPages} · {data.total.toLocaleString()} total
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Governance tab ── */}
        {tab === 'Governance' && (
          <div className="grid md:grid-cols-2 gap-6">
            <RetentionPanel />
            <RbacPanel />
          </div>
        )}
      </div>
    </AppShell>
  )
}
