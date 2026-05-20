import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppShell }           from '../components/layout/AppShell'
import { LiveOpsTicker }      from '../components/features/dashboard/LiveOpsTicker'
import { OnboardingBanner }   from '../components/features/dashboard/OnboardingBanner'
import { StatCard }           from '../components/features/dashboard/StatCard'
import { RouteTimeline }      from '../components/features/dashboard/RouteTimeline'
import { AtRiskPanel }        from '../components/features/dashboard/AtRiskPanel'
import { FleetStatusCards }   from '../components/features/dashboard/FleetStatusCards'
import { QuickActions }       from '../components/features/dashboard/QuickActions'
import { Icon }               from '../components/ui/icons'
import { fetchKpis, fetchKpiTrend } from '../api/analytics'
import { fetchFleetAvailability }   from '../api/fleet'
import { fetchOrders }              from '../api/orders'
import { fetchDrivers }             from '../api/drivers'
import { QUERY_KEYS }               from '../lib/utils/constants'
import { useMockData }                        from '../mock/config'
import { MOCK_DASHBOARD }                     from '../mock/data'

const todayStr = new Date().toISOString().slice(0, 10)
const MOCK_STATS = MOCK_DASHBOARD.stats

export default function Dashboard() {
  const isMock = useMockData()
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const { data: kpis } = useQuery({
    queryKey: QUERY_KEYS.analyticsKpis,
    queryFn:  () => fetchKpis(),
    staleTime:       120_000,
    refetchInterval: 120_000,
    enabled:  !isMock,
  })

  const { data: fleet } = useQuery({
    queryKey: ['fleet-availability'],
    queryFn:  fetchFleetAvailability,
    staleTime:       60_000,
    refetchInterval: 60_000,
    enabled:  !isMock,
  })

  const { data: todayOrders = [] } = useQuery({
    queryKey: QUERY_KEYS.orders(todayStr),
    queryFn:  () => fetchOrders({ plan_date: todayStr }),
    staleTime:       60_000,
    refetchInterval: 60_000,
    enabled:  !isMock,
  })

  const { data: allDrivers = [] } = useQuery({
    queryKey: QUERY_KEYS.drivers,
    queryFn:  () => fetchDrivers(),
    staleTime:       60_000,
    refetchInterval: 60_000,
    enabled:  !isMock,
  })

  // 10-day KPI trend — powers on-time rate and active driver sparklines
  const { data: kpiTrend = [] } = useQuery({
    queryKey: ['kpi-trend', 10],
    queryFn:  () => fetchKpiTrend(10),
    staleTime:       300_000,
    refetchInterval: 300_000,
    enabled:  !isMock,
  })

  const unassignedCount = isMock ? 0 : todayOrders.filter((o) => o.status === 'PENDING').length
  const showBanner      = unassignedCount > 0 && !bannerDismissed

  const onTimeRate      = isMock ? MOCK_STATS.onTimeRate      : (kpis?.on_time_rate != null ? Math.round(kpis.on_time_rate * 100) : 0)
  const totalDeliveries = isMock ? MOCK_STATS.totalDeliveries : (kpis?.total_deliveries ?? 0)
  const driversAvail    = isMock ? MOCK_STATS.driversAvail    : (fleet?.drivers.available ?? 0)
  const driversTotal    = isMock ? MOCK_STATS.driversTotal    : (fleet?.drivers.total ?? 0)
  const atRiskSlas      = isMock ? MOCK_STATS.atRiskSlas      : todayOrders.filter((o) => (o.priority === 'CRITICAL' || o.priority === 'HIGH') && o.status === 'PENDING').length

  const { sparklines } = MOCK_DASHBOARD
  const rawSparkOrders = kpis?.deliveries_by_day?.slice(-10).map(d => d.total) ?? []
  const sparkOrders  = isMock
    ? sparklines.orders
    : rawSparkOrders.length >= 2
      ? rawSparkOrders
      : Array(9).fill(totalDeliveries).concat([totalDeliveries])
  const sparkOnTime  = isMock
    ? sparklines.onTime
    : kpiTrend.length >= 2
      ? kpiTrend.map(p => Math.round((p.on_time_pct ?? 0) * 100))
      : [...sparklines.onTime.slice(0, 9), onTimeRate || 95]
  const sparkAtRisk  = isMock ? sparklines.atRisk : Array(10).fill(atRiskSlas)
  const sparkDrivers = isMock
    ? sparklines.drivers
    : kpiTrend.length >= 2
      ? kpiTrend.map(p => p.active_drivers)
      : [...sparklines.drivers.slice(0, 9), driversAvail || 13]

  // Trend labels — demo: static strings; live: derived from API data if available
  const deliveriesByDay = kpis?.deliveries_by_day
  const ordersDelta = deliveriesByDay && deliveriesByDay.length >= 2
    ? totalDeliveries - deliveriesByDay[deliveriesByDay.length - 2]!.total
    : null
  const ordersTrend = isMock
    ? { up: true, val: '+21', label: 'vs yesterday' }
    : (ordersDelta != null && ordersDelta !== 0)
      ? { up: ordersDelta > 0, val: `${ordersDelta > 0 ? '+' : ''}${ordersDelta}`, label: 'vs yesterday' }
      : undefined

  const onTimePrev  = kpiTrend.length >= 2 ? Math.round((kpiTrend[kpiTrend.length - 2]!.on_time_pct ?? 0) * 100) : null
  const onTimeDelta = onTimePrev != null ? onTimeRate - onTimePrev : null
  const onTimeTrend = isMock
    ? { up: true, val: '+2.5pp', label: 'this week' }
    : (onTimeDelta != null && onTimeDelta !== 0)
      ? { up: onTimeDelta > 0, val: `${onTimeDelta > 0 ? '+' : ''}${onTimeDelta}pp`, label: 'vs yesterday' }
      : undefined

  const driversPrev  = kpiTrend.length >= 2 ? kpiTrend[kpiTrend.length - 2]!.active_drivers : null
  const driversDelta = driversPrev != null ? driversAvail - driversPrev : null
  const driversTrend = isMock
    ? { up: true, val: '2 newly', label: 'clocked-in' }
    : (driversDelta != null && driversDelta !== 0)
      ? { up: driversDelta > 0, val: `${Math.abs(driversDelta)} ${driversDelta > 0 ? 'more' : 'fewer'}`, label: 'vs yesterday' }
      : undefined

  return (
    <AppShell>
      {/* Live ticker — padded and contained, not edge-to-edge */}
      {/* Real-time polling (refetchInterval) is handled inside LiveOpsTicker */}
      <div className="px-6 pt-4 pb-1">
        <LiveOpsTicker orders={todayOrders} drivers={allDrivers} planDate={todayStr} />
      </div>

      <div className="p-6 flex flex-col gap-6">

        {/* Onboarding banner */}
        {showBanner && (
          <OnboardingBanner
            unassignedCount={unassignedCount}
            onDismiss={() => setBannerDismissed(true)}
            onGenerate={() => {}}
          />
        )}

        {/* KPI stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Today's Orders"
            value={totalDeliveries}
            color="accent"
            icon={<Icon.Package size={16} />}
            trend={ordersTrend}
            sparkline={sparkOrders}
            delay={0}
          />
          <StatCard
            label="On-Time Rate"
            value={onTimeRate}
            color="success"
            suffix="%"
            icon={<Icon.Check size={16} />}
            trend={onTimeTrend}
            sparkline={sparkOnTime}
            delay={80}
          />
          <StatCard
            label="At-Risk SLAs"
            value={atRiskSlas}
            color="info"
            icon={<Icon.Alert size={16} />}
            trend={isMock ? { up: true, val: '4 fewer', label: 'than yesterday' } : undefined}
            sparkline={sparkAtRisk}
            delay={160}
          />
          <StatCard
            label="Active Drivers"
            value={driversAvail}
            color="blue"
            suffix={`/${driversTotal}`}
            icon={<Icon.Drivers size={16} />}
            trend={driversTrend}
            sparkline={sparkDrivers}
            delay={240}
          />
        </div>

        {/* Fleet status breakdown */}
        <FleetStatusCards />

        {/* Main content — Timeline hero + side panels */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
          <RouteTimeline planDate={todayStr} />
          <AtRiskPanel   planDate={todayStr} />
        </div>

        {/* Quick actions */}
        <QuickActions />

      </div>
    </AppShell>
  )
}
