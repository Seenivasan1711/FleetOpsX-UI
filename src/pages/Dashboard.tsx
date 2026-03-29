import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SuggestedActions from '../components/shared/SuggestedActions'
import { fetchOrders } from '../api/orders'
import { fetchDrivers } from '../api/drivers'
import { fetchAtRiskStops } from '../api/sla'
import type { AtRiskStop } from '../api/sla'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH:     'bg-orange-100 text-orange-700',
  NORMAL:   'bg-gray-100 text-gray-600',
  LOW:      'bg-blue-100 text-blue-600',
}

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0]
  const [riskExpanded, setRiskExpanded] = useState(true)

  const { data: orders = [] } = useQuery({ queryKey: ['orders', today], queryFn: () => fetchOrders({ plan_date: today }) })
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => fetchDrivers() })
  const { data: atRisk = [] } = useQuery({
    queryKey: ['sla-at-risk', today],
    queryFn: () => fetchAtRiskStops(today),
    refetchInterval: 60_000,
  })

  const unassigned = orders.filter(o => o.status === 'PENDING').length
  const assigned   = orders.filter(o => o.status === 'ASSIGNED').length

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Today's Overview</h2>
          <Link to="/planning">
            <Button>Generate Plan</Button>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={orders.length} color="blue" />
          <StatCard label="Unassigned" value={unassigned} color="red" />
          <StatCard label="Assigned" value={assigned} color="green" />
          <StatCard label="Active Drivers" value={drivers.filter(d => d.is_active).length} color="purple" />
        </div>

        {/* SLA At-Risk panel */}
        <AtRiskPanel stops={atRisk} expanded={riskExpanded} onToggle={() => setRiskExpanded(v => !v)} />

        {/* AI Suggested Actions panel */}
        <SuggestedActions planDate={today} />
      </div>
    </AppLayout>
  )
}

function AtRiskPanel({ stops, expanded, onToggle }: { stops: AtRiskStop[]; expanded: boolean; onToggle: () => void }) {
  const hasRisk = stops.length > 0
  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-colors ${hasRisk ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${hasRisk ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle size={15} className={hasRisk ? 'text-red-500' : 'text-gray-400'} />
          <span className={hasRisk ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'}>
            At-Risk Deliveries
          </span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${hasRisk ? 'bg-red-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
            {stops.length}
          </span>
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          refreshes every 60s
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="p-4">
          {stops.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">No at-risk stops — all deliveries on track.</p>
          ) : (
            <div className="space-y-2">
              {stops.map(s => (
                <div key={s.stop_id} className="flex items-start justify-between gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{s.delivery_address}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[s.priority] ?? PRIORITY_COLORS.NORMAL}`}>{s.priority}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Driver: <span className="font-medium">{s.driver_name}</span>
                      {' · '}Window ends: <span className="font-medium">{s.time_window_end}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-red-600">+{s.overdue_by_minutes} min late</p>
                    <p className="text-xs text-gray-400">ETA ~{s.eta_minutes % 60}min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600', red: 'text-red-500', green: 'text-green-500', purple: 'text-purple-500',
  }
  return (
    <Card>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]}`}>{value}</p>
    </Card>
  )
}
