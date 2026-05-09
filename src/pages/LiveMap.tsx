import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useQuery, useQueryClient }          from '@tanstack/react-query'
import { MapPin, Route, Layers, PlayCircle, StopCircle, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AppShell }        from '../components/layout/AppShell'
import FleetMap            from '../components/map/FleetMap'
import StopMarker          from '../components/map/StopMarker'
import RoutePolyline       from '../components/map/RoutePolyline'
import MapLegend           from '../components/map/MapLegend'
import { fetchLivePositions } from '../api/tracking'
import type { LivePosition }  from '../api/tracking'
import { fetchOrders }     from '../api/orders'
import { QUERY_KEYS }      from '../lib/utils/constants'
import { usePlanStore }    from '../store/plan.store'
import { useFleetEvents }  from '../hooks/useFleetEvents'
import type { Order }      from '../types'

// Demo fleet: Bangalore area coords, each driver drifts slowly on simulate
const DEMO_SEED: LivePosition[] = [
  { driver_id: 'demo-1', driver_name: 'Ravi Kumar (demo)',   latitude: 12.9279, longitude: 77.6271, speed_kmh: 28, recorded_at: new Date().toISOString() },
  { driver_id: 'demo-2', driver_name: 'Arjun Singh (demo)',  latitude: 12.9716, longitude: 77.5946, speed_kmh: 15, recorded_at: new Date().toISOString() },
  { driver_id: 'demo-3', driver_name: 'Priya Nair (demo)',   latitude: 13.0012, longitude: 77.5930, speed_kmh: 33, recorded_at: new Date().toISOString() },
]

const ROUTE_COLORS = [
  '#3b82f6', '#34d399', '#f59e0b', '#f87171',
  '#a78bfa', '#06b6d4', '#fb923c', '#4ade80',
  '#e879f9', '#fbbf24', '#38bdf8', '#f472b6',
]

type ViewMode = 'live' | 'plan'

