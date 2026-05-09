import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Edit2, Plus, Shield, Trash2, XCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }  from '../components/layout/AppShell'
import { Button }    from '../components/ui/Button'
import { Input }     from '../components/ui/Input'
import { Modal }     from '../components/ui/Modal'
import {
  listAiProviders, createAiProvider, updateAiProvider, deleteAiProvider,
  type AiProviderOut, type AiProviderIn,
} from '../api/aiProviders'

const PROVIDERS  = ['claude', 'openai', 'gemini']
const TASK_TYPES = ['planning', 'chat', 'analysis', 'all']

const MODEL_SUGGESTIONS: Record<string, string[]> = {
  claude: ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-pro'],
}

const PROVIDER_COLORS: Record<string, string> = {
  claude: 'text-[#f97316]',
  openai: 'text-[#10b981]',
  gemini: 'text-[#3b82f6]',
}

const TASK_COLORS: Record<string, string> = {
  planning: 'bg-[#7c3aed]/10 text-[#a78bfa] border-[#7c3aed]/30',
  chat:     'bg-[#10b981]/10 text-[#34d399] border-[#10b981]/30',
  analysis: 'bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/30',
  all:      'bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/30',
}

interface FormState {
  provider_name:       string
  model_id:            string
  api_key:             string
  task_type:           string
  is_active:           boolean
  is_platform_default: boolean
}

const defaultForm = (): FormState => ({
  provider_name:       'claude',
  model_id:            '',
  api_key:             '',
  task_type:           'planning',
  is_active:           true,
  is_platform_default: false,
})

export default function AiProviders() {
  const qc = useQueryClient()
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [form,        setForm]        = useState<FormState>(defaultForm())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['ai-providers'],
    queryFn:  listAiProviders,
  })

  const createMutation = useMutation({
    mutationFn: (data: AiProviderIn) => createAiProvider(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-providers'] }); toast.success('Provider added'); handleClose() },
    onError:   () => toast.error('Failed to add provider'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AiProviderIn> }) => updateAiProvider(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-providers'] }); toast.success('Provider updated'); handleClose() },
    onError:   () => toast.error('Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAiProvider(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-providers'] }); toast.success('Provider deleted'); setDeleteConfirmId(null) },
    onError:   () => toast.error('Failed to delete'),
  })

  const setDefaultMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => updateAiProvider(id, { is_platform_default: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-providers'] }); toast.success('Default updated') },
    onError:   () => toast.error('Failed to set default'),
  })

  const handleOpen = (p?: AiProviderOut) => {
    if (p) {
      setEditingId(p.id)
      setForm({ provider_name: p.provider_name, model_id: p.model_id, api_key: '', task_type: p.task_type, is_active: p.is_active, is_platform_default: p.is_platform_default })
    } else {
      setEditingId(null)
      setForm(defaultForm())
    }
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingId(null); setForm(defaultForm()) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: AiProviderIn = {
      provider_name:       form.provider_name,
      model_id:            form.model_id,
      task_type:           form.task_type,
      is_active:           form.is_active,
      is_platform_default: form.is_platform_default,
      ...(form.api_key ? { api_key: form.api_key } : {}),
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const suggestions = MODEL_SUGGESTIONS[form.provider_name] ?? []

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text)] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--c-accent)]" />
              AI Provider Management
            </h1>
            <p className="text-sm text-[var(--c-muted)] mt-1">
              Configure AI models for planning, chat, and analysis tasks
            </p>
          </div>
          <Button onClick={() => handleOpen()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Provider
          </Button>
        </div>

        {/* Provider table */}
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-[var(--c-muted)] text-sm">Loading providers…</div>
          ) : providers.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-10 h-10 text-[var(--c-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--c-muted)]">No AI providers configured yet.</p>
              <p className="text-xs text-[var(--c-muted)] mt-1">Add one to enable AI-powered planning and chat.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--c-border)] text-xs text-[var(--c-muted)] uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Provider</th>
                  <th className="text-left px-5 py-3 font-medium">Model ID</th>
                  <th className="text-left px-5 py-3 font-medium">Task</th>
                  <th className="text-left px-5 py-3 font-medium">API Key</th>
                  <th className="text-left px-5 py-3 font-medium">Default</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--c-border)] last:border-0 hover:bg-[var(--c-elevated)] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold capitalize ${PROVIDER_COLORS[p.provider_name] ?? 'text-[var(--c-text)]'}`}>
                        {p.provider_name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs font-mono text-[var(--c-text)] bg-[var(--c-elevated)] px-2 py-0.5 rounded-md">
                        {p.model_id}
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10.5px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wide ${TASK_COLORS[p.task_type] ?? ''}`}>
                        {p.task_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.key_set ? (
                        <span className="flex items-center gap-1.5 text-[var(--c-green)] text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Set
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[var(--c-red)] text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.is_platform_default ? (
                        <span className="text-xs font-semibold text-[var(--c-accent)] bg-[var(--c-accent-dim)] px-2 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      ) : (
                        <button
                          onClick={() => setDefaultMutation.mutate({ id: p.id })}
                          className="text-xs text-[var(--c-muted)] hover:text-[var(--c-accent)] transition-colors"
                        >
                          Set default
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`w-2 h-2 rounded-full inline-block ${p.is_active ? 'bg-[var(--c-green)]' : 'bg-[var(--c-red)]'}`} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpen(p)}
                          className="p-1.5 rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-elevated)] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg text-[var(--c-muted)] hover:text-[var(--c-red)] hover:bg-[var(--c-red-dim)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={handleClose} title={editingId ? 'Edit AI Provider' : 'Add AI Provider'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Provider</label>
              <select
                value={form.provider_name}
                onChange={(e) => setForm(f => ({ ...f, provider_name: e.target.value, model_id: '' }))}
                className="w-full h-9 px-3 rounded-[10px] text-sm bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] focus:border-[var(--c-accent)] outline-none"
              >
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Task Type</label>
              <select
                value={form.task_type}
                onChange={(e) => setForm(f => ({ ...f, task_type: e.target.value }))}
                className="w-full h-9 px-3 rounded-[10px] text-sm bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] focus:border-[var(--c-accent)] outline-none"
              >
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">Model ID</label>
            <Input
              value={form.model_id}
              onChange={(e) => setForm(f => ({ ...f, model_id: e.target.value }))}
              placeholder="e.g. claude-sonnet-4-6"
              required
            />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {suggestions.map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm(f => ({ ...f, model_id: s }))}
                    className="text-[10.5px] px-2 py-0.5 rounded-md bg-[var(--c-elevated)] border border-[var(--c-border)] text-[var(--c-muted)] hover:text-[var(--c-accent)] hover:border-[var(--c-accent)]/40 transition-colors font-mono"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--c-muted)]">
              API Key {editingId && <span className="text-[var(--c-muted)] font-normal normal-case">(leave blank to keep existing)</span>}
            </label>
            <Input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm(f => ({ ...f, api_key: e.target.value }))}
              placeholder="sk-ant-..."
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--c-text)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded accent-[var(--c-accent)]"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--c-text)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_platform_default}
                onChange={(e) => setForm(f => ({ ...f, is_platform_default: e.target.checked }))}
                className="w-4 h-4 rounded accent-[var(--c-accent)]"
              />
              Set as default for {form.task_type}
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Update Provider' : 'Add Provider'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Delete AI Provider">
        <p className="text-sm text-[var(--c-muted)] mb-6">
          Are you sure you want to delete this provider? This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            loading={deleteMutation.isPending}
            onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
