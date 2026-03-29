import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMyStops, updateStopStatus } from '../api/driver'
import { pingLocation } from '../api/tracking'
import useAppStore from '../store/useAppStore'
import toast from 'react-hot-toast'
import { LogOut, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const GEO_PING_INTERVAL_MS = 30_000

export default function DriverView() {
  const { user, clearAuth } = useAppStore()
  const qc = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  // GPS auto-ping every 30 s
  useEffect(() => {
    if (!navigator.geolocation) return
    const sendPing = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pingLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy ?? undefined,
          }).catch(() => {/* silent — no toast spam */})
        },
        () => {/* permission denied or unavailable — ignore */},
        { timeout: 5000 },
      )
    }
    sendPing() // send immediately on mount
    const interval = setInterval(sendPing, GEO_PING_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['my-stops', today],
    queryFn: () => fetchMyStops(today),
  })

  const statusMutation = useMutation({
    mutationFn: ({ stop_id, status }: { stop_id: string; status: string }) =>
      updateStopStatus(stop_id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-stops'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update'),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-500">Loading your stops...</p>
      </div>
    )
  }

  const stops = data?.stops || []
  const driverName = data?.driver?.name || user?.full_name || 'Driver'
  const delivered = stops.filter((s: any) => s.status === 'DELIVERED').length

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <p className="font-bold text-lg">{driverName}</p>
          <p className="text-blue-200 text-sm">{today} · {delivered}/{stops.length} done</p>
        </div>
        <button
          onClick={() => { clearAuth(); window.location.href = '/login' }}
          className="p-2"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-blue-100 dark:bg-blue-900 h-2">
        <div
          className="bg-blue-500 h-2 transition-all"
          style={{ width: stops.length ? `${(delivered / stops.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Stops list */}
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {stops.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-medium">No stops for today</p>
            <p className="text-sm mt-1">Check back after the dispatcher generates a plan</p>
          </div>
        ) : (
          stops.map((stop: any, idx: number) => (
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

function StopCard({ stop, index, onStatusChange, isUpdating }: {
  stop: any
  index: number
  onStatusChange: (status: string) => void
  isUpdating: boolean
}) {
  const [expanded, setExpanded] = useState(stop.status === 'PENDING')

  const statusColors: Record<string, string> = {
    PENDING: 'bg-gray-100 border-gray-300',
    ARRIVED: 'bg-blue-50 border-blue-300',
    DELIVERED: 'bg-green-50 border-green-300',
    FAILED: 'bg-red-50 border-red-300',
    SKIPPED: 'bg-yellow-50 border-yellow-300',
  }

  return (
    <div className={`rounded-xl border-2 p-4 transition-colors ${statusColors[stop.status] || statusColors.PENDING}`}>
      <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold shrink-0">
            {index}
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">{stop.delivery_address}</p>
            {stop.time_window_start && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock size={11} /> {stop.time_window_start} – {stop.time_window_end}
              </p>
            )}
            {stop.priority && stop.priority !== 'NORMAL' && (
              <span className="text-xs text-orange-600 font-medium">{stop.priority}</span>
            )}
          </div>
        </div>
        <StatusIcon status={stop.status} />
      </div>

      {/* Actions */}
      {expanded && !['DELIVERED', 'FAILED', 'SKIPPED'].includes(stop.status) && (
        <div className="flex gap-2 mt-4">
          {stop.status === 'PENDING' && (
            <button
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
              onClick={() => onStatusChange('ARRIVED')}
              disabled={isUpdating}
            >
              Arrived
            </button>
          )}
          <button
            className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-50"
            onClick={() => onStatusChange('DELIVERED')}
            disabled={isUpdating}
          >
            Delivered ✓
          </button>
          <button
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
            onClick={() => onStatusChange('FAILED')}
            disabled={isUpdating}
          >
            Failed ✗
          </button>
        </div>
      )}

      {stop.status === 'DELIVERED' && (
        <p className="text-sm text-green-600 font-medium mt-3 flex items-center gap-1">
          <CheckCircle size={14} /> Delivered
        </p>
      )}
      {stop.status === 'FAILED' && (
        <p className="text-sm text-red-500 font-medium mt-3 flex items-center gap-1">
          <XCircle size={14} /> Marked as failed
        </p>
      )}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'DELIVERED') return <CheckCircle size={18} className="text-green-500 shrink-0" />
  if (status === 'FAILED') return <XCircle size={18} className="text-red-500 shrink-0" />
  if (status === 'ARRIVED') return <MapPin size={18} className="text-blue-500 shrink-0" />
  return <AlertCircle size={18} className="text-gray-400 shrink-0" />
}
