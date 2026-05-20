import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useQuery, useQueryClient }          from '@tanstack/react-query'
import { MapPin, Route, Layers, Wifi, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MapContainer, TileLayer, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AppShell }        from '../components/layout/AppShell'
import FleetMap            from '../components/map/FleetMap'
import StopMarker          from '../components/map/StopMarker'
import RoutePolyline       from '../components/map/RoutePolyline'
import { fetchLivePositions } from '../api/tracking'
import type { LivePosition }  from '../api/tracking'
import { fetchOrders }     from '../api/orders'
import { QUERY_KEYS }      from '../lib/utils/constants'
import { usePlanStore }    from '../store/plan.store'
import { useFleetEvents }  from '../hooks/useFleetEvents'
import { useMockData }     from '../mock/config'
import { MOCK_DRIVER_FEED, MOCK_GPS_SEED } from '../mock/data'
import type { DriverFeedItem, DriverStatus } from '../mock/data'
import type { Order }      from '../types'
import { useUiStore }      from '../store'

// Depot centre (Bangalore MG Road area)
const DEPOT: [number, number] = [12.9716, 77.5946]

const STATUS_COLOR: Record<DriverStatus, string> = {
  onRoute:  '#34d399',
  atRisk:   '#f87171',
  onBreak:  '#f59e0b',
  idle:     '#94a3b8',
  offDuty:  '#475569',
}

const STATUS_LABEL: Record<DriverStatus, string> = {
  onRoute:  'On Route',
  atRisk:   'At Risk',
  onBreak:  'On Break',
  idle:     'Idle',
  offDuty:  'Off Duty',
}


const ROUTE_COLORS = [
  '#3b82f6', '#34d399', '#f59e0b', '#f87171',
  '#a78bfa', '#06b6d4', '#fb923c', '#4ade80',
]

type ViewMode = 'live' | 'plan'

function AutoFitPlan({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
  }, [points.length]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function MapResizer({ trigger }: { trigger: boolean }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(t)
  }, [trigger, map])
  return null
}

