import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { generatePlan } from '../api/planning'
import { fetchOrders } from '../api/orders'
import type { PlanResult } from '../types'
import toast from 'react-hot-toast'

export default function Planning() {
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0])
  const [planResult, setPlanResult] = useState<PlanResult | null>(null)

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['orders', planDate],
    queryFn: () => fetchOrders({ plan_date: planDate }),
  })

  const planMutation = useMutation({
    mutationFn: () => generatePlan(planDate),
    onSuccess: (data) => {
      setPlanResult(data)
      refetchOrders()
      toast.success(`Plan generated! ${data.assigned_orders} orders assigned across ${data.total_routes} routes.`)
    },
    onError: () => toast.error('Failed to generate plan'),
  })

  const unassigned = orders.filter(o => o.status === 'PENDING')

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">Planning</h2>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={planDate}
              onChange={e => setPlanDate(e.target.value)}
              className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Button
              onClick={() => planMutation.mutate()}
              disabled={planMutation.isPending || unassigned.length === 0}
            >
              {planMutation.isPending ? 'Planning...' : `Generate Plan (${unassigned.length} unassigned)`}
            </Button>
          </div>
        </div>

        <Card>
          <h3 className="font-semibold mb-3 dark:text-white">Unassigned Orders — {planDate}</h3>
          {unassigned.length === 0 ? (
            <p className="text-sm text-gray-400">No unassigned orders for this date.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-2">Address</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Time Window</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.slice(0, 10).map(order => (
                  <tr key={order.id} className="border-b last:border-0 dark:border-gray-700">
                    <td className="py-2 dark:text-gray-200">{order.delivery_address}</td>
                    <td className="py-2"><PriorityBadge priority={order.priority} /></td>
                    <td className="py-2 text-gray-500">{order.time_window_start} – {order.time_window_end}</td>
                  </tr>
                ))}
                {unassigned.length > 10 && (
                  <tr>
                    <td colSpan={3} className="text-gray-400 py-2">+{unassigned.length - 10} more...</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </Card>

        {planResult && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold dark:text-white">
                Plan Result — {planResult.assigned_orders}/{planResult.total_orders} orders assigned, {planResult.total_routes} routes
              </h3>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DRAFT</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b dark:border-gray-700">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Driver</th>
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Stop</th>
                </tr>
              </thead>
              <tbody>
                {planResult.assignments.map((a, i) => (
                  <tr key={i} className="border-b last:border-0 dark:border-gray-700">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium dark:text-gray-200">{a.driver_name}</td>
                    <td className="py-2 text-gray-500 truncate max-w-xs">{a.order_id.slice(0, 8)}...</td>
                    <td className="py-2 text-gray-400">Stop {a.sequence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    NORMAL: 'bg-gray-100 text-gray-600',
    LOW: 'bg-blue-100 text-blue-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[priority] || colors.NORMAL}`}>
      {priority}
    </span>
  )
}
