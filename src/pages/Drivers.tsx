import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, UserCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }       from '../components/layout/AppShell'
import { Button }         from '../components/ui/Button'
import { Input, SearchInput } from '../components/ui/Input'
import { Modal }          from '../components/ui/Modal'
import { Toggle }         from '../components/ui/Toggle'
import DataTable          from '../components/shared/DataTable'
import FormField          from '../components/shared/FormField'
import { fetchDrivers, createDriver, updateDriver } from '../api/drivers'
import { fetchDepots }    from '../api/depots'
import { QUERY_KEYS }     from '../lib/utils/constants'
import { initials }       from '../lib/utils/format'
import type { Driver, Depot, DriverAvailability } from '../types'

// ─── Schema ────────────────────────────────────────────────────────────────────

const driverSchema = z.object({
  full_name:            z.string().min(1, 'Name is required'),
  phone:                z.string().optional(),
  email:                z.string().email('Invalid email').optional().or(z.literal('')),
  license_number:       z.string().optional(),
  license_class:        z.string().optional(),
  home_depot_id:        z.string().uuid('Select a depot').optional().or(z.literal('')),
  default_shift_start:  z.string().optional(),
  default_shift_end:    z.string().optional(),
})

type DriverFormData = z.infer<typeof driverSchema>

const selectCls = [
  'w-full h-9 px-3 rounded-[10px] text-sm outline-none',
  'bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)]',
  'focus:border-[var(--c-accent)] transition-colors',
].join(' ')

const AVAIL_META: Record<DriverAvailability, { label: string; color: string; dot: string }> = {
  AVAILABLE: { label: 'Available', color: 'var(--c-green)',  dot: 'var(--c-green)'  },
  ON_BREAK:  { label: 'On Break',  color: 'var(--c-orange)', dot: 'var(--c-orange)' },
  OFF_DUTY:  { label: 'Off Duty',  color: 'var(--c-muted)',  dot: 'var(--c-muted)'  },
}
const AVAIL_CYCLE: DriverAvailability[] = ['AVAILABLE', 'ON_BREAK', 'OFF_DUTY']

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Drivers() {
  const qc = useQueryClient()
  const [modalOpen,     setModalOpen]     = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [search,        setSearch]        = useState('')

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.drivers,
    queryFn:  () => fetchDrivers({ active_only: false }),
  })

  const { data: depots = [] } = useQuery({
    queryKey: QUERY_KEYS.depots,
    queryFn:  () => fetchDepots({ active_only: true }),
  })

  const depotMap = Object.fromEntries((depots as Depot[]).map((d) => [d.id, d.name]))

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: DriverFormData) => {
      const payload = { ...data, home_depot_id: data.home_depot_id || undefined }
      return editingDriver ? updateDriver(editingDriver.id, payload) : createDriver(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.drivers })
      toast.success(editingDriver ? 'Driver updated' : 'Driver added')
      handleClose()
    },
    onError: () => toast.error('Something went wrong'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateDriver(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.drivers }),
  })

  const handleOpen = (driver?: Driver) => {
    setEditingDriver(driver ?? null)
    reset(driver ? {
      full_name:           driver.full_name,
      phone:               driver.phone ?? '',
      email:               driver.email ?? '',
      license_number:      '',
      license_class:       '',
      home_depot_id:       driver.home_depot_id ?? '',
      default_shift_start: '',
      default_shift_end:   '',
    } : {})
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingDriver(null); reset() }

  const filtered = (drivers as Driver[]).filter((d) => {
    const q = search.toLowerCase()
    return d.full_name.toLowerCase().includes(q) || (d.phone ?? '').includes(q)
  })

  const activeCount = (drivers as Driver[]).filter((d) => d.is_active).length

  const [availMap, setAvailMap] = useState<Record<string, DriverAvailability>>({})

  const getAvail = (d: Driver): DriverAvailability =>
    availMap[d.id] ?? d.availability_status ?? 'AVAILABLE'

  const cycleAvail = (d: Driver) => {
    const cur  = getAvail(d)
    const next = AVAIL_CYCLE[(AVAIL_CYCLE.indexOf(cur) + 1) % AVAIL_CYCLE.length]!
    setAvailMap((m) => ({ ...m, [d.id]: next }))
    updateDriver(d.id, { availability_status: next } as Partial<Driver>).catch(() => {})
  }

  const columns = [
    {
      key: 'name', header: 'Driver',
      render: (d: Driver) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-purple))' }}
          >
            {d.full_name ? initials(d.full_name) : <UserCircle2 size={14} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--c-text)]">{d.full_name}</p>
            <p className="text-xs text-[var(--c-muted)]">{d.phone ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'depot', header: 'Home Depot',
      render: (d: Driver) => (
        <span className="text-sm text-[var(--c-muted)]">
          {d.home_depot_id ? depotMap[d.home_depot_id] ?? '—' : '—'}
        </span>
      ),
    },
    {
      key: 'email', header: 'Email',
      render: (d: Driver) => <span className="text-sm text-[var(--c-muted)]">{d.email ?? '—'}</span>,
    },
    {
      key: 'availability', header: 'Status',
      render: (d: Driver) => {
        const avail = getAvail(d)
        const meta  = AVAIL_META[avail]
        return (
          <button
            onClick={() => cycleAvail(d)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: `${meta.dot}1a`, color: meta.color }}
            title="Click to change status"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.dot }} />
            {meta.label}
          </button>
        )
      },
    },
    {
      key: 'active', header: 'Active', width: '80px',
      render: (d: Driver) => (
        <Toggle
          value={d.is_active}
          onChange={(val) => toggleMutation.mutate({ id: d.id, is_active: val })}
        />
      ),
    },
    {
      key: 'actions', header: '', width: '48px',
      render: (d: Driver) => (
        <button
          onClick={() => handleOpen(d)}
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

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            placeholder="Search drivers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClass="flex-1 max-w-xs"
          />
          <Button onClick={() => handleOpen()}>
            <Plus size={15} /> Add Driver
          </Button>
          <p className="text-xs text-[var(--c-muted)] ml-auto">
            {activeCount} active · {(drivers as Driver[]).length} total
          </p>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            emptyMessage="No drivers yet. Add your first driver to get started."
          />
        </div>
      </div>

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingDriver ? 'Edit Driver' : 'Add Driver'}
      >
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <FormField label="Full Name" error={errors.full_name?.message} required>
            <Input {...register('full_name')} placeholder="Ravi Kumar" error={errors.full_name?.message} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone">
              <Input {...register('phone')} placeholder="9812345678" />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="ravi@example.com" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="License Number">
              <Input {...register('license_number')} placeholder="KA0120220001234" />
            </FormField>
            <FormField label="License Class">
              <select {...register('license_class')} className={selectCls}>
                <option value="">Select…</option>
                <option value="LMV">LMV</option>
                <option value="HMV">HMV</option>
                <option value="TRANS">TRANS</option>
              </select>
            </FormField>
          </div>
          <FormField label="Home Depot">
            <select {...register('home_depot_id')} className={selectCls}>
              <option value="">No depot assigned</option>
              {(depots as Depot[]).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Shift Start">
              <Input {...register('default_shift_start')} type="time" />
            </FormField>
            <FormField label="Shift End">
              <Input {...register('default_shift_end')} type="time" />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending} className="flex-1">
              {editingDriver ? 'Update Driver' : 'Add Driver'}
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
