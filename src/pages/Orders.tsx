import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import FormModal from '../components/shared/FormModal'
import FormField from '../components/shared/FormField'
import DataTable from '../components/shared/DataTable'
import StatusBadge from '../components/shared/StatusBadge'
import { fetchOrders, createOrder, updateOrder } from '../api/orders'
import type { Order } from '../types'

const orderSchema = z.object({
  delivery_address: z.string().min(1, 'Delivery address is required'),
  delivery_latitude: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  delivery_longitude: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  scheduled_date: z.string().min(1, 'Date is required'),
  time_window_start: z.string().optional(),
  time_window_end: z.string().optional(),
  priority: z.string().default('NORMAL'),
  weight_kg: z.preprocess(v => v === '' ? undefined : Number(v), z.number().positive().optional()),
  quantity_units: z.preprocess(v => v === '' ? undefined : Number(v), z.number().int().positive().optional()),
  notes: z.string().optional(),
  external_ref: z.string().optional(),
})

type OrderFormData = z.infer<typeof orderSchema>

const STATUS_OPTIONS = ['', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED']
const PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL']

export default function Orders() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', dateFilter, statusFilter],
    queryFn: () => fetchOrders({ plan_date: dateFilter || undefined, status: statusFilter || undefined }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: { priority: 'NORMAL' },
  })

  const mutation = useMutation({
    mutationFn: (data: OrderFormData) => {
      const payload = {
        ...data,
        scheduled_date: new Date(data.scheduled_date).toISOString(),
      }
      return editingOrder ? updateOrder(editingOrder.id, payload) : createOrder(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success(editingOrder ? 'Order updated' : 'Order created')
      handleClose()
    },
    onError: () => toast.error('Something went wrong'),
  })

  const handleOpen = (order?: Order) => {
    setEditingOrder(order || null)
    reset(order ? {
      delivery_address: order.delivery_address,
      delivery_latitude: order.delivery_latitude,
      delivery_longitude: order.delivery_longitude,
      scheduled_date: order.scheduled_date.split('T')[0],
      time_window_start: order.time_window_start || '',
      time_window_end: order.time_window_end || '',
      priority: order.priority,
      weight_kg: order.weight_kg,
      quantity_units: order.quantity_units,
      notes: order.notes || '',
      external_ref: order.external_ref || '',
    } : { priority: 'NORMAL', scheduled_date: dateFilter })
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingOrder(null); reset() }

  const filtered = (orders as Order[]).filter(o =>
    o.delivery_address.toLowerCase().includes(search.toLowerCase()) ||
    (o.external_ref || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'ref', header: 'Order',
      render: (o: Order) => (
        <div className="flex items-center gap-2">
          <Package size={14} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-xs font-mono text-gray-400">{o.external_ref || o.id.slice(0, 8)}</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-xs">{o.delivery_address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'date', header: 'Date',
      render: (o: Order) => new Date(o.scheduled_date).toLocaleDateString('en-IN'),
    },
    {
      key: 'window', header: 'Time Window',
      render: (o: Order) => o.time_window_start
        ? <span className="text-xs text-gray-500">{o.time_window_start} – {o.time_window_end}</span>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'priority', header: 'Priority',
      render: (o: Order) => <StatusBadge value={o.priority} />,
    },
    {
      key: 'status', header: 'Status',
      render: (o: Order) => <StatusBadge value={o.status} />,
    },
    {
      key: 'actions', header: '', width: '60px',
      render: (o: Order) => (
        <button onClick={() => handleOpen(o)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <Pencil size={14} className="text-gray-400" />
        </button>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Orders</h2>
            <p className="text-sm text-gray-500">{orders.length} orders for selected date</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <Plus size={16} className="mr-1" /> Add Order
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-auto"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <Input
            placeholder="Search address or ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
        </div>

        <Card>
          <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No orders for this date." />
        </Card>
      </div>

      <FormModal title={editingOrder ? 'Edit Order' : 'Create Order'} isOpen={modalOpen} onClose={handleClose}>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <FormField label="External Reference">
            <Input {...register('external_ref')} placeholder="ORD-2026-001" />
          </FormField>
          <FormField label="Delivery Address" error={errors.delivery_address?.message} required>
            <Input {...register('delivery_address')} placeholder="123, Koramangala..." error={!!errors.delivery_address} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Latitude">
              <Input {...register('delivery_latitude')} type="number" step="any" placeholder="12.9716" />
            </FormField>
            <FormField label="Longitude">
              <Input {...register('delivery_longitude')} type="number" step="any" placeholder="77.5946" />
            </FormField>
          </div>
          <FormField label="Scheduled Date" error={errors.scheduled_date?.message} required>
            <Input {...register('scheduled_date')} type="date" error={!!errors.scheduled_date} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Window Start">
              <Input {...register('time_window_start')} type="time" />
            </FormField>
            <FormField label="Window End">
              <Input {...register('time_window_end')} type="time" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Priority">
              <select {...register('priority')}
                className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Weight (kg)">
              <Input {...register('weight_kg')} type="number" step="0.1" placeholder="5" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea {...register('notes')}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 resize-none"
              placeholder="Leave at door, call on arrival..." />
          </FormField>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
            </Button>
            <button type="button" onClick={handleClose}
              className="flex-1 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
              Cancel
            </button>
          </div>
        </form>
      </FormModal>
    </AppLayout>
  )
}
