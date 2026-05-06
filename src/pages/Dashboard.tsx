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
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--c-muted)]">{label}</span>
        <span className="text-xs font-bold text-[var(--c-text)]">{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-elevated)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
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
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {showBanner && (
          <OnboardingBanner
            unassignedCount={unassigned}
            onDismiss={dismissBanner}
            onGenerate={() => { dismissBanner(); navigate('/planning') }}
          />
        )}

        {/* KPI stats */}
        <div className="flex gap-3.5">
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

        {/* Fleet Availability Widget — PP-E3 */}
        {(drivers.length > 0 || vehicles.length > 0) && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Truck size={14} style={{ color: 'var(--c-accent)' }} />
              <p className="text-sm font-bold text-[var(--c-text)]">Fleet Availability</p>
              <span className="text-xs text-[var(--c-muted)] ml-auto">Live · click status pills on Drivers / Vehicles pages to update</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Drivers */}
              <div>
                <p className="text-[10px] font-semibold text-[var(--c-muted)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Users size={10} /> Drivers · {driverStats.total} total
                </p>
                <FleetBar label="Available"   value={driverStats.available} total={driverStats.total} color="var(--c-green)"  />
                <FleetBar label="On Break"    value={driverStats.on_break}  total={driverStats.total} color="var(--c-orange)" />
                <FleetBar label="Off Duty"    value={driverStats.off_duty}  total={driverStats.total} color="var(--c-muted)"  />
              </div>
              {/* Vehicles */}
              <div>
                <p className="text-[10px] font-semibold text-[var(--c-muted)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Truck size={10} /> Vehicles · {vehicleStats.total} total
                </p>
                <FleetBar label="Available"   value={vehicleStats.available}   total={vehicleStats.total} color="var(--c-green)"  />
                <FleetBar label="In Use"      value={vehicleStats.in_use}      total={vehicleStats.total} color="var(--c-accent)" />
                <FleetBar label="Maintenance" value={vehicleStats.maintenance}  total={vehicleStats.total} color="var(--c-red)"    />
                <FleetBar label="Low Fuel"    value={vehicleStats.low_fuel}    total={vehicleStats.total} color="var(--c-orange)" />
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
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <div>
              <p className="text-sm font-bold text-[var(--c-text)] mb-0.5">Ready to dispatch?</p>
              <p className="text-xs text-[var(--c-muted)]">
                {unassigned} unassigned orders awaiting route optimisation for today.
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
