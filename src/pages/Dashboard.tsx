import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, AlertTriangle, CheckCircle, Users, Truck } from 'lucide-react'
import { AppShell }           from '../components/layout/AppShell'
import { StatCard }           from '../components/features/dashboard/StatCard'
import { OnboardingBanner }   from '../components/features/dashboard/OnboardingBanner'
import { QuickActions }       from '../components/features/dashboard/QuickActions'
import { AtRiskPanel }        from '../components/features/dashboard/AtRiskPanel'
import { AiSuggestionsPanel } from '../components/features/dashboard/AiSuggestionsPanel'
import { Button }             from '../components/ui/Button'
import { fetchOrders }        from '../api/orders'
import { fetchDrivers }       from '../api/drivers'
import { fetchVehicles }      from '../api/vehicles'
import { QUERY_KEYS }         from '../lib/utils/constants'
import { today }              from '../lib/utils/format'

const ONBOARDING_KEY = 'fleetopsx_ob_dismissed'

function FleetBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-[var(--c-muted)]">{label}</span>
        <span className="text-[12px] font-bold font-mono text-[var(--c-text)]">{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-elevated)' }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
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

  const unassigned    = orders.filter((o) => o.status === 'PENDING').length
  const assigned      = orders.filter((o) => o.status === 'ASSIGNED').length
  const activeDrivers = drivers.filter((d) => d.is_active).length

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

  return (
    <AppShell pendingOrders={unassigned}>
      <div className="p-7 flex flex-col gap-6" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {showBanner && (
          <OnboardingBanner
            unassignedCount={unassigned}
            onDismiss={dismissBanner}
            onGenerate={() => { dismissBanner(); navigate('/planning') }}
          />
        )}

        {/* KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Orders" value={orders.length} color="accent" delay={0}
            icon={<Package size={14} />}
            trend={{ up: true, val: '+4', label: 'vs yesterday' }}
          />
          <StatCard
            label="Unassigned" value={unassigned} color="danger" delay={80}
            icon={<AlertTriangle size={14} />}
            trend={{ up: false, val: `${unassigned > 0 ? Math.round((unassigned / Math.max(orders.length, 1)) * 100) : 0}%`, label: 'need dispatch' }}
          />
          <StatCard
            label="Assigned" value={assigned} color="success" delay={160}
            icon={<CheckCircle size={14} />}
          />
          <StatCard
            label="Active Drivers" value={activeDrivers} color="info" delay={240}
            icon={<Users size={14} />}
            trend={{ up: true, val: '100%', label: 'available' }}
          />
        </div>

        {/* Fleet Availability */}
        {(drivers.length > 0 || vehicles.length > 0) && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            {/* Card header */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--c-border)' }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--c-accent-dim)' }}
              >
                <Truck size={14} style={{ color: 'var(--c-accent)' }} />
              </span>
              <p className="text-sm font-semibold text-[var(--c-text)] flex-1">Fleet Availability</p>
              <span
                className="text-[10px] font-mono px-2 py-1 rounded-full"
                style={{ background: 'var(--c-green-dim)', color: 'var(--c-green)' }}
              >
                Live
              </span>
              <span className="text-[11px] text-[var(--c-subtle)] hidden sm:inline">
                Click status pills on Drivers / Vehicles to update
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 divide-x" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {/* Drivers */}
              <div className="p-6">
                <p className="text-[10px] font-bold text-[var(--c-muted)] uppercase tracking-[0.8px] mb-5 flex items-center gap-1.5">
                  <Users size={10} /> Drivers · {driverStats.total} total
                </p>
                <FleetBar label="Available" value={driverStats.available} total={driverStats.total} color="var(--c-green)"  />
                <FleetBar label="On Break"  value={driverStats.on_break}  total={driverStats.total} color="var(--c-orange)" />
                <FleetBar label="Off Duty"  value={driverStats.off_duty}  total={driverStats.total} color="var(--c-muted)"  />
              </div>

              {/* Vehicles */}
              <div className="p-6" style={{ borderLeft: '1px solid var(--c-border)' }}>
                <p className="text-[10px] font-bold text-[var(--c-muted)] uppercase tracking-[0.8px] mb-5 flex items-center gap-1.5">
                  <Truck size={10} /> Vehicles · {vehicleStats.total} total
                </p>
                <FleetBar label="Available"   value={vehicleStats.available}  total={vehicleStats.total} color="var(--c-green)"  />
                <FleetBar label="In Use"      value={vehicleStats.in_use}     total={vehicleStats.total} color="var(--c-accent)" />
                <FleetBar label="Maintenance" value={vehicleStats.maintenance} total={vehicleStats.total} color="var(--c-red)"    />
                <FleetBar label="Low Fuel"    value={vehicleStats.low_fuel}   total={vehicleStats.total} color="var(--c-orange)" />
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <QuickActions />

        {/* At-risk + AI panels */}
        <AtRiskPanel planDate={planDate} />
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
