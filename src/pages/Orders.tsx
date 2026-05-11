import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Package, Download, Upload, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }       from '../components/layout/AppShell'
import { Button }         from '../components/ui/Button'
import { Input, SearchInput } from '../components/ui/Input'
import { Modal }          from '../components/ui/Modal'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import DataTable          from '../components/shared/DataTable'
import FormField          from '../components/shared/FormField'
import { fetchOrders, createOrder, updateOrder } from '../api/orders'
import { exportOrders, importOrders, triggerBlobDownload } from '../api/exportImport'
import { QUERY_KEYS }     from '../lib/utils/constants'
import type { Order }     from '../types'

// ─── Form schema ───────────────────────────────────────────────────────────────

const orderSchema = z.object({
  delivery_address:   z.string().min(1, 'Delivery address is required'),
  delivery_latitude:  z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().optional()),
  delivery_longitude: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().optional()),
  scheduled_date:     z.string().min(1, 'Date is required'),
  time_window_start:  z.string().optional(),
  time_window_end:    z.string().optional(),
  priority:           z.string().default('NORMAL'),
  weight_kg:          z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().positive().optional()),
  quantity_units:     z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
  value:              z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().nonnegative().optional()),
  notes:              z.string().optional(),
  external_ref:       z.string().optional(),
})

type OrderFormData = z.infer<typeof orderSchema>

