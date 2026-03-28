import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { fetchOrders } from '../api/orders'
import { fetchDrivers } from '../api/drivers'

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0]
  const { data: orders = [] } = useQuery({ queryKey: ['orders', today], queryFn: () => fetchOrders({ plan_date: today }) })
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: () => fetchDrivers() })

  const unassigned = orders.filter(o => o.status === 'PENDING').length
  const assigned = orders.filter(o => o.status === 'ASSIGNED').length

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">Today's Overview</h2>
          <Link to="/planning">
            <Button>Generate Plan</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={orders.length} color="blue" />
          <StatCard label="Unassigned" value={unassigned} color="red" />
          <StatCard label="Assigned" value={assigned} color="green" />
          <StatCard label="Active Drivers" value={drivers.filter(d => d.is_active).length} color="purple" />
        </div>
      </div>
    </AppLayout>
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
