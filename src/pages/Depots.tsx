import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }       from '../components/layout/AppShell'
import { Button }         from '../components/ui/Button'
import { Input, SearchInput } from '../components/ui/Input'
import { Modal }          from '../components/ui/Modal'
import { Toggle }         from '../components/ui/Toggle'
import DataTable          from '../components/shared/DataTable'
import FormField          from '../components/shared/FormField'
import { fetchDepots, createDepot, updateDepot } from '../api/depots'
import { QUERY_KEYS }     from '../lib/utils/constants'
import type { Depot }     from '../types'

// ─── Schema ────────────────────────────────────────────────────────────────────

const depotSchema = z.object({
  name:      z.string().min(1, 'Name is required'),
  address:   z.string().optional(),
  city:      z.string().optional(),
  state:     z.string().optional(),
  country:   z.string().default('India'),
  pincode:   z.string().optional(),
  latitude:  z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().optional()),
  longitude: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().optional()),
})

type DepotFormData = z.infer<typeof depotSchema>

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Depots() {
  const qc = useQueryClient()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null)
  const [search,       setSearch]       = useState('')

  const { data: depots = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.depots,
    queryFn:  () => fetchDepots({ active_only: false }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepotFormData>({
    resolver: zodResolver(depotSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: DepotFormData) =>
      editingDepot ? updateDepot(editingDepot.id, data) : createDepot(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.depots })
      toast.success(editingDepot ? 'Depot updated' : 'Depot created')
      handleClose()
    },
    onError: () => toast.error('Something went wrong'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateDepot(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.depots }),
  })

  const handleOpen = (depot?: Depot) => {
    setEditingDepot(depot ?? null)
    reset(depot ? {
      name:      depot.name,
      address:   depot.address ?? '',
      city:      depot.city ?? '',
      state:     '',
      country:   'India',
      pincode:   '',
      latitude:  depot.latitude,
      longitude: depot.longitude,
    } : { country: 'India' })
    setModalOpen(true)
  }

  const handleClose = () => { setModalOpen(false); setEditingDepot(null); reset() }

  const filtered = (depots as Depot[]).filter((d) => {
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || (d.city ?? '').toLowerCase().includes(q)
  })

  const columns = [
    {
      key: 'name', header: 'Depot',
      render: (d: Depot) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--c-green-dim)' }}
          >
            <MapPin size={14} style={{ color: 'var(--c-green)' }} />
          </div>
          <p className="text-sm font-semibold text-[var(--c-text)]">{d.name}</p>
        </div>
      ),
    },
    {
      key: 'city', header: 'City',
      render: (d: Depot) => <span className="text-sm text-[var(--c-muted)]">{d.city ?? '—'}</span>,
    },
    {
      key: 'coords', header: 'Coordinates',
      render: (d: Depot) => d.latitude
        ? (
          <span className="text-xs font-mono text-[var(--c-muted)]">
            {d.latitude.toFixed(4)}, {d.longitude?.toFixed(4)}
          </span>
        )
        : <span className="text-xs text-[var(--c-muted)]">—</span>,
    },
    {
      key: 'active', header: 'Active', width: '80px',
      render: (d: Depot) => (
        <Toggle value={d.is_active} onChange={(val) => toggleMutation.mutate({ id: d.id, is_active: val })} />
      ),
    },
    {
      key: 'actions', header: '', width: '48px',
      render: (d: Depot) => (
        <button
          onClick={() => handleOpen(d)}
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
            placeholder="Search depots…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClass="flex-1 max-w-xs"
          />
          <Button onClick={() => handleOpen()}>
            <Plus size={15} /> Add Depot
          </Button>
          <p className="text-xs text-[var(--c-muted)] ml-auto">
            {(depots as Depot[]).filter((d) => d.is_active).length} active · {(depots as Depot[]).length} total
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
            emptyMessage="No depots yet. Add your first depot to get started."
          />
        </div>
      </div>

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={handleClose}
        title={editingDepot ? 'Edit Depot' : 'Add Depot'}
      >
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <FormField label="Name" error={errors.name?.message} required>
            <Input {...register('name')} placeholder="Koramangala Depot" error={errors.name?.message} />
          </FormField>
          <FormField label="Address">
            <Input {...register('address')} placeholder="123, 5th Block…" />
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
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={mutation.isPending} className="flex-1">
              {editingDepot ? 'Update Depot' : 'Create Depot'}
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
