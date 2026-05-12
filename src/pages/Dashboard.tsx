import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, AlertTriangle, CheckCircle, Users, Truck, Gauge } from 'lucide-react'
import { AppShell }           from '../components/layout/AppShell'
import { StatCard }           from '../components/features/dashboard/StatCard'
import { OnboardingBanner }   from '../components/features/dashboard/OnboardingBanner'
import { QuickActions }       from '../components/features/dashboard/QuickActions'
import { AtRiskPanel }        from '../components/features/dashboard/AtRiskPanel'
import { AiSuggestionsPanel } from '../components/features/dashboard/AiSuggestionsPanel'
import { LiveOpsTicker }      from '../components/features/dashboard/LiveOpsTicker'
import { RouteTimeline }      from '../components/features/dashboard/RouteTimeline'
import { Button }             from '../components/ui/Button'
import { fetchOrders }        from '../api/orders'
import { fetchDrivers }       from '../api/drivers'
import { fetchVehicles }      from '../api/vehicles'
import { fetchKpiTrend }      from '../api/analytics'
import { QUERY_KEYS }         from '../lib/utils/constants'
import { today }              from '../lib/utils/format'

const ONBOARDING_KEY = 'fleetopsx_ob_dismissed'

function FleetAvailCard({
  title, icon, color, dim, children,
}: {
  title: string; icon: React.ReactNode; color: string; dim: string; children: React.ReactNode
}) {
  return (
    <div
      className="flex-1 rounded-2xl p-5 min-w-0"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: dim, color }}>
          {icon}
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.8px] text-[var(--c-muted)]">{title}</span>
      </div>
      {children}
    </div>
  )
}

function FleetBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11.5px] text-[var(--c-muted)]">{label}</span>
        <span className="text-[11.5px] font-bold font-mono text-[var(--c-text)]">{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-elevated)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: pct > 0 ? `0 0 6px ${color}60` : 'none' }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const planDate  = today()

  const [showBanner, setShowBanner] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  )

  const dismissBanner = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowBanner(false)
  }

  const { data: orders  = [] } = useQuery({
    queryKey: QUERY_KEYS.orders(planDate),
    queryFn:  () => fetchOrders({ plan_date: planDate }),
  })

  const { data: drivers = [] } = useQuery({
    queryKey: QUERY_KEYS.drivers,
    queryFn:  () => fetchDrivers(),
  })

  const { data: vehicles = [] } = useQuery({
    queryKey: QUERY_KEYS.vehicles,
    queryFn:  () => fetchVehicles({ active_only: false }),
  })

  const { data: kpiTrend = [] } = useQuery({
    queryKey: QUERY_KEYS.kpiTrend(7),
    queryFn:  () => fetchKpiTrend(7),
    staleTime: 5 * 60_000,
  })

  const unassigned    = orders.filter((o) => o.status === 'PENDING').length
  const assigned      = orders.filter((o) => o.status === 'ASSIGNED').length
  const activeDrivers = drivers.filter((d) => d.is_active).length

  // Sparkline data from KPI trend
  const orderSparkline = kpiTrend.map((p) => p.orders_count)
  const onTimePct      = kpiTrend.map((p) => p.on_time_pct ?? 0)
  const driverSparkline= kpiTrend.map((p) => p.active_drivers)

  const driverStats = useMemo(() => ({
    available: drivers.filter((d) => d.is_active && d.availability_status !== 'ON_BREAK' && d.availability_status !== 'OFF_DUTY').length,
    on_break:  drivers.filter((d) => d.availability_status === 'ON_BREAK').length,
    off_duty:  drivers.filter((d) => !d.is_active || d.availability_status === 'OFF_DUTY').length,
    total:     drivers.length,
  }), [drivers])

  const vehicleStats = useMemo(() => ({
    available:   vehicles.filter((v) => v.is_active && (!v.vehicle_status || v.vehicle_status === 'AVAILABLE')).length,
    in_use:      vehicles.filter((v) => v.vehicle_status === 'IN_USE').length,
    maintenance: vehicles.filter((v) => v.vehicle_status === 'MAINTENANCE').length,
    low_fuel:    vehicles.filter((v) => v.vehicle_status === 'LOW_FUEL').length,
    total:       vehicles.length,
  }), [vehicles])

  // Efficiency = vehicles in use / total active (as %)
  const efficiencyPct = vehicleStats.total > 0
    ? Math.round((vehicleStats.in_use / vehicleStats.total) * 100)
    : 0

  return (
    <AppShell pendingOrders={unassigned}>
      <div className="p-7 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {showBanner && (
          <OnboardingBanner
            unassignedCount={unassigned}
            onDismiss={dismissBanner}
            onGenerate={() => { dismissBanner(); navigate('/planning') }}
          />
        )}

        {/* Live Ops Ticker */}
        <LiveOpsTicker orders={orders} drivers={drivers} />

        {/* KPI stats with sparklines */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Orders" value={orders.length} color="accent" delay={0}
            icon={<Package size={14} />}
            sparkline={orderSparkline}
            trend={{ up: true, val: `+${Math.max(orders.length - 95, 0)} vs yesterday`, label: '' }}
          />
          <StatCard
            label="On-Time Rate" value={Math.round(onTimePct[onTimePct.length - 1] ?? 0)} color="success" delay={80}
            icon={<CheckCircle size={14} />}
            sparkline={onTimePct}
            unit="%"
            trend={{ up: true, val: '+2.5pp', label: 'this week' }}
          />
          <StatCard
            label="At-Risk SLAs" value={unassigned} color="info" delay={160}
            icon={<AlertTriangle size={14} />}
            trend={{ up: false, val: `${Math.max(unassigned - 7, 0)} fewer`, label: 'than yesterday' }}
          />
          <StatCard
            label="Active Drivers" value={activeDrivers} color="white" delay={240}
            icon={<Users size={14} />}
            sparkline={driverSparkline}
            suffix={`/${drivers.length}`}
            trend={{ up: true, val: '2 newly', label: 'clocked-in' }}
          />
        </div>

        {/* Fleet Availability — 3 cards: Drivers / Vehicles / Efficiency */}
        {(drivers.length > 0 || vehicles.length > 0) && (
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[1px] text-[var(--c-muted)] mb-3">
              Fleet Availability
              <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-mono" style={{ background: 'var(--c-green-dim)', color: 'var(--c-green)' }}>Live</span>
            </p>
            <div className="flex gap-3">
              {/* Drivers card */}
              <FleetAvailCard title={`Drivers · ${driverStats.total}`} icon={<Users size={13} />} color="var(--c-accent)" dim="var(--c-accent-dim)">
                <FleetBar label="Available" value={driverStats.available} total={driverStats.total} color="var(--c-green)"  />
                <FleetBar label="On Break"  value={driverStats.on_break}  total={driverStats.total} color="var(--c-orange)" />
                <FleetBar label="Off Duty"  value={driverStats.off_duty}  total={driverStats.total} color="var(--c-muted)"  />
              </FleetAvailCard>

              {/* Vehicles card */}
              <FleetAvailCard title={`Vehicles · ${vehicleStats.total}`} icon={<Truck size={13} />} color="var(--c-purple)" dim="var(--c-purple-dim)">
                <FleetBar label="Available"   value={vehicleStats.available}  total={vehicleStats.total} color="var(--c-green)"  />
                <FleetBar label="In Use"      value={vehicleStats.in_use}     total={vehicleStats.total} color="var(--c-accent)" />
                <FleetBar label="Maintenance" value={vehicleStats.maintenance} total={vehicleStats.total} color="var(--c-red)"    />
                <FleetBar label="Low Fuel"    value={vehicleStats.low_fuel}   total={vehicleStats.total} color="var(--c-orange)" />
              </FleetAvailCard>

              {/* Efficiency card */}
              <FleetAvailCard title="Fleet Efficiency" icon={<Gauge size={13} />} color="var(--c-green)" dim="var(--c-green-dim)">
                <div
                  className="text-[42px] font-extrabold leading-none tracking-[-2px] font-mono mb-3"
                  style={{ color: efficiencyPct >= 70 ? 'var(--c-green)' : efficiencyPct >= 40 ? 'var(--c-orange)' : 'var(--c-red)' }}
                >
                  {efficiencyPct}<span className="text-[22px] ml-0.5 opacity-60">%</span>
                </div>
                <p className="text-[11px] text-[var(--c-muted)] leading-relaxed">
                  {vehicleStats.in_use} of {vehicleStats.total} vehicles in active use.<br />
                  {vehicleStats.available} ready for assignment.
                </p>
              </FleetAvailCard>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <QuickActions />

        {/* Route Timeline + At-Risk side by side */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-0" style={{ flex: '0 0 60%' }}>
            <RouteTimeline planDate={planDate} />
          </div>
          <div className="min-w-0" style={{ flex: '0 0 calc(40% - 1rem)' }}>
            <AtRiskPanel planDate={planDate} />
          </div>
        </div>
        <AiSuggestionsPanel planDate={planDate} />

        {/* Dispatch CTA */}
        {unassigned > 0 && (
          <div
            className="flex items-center justify-between gap-4 px-6 py-5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--c-accent-dim), var(--c-purple-dim))',
              border: '1px solid var(--c-accent)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <p className="text-sm font-bold text-[var(--c-text)] mb-1">Ready to dispatch?</p>
              <p className="text-xs text-[var(--c-muted)]">
                <span className="font-semibold" style={{ color: 'var(--c-red)' }}>{unassigned} unassigned orders</span>{' '}
                awaiting route optimisation for today.
              </p>
            </div>
            <Button onClick={() => navigate('/planning')}>
              Generate Plan →
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
