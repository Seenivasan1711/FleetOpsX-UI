import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Truck, Snowflake } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import FormModal from '../components/shared/FormModal'
import FormField from '../components/shared/FormField'
import DataTable from '../components/shared/DataTable'
import ToggleSwitch from '../components/shared/ToggleSwitch'
import { fetchVehicles, createVehicle, updateVehicle } from '../api/vehicles'
import { fetchDepots } from '../api/depots'
import type { Vehicle, Depot } from '../types'

const vehicleSchema = z.object({
  registration_number: z.string().min(1, 'Registration number is required'),
  vehicle_type: z.string().min(1, 'Select a type'),
  capacity_kg: z.preprocess(v => v === '' ? undefined : Number(v), z.number().positive().optional()),
  capacity_units: z.preprocess(v => v === '' ? undefined : Number(v), z.number().int().positive().optional()),
  is_refrigerated: z.boolean().default(false),
  home_depot_id: z.string().uuid().optional().or(z.literal('')),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const VEHICLE_TYPES = ['BIKE', 'AUTO', 'VAN', 'TRUCK_SMALL', 'TRUCK_LARGE']

export default function Vehicles() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [search, setSearch] = useState('')

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => fetchVehicles({ active_only: false }),
  })

  const { data: depots = [] } = useQuery({
    queryKey: ['depots'],
    queryFn: () => fetchDepots({ active_only: true }),
  })

  const depotMap = Object.fromEntries((depots as Depot[]).map(d => [d.id, d.name]))

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { is_refrigerated: false, vehicle_type: 'VAN' },
  })

  const isRefrigerated = watch('is_refrigerated')

  const mutation = useMutation({
    mutationFn: (data: VehicleFormData) => {
      const payload = { ...data, home_depot_id: data.home_depot_id || undefined }
      return editingVehicle ? updateVehicle(editingVehicle.id, payload) : createVehicle(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success(editingVehicle ? 'Vehicle updated' : 'Vehicle created')
      handleClose()
    },
    onError: () => toast.error('Something went wrong'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateVehicle(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })

  const handleOpen = (vehicle?: Vehicle) => {
    setEditingVehicle(vehicle || null)
    reset(vehicle ? {
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type,
      capacity_kg: vehicle.capacity_kg,
      capacity_units: vehicle.capacity_units,
      is_refrigerated: vehicle.is_refrigerated || false,
      home_depot_id: vehicle.home_depot_id || '',
    } : { vehicle_type: 'VAN', is_refrigerated: false })
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingVehicle(null); reset() }

  const filtered = (vehicles as Vehicle[]).filter(v =>
    v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicle_type.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'reg', header: 'Registration',
      render: (v: Vehicle) => (
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-blue-500 shrink-0" />
          <div>
            <p className="font-medium text-sm font-mono">{v.registration_number}</p>
            <p className="text-xs text-gray-400">{v.vehicle_type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'depot', header: 'Depot',
      render: (v: Vehicle) => v.home_depot_id ? depotMap[v.home_depot_id] || '—' : '—',
    },
    {
      key: 'capacity', header: 'Capacity',
      render: (v: Vehicle) => v.capacity_kg ? `${v.capacity_kg} kg` : '—',
    },
    {
      key: 'refrigerated', header: 'Cold Chain',
      render: (v: Vehicle) => v.is_refrigerated
        ? <span className="flex items-center gap-1 text-xs text-blue-500"><Snowflake size={11} /> Yes</span>
        : <span className="text-xs text-gray-400">No</span>,
    },
    {
      key: 'active', header: 'Active', width: '80px',
      render: (v: Vehicle) => (
        <ToggleSwitch checked={v.is_active} onChange={(val) => toggleMutation.mutate({ id: v.id, is_active: val })} />
      ),
    },
    {
      key: 'actions', header: '', width: '60px',
      render: (v: Vehicle) => (
        <button onClick={() => handleOpen(v)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
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
            <h2 className="text-xl font-bold dark:text-white">Vehicles</h2>
            <p className="text-sm text-gray-500">{(vehicles as Vehicle[]).filter(v => v.is_active).length} active of {vehicles.length}</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <Plus size={16} className="mr-1" /> Add Vehicle
          </Button>
        </div>

        <Input placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

        <Card>
          <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No vehicles yet." />
        </Card>
      </div>

      <FormModal title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'} isOpen={modalOpen} onClose={handleClose}>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <FormField label="Registration Number" error={errors.registration_number?.message} required>
            <Input {...register('registration_number')} placeholder="KA-01-AB-1234" error={!!errors.registration_number} />
          </FormField>
          <FormField label="Vehicle Type" error={errors.vehicle_type?.message} required>
            <select {...register('vehicle_type')}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
            <select {...register('home_depot_id')}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
              <option value="">No depot</option>
              {(depots as Depot[]).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={isRefrigerated} onChange={(v) => setValue('is_refrigerated', v)} />
            <label className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Snowflake size={13} className="text-blue-400" /> Refrigerated / Cold Chain
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : editingVehicle ? 'Update' : 'Create Vehicle'}
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
