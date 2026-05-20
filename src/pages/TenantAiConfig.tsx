import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Edit2, Info, Trash2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Modal }      from '../components/ui/Modal'
import { getTenantAiConfig, updateTenantAiConfig } from '../api/aiProviders'

const TASK_TYPES = ['planning', 'chat', 'analysis', 'all'] as const
type TaskType = typeof TASK_TYPES[number]

const TASK_META: Record<TaskType, { label: string; description: string }> = {
  planning: { label: 'Planning',     description: 'Route optimisation and dispatch planning' },
  chat:     { label: 'Chat AI',      description: 'Conversational AI assistant (Ask AI panel)' },
  analysis: { label: 'SLA Analysis', description: 'At-risk SLA detection and anomaly analysis' },
  all:      { label: 'All tasks',    description: 'Fallback for tasks not explicitly configured' },
}

const TASK_COLORS: Record<TaskType, string> = {
  planning: 'bg-[#7c3aed]/10 text-[#a78bfa] border-[#7c3aed]/30',
  chat:     'bg-[#10b981]/10 text-[#34d399] border-[#10b981]/30',
  analysis: 'bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/30',
  all:      'bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/30',
}

const PROVIDER_PRESETS = ['claude', 'openai', 'gemini', 'mistral', 'groq', 'cohere']
const MODEL_SUGGESTIONS: Record<string, string[]> = {
  claude:  ['claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5-20251001'],
  openai:  ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  gemini:  ['gemini-2.0-flash', 'gemini-1.5-pro'],
  mistral: ['mistral-large-latest', 'mistral-small-latest'],
  groq:    ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  cohere:  ['command-r-plus', 'command-r'],
}

const WARN_TASKS: TaskType[] = ['planning', 'analysis']

interface OverrideForm {
  provider_name: string
  model_id:      string
  api_key:       string
}

const emptyForm = (): OverrideForm => ({ provider_name: 'claude', model_id: '', api_key: '' })

