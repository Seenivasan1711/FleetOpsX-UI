import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowDown, ArrowUp, Calendar, Download, FileSpreadsheet, Plus, SlidersHorizontal, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }           from '../components/layout/AppShell'
import { Button }             from '../components/ui/Button'
import { Input, SearchInput } from '../components/ui/Input'
import { Modal }              from '../components/ui/Modal'
import { PriorityBadge, StatusBadge } from '../components/ui/Badge'
import FormField              from '../components/shared/FormField'
import { fetchOrders, createOrder, updateOrder } from '../api/orders'
import { exportOrders, importOrders, downloadTemplate, triggerBlobDownload } from '../api/exportImport'
import { QUERY_KEYS }         from '../lib/utils/constants'
import { useMockData }        from '../mock/config'
import { MOCK_ORDERS }        from '../mock/data'
import type { Order }         from '../types'

// ─── Types ─────────────────────────────────────────────────────────────────────

const isAtRisk = (o: Order) =>
  (o.priority === 'HIGH' || o.priority === 'CRITICAL') &&
  (o.status === 'IN_TRANSIT' || o.status === 'PENDING')

const displayStatus = (o: Order): string => isAtRisk(o) ? 'AT_RISK' : o.status

type TabKey = 'all' | 'in_transit' | 'assigned' | 'unassigned' | 'at_risk' | 'delivered' | 'failed'

const TABS: { key: TabKey; label: string; match: (o: Order) => boolean; accent?: string }[] = [
  { key: 'all',        label: 'All',        match: () => true },
  { key: 'in_transit', label: 'In Transit', match: (o) => o.status === 'IN_TRANSIT' && !isAtRisk(o) },
  { key: 'assigned',   label: 'Assigned',   match: (o) => o.status === 'ASSIGNED' },
  { key: 'unassigned', label: 'Unassigned', match: (o) => o.status === 'PENDING' && !isAtRisk(o) },
  { key: 'at_risk',    label: 'At Risk',    match: isAtRisk, accent: '#f59e0b' },
  { key: 'delivered',  label: 'Delivered',  match: (o) => o.status === 'DELIVERED' },
  { key: 'failed',     label: 'Failed',     match: (o) => o.status === 'FAILED' || o.status === 'CANCELLED' },
]

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

const PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL']