export default function LiveMap() {
  const isMock  = useMockData()
  const theme   = useUiStore((s) => s.theme)
  const isDark  = theme === 'dark'
  const [view, setView]               = useState<ViewMode>('live')
  const [demoPos, setDemoPos]         = useState<LivePosition[]>(MOCK_GPS_SEED)
  const [wsConnected, setWsConnected] = useState(false)
  const [showFeed, setShowFeed]       = useState(true)
  const demoRef                       = useRef<ReturnType<typeof setInterval> | null>(null)
  const { lastPlan, lastPlanDate }    = usePlanStore()
  const qc                            = useQueryClient()
  const navigate                      = useNavigate()

  const handleFleetEvent = useCallback((event: { type: string; payload: Record<string, unknown> }) => {
    if (event.type === 'location_update') {
      setWsConnected(true)
      const p = event.payload as { driver_id: string; driver_name: string; lat: number; lng: number; speed_kmh?: number }
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
    if (isMock) {
      setDemoPos(MOCK_GPS_SEED)
      demoRef.current = setInterval(() => {
        setDemoPos(prev => prev.map(p => ({
          ...p,
          latitude:    p.latitude  + (Math.random() - 0.5) * 0.004,
          longitude:   p.longitude + (Math.random() - 0.5) * 0.004,
          speed_kmh:   Math.round(8 + Math.random() * 45),
          recorded_at: new Date().toISOString(),
        })))
      }, 3000)
    } else {
      if (demoRef.current) { clearInterval(demoRef.current); demoRef.current = null }
    }
    return () => { if (demoRef.current) clearInterval(demoRef.current) }
  }, [isMock])

  const { data: positions = [], dataUpdatedAt } = useQuery({
    queryKey:        QUERY_KEYS.livePositions,
    queryFn:         fetchLivePositions,
    refetchInterval: 10_000,
    enabled:         view === 'live' && !isMock,
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

  const activePositions = isMock ? demoPos : (positions as LivePosition[])

  const lastUpdated = isMock
    ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : dataUpdatedAt
      ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—'

  const fleetStats = useMemo(() => {
    if (isMock) return {
      onRoute: MOCK_DRIVER_FEED.filter(d => d.status === 'onRoute' || d.status === 'atRisk').length,
      idle:    MOCK_DRIVER_FEED.filter(d => d.status === 'idle' || d.status === 'onBreak').length,
      offDuty: MOCK_DRIVER_FEED.filter(d => d.status === 'offDuty').length,
    }
    return {
      onRoute: activePositions.filter(p => (p.speed_kmh ?? 0) > 0).length,
      idle:    activePositions.filter(p => (p.speed_kmh ?? 0) === 0).length,
      offDuty: 0,
    }
  }, [isMock, activePositions])

  const driverFeedItems = useMemo((): DriverFeedItem[] => {
    if (isMock) return MOCK_DRIVER_FEED
    return activePositions.map((p, i) => ({
      driver_id:   p.driver_id,
      driver_name: p.driver_name,
      display_id:  `D-${String(i + 1).padStart(3, '0')}`,
      area:        `${p.latitude.toFixed(3)}, ${p.longitude.toFixed(3)}`,
      status:      (p.speed_kmh ?? 0) > 0 ? 'onRoute' : 'idle',
      stops:       0,
      eta:         '—',
      util:        0,
      color:       ROUTE_COLORS[i % ROUTE_COLORS.length]!,
    }))
  }, [isMock, activePositions])

  const colorMap = useMemo(
    () => Object.fromEntries(driverFeedItems.map(d => [d.driver_id, STATUS_COLOR[d.status]])),
    [driverFeedItems],
  )

  return (
    <AppShell>
      <div className="flex flex-col h-full p-6 gap-4" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
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

          {/* Status badges */}
          {view === 'live' ? (
            <>
              {isMock ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                  style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--c-orange)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--c-orange)' }} />
                  DEMO · Simulated GPS
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: wsConnected ? 'var(--c-green)' : 'var(--c-muted)' }}>
                  <Wifi size={12} />
                  <span>{wsConnected ? 'Live' : 'Polling'}</span>
                </div>
              )}
              <p className="text-xs text-[var(--c-muted)]">
                {isMock ? 'Simulating · updates 3s ·' : 'Refreshes 10s ·'} {lastUpdated}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Layers size={13} style={{ color: 'var(--c-accent)', flexShrink: 0 }} />
              <p className="text-sm font-semibold text-[var(--c-text)]">
                {lastPlan
                  ? `${routes.length} route${routes.length !== 1 ? 's' : ''} · ${lastPlan.assigned_orders} stops · ${lastPlanDate}`
                  : 'No plan loaded — generate one on Planning page'}
              </p>
            </div>
          )}

          {/* Feed toggle */}
          <div className="ml-auto">
            <button
              onClick={() => setShowFeed((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: showFeed ? 'var(--c-elevated)' : 'transparent',
                border:     '1px solid var(--c-border)',
                color:      showFeed ? 'var(--c-text)' : 'var(--c-muted)',
              }}
            >
              <Users size={12} />
              Feed
            </button>
          </div>
        </div>

        {/* ── Map + Driver Feed ───────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex gap-3" style={{ minHeight: 0 }}>

          {/* Map wrapper */}
          <div
            className="flex-1 min-h-0 rounded-2xl overflow-hidden relative"
            style={{ border: '1px solid var(--c-border)' }}
          >
            {view === 'live' ? (
              <>
                {/* Fleet map with dashed depot→driver route lines */}
                <FleetMap positions={activePositions} colorMap={colorMap}>
                  <MapResizer trigger={showFeed} />
                  {activePositions.map((p) => {
                    const feedItem = MOCK_DRIVER_FEED.find(d => d.driver_id === p.driver_id)
                    const color    = feedItem?.color ?? '#3b82f6'
                    return (
                      <Polyline
                        key={`depot-${p.driver_id}`}
                        positions={[DEPOT, [p.latitude, p.longitude]]}
                        pathOptions={{ color, weight: 1.5, dashArray: '6 6', opacity: 0.55 }}
                      />
                    )
                  })}
                </FleetMap>

                {/* Fleet stats overlay — top left, see-through glass */}
                <div className="absolute top-4 left-4 pointer-events-none" style={{ zIndex: 900 }}>
                  <div
                    className="rounded-2xl p-4 flex flex-col gap-3 pointer-events-auto"
                    style={{
                      background:     isDark ? 'rgba(10,11,20,0.50)' : 'rgba(255,255,255,0.55)',
                      border:         isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.10)',
                      backdropFilter: 'blur(16px) saturate(1.4)',
                      WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
                      boxShadow:      isDark ? '0 8px 32px rgba(0,0,0,0.30)' : '0 8px 24px rgba(0,0,0,0.10)',
                      minWidth:       200,
                    }}
                  >
                    {/* Header */}
                    <p className="text-[10px] font-bold tracking-widest uppercase"
                      style={{ color: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)' }}>
                      Live Fleet
                    </p>

                    {/* Flat list */}
                    <div className="flex flex-col gap-2">
                      {([
                        { label: 'On route',         value: fleetStats.onRoute },
                        { label: 'Idle / available', value: fleetStats.idle    },
                        { label: 'Off duty',         value: fleetStats.offDuty },
                      ] as const).map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-6">
                          <span className="text-[13px]"
                            style={{ color: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.68)' }}>
                            {label}
                          </span>
                          <span className="text-[13px] font-bold tabular-nums"
                            style={{ color: isDark ? '#fff' : '#0f0f18' }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Optimize live — solid purple + 8-spoke AI icon */}
                    <button
                      onClick={() => navigate('/planning')}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-opacity hover:opacity-90"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                        color:      '#fff',
                        boxShadow:  '0 4px 14px rgba(124,58,237,0.40)',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/>
                      </svg>
                      Optimize live
                    </button>
                  </div>
                </div>

                {/* Map legend — bottom center */}
                <div
                  className="absolute bottom-4 pointer-events-none"
                  style={{ zIndex: 900, left: '50%', transform: 'translateX(-50%)' }}
                >
                  <div
                    className="flex items-center gap-4 px-4 py-2 rounded-xl pointer-events-auto whitespace-nowrap"
                    style={{
                      background:     isDark ? 'rgba(10,11,20,0.76)' : 'rgba(255,255,255,0.82)',
                      border:         isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.10)',
                      backdropFilter: 'blur(14px) saturate(1.3)',
                      WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
                      boxShadow:      isDark ? '0 4px 16px rgba(0,0,0,0.32)' : '0 4px 12px rgba(0,0,0,0.10)',
                    }}
                  >
                    {[
                      { color: '#34d399', label: 'On Route' },
                      { color: '#f87171', label: 'At Risk'  },
                      { color: '#f59e0b', label: 'On Break' },
                      { color: '#94a3b8', label: 'Idle'     },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-[10px] font-medium"
                          style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Plan view */
              <MapContainer center={[12.9716, 77.5946]} zoom={12} className="w-full h-full">
                <TileLayer
                  key={isDark ? 'dark' : 'light'}
                  url={isDark
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                  }
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapResizer trigger={showFeed} />
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
              </MapContainer>
            )}
          </div>

          {/* ── Driver Feed Panel ──────────────────────────────────────────── */}
          {showFeed && (
            <div
              className="w-[272px] shrink-0 rounded-2xl flex flex-col overflow-hidden"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
            >
              {/* Header */}
              <div
                className="px-4 py-3.5 flex items-center gap-3"
                style={{ borderBottom: '1px solid var(--c-border)' }}
              >
                <p className="text-[13px] font-bold text-[var(--c-text)] flex-1">Driver Feed</p>
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }} />
                  <span className="text-[9px] font-bold tracking-widest" style={{ color: '#34d399' }}>LIVE</span>
                </div>
              </div>

              {/* Driver list */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                {view === 'live' ? (
                  driverFeedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                      <MapPin size={24} style={{ color: 'var(--c-subtle)' }} />
                      <p className="text-xs text-[var(--c-muted)] text-center">No active drivers.<br />Waiting for GPS pings…</p>
                    </div>
                  ) : driverFeedItems.map((driver) => (
                    <div
                      key={driver.driver_id}
                      className="p-3 rounded-xl cursor-default transition-colors"
                      style={{ background: 'var(--c-elevated)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--c-accent-dim)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--c-elevated)' }}
                    >
                      {/* Row 1: status dot + name + D-00X chip */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0${driver.status === 'atRisk' ? ' animate-pulse' : ''}`}
                          style={{ background: STATUS_COLOR[driver.status] }}
                        />
                        <p className="text-[12px] font-semibold text-[var(--c-text)] flex-1 truncate leading-tight">
                          {driver.driver_name}
                        </p>
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{
                            background: `${driver.color}22`,
                            color:       driver.color,
                            border:      `1px solid ${driver.color}44`,
                          }}
                        >
                          {driver.display_id}
                        </span>
                      </div>

                      {/* Row 2: area + status badge */}
                      <div className="flex items-center gap-2 mt-1 ml-4">
                        <p className="text-[10px] truncate flex-1" style={{ color: 'var(--c-muted)' }}>
                          {driver.area}
                        </p>
                        {(driver.status === 'atRisk' || driver.status === 'onBreak') && (
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              background: `${STATUS_COLOR[driver.status]}1f`,
                              color:       STATUS_COLOR[driver.status],
                            }}
                          >
                            {STATUS_LABEL[driver.status]}
                          </span>
                        )}
                      </div>

                      {/* Row 3: stops / eta / util */}
                      <div className="flex items-center gap-3 mt-2 ml-4">
                        <div className="flex flex-col items-center min-w-0">
                          <span className="text-[11px] font-bold text-[var(--c-text)]">
                            {driver.stops > 0 ? driver.stops : '—'}
                          </span>
                          <span className="text-[8.5px]" style={{ color: 'var(--c-subtle)' }}>Stops</span>
                        </div>
                        <div className="w-px h-5 shrink-0" style={{ background: 'var(--c-border)' }} />
                        <div className="flex flex-col items-center min-w-0">
                          <span className="text-[11px] font-bold text-[var(--c-text)]">{driver.eta}</span>
                          <span className="text-[8.5px]" style={{ color: 'var(--c-subtle)' }}>ETA</span>
                        </div>
                        <div className="w-px h-5 shrink-0" style={{ background: 'var(--c-border)' }} />
                        <div className="flex flex-col items-center min-w-0">
                          <span className="text-[11px] font-bold text-[var(--c-text)]">
                            {driver.util > 0 ? `${driver.util}%` : '—'}
                          </span>
                          <span className="text-[8.5px]" style={{ color: 'var(--c-subtle)' }}>Util</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Plan view: show route summary */
                  routes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                      <Route size={24} style={{ color: 'var(--c-subtle)' }} />
                      <p className="text-xs text-[var(--c-muted)] text-center">
                        No plan loaded.<br />Generate one on Planning page.
                      </p>
                    </div>
                  ) : routes.map((route, i) => (
                    <div
                      key={route.driverName}
                      className="p-3 rounded-xl cursor-default"
                      style={{ background: 'var(--c-elevated)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: route.color }} />
                        <p className="text-[11.5px] font-semibold text-[var(--c-text)] flex-1 truncate">
                          {route.driverName}
                        </p>
                        <span className="text-[9px] font-mono shrink-0" style={{ color: 'var(--c-muted)' }}>
                          R-{String(i + 1).padStart(3, '0')}
                        </span>
                      </div>
                      <p className="text-[10px] mt-1 ml-4" style={{ color: 'var(--c-muted)' }}>
                        {route.stops.length} stop{route.stops.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--c-border)' }}>
                <p className="text-[10px] text-center" style={{ color: 'var(--c-subtle)' }}>
                  {isMock ? 'Simulated GPS · updates 3s' : 'Live · updates 10s'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