export default function TenantAiConfig() {
  const qc = useQueryClient()
  const [overrideTask, setOverrideTask] = useState<TaskType | null>(null)
  const [form, setForm] = useState<OverrideForm>(emptyForm())

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-ai-config'],
    queryFn:  getTenantAiConfig,
  })

  const saveMutation = useMutation({
    mutationFn: (vars: { task_type: string } & Partial<OverrideForm>) =>
      updateTenantAiConfig(vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-ai-config'] })
      toast.success('AI configuration saved')
      setOverrideTask(null)
      setForm(emptyForm())
    },
    onError: () => toast.error('Failed to save configuration'),
  })

  const clearMutation = useMutation({
    mutationFn: (task_type: string) =>
      updateTenantAiConfig({ task_type, model_id: '', provider_name: '', api_key: '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-ai-config'] })
      toast.success('Override cleared — falling back to platform default')
    },
    onError: () => toast.error('Failed to clear override'),
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!overrideTask) return
    if (!form.model_id.trim()) { toast.error('Model ID is required'); return }
    saveMutation.mutate({ task_type: overrideTask, ...form })
  }

  const openOverride = (task: TaskType) => {
    setOverrideTask(task)
    const existing = data?.tenant_overrides[task]
    setForm({ provider_name: 'claude', model_id: existing ?? '', api_key: '' })
  }

  const suggestions = MODEL_SUGGESTIONS[form.provider_name] ?? []

  // Tasks that are missing an effective provider (no platform default AND no tenant override)
  const missingWarnings = WARN_TASKS.filter(t => {
    const effective = data?.tenant_overrides[t] ?? data?.platform_defaults[t]
    return !effective
  })

  return (
    <AppShell>
      <div className="p-6 md:p-8" style={{ animation: 'page-slide-in 0.22s ease' }}>
        <div className="mx-auto max-w-3xl flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[var(--c-text)] flex items-center gap-2">
                <Zap className="w-5 h-5 text-[var(--c-accent)]" />
                AI Configuration
              </h1>
              <p className="text-sm text-[var(--c-muted)] mt-1">
                Configure which AI provider handles each task for your workspace. Custom overrides take
                priority; unconfigured tasks fall back to the platform default.
              </p>
            </div>
          </div>

          {/* Missing-provider warnings */}
          {!isLoading && missingWarnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {missingWarnings.map(t => (
                <div
                  key={t}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                  <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                  <span style={{ color: 'var(--c-muted)' }}>
                    <strong style={{ color: 'var(--c-text)' }}>{TASK_META[t].label}</strong> has no AI provider
                    configured — {TASK_META[t].description.toLowerCase()} will be unavailable.{' '}
                    <button
                      onClick={() => openOverride(t)}
                      className="underline hover:no-underline"
                      style={{ color: 'var(--c-accent)' }}
                    >
                      Configure now
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Platform default notice */}
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <Info className="w-4 h-4 text-[var(--c-accent)] shrink-0 mt-0.5" />
            <span style={{ color: 'var(--c-muted)' }}>
              <strong style={{ color: 'var(--c-text)' }}>Platform defaults</strong> are read-only and set by your
              platform administrator. Add a workspace override to use your own provider or API key for a specific task.
            </span>
          </div>

          {/* Config table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            {/* Table header */}
            <div
              className="grid grid-cols-[160px_1fr_1fr_auto] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--c-muted)', borderBottom: '1px solid var(--c-border)' }}
            >
              <span>Task</span>
              <span>Platform default</span>
              <span>Your override</span>
              <span />
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--c-muted)' }}>
                Loading configuration…
              </div>
            ) : (
              TASK_TYPES.map((task, idx) => {
                const platformDefault = data?.platform_defaults[task]
                const tenantOverride  = data?.tenant_overrides[task]
                const ownKey          = data?.own_keys_configured.includes(task) ?? false
                const isLast          = idx === TASK_TYPES.length - 1

                return (
                  <div
                    key={task}
                    className="grid grid-cols-[160px_1fr_1fr_auto] gap-4 items-center px-5 py-4"
                    style={{ borderBottom: isLast ? 'none' : '1px solid var(--c-border)' }}
                  >
                    {/* Task badge + description */}
                    <div>
                      <span
                        className={`text-[10.5px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wide ${TASK_COLORS[task]}`}
                      >
                        {TASK_META[task].label}
                      </span>
                      <p className="text-[11px] mt-1.5 leading-tight" style={{ color: 'var(--c-muted)' }}>
                        {TASK_META[task].description}
                      </p>
                    </div>

                    {/* Platform default (read-only) */}
                    <div>
                      {platformDefault ? (
                        <code className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--c-elevated)', color: 'var(--c-text)' }}>
                          {platformDefault}
                        </code>
                      ) : (
                        <span className="text-xs italic" style={{ color: 'var(--c-muted)' }}>None</span>
                      )}
                    </div>

                    {/* Tenant override */}
                    <div className="flex flex-col gap-1">
                      {tenantOverride ? (
                        <>
                          <code className="text-xs font-mono px-2 py-0.5 rounded-md w-fit" style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)' }}>
                            {tenantOverride}
                          </code>
                          {ownKey && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--c-green)' }}>
                              <CheckCircle2 className="w-3 h-3" /> Own API key
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs italic" style={{ color: 'var(--c-muted)' }}>
                          Using platform default
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openOverride(task)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--c-muted)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-text)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-elevated)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        title="Set override"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {tenantOverride && (
                        <button
                          onClick={() => clearMutation.mutate(task)}
                          disabled={clearMutation.isPending}
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                          style={{ color: 'var(--c-muted)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-red)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--c-red-dim)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                          title="Clear override"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>

      {/* Override modal */}
      <Modal
        open={!!overrideTask}
        onClose={() => { setOverrideTask(null); setForm(emptyForm()) }}
        title={`Override — ${overrideTask ? TASK_META[overrideTask].label : ''}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-muted)' }}>
                Provider
              </label>
              <input
                list="tenant-provider-presets"
                value={form.provider_name}
                onChange={(e) => setForm(f => ({ ...f, provider_name: e.target.value.toLowerCase(), model_id: '' }))}
                placeholder="claude, openai…"
                className="w-full h-9 px-3 rounded-[10px] text-sm outline-none"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
              />
              <datalist id="tenant-provider-presets">
                {PROVIDER_PRESETS.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-muted)' }}>
                Model ID
              </label>
              <Input
                value={form.model_id}
                onChange={(e) => setForm(f => ({ ...f, model_id: e.target.value }))}
                placeholder="e.g. claude-sonnet-4-6"
                required
              />
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setForm(f => ({ ...f, model_id: s }))}
                  className="text-[10.5px] px-2 py-0.5 rounded-md font-mono transition-colors"
                  style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-accent)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--c-muted)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-muted)' }}>
              API Key <span className="font-normal normal-case">(optional — leave blank to use platform key)</span>
            </label>
            <Input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm(f => ({ ...f, api_key: e.target.value }))}
              placeholder="sk-ant-…"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={() => { setOverrideTask(null); setForm(emptyForm()) }}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Save override
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
