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
import { useMockData }              from '../mock/config'
import { MOCK_FLEET, MOCK_AT_RISK } from '../mock/data'

const todayStr = new Date().toISOString().slice(0, 10)

// Mock stat values matching the fleet/orders mock data
const MOCK_STATS = {
  totalDeliveries: 118,
  onTimeRate:      95,
  atRiskSlas:      MOCK_AT_RISK.length,
  driversAvail:    MOCK_FLEET.drivers.find(d => d.label === 'Available')?.value ?? 13,
  driversTotal:    MOCK_FLEET.driversTotal,
}

export default function Dashboard() {
  const isMock = useMockData()
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const { data: kpis } = useQuery({
    queryKey: QUERY_KEYS.analyticsKpis,
    queryFn:  () => fetchKpis(),
    staleTime: 120_000,
    enabled:  !isMock,
  })

  const { data: fleet } = useQuery({
    queryKey: ['fleet-availability'],
    queryFn:  fetchFleetAvailability,
    staleTime: 60_000,
    enabled:  !isMock,
  })

  const { data: todayOrders = [] } = useQuery({
    queryKey: QUERY_KEYS.orders(todayStr),
    queryFn:  () => fetchOrders({ plan_date: todayStr }),
    staleTime: 60_000,
    enabled:  !isMock,
  })

  const { data: allDrivers = [] } = useQuery({
    queryKey: QUERY_KEYS.drivers,
    queryFn:  () => fetchDrivers(),
    staleTime: 60_000,
    enabled:  !isMock,
  })

  // 10-day KPI trend — powers on-time rate and active driver sparklines
  const { data: kpiTrend = [] } = useQuery({
    queryKey: ['kpi-trend', 10],
    queryFn:  () => fetchKpiTrend(10),
    staleTime: 300_000,
    enabled:  !isMock,
  })

  const unassignedCount = isMock ? 0 : todayOrders.filter((o) => o.status === 'PENDING').length
  const showBanner      = unassignedCount > 0 && !bannerDismissed

  const onTimeRate      = isMock ? MOCK_STATS.onTimeRate      : (kpis?.on_time_rate != null ? Math.round(kpis.on_time_rate * 100) : 0)
  const totalDeliveries = isMock ? MOCK_STATS.totalDeliveries : (kpis?.total_deliveries ?? 0)
  const driversAvail    = isMock ? MOCK_STATS.driversAvail    : (fleet?.drivers.available ?? 0)
  const driversTotal    = isMock ? MOCK_STATS.driversTotal    : (fleet?.drivers.total ?? 0)
  const atRiskSlas      = isMock ? MOCK_STATS.atRiskSlas      : todayOrders.filter((o) => (o.priority === 'CRITICAL' || o.priority === 'HIGH') && o.status === 'PENDING').length

  // Sparklines — last point always reflects the current live value.
  // Orders and on-time rate use real deliveries_by_day / kpi-trend when available.
  const sparkOrders  = isMock
    ? [78, 82, 85, 90, 88, 92, 97, 100, 105, MOCK_STATS.totalDeliveries]
    : (kpis?.deliveries_by_day?.slice(-10).map(d => d.total) ?? [78, 82, 85, 90, 88, 92, 97, 100, 105, totalDeliveries || 118])
  const sparkOnTime  = isMock
    ? [88, 89, 89, 90, 91, 92, 91, 93, 94, MOCK_STATS.onTimeRate]
    : kpiTrend.length >= 2
      ? kpiTrend.map(p => Math.round((p.on_time_pct ?? 0) * 100))
      : [88, 89, 89, 90, 91, 92, 91, 93, 94, onTimeRate || 95]
  const sparkAtRisk  = [8,  6,  7,  5,  4,  6,  4,  3,  3, atRiskSlas  || 3]
  const sparkDrivers = isMock
    ? [10, 11, 12, 11, 13, 12, 14, 13, 13, MOCK_STATS.driversAvail]
    : kpiTrend.length >= 2
      ? kpiTrend.map(p => p.active_drivers)
      : [10, 11, 12, 11, 13, 12, 14, 13, 13, driversAvail || 13]

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
            trend={{ up: true, val: '+21', label: 'vs yesterday' }}
            sparkline={sparkOrders}
            delay={0}
          />
          <StatCard
            label="On-Time Rate"
            value={onTimeRate}
            color="success"
            suffix="%"
            icon={<Icon.Check size={16} />}
            trend={{ up: true, val: '+2.5pp', label: 'this week' }}
            sparkline={sparkOnTime}
            delay={80}
          />
          <StatCard
            label="At-Risk SLAs"
            value={atRiskSlas}
            color="info"
            icon={<Icon.Alert size={16} />}
            trend={{ up: true, val: '4 fewer', label: 'than yesterday' }}
            sparkline={sparkAtRisk}
            delay={160}
          />
          <StatCard
            label="Active Drivers"
            value={driversAvail}
            color="blue"
            suffix={`/${driversTotal}`}
            icon={<Icon.Drivers size={16} />}
            trend={{ up: true, val: '2 newly', label: 'clocked-in' }}
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
