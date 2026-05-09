import { useParams } from 'react-router-dom'
import { useQuery }  from '@tanstack/react-query'
import { MapPin, Clock, CheckCircle, Truck, AlertTriangle, Package } from 'lucide-react'
import client from '../api/client'

// ─── API ─────────────────────────────────────────────────────────────────────

interface TrackingInfo {
  order_id:          string
  external_ref:      string | null
  delivery_address:  string
  status:            string
  driver_name:       string | null
  driver_lat:        number | null
  driver_lng:        number | null
  time_window_start: string | null
  time_window_end:   string | null
  eta_minutes:       number | null
}

const fetchTracking = (token: string): Promise<TrackingInfo> =>
  client.get(`/api/v1/public/track/${token}`).then(r => r.data)

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  PENDING: {
    label: 'Order Received',
    icon:  <Package size={22} />,
    color: '#6b7280',
    bg:    'rgba(107,114,128,0.12)',
  },
  ASSIGNED: {
    label: 'Driver Assigned',
    icon:  <Truck size={22} />,
    color: '#3b82f6',
    bg:    'rgba(59,130,246,0.12)',
  },
  IN_TRANSIT: {
    label: 'Out for Delivery',
    icon:  <Truck size={22} className="animate-pulse" />,
    color: '#f59e0b',
    bg:    'rgba(245,158,11,0.12)',
  },
  ARRIVED: {
    label: 'Driver Arrived',
    icon:  <MapPin size={22} />,
    color: '#10b981',
    bg:    'rgba(16,185,129,0.12)',
  },
  DELIVERED: {
    label: 'Delivered!',
    icon:  <CheckCircle size={22} />,
    color: '#10b981',
    bg:    'rgba(16,185,129,0.12)',
  },
  FAILED: {
    label: 'Delivery Attempted',
    icon:  <AlertTriangle size={22} />,
    color: '#ef4444',
    bg:    'rgba(239,68,68,0.12)',
  },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG['PENDING']!
}

// ─── Progress steps ──────────────────────────────────────────────────────────

const STEPS = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED']

function ProgressStepper({ status }: { status: string }) {
  const currentStep = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'].indexOf(status)
  const stepIndex   = Math.min(currentStep, STEPS.length - 1)

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done    = i <= stepIndex || status === 'DELIVERED'
        const current = i === stepIndex && status !== 'DELIVERED'
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: done    ? '#6d28d9' : 'rgba(255,255,255,0.08)',
                color:      done    ? '#fff'     : 'rgba(255,255,255,0.3)',
                boxShadow:  current ? '0 0 12px rgba(109,40,217,0.6)' : 'none',
              }}
            >
              {done && !current ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="h-0.5 flex-1 transition-all"
                style={{ background: i < stepIndex ? '#6d28d9' : 'rgba(255,255,255,0.1)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackOrder() {
  const { token } = useParams<{ token: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey:        ['track', token],
    queryFn:         () => fetchTracking(token!),
    refetchInterval: 30_000,
    enabled:         !!token,
  })

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 py-10 gap-6"
      style={{ background: '#0a0a0a', color: '#f0f0f0' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <Truck size={20} style={{ color: '#6d28d9' }} />
        <span className="text-lg font-bold" style={{ color: '#6d28d9' }}>FleetOpsX</span>
        <span className="text-sm text-[#6b7280]">· Track your order</span>
      </div>

      {isLoading && (
        <div className="w-full max-w-sm flex flex-col items-center gap-4 mt-12">
          <div className="w-10 h-10 rounded-full border-2 border-[#6d28d9] border-t-transparent animate-spin" />
          <p className="text-sm text-[#6b7280]">Looking up your order…</p>
        </div>
      )}

      {isError && (
        <div className="w-full max-w-sm mt-12 rounded-2xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
          <p className="font-semibold text-[#f0f0f0]">Tracking link not found</p>
          <p className="text-sm text-[#6b7280] mt-1">This link may be invalid or expired.</p>
        </div>
      )}

      {data && (() => {
        const cfg = getStatusConfig(data.status)
        return (
          <div className="w-full max-w-sm flex flex-col gap-4">

            {/* Status card */}
            <div
              className="rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
              style={{ background: '#141414', border: '1px solid #2a2a2a' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.icon}
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
                {data.external_ref && (
                  <p className="text-xs text-[#6b7280] mt-1 font-mono">Ref: {data.external_ref}</p>
                )}
              </div>
              <ProgressStepper status={data.status} />
            </div>

            {/* Delivery info */}
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="flex items-start gap-3">
                <MapPin size={16} style={{ color: '#6b7280', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p className="text-[11px] text-[#6b7280] uppercase tracking-wide">Delivery Address</p>
                  <p className="text-sm text-[#f0f0f0] mt-0.5 leading-relaxed">{data.delivery_address}</p>
                </div>
              </div>

              {data.time_window_start && (
                <div className="flex items-center gap-3">
                  <Clock size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <div>
                    <p className="text-[11px] text-[#6b7280] uppercase tracking-wide">Delivery Window</p>
                    <p className="text-sm text-[#f0f0f0] mt-0.5">{data.time_window_start} – {data.time_window_end}</p>
                  </div>
                </div>
              )}

              {data.driver_name && (
                <div className="flex items-center gap-3">
                  <Truck size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <div>
                    <p className="text-[11px] text-[#6b7280] uppercase tracking-wide">Driver</p>
                    <p className="text-sm text-[#f0f0f0] mt-0.5">{data.driver_name}</p>
                  </div>
                </div>
              )}

              {data.eta_minutes != null && data.status !== 'DELIVERED' && data.status !== 'FAILED' && (
                <div
                  className="rounded-xl px-4 py-3 flex items-center justify-between mt-1"
                  style={{ background: 'rgba(109,40,217,0.12)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#a78bfa' }}>Estimated arrival</span>
                  <span className="text-sm font-bold font-mono" style={{ color: '#a78bfa' }}>~{data.eta_minutes} min</span>
                </div>
              )}
            </div>

            <p className="text-center text-[11px] text-[#4b5563]">
              Auto-refreshes every 30 s · powered by FleetOpsX
            </p>
          </div>
        )
      })()}
    </div>
  )
}