// Auto-pan map to fit all plan stop coordinates
function AutoFitPlan({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
  }, [points.length]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function LiveMap() {
  const [view, setView]          = useState<ViewMode>('live')
  const [demoMode, setDemoMode]  = useState(false)
  const [demoPos, setDemoPos]    = useState<LivePosition[]>(DEMO_SEED)
  const [wsConnected, setWsConnected] = useState(false)
  const demoRef                  = useRef<ReturnType<typeof setInterval> | null>(null)
  const { lastPlan, lastPlanDate } = usePlanStore()
  const qc = useQueryClient()

  // Real-time WebSocket events
  const handleFleetEvent = useCallback((event: { type: string; payload: Record<string, unknown> }) => {
    if (event.type === 'location_update') {
      setWsConnected(true)
      const p = event.payload as { driver_id: string; driver_name: string; lat: number; lng: number; speed_kmh?: number }
      // Optimistically update the position in React Query cache
      qc.setQueryData<LivePosition[]>(QUERY_KEYS.livePositions, (prev = []) => {
        const updated = prev.filter((x) => x.driver_id !== p.driver_id)
        return [...updated, {
          driver_id:   p.driver_id,
          driver_name: p.driver_name,
          latitude:    p.lat,
          longitude:   p.lng,
          speed_kmh:   p.speed_kmh ?? 0,
          recorded_at: new Date().toISOString(),
        }]
      })
    }
    if (event.type === 'order_at_risk') {
      toast.error(`SLA at risk: ${(event.payload as { order_id?: string }).order_id ?? 'order'}`, { id: 'ws-atrisk' })
    }
  }, [qc])

  useFleetEvents(handleFleetEvent)

  useEffect(() => {
    if (demoMode) {
      toast.success('Demo GPS active — 3 simulated drivers moving', { id: 'demo-gps' })
      demoRef.current = setInterval(() => {
        setDemoPos(prev => prev.map(p => ({
          ...p,
          latitude:    p.latitude  + (Math.random() - 0.5) * 0.003,
          longitude:   p.longitude + (Math.random() - 0.5) * 0.003,
          speed_kmh:   Math.round(10 + Math.random() * 40),
          recorded_at: new Date().toISOString(),
        })))
      }, 3000)
    } else {
      if (demoRef.current) { clearInterval(demoRef.current); demoRef.current = null }
      setDemoPos(DEMO_SEED)
      toast.dismiss('demo-gps')
    }
    return () => { if (demoRef.current) clearInterval(demoRef.current) }
  }, [demoMode])

  const { data: positions = [], dataUpdatedAt } = useQuery({
    queryKey:        QUERY_KEYS.livePositions,
    queryFn:         fetchLivePositions,
    refetchInterval: 10_000,
    enabled:         view === 'live',
  })

  const { data: planOrders = [] } = useQuery({
    queryKey: QUERY_KEYS.orders(lastPlanDate ?? ''),
    queryFn:  () => fetchOrders({ plan_date: lastPlanDate! }),
    enabled:  view === 'plan' && !!lastPlanDate,
  })

  const routes = useMemo(() => {
    if (!lastPlan) return []
    const routeMap: Record<string, {
      driverName: string
      color:      string
      stops:      { lat: number; lng: number; seq: number; address: string }[]
    }> = {}
    let colorIdx = 0

    lastPlan.assignments.forEach((a) => {
      if (!routeMap[a.driver_id]) {
        routeMap[a.driver_id] = {
          driverName: a.driver_name,
          color:      ROUTE_COLORS[colorIdx++ % ROUTE_COLORS.length]!,
          stops:      [],
        }
      }
      const order = (planOrders as Order[]).find((o) => o.id === a.order_id)
      if (order?.delivery_latitude && order?.delivery_longitude) {
        routeMap[a.driver_id]!.stops.push({
          lat:     order.delivery_latitude,
          lng:     order.delivery_longitude,
          seq:     a.sequence,
          address: order.delivery_address,
        })
      }
    })

    return Object.values(routeMap).map((r) => ({
      ...r,
      stops: [...r.stops].sort((a, b) => a.seq - b.seq),
    }))
  }, [lastPlan, planOrders])

  const allPlanPoints = useMemo<[number, number][]>(
    () => routes.flatMap((r) => r.stops.map((s): [number, number] => [s.lat, s.lng])),
    [routes],
  )

  const activePositions = demoMode ? demoPos : (positions as LivePosition[])

  const lastUpdated = demoMode
    ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : dataUpdatedAt
      ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—'

  return (
    <AppShell>
      <div className="flex flex-col h-full p-6 gap-4" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Header row */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Live / Plan toggle */}
          <div
            className="flex gap-0.5 p-1 rounded-xl"
            style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
          >
            {(['live', 'plan'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: view === v ? 'var(--c-surface)' : 'transparent',
                  color:      view === v ? 'var(--c-text)'    : 'var(--c-muted)',
                  boxShadow:  view === v ? '0 1px 4px rgba(0,0,0,.18)' : 'none',
                }}
              >
                {v === 'live' ? <MapPin size={12} /> : <Route size={12} />}
                {v === 'live' ? 'Live Tracking' : 'Route Plan'}
              </button>
            ))}
          </div>

          {/* Status info */}
          {view === 'live' ? (
            <>
              {/* WebSocket indicator */}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: wsConnected ? 'var(--c-green)' : 'var(--c-muted)' }}>
                <Wifi size={12} />
                <span>{wsConnected ? 'Live' : 'Polling'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: activePositions.length > 0 ? 'var(--c-green)'  : 'var(--c-orange)',
                    boxShadow:  activePositions.length > 0 ? '0 0 6px var(--c-green)' : '0 0 6px var(--c-orange)',
                  }}
                />
                <p className="text-sm font-semibold text-[var(--c-text)]">
                  {activePositions.length} driver{activePositions.length !== 1 ? 's' : ''} active
                  {demoMode && <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--c-orange)' }}>DEMO</span>}
                </p>
              </div>
              <p className="text-xs text-[var(--c-muted)]">{demoMode ? 'Simulating · updates every 3s ·' : 'Refreshes every 10s ·'} last at {lastUpdated}</p>
              {activePositions.length === 0 && !demoMode && (
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--c-orange)' }}
                >
                  Waiting for GPS pings…
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setDemoMode(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: demoMode ? 'rgba(251,191,36,0.15)' : 'var(--c-elevated)',
                    color:      demoMode ? 'var(--c-orange)'        : 'var(--c-muted)',
                    border:     '1px solid var(--c-border)',
                  }}
                >
                  {demoMode ? <StopCircle size={12} /> : <PlayCircle size={12} />}
                  {demoMode ? 'Stop Demo' : 'Simulate GPS'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Layers size={13} style={{ color: 'var(--c-accent)', flexShrink: 0 }} />
                <p className="text-sm font-semibold text-[var(--c-text)]">
                  {lastPlan
                    ? `${routes.length} route${routes.length !== 1 ? 's' : ''} · ${lastPlan.assigned_orders} stops · ${lastPlanDate}`
                    : 'No plan loaded'}
                </p>
              </div>
              {!lastPlan && (
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full ml-auto"
                  style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--c-orange)' }}
                >
                  Generate a plan on the Planning page first
                </span>
              )}
            </>
          )}
        </div>

        {/* Map */}
        <div
          className="flex-1 min-h-0 rounded-2xl overflow-hidden relative"
          style={{ height: 'calc(100vh - 220px)', border: '1px solid var(--c-border)' }}
        >
          {view === 'live' ? (
            <FleetMap positions={activePositions} />
          ) : (
            <MapContainer center={[12.9716, 77.5946]} zoom={12} className="w-full h-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
              />
              {allPlanPoints.length > 0 && <AutoFitPlan points={allPlanPoints} />}
              {routes.map((route) => (
                <RoutePolyline
                  key={`poly-${route.driverName}`}
                  positions={route.stops.map((s) => [s.lat, s.lng])}
                  color={route.color}
                />
              ))}
              {routes.flatMap((route) =>
                route.stops.map((stop) => (
                  <StopMarker
                    key={`${route.driverName}-${stop.seq}`}
                    lat={stop.lat}
                    lng={stop.lng}
                    sequence={stop.seq}
                    driverName={route.driverName}
                    address={stop.address}
                    color={route.color}
                  />
                ))
              )}
              <MapLegend
                entries={routes.map((r) => ({
                  driverName: r.driverName,
                  color:      r.color,
                  stopCount:  r.stops.length,
                }))}
              />
            </MapContainer>
          )}
        </div>

        {/* Driver chips (live only) */}
        {view === 'live' && activePositions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activePositions.map((p) => (
              <div
                key={p.driver_id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
              >
                <MapPin size={12} style={{ color: 'var(--c-accent)', flexShrink: 0 }} />
                <span className="font-medium text-[var(--c-text)]">{p.driver_name}</span>
                <span className="text-xs font-mono text-[var(--c-muted)]">
                  {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
