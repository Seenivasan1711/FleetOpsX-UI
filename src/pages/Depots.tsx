import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import FormModal from '../components/shared/FormModal'
import FormField from '../components/shared/FormField'
import DataTable from '../components/shared/DataTable'
import ToggleSwitch from '../components/shared/ToggleSwitch'
import { fetchDepots, createDepot, updateDepot } from '../api/depots'
import type { Depot } from '../types'

const depotSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  pincode: z.string().optional(),
  latitude: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
  longitude: z.preprocess(v => v === '' ? undefined : Number(v), z.number().optional()),
})

type DepotFormData = z.infer<typeof depotSchema>

export default function Depots() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null)
  const [search, setSearch] = useState('')

  const { data: depots = [], isLoading } = useQuery({
    queryKey: ['depots'],
    queryFn: () => fetchDepots({ active_only: false }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepotFormData>({
    resolver: zodResolver(depotSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: DepotFormData) =>
      editingDepot ? updateDepot(editingDepot.id, data) : createDepot(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['depots'] })
      toast.success(editingDepot ? 'Depot updated' : 'Depot created')
      handleClose()
    },
    onError: () => toast.error('Something went wrong'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateDepot(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['depots'] }),
  })

  const handleOpen = (depot?: Depot) => {
    setEditingDepot(depot || null)
    reset(depot ? {
      name: depot.name,
      address: depot.address || '',
      city: depot.city || '',
      state: '',
      country: 'India',
      pincode: '',
      latitude: depot.latitude,
      longitude: depot.longitude,
    } : { country: 'India' })
    setModalOpen(true)
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditingDepot(null)
    reset()
  }

  const filtered = depots.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.city || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'name', header: 'Name',
      render: (d: Depot) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-blue-500 shrink-0" />
          <span className="font-medium">{d.name}</span>
        </div>
      ),
    },
    { key: 'city', header: 'City', render: (d: Depot) => d.city || '—' },
    {
      key: 'coords', header: 'Coordinates',
      render: (d: Depot) => d.latitude
        ? <span className="text-xs text-gray-400">{d.latitude.toFixed(4)}, {d.longitude?.toFixed(4)}</span>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'active', header: 'Active', width: '80px',
      render: (d: Depot) => (
        <ToggleSwitch
          checked={d.is_active}
          onChange={(val) => toggleMutation.mutate({ id: d.id, is_active: val })}
        />
      ),
    },
    {
      key: 'actions', header: '', width: '60px',
      render: (d: Depot) => (
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
            <h2 className="text-xl font-bold dark:text-white">Depots</h2>
            <p className="text-sm text-gray-500">{depots.length} total</p>
          </div>
          <Button onClick={() => handleOpen()}>
            <Plus size={16} className="mr-1" /> Add Depot
          </Button>
        </div>

        <Input
          placeholder="Search depots..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Card>
          <DataTable columns={columns} data={filtered} isLoading={isLoading} emptyMessage="No depots yet. Add your first depot." />
        </Card>
      </div>

      <FormModal
        title={editingDepot ? 'Edit Depot' : 'Add Depot'}
        isOpen={modalOpen}
        onClose={handleClose}
      >
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <FormField label="Name" error={errors.name?.message} required>
            <Input {...register('name')} placeholder="Koramangala Depot" error={!!errors.name} />
          </FormField>
          <FormField label="Address" error={errors.address?.message}>
            <Input {...register('address')} placeholder="123, 5th Block..." />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <Input {...register('city')} placeholder="Bangalore" />
            </FormField>
            <FormField label="Pincode">
              <Input {...register('pincode')} placeholder="560034" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Latitude" error={errors.latitude?.message}>
              <Input {...register('latitude')} type="number" step="any" placeholder="12.9716" />
            </FormField>
            <FormField label="Longitude" error={errors.longitude?.message}>
              <Input {...register('longitude')} type="number" step="any" placeholder="77.5946" />
            </FormField>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : editingDepot ? 'Update Depot' : 'Create Depot'}
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
