import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, Clock, Package, RefreshCw } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { fetchKpis, fetchDriverPerformance, triggerEtl } from '../api/analytics'

const today = new Date().toISOString().split('T')[0]
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    green:  'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  }
  return (
    <div className={`rounded-xl p-4 ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

export default function Analytics() {
  const [etlDate, setEtlDate] = useState(today)
  const queryClient = useQueryClient()

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['analytics-kpis', thirtyDaysAgo, today],
    queryFn: () => fetchKpis(thirtyDaysAgo, today),
  })

  const { data: driverPerf = [], isLoading: perfLoading } = useQuery({
    queryKey: ['driver-performance', thirtyDaysAgo],
    queryFn: () => fetchDriverPerformance(thirtyDaysAgo),
  })

  const etlMutation = useMutation({
    mutationFn: () => triggerEtl(etlDate),
    onSuccess: (data) => {
      toast.success(`ETL complete: ${data.upserted} deliveries, ${data.driver_scores_upserted} driver scores`)
      queryClient.invalidateQueries({ queryKey: ['analytics-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['driver-performance'] })
    },
    onError: () => toast.error('ETL failed — check API logs'),
  })

  const onTimeRate = kpis?.on_time_rate != null ? `${(kpis.on_time_rate * 100).toFixed(1)}%` : '—'
  const avgDelay = kpis?.avg_delay_minutes != null ? `${kpis.avg_delay_minutes.toFixed(1)} min` : '—'

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Analytics — Last 30 Days</h2>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={etlDate}
              onChange={e => setEtlDate(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Button
              onClick={() => etlMutation.mutate()}
              disabled={etlMutation.isPending}
            >
              <RefreshCw size={14} className={etlMutation.isPending ? 'animate-spin' : ''} />
              Run ETL
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {kpisLoading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading KPIs…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Total Deliveries" value={kpis?.total_deliveries ?? 0} color="blue" />
            <KpiCard label="On-Time Rate" value={onTimeRate} sub="target ≥ 85%" color={
              kpis?.on_time_rate != null && kpis.on_time_rate >= 0.85 ? 'green' : 'orange'
            } />
            <KpiCard label="Avg Delay" value={avgDelay} sub="when delayed" color="orange" />
            <KpiCard label="Zones Served" value={kpis?.deliveries_by_zone.length ?? 0} color="purple" />
          </div>
        )}

        {/* Delivery trend chart */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp size={15} /> Daily Deliveries
          </h3>
          {kpisLoading || !kpis?.deliveries_by_day.length ? (
            <p className="text-sm text-gray-400">No data yet — run ETL to populate.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={kpis.deliveries_by_day} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'total' ? 'Total' : 'On-Time']}
                  labelFormatter={l => `Date: ${l}`}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="on_time" stroke="#22c55e" strokeWidth={2} dot={false} name="On-Time" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Zone breakdown chart */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Package size={15} /> Deliveries by Zone (Top 10)
          </h3>
          {kpisLoading || !kpis?.deliveries_by_zone.length ? (
            <p className="text-sm text-gray-400">No data yet — run ETL to populate.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={kpis.deliveries_by_zone.slice(0, 10)}
                margin={{ top: 4, right: 16, left: -10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="zone" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="on_time" fill="#22c55e" name="On-Time" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Driver leaderboard */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Clock size={15} /> Driver Performance Leaderboard
          </h3>
          {perfLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : driverPerf.length === 0 ? (
            <p className="text-sm text-gray-400">No performance data yet — run ETL first.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Driver</th>
                    <th className="pb-2 pr-4 text-right">Deliveries</th>
                    <th className="pb-2 pr-4 text-right">On-Time</th>
                    <th className="pb-2 text-right">Avg Delay</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerf.map((d, i) => (
                    <tr key={d.driver_id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium dark:text-white">{d.driver_name}</td>
                      <td className="py-2 pr-4 text-right tabular-nums dark:text-gray-300">{d.total_deliveries}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        <span className={`font-semibold ${
                          d.on_time_rate != null && d.on_time_rate >= 0.85
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-orange-500 dark:text-orange-400'
                        }`}>
                          {d.on_time_rate != null ? `${(d.on_time_rate * 100).toFixed(1)}%` : '—'}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">
                        {d.avg_delay_minutes != null ? `${d.avg_delay_minutes.toFixed(1)} min` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
