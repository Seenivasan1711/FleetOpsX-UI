import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Edit2, Plus, Shield, Trash2, XCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button }      from '../components/ui/Button'
import { Input }       from '../components/ui/Input'
import { Modal }       from '../components/ui/Modal'
import { useAuthStore } from '../store/auth.store'
import {
  listAiProviders, createAiProvider, updateAiProvider, deleteAiProvider,
  type AiProviderOut, type AiProviderIn,
} from '../api/aiProviders'

const PROVIDER_PRESETS = ['claude', 'openai', 'gemini', 'mistral', 'cohere', 'groq', 'together']
const TASK_TYPES = ['planning', 'chat', 'analysis', 'all']

const MODEL_SUGGESTIONS: Record<string, string[]> = {
  claude:   ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai:   ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  gemini:   ['gemini-2.0-flash', 'gemini-1.5-pro'],
  mistral:  ['mistral-large-latest', 'mistral-small-latest'],
  cohere:   ['command-r-plus', 'command-r'],
  groq:     ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  together: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
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
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { clearAuth } = useAuthStore()

  const [modalOpen,       setModalOpen]       = useState(false)
  const [editingId,       setEditingId]       = useState<string | null>(null)
  const [form,            setForm]            = useState<FormState>(defaultForm())
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] flex flex-col">
      {/* Top bar — matches TenantSelector */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center font-bold text-sm">F</div>
          <span className="font-semibold text-lg">FleetOpsX</span>
          <span className="text-xs text-[#6b7280] bg-[#141414] border border-[#2a2a2a] px-2 py-0.5 rounded-full">
            Platform Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { clearAuth(); navigate('/login') }}
            className="text-sm text-[#6b7280] hover:text-[#f0f0f0] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-8 py-10 space-y-6">
        {/* Back link — prominent, above heading */}
        <button
          onClick={() => navigate('/select-tenant')}
          className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#a78bfa] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Platform Home
        </button>

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-[#f0f0f0]">
              <Zap className="w-5 h-5 text-[#7c3aed]" />
              AI Provider Management
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Platform defaults — applies to all tenants without their own configuration
            </p>
          </div>
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Provider
          </button>
        </div>

        {/* Provider table */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-[#6b7280] text-sm">Loading providers…</div>
          ) : providers.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280]">No AI providers configured yet.</p>
              <p className="text-xs text-[#6b7280] mt-1">Add one to enable AI-powered planning and chat.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-xs text-[#6b7280] uppercase tracking-wider">
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
                  <tr key={p.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#1c1c1c] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold capitalize ${PROVIDER_COLORS[p.provider_name] ?? 'text-[#f0f0f0]'}`}>
                        {p.provider_name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs font-mono text-[#f0f0f0] bg-[#1c1c1c] border border-[#2a2a2a] px-2 py-0.5 rounded-md">
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
                        <span className="flex items-center gap-1.5 text-[#10b981] text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Set
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-xs">
                          <XCircle className="w-3.5 h-3.5" /> Missing
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.is_platform_default ? (
                        <span className="text-xs font-semibold text-[#a78bfa] bg-[#7c3aed]/10 border border-[#7c3aed]/30 px-2 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      ) : (
                        <button
                          onClick={() => setDefaultMutation.mutate({ id: p.id })}
                          className="text-xs text-[#6b7280] hover:text-[#a78bfa] transition-colors"
                        >
                          Set default
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`w-2 h-2 rounded-full inline-block ${p.is_active ? 'bg-[#10b981]' : 'bg-red-500'}`} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpen(p)}
                          className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#f0f0f0] hover:bg-[#2a2a2a] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
      </main>

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={handleClose} title={editingId ? 'Edit AI Provider' : 'Add AI Provider'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Provider</label>
              <input
                list="provider-presets"
                value={form.provider_name}
                onChange={(e) => setForm(f => ({ ...f, provider_name: e.target.value.toLowerCase(), model_id: '' }))}
                placeholder="claude, openai, gemini…"
                className="w-full h-9 px-3 rounded-[10px] text-sm bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] focus:border-[var(--c-accent)] outline-none"
              />
              <datalist id="provider-presets">
                {PROVIDER_PRESETS.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Task Type</label>
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
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Model ID</label>
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
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              API Key {editingId && <span className="text-[#6b7280] font-normal normal-case">(leave blank to keep existing)</span>}
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
    </div>
  )
}
