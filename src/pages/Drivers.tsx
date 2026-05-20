import { useState, useRef, type ChangeEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Download, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }       from '../components/layout/AppShell'
import { Button }         from '../components/ui/Button'
import { Input, SearchInput } from '../components/ui/Input'
import { Modal }          from '../components/ui/Modal'
import { Toggle }         from '../components/ui/Toggle'
import DataTable          from '../components/shared/DataTable'
import FormField          from '../components/shared/FormField'
import { fetchDrivers, createDriver, updateDriver } from '../api/drivers'
import { exportDrivers, importDrivers, triggerBlobDownload } from '../api/exportImport'
import { fetchDepots }    from '../api/depots'
import { QUERY_KEYS }     from '../lib/utils/constants'
import { initials }       from '../lib/utils/format'
import { useMockData }    from '../mock/config'
import type { Driver, Depot, DriverAvailability } from '../types'

// ── Mock overlay (keyed by driver name) ──────────────────────────────────────

const MOCK_DRIVER_TABLE: Record<string, {
  display_id:  string
  phone:       string
  vehicle:     string
  status:      string
  stopsToday:  number
  util:        number
  score:       number
  eta:         string
}> = {
  'Arjun Mehta':  { display_id: 'D-001', phone: '+91 98765 43210', vehicle: 'KA-01-MG-1234', status: 'On Route', stopsToday: 9,  util: 72, score: 88, eta: '15:30' },
  'Priya Sharma': { display_id: 'D-002', phone: '+91 87654 32109', vehicle: 'KA-03-HG-5678', status: 'On Route', stopsToday: 7,  util: 58, score: 92, eta: '16:15' },
  'Sneha Reddy':  { display_id: 'D-003', phone: '+91 76543 21098', vehicle: 'KA-05-AB-2345', status: 'On Route', stopsToday: 11, util: 84, score: 95, eta: '17:00' },
  'Vikram Singh': { display_id: 'D-004', phone: '+91 65432 10987', vehicle: 'KA-02-CD-9012', status: 'At Risk',  stopsToday: 6,  util: 65, score: 74, eta: '17:45' },
  'Rohan Das':    { display_id: 'D-005', phone: '+91 54321 09876', vehicle: 'KA-04-EF-3456', status: 'On Break', stopsToday: 3,  util: 38, score: 81, eta: '—'     },
  'Ananya Iyer':  { display_id: 'D-006', phone: '+91 43210 98765', vehicle: 'KA-06-GH-7890', status: 'Idle',     stopsToday: 0,  util: 0,  score: 89, eta: '—'     },
  'Rahul Iyer':   { display_id: 'D-007', phone: '+91 32109 87654', vehicle: 'KA-07-IJ-1234', status: 'Idle',     stopsToday: 0,  util: 0,  score: 77, eta: '—'     },
}

const MOCK_DRIVER_NAMES = Object.keys(MOCK_DRIVER_TABLE)

// ── Unified display type ──────────────────────────────────────────────────────

type DisplayRow = {
  id:          string
  display_id:  string
  full_name:   string
  phone:       string
  vehicle:     string
  status:      string
  stopsToday:  number | null
  util:        number | null
  score:       number | null
  eta:         string
  _driver:     Driver | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  'On Route': '#34d399',
  'At Risk':  '#f87171',
  'On Break': '#f59e0b',
  'Available':'#34d399',
  'Idle':     '#94a3b8',
  'Off Duty': '#475569',
}

const AVAIL_STATUS: Record<DriverAvailability, string> = {
  AVAILABLE: 'Available',
  ON_BREAK:  'On Break',
  OFF_DUTY:  'Off Duty',
}

function scoreColor(s: number): string {
  if (s >= 90) return '#34d399'
  if (s >= 75) return '#06b6d4'
  if (s >= 60) return '#f59e0b'
  return '#f87171'
}

function driverToRow(d: Driver, index: number): DisplayRow {
  const mock = MOCK_DRIVER_TABLE[d.full_name]
  return {
    id:         d.id,
    display_id: mock?.display_id ?? `D-${String(index + 1).padStart(3, '0')}`,
    full_name:  d.full_name,
    phone:      mock?.phone ?? d.phone ?? '—',
    vehicle:    mock?.vehicle ?? '—',
    status:     mock?.status ?? AVAIL_STATUS[d.availability_status ?? 'AVAILABLE'],
    stopsToday: mock?.stopsToday ?? null,
    util:       mock?.util ?? d.utilization_pct ?? null,
    score:      mock?.score ?? d.performance_score ?? null,
    eta:        mock?.eta ?? '—',
    _driver:    d,
  }
}