const selectCls = 'w-full h-9 px-3 rounded-[10px] text-sm outline-none bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] focus:border-[var(--c-accent)] transition-colors'
const textareaCls = 'w-full px-3 py-2.5 rounded-[10px] text-sm outline-none resize-none bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] placeholder:text-[var(--c-muted)] focus:border-[var(--c-accent)] transition-colors'

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Orders() {
  const qc     = useQueryClient()
  const isMock = useMockData()
  const today  = new Date().toISOString().split('T')[0]

  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [search,       setSearch]       = useState('')
  const [activeTab,    setActiveTab]    = useState<TabKey>('all')
  const [exporting,      setExporting]      = useState(false)
  const [importing,      setImporting]      = useState(false)
  const [downloadingTpl, setDownloadingTpl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter / sort state
  const [filterOpen,       setFilterOpen]       = useState(false)
  const [filterDateFrom,   setFilterDateFrom]   = useState('')
  const [filterDateTo,     setFilterDateTo]     = useState('')
  const [filterPriorities, setFilterPriorities] = useState<Order['priority'][]>([])
  const [filterDriver,     setFilterDriver]     = useState('')
  const [sortBy,           setSortBy]           = useState<'date' | 'value' | 'priority'>('date')
  const [sortDir,          setSortDir]          = useState<'asc' | 'desc'>('desc')

  const { data: liveOrders = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.orders('all'),
    queryFn:  () => fetchOrders(),
    enabled:  !isMock,
    refetchInterval: 30_000,
  })

  const orders: Order[] = isMock ? MOCK_ORDERS : liveOrders

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema) as Resolver<OrderFormData>,
    defaultValues: { priority: 'NORMAL' },
  })

  const mutation = useMutation({
    mutationFn: (data: OrderFormData) => {
      const payload = {
        ...data,
        scheduled_date: new Date(data.scheduled_date).toISOString(),
        priority: data.priority as Order['priority'],
      }
      return editingOrder ? updateOrder(editingOrder.id, payload) : createOrder(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'], exact: false })
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
    } : { priority: 'NORMAL', scheduled_date: today })
    setModalOpen(true)
  }
  const handleClose = () => { setModalOpen(false); setEditingOrder(null); reset() }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportOrders()
      triggerBlobDownload(blob, `orders-${today}.xlsx`)
    } catch { toast.error('Failed to export orders') }
    finally { setExporting(false) }
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTpl(true)
    try {
      const blob = await downloadTemplate()
      triggerBlobDownload(blob, 'orders_import_template.xlsx')
    } catch { toast.error('Failed to download template') }
    finally { setDownloadingTpl(false) }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const result = await importOrders(file)
      if (result.created > 0) {
        toast.success(`Imported ${result.created} order${result.created !== 1 ? 's' : ''}${result.errors ? ` (${result.errors} skipped)` : ''}`)
        qc.invalidateQueries({ queryKey: ['orders'], exact: false })
      } else {
        toast.error(`No orders imported${result.errors ? ` — ${result.errors} rows had errors` : ''}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg ?? 'Import failed')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Filtering + sorting
  const tab = TABS.find(t => t.key === activeTab)!
  const PRIORITY_RANK: Record<Order['priority'], number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 }

  const searched = useMemo(() => {
    let list = orders.filter(tab.match)

    if (filterDateFrom)
      list = list.filter(o => o.scheduled_date.slice(0, 10) >= filterDateFrom)
    if (filterDateTo)
      list = list.filter(o => o.scheduled_date.slice(0, 10) <= filterDateTo)

    if (filterPriorities.length > 0)
      list = list.filter(o => filterPriorities.includes(o.priority))

    if (filterDriver.trim())
      list = list.filter(o =>
        (o.assigned_driver_name ?? '').toLowerCase().includes(filterDriver.toLowerCase())
      )

    if (search.trim())
      list = list.filter(o =>
        o.delivery_address.toLowerCase().includes(search.toLowerCase()) ||
        (o.external_ref ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (o.assigned_driver_name ?? '').toLowerCase().includes(search.toLowerCase())
      )

    list = [...list].sort((a, b) => {
      let d = 0
      if (sortBy === 'date')          d = a.scheduled_date.localeCompare(b.scheduled_date)
      else if (sortBy === 'value')    d = (a.value ?? 0) - (b.value ?? 0)
      else if (sortBy === 'priority') d = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      return sortDir === 'asc' ? d : -d
    })

    return list
  }, [orders, activeTab, filterDateFrom, filterDateTo, filterPriorities, filterDriver, search, sortBy, sortDir])

  const activeFilterCount =
    (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0) + filterPriorities.length + (filterDriver ? 1 : 0)

  const togglePriority = (p: Order['priority']) =>
    setFilterPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const clearFilters = () => {
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterPriorities([])
    setFilterDriver('')
    setSortBy('date')
    setSortDir('desc')
  }

  const unassignedCount = orders.filter(o => o.status === 'PENDING').length

  return (
    <AppShell>
      <div className="p-6 flex flex-col gap-5" style={{ animation: 'page-slide-in 0.22s ease' }}>

        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-[var(--c-text)]">Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-muted)' }}>
            {orders.length} active orders · {unassignedCount} unassigned
          </p>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map(t => {
            const count   = orders.filter(t.match).length
            const isActive = activeTab === t.key
            const accentColor = t.accent ?? 'var(--c-accent)'
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all"
                style={{
                  background: isActive
                    ? t.accent ? `rgba(245,158,11,0.15)` : 'var(--c-accent-dim)'
                    : 'transparent',
                  color: isActive ? accentColor : 'var(--c-muted)',
                  border: `1px solid ${isActive ? (t.accent ? 'rgba(245,158,11,0.4)' : 'var(--c-accent)') : 'transparent'}`,
                }}
              >
                {t.label}
                <span
                  className="text-[11px] font-mono px-1.5 py-px rounded"
                  style={{
                    background: isActive ? (t.accent ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.25)') : 'var(--c-elevated)',
                    color: isActive ? accentColor : 'var(--c-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <SearchInput
            placeholder="Search by ID, address, driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClass="flex-1 min-w-[180px]"
          />

          {/* Filters toggle */}
          <button
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-medium transition-colors shrink-0"
            style={{
              background: filterOpen || activeFilterCount > 0 ? 'var(--c-accent-dim)' : 'var(--c-surface)',
              border: `1px solid ${filterOpen || activeFilterCount > 0 ? 'var(--c-accent)' : 'var(--c-border)'}`,
              color: filterOpen || activeFilterCount > 0 ? 'var(--c-accent)' : 'var(--c-text)',
            }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--c-accent)', color: '#fff' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort direction toggle */}
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-sm font-medium shrink-0 transition-colors"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
            title={`Sort by ${sortBy} · ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-muted)')}
          >
            {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <span className="capitalize">{sortBy}</span>
          </button>

          {/* Template */}
          <Button variant="secondary" onClick={handleDownloadTemplate} loading={downloadingTpl} className="shrink-0">
            <FileSpreadsheet size={14} /> Template
          </Button>

          {/* Import */}
          <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={importing} className="shrink-0">
            <Upload size={14} /> Import
          </Button>

          {/* Export */}
          <Button variant="secondary" onClick={handleExport} loading={exporting} className="shrink-0">
            <Download size={14} /> Export
          </Button>

          <Button onClick={() => handleOpen()} className="shrink-0">
            <Plus size={14} /> Add Order
          </Button>
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div
            className="rounded-2xl p-4 flex flex-col gap-4"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--c-text)]">Filters &amp; Sort</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: 'var(--c-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c-red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--c-muted)')}
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {/* Date range */}
              <div className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-2">
                <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
                  <Calendar size={10} className="inline mr-1" />Date range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterDateFrom}
                    max={filterDateTo || undefined}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-[10px] text-sm outline-none min-w-0"
                    style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                    placeholder="From"
                  />
                  <span className="text-[var(--c-muted)] text-xs shrink-0">→</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    min={filterDateFrom || undefined}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-[10px] text-sm outline-none min-w-0"
                    style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
                  Priority
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as Order['priority'][]).map(p => {
                    const active = filterPriorities.includes(p)
                    const colors: Record<Order['priority'], string> = {
                      CRITICAL: '#f87171', HIGH: '#f59e0b', NORMAL: 'var(--c-accent)', LOW: 'var(--c-muted)',
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => togglePriority(p)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: active ? `${colors[p]}22` : 'var(--c-elevated)',
                          color: active ? colors[p] : 'var(--c-muted)',
                          border: `1px solid ${active ? colors[p] : 'var(--c-border)'}`,
                        }}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Driver */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
                  Driver name
                </label>
                <input
                  type="text"
                  value={filterDriver}
                  onChange={(e) => setFilterDriver(e.target.value)}
                  placeholder="e.g. Arjun Mehta"
                  className="h-9 px-3 rounded-[10px] text-sm outline-none w-full"
                  style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--c-accent)')}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                />
              </div>

              {/* Sort */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>
                  Sort by
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="flex-1 h-9 px-2 rounded-[10px] text-sm outline-none"
                    style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                  >
                    <option value="date">Date</option>
                    <option value="value">Value</option>
                    <option value="priority">Priority</option>
                  </select>
                  <button
                    onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    className="h-9 px-3 rounded-[10px] text-sm font-mono transition-colors"
                    style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}
                    title="Toggle sort direction"
                  >
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  {['ORDER', 'ADDRESS', 'WINDOW', 'PRIORITY', 'STATUS', 'DRIVER', 'VALUE'].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.8px]"
                      style={{ color: 'var(--c-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && !isMock ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--c-border)' }}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded-md animate-pulse" style={{ background: 'var(--c-elevated)', width: j === 1 ? 160 : 80 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : searched.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-sm" style={{ color: 'var(--c-muted)' }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  searched.map((order, idx) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      last={idx === searched.length - 1}
                      onEdit={() => handleOpen(order)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {searched.length > 0 && (
            <div
              className="px-5 py-2.5"
              style={{ borderTop: '1px solid var(--c-border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                {searched.length} order{searched.length !== 1 ? 's' : ''}
                {search ? ` matching "${search}"` : ''}
                {activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={handleClose} title={editingOrder ? 'Edit Order' : 'New Order'} size="md">
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
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
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
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}

// ─── Row component ──────────────────────────────────────────────────────────────

function OrderRow({ order, last, onEdit }: { order: Order; last: boolean; onEdit: () => void }) {
  const window = order.time_window_start && order.time_window_end
    ? `${order.time_window_start.slice(0, 5)}–${order.time_window_end.slice(0, 5)}`
    : '—'

  return (
    <tr
      className="group cursor-pointer transition-colors"
      style={{ borderBottom: last ? 'none' : '1px solid var(--c-border)' }}
      onClick={onEdit}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {/* ORDER ID */}
      <td className="px-5 py-3.5">
        <span
          className="text-[13px] font-mono font-semibold"
          style={{ color: 'var(--c-accent)' }}
        >
          {order.external_ref ?? order.id.slice(0, 12)}
        </span>
      </td>

      {/* ADDRESS */}
      <td className="px-5 py-3.5 max-w-[220px]">
        <span className="text-[13px] text-[var(--c-text)] truncate block">
          {order.delivery_address}
        </span>
      </td>

      {/* WINDOW */}
      <td className="px-5 py-3.5">
        <span className="text-[12px] font-mono" style={{ color: 'var(--c-muted)' }}>
          {window}
        </span>
      </td>

      {/* PRIORITY */}
      <td className="px-5 py-3.5">
        <PriorityBadge priority={order.priority} />
      </td>

      {/* STATUS */}
      <td className="px-5 py-3.5">
        <StatusBadge status={displayStatus(order)} />
      </td>

      {/* DRIVER */}
      <td className="px-5 py-3.5">
        <span className="text-[13px]" style={{ color: order.assigned_driver_name ? 'var(--c-text)' : 'var(--c-muted)' }}>
          {order.assigned_driver_name ?? '—'}
        </span>
      </td>

      {/* VALUE */}
      <td className="px-5 py-3.5 text-right">
        {order.value != null ? (
          <span className="text-[13px] font-mono font-semibold text-[var(--c-text)]">
            ₹{order.value.toLocaleString('en-IN')}
          </span>
        ) : (
          <span className="text-[13px]" style={{ color: 'var(--c-muted)' }}>—</span>
        )}
      </td>
    </tr>
  )
}
