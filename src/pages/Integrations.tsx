import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Zap, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }     from '../components/layout/AppShell'
import { Button }       from '../components/ui/Button'
import { Input }        from '../components/ui/Input'
import { Modal }        from '../components/ui/Modal'
import { Skeleton }     from '../components/ui/Skeleton'
import { EmptyState }   from '../components/ui/EmptyState'
import {
  fetchWebhooks, createWebhook, deleteWebhook, testWebhook,
  fetchIntegrationLogs,
} from '../api/integrations'
import type { WebhookRegistration, IntegrationLog } from '../api/integrations'

const ALL_EVENTS = [
  'order.delivered', 'order.failed', 'order.delayed',
  'route.updated', 'webhook.test',
]

const webhookSchema = z.object({
  url:    z.string().url('Must be a valid URL'),
  secret: z.string().optional(),
})
type WebhookForm = z.infer<typeof webhookSchema>

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'

export default function Integrations() {
  const qc = useQueryClient()
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.delivered'])

  const { data: webhooks = [], isLoading: wLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn:  fetchWebhooks,
  })

  const { data: logs = [], isLoading: lLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['integration-logs'],
    queryFn:  () => fetchIntegrationLogs(),
  })

  const createMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess:  () => {
      toast.success('Webhook registered')
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      setShowAddWebhook(false)
      reset()
      setSelectedEvents(['order.delivered'])
    },
    onError: () => toast.error('Failed to register webhook'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWebhook,
    onSuccess:  () => {
      toast.success('Webhook deactivated')
      qc.invalidateQueries({ queryKey: ['webhooks'] })
    },
    onError: () => toast.error('Failed to deactivate webhook'),
  })

  const testMutation = useMutation({
    mutationFn: testWebhook,
    onSuccess:  (res) => toast.success(res.message),
    onError:    () => toast.error('Test failed'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WebhookForm>({
    resolver: zodResolver(webhookSchema),
  })

  const onSubmit = (data: WebhookForm) => {
    if (!selectedEvents.length) {
      toast.error('Select at least one event type')
      return
    }
    const body: { url: string; event_types: string[]; secret?: string } = {
      url: data.url, event_types: selectedEvents,
    }
    if (data.secret) body.secret = data.secret
    createMutation.mutate(body)
  }

  const toggleEvent = (ev: string) =>
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    )

  return (
    <AppShell>
      <div className="p-6 space-y-6" style={{ animation: 'page-slide-in 0.22s ease' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text)]">Partner Integrations</h1>
            <p className="text-sm text-[var(--c-muted)] mt-0.5">
              Ingest orders from ERP/WMS/TMS · stream delivery events via webhooks
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAddWebhook(true)}>
            <Plus size={15} className="mr-1.5" /> Register Webhook
          </Button>
        </div>

        {/* Webhook registry */}
        <section>
          <h2 className="text-sm font-semibold text-[var(--c-text)] mb-3">Webhook Registry</h2>
          {wLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : webhooks.length === 0 ? (
            <EmptyState
              title="No webhooks registered"
              subtitle="Register a partner URL to receive real-time delivery events."
            />
          ) : (
            <div className="space-y-2">
              {webhooks.map((wh) => <WebhookRow key={wh.id} wh={wh}
                onDelete={() => deleteMutation.mutate(wh.id)}
                onTest={() => testMutation.mutate(wh.id)}
                testing={testMutation.isPending}
              />)}
            </div>
          )}
        </section>

        {/* Integration logs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--c-text)]">Integration Logs</h2>
            <button
              onClick={() => refetchLogs()}
              className="text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors"
              title="Refresh logs"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          {lLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : logs.length === 0 ? (
            <EmptyState
              title="No integration logs"
              subtitle="Ingest orders via POST /api/v1/integrations/ingest to see logs here."
            />
          ) : (
            <div
              className="rounded-xl border border-[var(--c-border)] overflow-hidden"
              style={{ background: 'var(--c-surface)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--c-border)]" style={{ background: 'var(--c-elevated)' }}>
                    {['Partner ID', 'Source', 'Status', 'Order ID', 'Time'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-muted)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => <LogRow key={log.id} log={log} i={i} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Add webhook modal */}
      <Modal
        open={showAddWebhook}
        onClose={() => { setShowAddWebhook(false); reset(); setSelectedEvents(['order.delivered']) }}
        title="Register Webhook"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
              Callback URL
            </label>
            <Input
              {...register('url')}
              placeholder="https://partner.example.com/fleet-events"
              className="mt-1"
            />
            {errors.url && <p className="text-red-400 text-xs mt-1">{errors.url.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
              Event Types
            </label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ALL_EVENTS.map((ev) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => toggleEvent(ev)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  style={{
                    background:   selectedEvents.includes(ev) ? 'var(--c-accent)' : 'var(--c-elevated)',
                    borderColor:  selectedEvents.includes(ev) ? 'var(--c-accent)' : 'var(--c-border)',
                    color:        selectedEvents.includes(ev) ? '#fff' : 'var(--c-muted)',
                  }}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--c-muted)] uppercase tracking-wide">
              HMAC Secret <span className="normal-case font-normal">(optional)</span>
            </label>
            <Input
              {...register('secret')}
              type="password"
              placeholder="Optional signing secret"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowAddWebhook(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Registering…' : 'Register'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}

function WebhookRow({
  wh, onDelete, onTest, testing,
}: {
  wh: WebhookRegistration
  onDelete: () => void
  onTest: () => void
  testing: boolean
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--c-border)] transition-colors hover:border-[var(--c-accent-dim)]"
      style={{ background: 'var(--c-surface)' }}
    >
      <div className="mt-0.5">
        {wh.is_active
          ? <CheckCircle2 size={16} className="text-green-400" />
          : <XCircle     size={16} className="text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--c-text)] truncate">{wh.url}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {wh.event_types.map((ev) => (
            <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: 'var(--c-elevated)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
              {ev}
            </span>
          ))}
        </div>
        {wh.last_error && (
          <p className="text-xs text-red-400 mt-1 truncate">{wh.last_error}</p>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <Button size="sm" variant="ghost" onClick={onTest} disabled={testing}>
          <Zap size={13} />
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete}>
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}

function LogRow({ log, i }: { log: IntegrationLog; i: number }) {
  return (
    <tr
      className="border-b border-[var(--c-border)] last:border-0 hover:bg-[var(--c-elevated)] transition-colors"
      style={{ background: i % 2 === 0 ? 'transparent' : 'var(--c-elevated-alt, transparent)' }}
    >
      <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--c-muted)]">{log.partner_order_id}</td>
      <td className="px-4 py-2.5 text-[var(--c-muted)] text-xs">{log.source_system}</td>
      <td className="px-4 py-2.5">
        {log.normalized ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
            Imported
          </span>
        ) : (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 cursor-default"
            title={log.error_message ?? ''}
          >
            Error
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--c-muted)]">
        {log.order_id ? log.order_id.slice(0, 8) + '…' : '—'}
      </td>
      <td className="px-4 py-2.5 text-[var(--c-muted)] text-xs">{fmt(log.created_at)}</td>
    </tr>
  )
}