// ── Schema ────────────────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Drivers() {
  const isMock = useMockData()
  const qc     = useQueryClient()

  const [modalOpen,     setModalOpen]     = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [search,        setSearch]        = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.drivers,
    queryFn:  () => fetchDrivers({ active_only: false }),
    enabled:  !isMock,
  })

  const { data: depots = [] } = useQuery({
    queryKey: QUERY_KEYS.depots,
    queryFn:  () => fetchDepots({ active_only: true }),
    enabled:  !isMock,
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

  // ── Build display rows ──────────────────────────────────────────────────────

  const q = search.toLowerCase()

  const displayRows: DisplayRow[] = isMock
    ? MOCK_DRIVER_NAMES
        .filter((name) => name.toLowerCase().includes(q) || MOCK_DRIVER_TABLE[name]!.phone.includes(q))
        .map((name, i) => {
          const m = MOCK_DRIVER_TABLE[name]!
          return {
            id:         `mock-${i}`,
            display_id: m.display_id,
            full_name:  name,
            phone:      m.phone,
            vehicle:    m.vehicle,
            status:     m.status,
            stopsToday: m.stopsToday,
            util:       m.util,
            score:      m.score,
            eta:        m.eta,
            _driver:    null,
          }
        })
    : (drivers as Driver[])
        .filter((d) => d.full_name.toLowerCase().includes(q) || (d.phone ?? '').includes(q))
        .map((d, i) => driverToRow(d, i))

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'driver', header: 'Driver',
      render: (row: DisplayRow) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            {initials(row.full_name)}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--c-text)] leading-tight">{row.full_name}</p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--c-muted)' }}>
              {row.display_id} · {row.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle', header: 'Vehicle',
      render: (row: DisplayRow) => (
        <span className="text-[12px] font-mono font-semibold text-[var(--c-text)]">{row.vehicle}</span>
      ),
    },
    {
      key: 'status', header: 'Status', width: '110px',
      render: (row: DisplayRow) => {
        const color = STATUS_COLORS[row.status] ?? '#94a3b8'
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: `${color}1a`, color }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
            {row.status}
          </span>
        )
      },
    },
    {
      key: 'stops', header: 'Stops Today', width: '100px',
      render: (row: DisplayRow) => (
        <span className="text-[13px] font-bold tabular-nums text-[var(--c-text)]">
          {row.stopsToday ?? '—'}
        </span>
      ),
    },
    {
      key: 'util', header: 'Utilization', width: '130px',
      render: (row: DisplayRow) => {
        if (row.util == null) return <span className="text-xs text-[var(--c-muted)]">—</span>
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-elevated)' }}>
              <div style={{ width: `${row.util}%`, background: 'var(--c-accent)', height: '100%' }} />
            </div>
            <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--c-muted)' }}>
              {row.util}%
            </span>
          </div>
        )
      },
    },
    {
      key: 'score', header: 'Score', width: '130px',
      render: (row: DisplayRow) => {
        if (row.score == null) return <span className="text-xs text-[var(--c-muted)]">—</span>
        const c = scoreColor(row.score)
        return (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[var(--c-text)] w-7 shrink-0 tabular-nums">
              {row.score}
            </span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-elevated)' }}>
              <div style={{ width: `${row.score}%`, background: c, height: '100%' }} />
            </div>
          </div>
        )
      },
    },
    {
      key: 'eta', header: 'ETA Next', width: '90px',
      render: (row: DisplayRow) => (
        <span className="text-[12px] font-mono text-[var(--c-text)]">{row.eta}</span>
      ),
    },
    ...(!isMock ? [
      {
        key: 'active', header: 'Active', width: '72px',
        render: (row: DisplayRow) => row._driver ? (
          <Toggle
            value={row._driver.is_active}
            onChange={(val) => toggleMutation.mutate({ id: row._driver!.id, is_active: val })}
          />
        ) : null,
      },
      {
        key: 'actions', header: '', width: '48px',
        render: (row: DisplayRow) => row._driver ? (
          <button
            onClick={() => handleOpen(row._driver!)}
            className="p-1.5 rounded-lg transition-colors text-[var(--c-muted)] hover:text-[var(--c-text)]"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil size={14} />
          </button>
        ) : null,
      },
    ] : []),
  ]

  const handleExport = async () => {
    if (isMock) {
      const header = 'display_id,full_name,phone,vehicle,status,stops_today,utilization,score,eta'
      const rows = Object.entries(MOCK_DRIVER_TABLE).map(([name, m]) =>
        `${m.display_id},"${name}",${m.phone},${m.vehicle},${m.status},${m.stopsToday},${m.util},${m.score},${m.eta}`
      )
      triggerBlobDownload(new Blob([[header, ...rows].join('\n')], { type: 'text/csv' }), 'drivers.csv')
      return
    }
    setExportLoading(true)
    try {
      const blob = await exportDrivers()
      triggerBlobDownload(blob, 'drivers.csv')
    } catch {
      toast.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (isMock) {
      const lines = (await file.text()).trim().split('\n').slice(1).filter(Boolean)
      toast.success(`Import complete — ${lines.length} records loaded (demo)`)
      return
    }
    setImportLoading(true)
    try {
      const result = await importDrivers(file)
      toast.success(`Import complete — ${result.created} records loaded`)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.drivers })
    } catch {
      toast.error('Import failed')
    } finally {
      setImportLoading(false)
    }
  }

  const activeCount = isMock
    ? MOCK_DRIVER_NAMES.length
    : (drivers as Driver[]).filter((d) => d.is_active).length

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
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exportLoading}>
            <Download size={14} /> Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => importRef.current?.click()} loading={importLoading}>
            <Upload size={14} /> Import
          </Button>
          <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          {!isMock && (
            <Button onClick={() => handleOpen()}>
              <Plus size={15} /> Add Driver
            </Button>
          )}
          <p className="text-xs text-[var(--c-muted)] ml-auto">
            {activeCount} active · {isMock ? MOCK_DRIVER_NAMES.length : (drivers as Driver[]).length} total
          </p>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
        >
          <DataTable
            columns={columns}
            data={displayRows}
            isLoading={!isMock && isLoading}
            emptyMessage="No drivers yet. Add your first driver to get started."
          />
        </div>
      </div>

      {/* Form modal (live mode only) */}
      {!isMock && (
        <Modal open={modalOpen} onClose={handleClose} title={editingDriver ? 'Edit Driver' : 'Add Driver'}>
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
      )}
    </AppShell>
  )
}
