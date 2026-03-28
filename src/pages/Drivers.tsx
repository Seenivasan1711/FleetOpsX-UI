import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, User } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import FormModal from '../components/shared/FormModal'
import FormField from '../components/shared/FormField'
import DataTable from '../components/shared/DataTable'
import ToggleSwitch from '../components/shared/ToggleSwitch'
import { fetchDrivers, createDriver, updateDriver } from '../api/drivers'
import { fetchDepots } from '../api/depots'
import type { Driver, Depot } from '../types'

const driverSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  license_number: z.string().optional(),
  license_class: z.string().optional(),
  home_depot_id: z.string().uuid('Select a depot').optional().or(z.literal('')),
  default_shift_start: z.string().optional(),
  default_shift_end: z.string().optional(),
})

type DriverFormData = z.infer<typeof driverSchema>

export default function Drivers() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [search, setSearch] = useState('')

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => fetchDrivers({ active_only: false }),
  })

  const { data: depots = [] } = useQuery({
    queryKey: ['depots'],
    queryFn: () => fetchDepots({ active_only: true }),
  })

  const depotMap = Object.fromEntries((depots as Depot[]).map(d => [d.id, d.name]))

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: DriverFormData) => {
      const payload = { ...data, home_depot_id: data.home_depot_id || undefined }
      return editingDriver ? updateDriver(editingDriver.id, payload) : createDriver(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drivers'] })
      toast.success(editingDriver ? 'Driver updated' : 'Driver created')
      handleClose()
    },
    onError: () => toast.error('Something went wrong'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateDriver(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  })

  const handleOpen = (driver?: Driver) => {
    setEditingDriver(driver || null)
    reset(driver ? {
      full_name: driver.full_name,
      phone: driver.phone || '',
      email: driver.email || '',
      license_number: '',
      license_class: '',
      home_depot_id: driver.home_depot_id || '',
      default_shift_start: '',
      default_shift_end: '',
    } : {})
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingDriver(null); reset() }

  const filtered = (drivers as Driver[]).filter(d =>
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.phone || '').includes(search)
  )

  const columns = [
    {
      key: 'name', header: 'Driver',
      render: (d: Driver) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <User size={13} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm">{d.full_name}</p>
            <p className="text-xs text-gray-400">{d.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'depot', header: 'Home Depot',
      render: (d: Driver) => d.home_depot_id ? depotMap[d.home_depot_id] || '—' : '—',
    },
    { key: 'email', header: 'Email', render: (d: Driver) => d.email || '—' },
    {
      key: 'active', header: 'Active', width: '80px',
      render: (d: Driver) => (
        <ToggleSwitch checked={d.is_active} onChange={(val) => toggleMutation.mutate({ id: d.id, is_active: val })} />
      ),
    },
    {
      key: 'actions', header: '', width: '60px',
      render: (d: Driver) => (
        <button onClick={() => handleOpen(d)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
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
            <h2 className="text-xl font-bold dark:text-white">Drivers</h2>
            <p className="text-sm text-gray-500">{(drivers as Driver[]).filter(d => d.is_active).length} active of {drivers.length}</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <Plus size={16} className="mr-1" /> Add Driver
          </Button>
        </div>

        <Input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

        <Card>
          <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No drivers yet." />
        </Card>
      </div>

      <FormModal title={editingDriver ? 'Edit Driver' : 'Add Driver'} isOpen={modalOpen} onClose={handleClose}>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <FormField label="Full Name" error={errors.full_name?.message} required>
            <Input {...register('full_name')} placeholder="Ravi Kumar" error={!!errors.full_name} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone">
              <Input {...register('phone')} placeholder="9812345678" />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input {...register('email')} type="email" placeholder="ravi@email.com" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="License Number">
              <Input {...register('license_number')} placeholder="KA0120220001234" />
            </FormField>
            <FormField label="License Class">
              <select {...register('license_class')}
                className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
                <option value="">Select...</option>
                <option value="LMV">LMV</option>
                <option value="HMV">HMV</option>
                <option value="TRANS">TRANS</option>
              </select>
            </FormField>
          </div>
          <FormField label="Home Depot">
            <select {...register('home_depot_id')}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
              <option value="">No depot assigned</option>
              {(depots as Depot[]).map(d => (
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
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : editingDriver ? 'Update Driver' : 'Create Driver'}
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
