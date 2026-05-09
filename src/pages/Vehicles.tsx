import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Truck, Snowflake } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }       from '../components/layout/AppShell'
import { Button }         from '../components/ui/Button'
import { Input, SearchInput } from '../components/ui/Input'
import { Modal }          from '../components/ui/Modal'
import { Toggle }         from '../components/ui/Toggle'
import DataTable          from '../components/shared/DataTable'
import FormField          from '../components/shared/FormField'
import { fetchVehicles, createVehicle, updateVehicle } from '../api/vehicles'
import { fetchDepots }    from '../api/depots'
import { QUERY_KEYS }     from '../lib/utils/constants'
import type { Vehicle, Depot, VehicleStatus } from '../types'

// ─── Schema ────────────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  registration_number: z.string().min(1, 'Registration number is required'),
  vehicle_type:        z.string().min(1, 'Select a type'),
  capacity_kg:         z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().positive().optional()),
  capacity_units:      z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().positive().optional()),
  is_refrigerated:     z.boolean().default(false),
  home_depot_id:       z.string().uuid().optional().or(z.literal('')),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const VEHICLE_TYPES = ['BIKE', 'AUTO', 'VAN', 'TRUCK_SMALL', 'TRUCK_LARGE']

const V_STATUS_META: Record<VehicleStatus, { label: string; color: string }> = {
  AVAILABLE:   { label: 'Available',   color: 'var(--c-green)'  },
  IN_USE:      { label: 'In Use',      color: 'var(--c-accent)' },
  MAINTENANCE: { label: 'Maintenance', color: 'var(--c-red)'    },
  LOW_FUEL:    { label: 'Low Fuel',    color: 'var(--c-orange)' },
}
const V_STATUS_CYCLE: VehicleStatus[] = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'LOW_FUEL']

const selectCls = [
  'w-full h-9 px-3 rounded-[10px] text-sm outline-none',
  'bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)]',
  'focus:border-[var(--c-accent)] transition-colors',
].join(' ')

// ─── Type badge ────────────────────────────────────────────────────────────────

const VehicleTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    BIKE:        { bg: 'rgba(52,211,153,0.12)',  color: 'var(--c-green)'  },
    AUTO:        { bg: 'rgba(52,211,153,0.12)',  color: 'var(--c-green)'  },
    VAN:         { bg: 'rgba(59,130,246,0.12)',  color: 'var(--c-accent)' },
    TRUCK_SMALL: { bg: 'rgba(251,191,36,0.12)',  color: 'var(--c-orange)' },
    TRUCK_LARGE: { bg: 'rgba(248,113,113,0.12)', color: 'var(--c-red)'   },
  }
  const s = colors[type] ?? { bg: 'rgba(59,130,246,0.12)', color: 'var(--c-accent)' }
  return (
    <span
      className="text-[10.5px] font-bold font-mono px-2 py-0.5 rounded-md"
      style={{ background: s.bg, color: s.color }}
    >
      {type}
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Vehicles() {
  const qc = useQueryClient()
  const [modalOpen,       setModalOpen]       = useState(false)
  const [editingVehicle,  setEditingVehicle]  = useState<Vehicle | null>(null)
  const [search,          setSearch]          = useState('')

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.vehicles,
    queryFn:  () => fetchVehicles({ active_only: false }),
  })

  const { data: depots = [] } = useQuery({
    queryKey: QUERY_KEYS.depots,
    queryFn:  () => fetchDepots({ active_only: true }),
  })

  const depotMap = Object.fromEntries((depots as Depot[]).map((d) => [d.id, d.name]))

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<VehicleFormData>({
    resolver:      zodResolver(vehicleSchema) as Resolver<VehicleFormData>,
    defaultValues: { is_refrigerated: false, vehicle_type: 'VAN' },
  })

  const isRefrigerated = watch('is_refrigerated')

  const mutation = useMutation({
    mutationFn: (data: VehicleFormData) => {
      const payload = { ...data, home_depot_id: data.home_depot_id || undefined }
      return editingVehicle ? updateVehicle(editingVehicle.id, payload) : createVehicle(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.vehicles })
      toast.success(editingVehicle ? 'Vehicle updated' : 'Vehicle added')
      handleClose()
    },
    onError: () => toast.error('Something went wrong'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateVehicle(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.vehicles }),
  })

  const handleOpen = (vehicle?: Vehicle) => {
    setEditingVehicle(vehicle ?? null)
    reset(vehicle ? {
      registration_number: vehicle.registration_number,
      vehicle_type:        vehicle.vehicle_type,
      capacity_kg:         vehicle.capacity_kg,
      capacity_units:      vehicle.capacity_units,
      is_refrigerated:     vehicle.is_refrigerated ?? false,
      home_depot_id:       vehicle.home_depot_id ?? '',
    } : { vehicle_type: 'VAN', is_refrigerated: false })
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingVehicle(null); reset() }

  const filtered = (vehicles as Vehicle[]).filter((v) => {
    const q = search.toLowerCase()
    return v.registration_number.toLowerCase().includes(q) || v.vehicle_type.toLowerCase().includes(q)
  })

  const activeCount = (vehicles as Vehicle[]).filter((v) => v.is_active).length

  const [statusMap, setStatusMap] = useState<Record<string, VehicleStatus>>({})

  const getVStatus = (v: Vehicle): VehicleStatus =>
    statusMap[v.id] ?? v.vehicle_status ?? 'AVAILABLE'

  const cycleVStatus = (v: Vehicle) => {
    const cur  = getVStatus(v)
    const next = V_STATUS_CYCLE[(V_STATUS_CYCLE.indexOf(cur) + 1) % V_STATUS_CYCLE.length]!
    setStatusMap((m) => ({ ...m, [v.id]: next }))
    updateVehicle(v.id, { vehicle_status: next } as Partial<Vehicle>).catch(() => {})
  }

  const columns = [
    {
      key: 'reg', header: 'Vehicle',
      render: (v: Vehicle) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--c-accent-dim)' }}
          >
            <Truck size={14} style={{ color: 'var(--c-accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold font-mono text-[var(--c-text)]">{v.registration_number}</p>
            <VehicleTypeBadge type={v.vehicle_type} />
          </div>
        </div>
      ),
    },
    {
      key: 'depot', header: 'Depot',
      render: (v: Vehicle) => (
        <span className="text-sm text-[var(--c-muted)]">
          {v.home_depot_id ? depotMap[v.home_depot_id] ?? '—' : '—'}
        </span>
      ),
    },
    {
      key: 'capacity', header: 'Capacity',
      render: (v: Vehicle) => (
        <span className="text-sm text-[var(--c-muted)]">
          {v.capacity_kg ? `${v.capacity_kg} kg` : '—'}
        </span>
      ),
    },
    {
      key: 'vstatus', header: 'Status',
      render: (v: Vehicle) => {
        const status = getVStatus(v)
        const meta   = V_STATUS_META[status]
        return (
          <button
            onClick={() => cycleVStatus(v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: `${meta.color}1a`, color: meta.color }}
            title="Click to change status"
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
            {meta.label}
          </button>
        )
      },
    },
    {
      key: 'cold', header: 'Cold Chain',
      render: (v: Vehicle) => v.is_refrigerated
        ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--c-accent)' }}>
            <Snowflake size={12} /> Yes
          </span>
        )
        : <span className="text-xs text-[var(--c-muted)]">—</span>,
    },
    {
      key: 'active', header: 'Active', width: '80px',
      render: (v: Vehicle) => (
        <Toggle value={v.is_active} onChange={(val) => toggleMutation.mutate({ id: v.id, is_active: val })} />
      ),
    },
    {
      key: 'actions', header: '', width: '48px',
      render: (v: Vehicle) => (
        <button
          onClick={() => handleOpen(v)}
          className="p-1.5 rounded-lg text-[var(--c-muted)] hover:text-[var(--c-text)] transition-colors"
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
            placeholder="Search vehicles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClass="flex-1 max-w-xs"
          />
          <Button onClick={() => handleOpen()}>
            <Plus size={15} /> Add Vehicle
          </Button>
          <p className="text-xs text-[var(--c-muted)] ml-auto">
            {activeCount} active · {(vehicles as Vehicle[]).length} total
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
            emptyMessage="No vehicles yet. Add your first vehicle to get started."
          />
        </div>
      </div>

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <form onSubmit={handleSubmit((d: VehicleFormData) => mutation.mutate(d))} className="space-y-4">
          <FormField label="Registration Number" error={errors.registration_number?.message} required>
            <Input {...register('registration_number')} placeholder="KA-01-AB-1234" error={errors.registration_number?.message} />
          </FormField>
          <FormField label="Vehicle Type" error={errors.vehicle_type?.message} required>
            <select {...register('vehicle_type')} className={selectCls}>
              {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Capacity (kg)">
              <Input {...register('capacity_kg')} type="number" step="0.1" placeholder="500" />
            </FormField>
            <FormField label="Capacity (units)">
              <Input {...register('capacity_units')} type="number" placeholder="100" />
            </FormField>
          </div>
          <FormField label="Home Depot">
            <select {...register('home_depot_id')} className={selectCls}>
              <option value="">No depot</option>
              {(depots as Depot[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border)' }}
          >
            <Toggle value={isRefrigerated} onChange={(v) => setValue('is_refrigerated', v)} />
            <label className="text-sm text-[var(--c-text)] flex items-center gap-2 cursor-pointer" onClick={() => setValue('is_refrigerated', !isRefrigerated)}>
              <Snowflake size={14} style={{ color: 'var(--c-accent)' }} />
              Refrigerated / Cold Chain
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending} className="flex-1">
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
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
