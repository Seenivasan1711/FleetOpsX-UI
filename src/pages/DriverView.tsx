import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchMyStops, updateStopStatus } from '../api/driver'
import { pingLocation } from '../api/tracking'
import { useAuthStore } from '../store/auth.store'

const GEO_PING_MS = 30_000

export default function DriverView() {
  const { user, clearAuth } = useAuthStore()
  const qc    = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  // GPS auto-ping every 30 s
  useEffect(() => {
    if (!navigator.geolocation) return

    const sendPing = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pingLocation({
            latitude:   pos.coords.latitude,
            longitude:  pos.coords.longitude,
            accuracy_m: pos.coords.accuracy ?? undefined,
          }).catch(() => {/* silent */})
        },
        () => {/* permission denied — ignore */},
        { timeout: 5000 },
      )
    }

    sendPing()
    const interval = setInterval(sendPing, GEO_PING_MS)
    return () => clearInterval(interval)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['my-stops', today],
    queryFn:  () => fetchMyStops(today),
  })

  const statusMutation = useMutation({
    mutationFn: ({ stop_id, status }: { stop_id: string; status: string }) =>
      updateStopStatus(stop_id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-stops'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--c-bg)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--c-accent)' }}
        />
      </div>
    )
  }

  const stops      = (data as { stops?: unknown[] })?.stops ?? []
  const driverName = (data as { driver?: { name?: string } })?.driver?.name ?? user?.full_name ?? 'Driver'
  const delivered  = (stops as { status: string }[]).filter((s) => s.status === 'DELIVERED').length
  const progress   = stops.length ? Math.round((delivered / stops.length) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}>

      {/* Header */}
      <div
        className="px-4 py-4 flex justify-between items-center sticky top-0 z-10"
        style={{ background: 'var(--c-accent)', color: '#fff' }}
      >
        <div>
          <p className="font-bold text-lg">{driverName}</p>
          <p className="text-white/70 text-sm">{today} · {delivered}/{stops.length} completed</p>
        </div>
        <button
          onClick={() => { clearAuth(); window.location.href = '/login' }}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: 'var(--c-elevated)' }}
      >
        <div
          className="h-1.5 transition-all duration-500"
          style={{ width: `${progress}%`, background: 'var(--c-green)' }}
        />
      </div>

      {/* Stops */}
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {stops.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-bold text-[var(--c-text)]">No stops for today</p>
            <p className="text-sm text-[var(--c-muted)] mt-1">
              Check back after the dispatcher generates a plan.
            </p>
          </div>
        ) : (
          (stops as { stop_id: string; status: string; delivery_address: string; time_window_start?: string; time_window_end?: string; priority?: string }[])
            .map((stop, idx) => (
              <StopCard
                key={stop.stop_id}
                stop={stop}
                index={idx + 1}
                onStatusChange={(status) => statusMutation.mutate({ stop_id: stop.stop_id, status })}
                isUpdating={statusMutation.isPending}
              />
            ))
        )}
      </div>
    </div>
  )
}

// ─── Stop card ─────────────────────────────────────────────────────────────────

type StopProps = {
  stop: {
    status:            string
    delivery_address:  string
    time_window_start?: string
    time_window_end?:   string
    priority?:          string
  }
  index:          number
  onStatusChange: (status: string) => void
  isUpdating:     boolean
}

const statusBorders: Record<string, string> = {
  PENDING:   'var(--c-border)',
  ARRIVED:   'var(--c-accent)',
  DELIVERED: 'var(--c-green)',
  FAILED:    'var(--c-red)',
  SKIPPED:   'var(--c-orange)',
}

function StopCard({ stop, index, onStatusChange, isUpdating }: StopProps) {
  const [expanded, setExpanded] = useState(stop.status === 'PENDING' || stop.status === 'ARRIVED')

  const isDone = ['DELIVERED', 'FAILED', 'SKIPPED'].includes(stop.status)

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background:  'var(--c-surface)',
        border:      `1.5px solid ${statusBorders[stop.status] ?? statusBorders.PENDING}`,
        opacity:     isDone ? 0.7 : 1,
      }}
    >
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3">
          <span
            className="w-7 h-7 rounded-full text-sm flex items-center justify-center font-bold shrink-0 text-white"
            style={{ background: 'var(--c-accent)' }}
          >
            {index}
          </span>
          <div>
            <p className="font-medium text-[var(--c-text)] text-sm leading-tight">
              {stop.delivery_address}
            </p>
            {stop.time_window_start && (
              <p className="text-xs text-[var(--c-muted)] flex items-center gap-1 mt-0.5">
                <Clock size={11} />
                {stop.time_window_start} – {stop.time_window_end}
              </p>
            )}
            {stop.priority && stop.priority !== 'NORMAL' && (
              <span
                className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded mt-1 inline-block"
                style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--c-orange)' }}
              >
                {stop.priority}
              </span>
            )}
          </div>
        </div>
        <StatusIcon status={stop.status} />
      </div>

      {expanded && !isDone && (
        <div className="flex gap-2 mt-4">
          {stop.status === 'PENDING' && (
            <button
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--c-accent)', color: '#fff' }}
              onClick={() => onStatusChange('ARRIVED')}
              disabled={isUpdating}
            >
              Arrived
            </button>
          )}
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--c-green)', color: '#fff' }}
            onClick={() => onStatusChange('DELIVERED')}
            disabled={isUpdating}
          >
            Delivered ✓
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--c-red)', color: '#fff' }}
            onClick={() => onStatusChange('FAILED')}
            disabled={isUpdating}
          >
            Failed ✗
          </button>
        </div>
      )}

      {stop.status === 'DELIVERED' && (
        <p className="text-sm font-semibold mt-3 flex items-center gap-1.5" style={{ color: 'var(--c-green)' }}>
          <CheckCircle size={14} /> Delivered
        </p>
      )}
      {stop.status === 'FAILED' && (
        <p className="text-sm font-semibold mt-3 flex items-center gap-1.5" style={{ color: 'var(--c-red)' }}>
          <XCircle size={14} /> Marked as failed
        </p>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'DELIVERED') return <CheckCircle size={18} style={{ color: 'var(--c-green)', flexShrink: 0 }} />
  if (status === 'FAILED')    return <XCircle size={18}    style={{ color: 'var(--c-red)',   flexShrink: 0 }} />
  if (status === 'ARRIVED')   return <MapPin size={18}     style={{ color: 'var(--c-accent)', flexShrink: 0 }} />
  return <AlertCircle size={18} style={{ color: 'var(--c-muted)', flexShrink: 0 }} />
}