const STATUS_TABS = ['ALL', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'] as const
type StatusTab = typeof STATUS_TABS[number]

const STATUS_OPTIONS  = ['', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED']
const PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL']

const selectCls = [
  'w-full h-9 px-3 rounded-[10px] text-sm outline-none',
  'bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)]',
  'focus:border-[var(--c-accent)] transition-colors',
].join(' ')

const textareaCls = [
  'w-full px-3 py-2.5 rounded-[10px] text-sm outline-none resize-none',
  'bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)]',
  'placeholder:text-[var(--c-muted)] focus:border-[var(--c-accent)] transition-colors',
].join(' ')

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Orders() {
  const qc = useQueryClient()

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusTab,    setStatusTab]    = useState<StatusTab>('ALL')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter,   setDateFilter]   = useState(new Date().toISOString().split('T')[0])
  const [exporting,    setExporting]    = useState(false)
  const [importing,    setImporting]    = useState(false)
  const fileInputRef                    = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportOrders(dateFilter)
      triggerBlobDownload(blob, `orders-${dateFilter}.xlsx`)
    } catch {
      toast.error('Export not yet available — backend coming soon')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const result = await importOrders(file)
      toast.success(`Imported ${result.created} orders${result.errors ? `, ${result.errors} errors` : ''}`)
      qc.invalidateQueries({ queryKey: ['orders'] })
    } catch {
      toast.error('Import not yet available — backend coming soon')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const { data: orders = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.orders(dateFilter),
    queryFn:  () => fetchOrders({ plan_date: dateFilter || undefined, ...(statusFilter ? { status: statusFilter } : {}) }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderFormData>({
    resolver:      zodResolver(orderSchema) as Resolver<OrderFormData>,
    defaultValues: { priority: 'NORMAL' },
  })

  const mutation = useMutation({
    mutationFn: (data: OrderFormData) => {
      const payload = {
        ...data,
        scheduled_date: new Date(data.scheduled_date).toISOString(),
        priority: data.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL',
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
    setEditingOrder(order ?? null)
    reset(order ? {
      delivery_address:   order.delivery_address,
      delivery_latitude:  order.delivery_latitude,
      delivery_longitude: order.delivery_longitude,
      scheduled_date:     order.scheduled_date.split('T')[0],
      time_window_start:  order.time_window_start ?? '',
      time_window_end:    order.time_window_end ?? '',
      priority:           order.priority,
      weight_kg:          order.weight_kg,
      quantity_units:     order.quantity_units,
      value:              order.value,
      notes:              order.notes ?? '',
      external_ref:       order.external_ref ?? '',
    } : { priority: 'NORMAL', scheduled_date: dateFilter })
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingOrder(null); reset() }

  const filtered = (orders as Order[]).filter((o) => {
    const q = search.toLowerCase()
    const matchSearch = o.delivery_address.toLowerCase().includes(q) || (o.external_ref ?? '').toLowerCase().includes(q)
    const matchTab = statusTab === 'ALL' || o.status === statusTab
    return matchSearch && matchTab
  })

  const columns = [
    {
      key: 'ref', header: 'Order',
      render: (o: Order) => (
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--c-accent-dim)' }}
          >
            <Package size={13} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-mono text-[var(--c-muted)] truncate">
              {o.external_ref ?? o.id.slice(0, 8)}
            </p>
            <p className="text-sm font-medium text-[var(--c-text)] truncate max-w-xs">
              {o.delivery_address}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'date', header: 'Date',
      render: (o: Order) => (
        <span className="text-sm text-[var(--c-muted)] font-mono">
          {new Date(o.scheduled_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'window', header: 'Time Window',
      render: (o: Order) => o.time_window_start
        ? <span className="text-xs font-mono text-[var(--c-muted)]">{o.time_window_start} – {o.time_window_end}</span>
        : <span className="text-xs text-[var(--c-muted)]">—</span>,
    },
    {
      key: 'value', header: 'Value',
      render: (o: Order) => o.value != null
        ? (
          <span className="text-xs font-mono text-[var(--c-text)] flex items-center gap-0.5">
            <IndianRupee size={10} className="text-[var(--c-muted)]" />
            {o.value.toLocaleString('en-IN')}
          </span>
        )
        : <span className="text-xs text-[var(--c-muted)]">—</span>,
    },
    {
      key: 'priority', header: 'Priority',
      render: (o: Order) => <PriorityBadge priority={o.priority} />,
    },
    {
      key: 'status', header: 'Status',
      render: (o: Order) => <StatusBadge status={o.status} />,
    },
    {
      key: 'actions', header: '', width: '48px',
      render: (o: Order) => (
        <button
          onClick={() => handleOpen(o)}
          className="p-1.5 rounded-lg transition-colors text-[var(--c-muted)] hover:text-[var(--c-text)]"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Pencil size={14} />
        </button>
      ),
    },
  ]

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Status tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count = tab === 'ALL'
              ? (orders as Order[]).length
              : (orders as Order[]).filter((o) => o.status === tab).length
            return (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
                style={{
                  background: statusTab === tab ? 'var(--c-accent-dim)' : 'var(--c-elevated)',
                  color:      statusTab === tab ? 'var(--c-accent)'     : 'var(--c-muted)',
                  border:     `1px solid ${statusTab === tab ? 'var(--c-accent)' : 'var(--c-border)'}`,
                }}
              >
                {tab === 'ALL' ? 'All' : tab.replace('_', ' ')}
                <span className="font-mono text-[10px]">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 -mt-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-auto"
          />
          <SearchInput
            placeholder="Search address or ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClass="flex-1 min-w-[200px]"
          />
          <Button variant="secondary" onClick={handleExport} loading={exporting}>
            <Upload size={15} /> Export
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={importing}
          >
            <Download size={15} /> Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button onClick={() => handleOpen()}>
            <Plus size={15} /> Add Order
          </Button>
        </div>

        {/* Summary */}
        <p className="text-xs text-[var(--c-muted)] -mt-2">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''} · {dateFilter}
        </p>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No orders for this date." />
        </div>
      </div>

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingOrder ? 'Edit Order' : 'New Order'}
        size="md"
      >
        <form onSubmit={handleSubmit((d: OrderFormData) => mutation.mutate(d))} className="space-y-4">
          <FormField label="External Reference">
            <Input {...register('external_ref')} placeholder="ORD-2026-001" />
          </FormField>
          <FormField label="Delivery Address" error={errors.delivery_address?.message} required>
            <Input {...register('delivery_address')} placeholder="123, Koramangala, Bangalore" error={errors.delivery_address?.message} />
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
            <Input {...register('scheduled_date')} type="date" error={errors.scheduled_date?.message} />
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
              <select {...register('priority')} className={selectCls}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Value (₹)">
              <Input {...register('value')} type="number" step="0.01" placeholder="0.00" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Weight (kg)">
              <Input {...register('weight_kg')} type="number" step="0.1" placeholder="5" />
            </FormField>
            <FormField label="Quantity">
              <Input {...register('quantity_units')} type="number" step="1" placeholder="1" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea {...register('notes')} rows={2} className={textareaCls} placeholder="Leave at door, call on arrival…" />
          </FormField>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending} className="flex-1">
              {editingOrder ? 'Update Order' : 'Create Order'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}
