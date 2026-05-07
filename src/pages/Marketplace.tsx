import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Zap, CheckCircle2, XCircle, Clock, RefreshCw, Truck, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AppShell }   from '../components/layout/AppShell'
import { Button }     from '../components/ui/Button'
import { Input }      from '../components/ui/Input'
import { Modal }      from '../components/ui/Modal'
import { Skeleton }   from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import {
  fetchOffers, createOffer, cancelOffer,
  fetchMyRequests, createRequest,
  fetchMatches, respondToMatch, triggerMatchEngine,
} from '../api/marketplace'
import type { CapacityOffer, CapacityRequest, CapacityMatch } from '../api/marketplace'
import { useAuthStore } from '../store'

type Tab = 'offers' | 'requests' | 'matches'

const offerSchema = z.object({
  offer_date:    z.string().min(1, 'Required'),
  driver_count:  z.coerce.number().int().positive(),
  zone:          z.string().min(1, 'Required'),
  vehicle_type:  z.string().optional(),
  rate_per_stop: z.coerce.number().optional(),
})
const requestSchema = z.object({
  request_date: z.string().min(1, 'Required'),
  order_count:  z.coerce.number().int().positive(),
  zone:         z.string().min(1, 'Required'),
  priority:     z.enum(['NORMAL', 'HIGH']),
})

type OfferForm   = z.infer<typeof offerSchema>
type RequestForm = z.infer<typeof requestSchema>

const statusIcon = (s: string) => {
  if (s === 'OPEN')    return <Clock       size={13} className="text-amber-400" />
  if (s === 'MATCHED') return <CheckCircle2 size={13} className="text-green-400" />
  if (s === 'ACCEPTED')return <CheckCircle2 size={13} className="text-green-400" />
  if (s === 'EXPIRED' || s === 'REJECTED') return <XCircle size={13} className="text-red-400" />
  return <Clock size={13} className="text-[var(--c-muted)]" />
}

const statusColor: Record<string, string> = {
  OPEN:               'text-amber-400 bg-amber-400/10',
  MATCHED:            'text-green-400 bg-green-400/10',
  ACCEPTED:           'text-green-400 bg-green-400/10',
  CANCELLED:          'text-[var(--c-muted)] bg-[var(--c-elevated)]',
  EXPIRED:            'text-red-400 bg-red-400/10',
  REJECTED:           'text-red-400 bg-red-400/10',
  PENDING_ACCEPTANCE: 'text-amber-400 bg-amber-400/10',
  COMPLETED:          'text-blue-400 bg-blue-400/10',
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString([], { dateStyle: 'medium' }) : '—'

export default function Marketplace() {
  const qc = useQueryClient()
  const tenantId = useAuthStore((s) => s.user?.tenant_id ?? '')
  const [tab,            setTab]            = useState<Tab>('offers')
  const [showOffer,      setShowOffer]      = useState(false)
  const [showRequest,    setShowRequest]    = useState(false)

  const { data: offers   = [], isLoading: ol } = useQuery({ queryKey: ['mp-offers'],   queryFn: () => fetchOffers() })
  const { data: requests = [], isLoading: rl } = useQuery({ queryKey: ['mp-requests'], queryFn: fetchMyRequests })
  const { data: matches  = [], isLoading: ml } = useQuery({ queryKey: ['mp-matches'],  queryFn: () => fetchMatches() })

  const offerMut = useMutation({
    mutationFn: createOffer,
    onSuccess: () => { toast.success('Offer posted'); qc.invalidateQueries({ queryKey: ['mp-offers'] }); setShowOffer(false); offerReset() },
    onError:   () => toast.error('Failed to post offer'),
  })
  const requestMut = useMutation({
    mutationFn: createRequest,
    onSuccess: () => { toast.success('Request submitted'); qc.invalidateQueries({ queryKey: ['mp-requests'] }); setShowRequest(false); reqReset() },
    onError:   () => toast.error('Failed to submit request'),
  })
  const cancelMut = useMutation({
    mutationFn: cancelOffer,
    onSuccess: () => { toast.success('Offer cancelled'); qc.invalidateQueries({ queryKey: ['mp-offers'] }) },
    onError:   () => toast.error('Failed to cancel offer'),
  })
  const respondMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'REJECTED' }) => respondToMatch(id, status),
    onSuccess: () => { toast.success('Response sent'); qc.invalidateQueries({ queryKey: ['mp-matches'] }) },
    onError:   () => toast.error('Failed to respond'),
  })
  const matchNowMut = useMutation({
    mutationFn: triggerMatchEngine,
    onSuccess: (r) => { toast.success(`Match engine: ${r.matches_created} match(es) created`); qc.invalidateQueries({ queryKey: ['mp-matches', 'mp-offers', 'mp-requests'] }) },
    onError:   () => toast.error('Match engine error'),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register: offerReg, handleSubmit: offerSubmit, reset: offerReset, formState: { errors: offerErrs } } = useForm<any>({ resolver: zodResolver(offerSchema) })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register: reqReg, handleSubmit: reqSubmit, reset: reqReset, formState: { errors: reqErrs } } = useForm<any>({ resolver: zodResolver(requestSchema), defaultValues: { priority: 'NORMAL' } })

  const pendingMatches = matches.filter((m) => m.status === 'PENDING_ACCEPTANCE' && m.requesting_tenant_id === tenantId)

  return (
    <AppShell>
      <div className="p-6 space-y-5" style={{ animation: 'page-slide-in 0.22s ease' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text)]">Capacity Marketplace</h1>
            <p className="text-sm text-[var(--c-muted)] mt-0.5">
              Buy and sell excess fleet capacity across tenants
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => matchNowMut.mutate()} disabled={matchNowMut.isPending}>
              <RefreshCw size={13} className="mr-1.5" /> Run Match
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowRequest(true)}>
              <Plus size={13} className="mr-1.5" /> Request Capacity
            </Button>
            <Button size="sm" onClick={() => setShowOffer(true)}>
              <Plus size={13} className="mr-1.5" /> Post Offer
            </Button>
          </div>
        </div>

        {/* Pending matches alert */}
        {pendingMatches.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-400/30 bg-amber-400/8 text-amber-400 text-sm">
            <Zap size={16} className="shrink-0" />
            <span>
              <strong>{pendingMatches.length}</strong> pending match{pendingMatches.length > 1 ? 'es' : ''} waiting for your response
            </span>
            <button onClick={() => setTab('matches')} className="ml-auto underline text-xs">View →</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--c-elevated)' }}>
          {(['offers', 'requests', 'matches'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150"
              style={{
                background: tab === t ? 'var(--c-surface)' : 'transparent',
                color:      tab === t ? 'var(--c-text)'    : 'var(--c-muted)',
                boxShadow:  tab === t ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {t} {t === 'matches' && matches.length > 0 && <span className="ml-1 text-[10px]">({matches.length})</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'offers' && (
          ol ? <Skeleton className="h-48 rounded-xl" /> :
          offers.length === 0 ? <EmptyState title="No open offers" subtitle="Post excess driver capacity to attract requests from other fleets." /> :
          <div className="space-y-2">
            {offers.map((o) => (
              <OfferCard key={o.id} offer={o} ownTenantId={tenantId}
                onCancel={() => cancelMut.mutate(o.id)} />
            ))}
          </div>
        )}

        {tab === 'requests' && (
          rl ? <Skeleton className="h-48 rounded-xl" /> :
          requests.length === 0 ? <EmptyState title="No requests yet" subtitle="Request capacity when you have overflow orders." /> :
          <div className="space-y-2">
            {requests.map((r) => <RequestCard key={r.id} req={r} />)}
          </div>
        )}

        {tab === 'matches' && (
          ml ? <Skeleton className="h-48 rounded-xl" /> :
          matches.length === 0 ? <EmptyState title="No matches yet" subtitle="Matches appear here once the engine pairs an offer with a request." /> :
          <div className="space-y-2">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} ownTenantId={tenantId}
                onRespond={(status) => respondMut.mutate({ id: m.id, status })}
                responding={respondMut.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post offer modal */}
      <Modal open={showOffer} onClose={() => { setShowOffer(false); offerReset() }} title="Post Capacity Offer">
        <form onSubmit={offerSubmit((d) => offerMut.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Date</label>
              <Input type="date" {...offerReg('offer_date')} className="mt-1" />
              {offerErrs.offer_date && <p className="err">{String(offerErrs.offer_date.message ?? '')}</p>}
            </div>
            <div>
              <label className="field-label">Drivers Available</label>
              <Input type="number" min={1} {...offerReg('driver_count')} className="mt-1" />
              {offerErrs.driver_count && <p className="err">{String(offerErrs.driver_count.message ?? '')}</p>}
            </div>
          </div>
          <div>
            <label className="field-label">Zone / Area</label>
            <Input {...offerReg('zone')} placeholder="e.g. Koramangala" className="mt-1" />
            {offerErrs.zone && <p className="err">{String(offerErrs.zone.message ?? '')}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Vehicle Type <span className="font-normal opacity-60">(optional)</span></label>
              <select {...offerReg('vehicle_type')}
                className="mt-1 w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] px-3 py-2 text-sm">
                <option value="">Any</option>
                <option>VAN</option><option>TRUCK</option><option>BIKE</option>
              </select>
            </div>
            <div>
              <label className="field-label">Rate / Stop ₹ <span className="font-normal opacity-60">(optional)</span></label>
              <Input type="number" step="0.5" {...offerReg('rate_per_stop')} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={() => setShowOffer(false)}>Cancel</Button>
            <Button type="submit" disabled={offerMut.isPending}>{offerMut.isPending ? 'Posting…' : 'Post Offer'}</Button>
          </div>
        </form>
      </Modal>

      {/* Request capacity modal */}
      <Modal open={showRequest} onClose={() => { setShowRequest(false); reqReset() }} title="Request Capacity">
        <form onSubmit={reqSubmit((d) => requestMut.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Date Needed</label>
              <Input type="date" {...reqReg('request_date')} className="mt-1" />
              {reqErrs.request_date && <p className="err">{String(reqErrs.request_date.message ?? '')}</p>}
            </div>
            <div>
              <label className="field-label">Orders to Cover</label>
              <Input type="number" min={1} {...reqReg('order_count')} className="mt-1" />
              {reqErrs.order_count && <p className="err">{String(reqErrs.order_count.message ?? '')}</p>}
            </div>
          </div>
          <div>
            <label className="field-label">Zone / Area</label>
            <Input {...reqReg('zone')} placeholder="e.g. Koramangala" className="mt-1" />
            {reqErrs.zone && <p className="err">{String(reqErrs.zone.message ?? '')}</p>}
          </div>
          <div>
            <label className="field-label">Priority</label>
            <select {...reqReg('priority')}
              className="mt-1 w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] px-3 py-2 text-sm">
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={() => setShowRequest(false)}>Cancel</Button>
            <Button type="submit" disabled={requestMut.isPending}>{requestMut.isPending ? 'Submitting…' : 'Submit Request'}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}

function OfferCard({ offer, ownTenantId, onCancel }: { offer: CapacityOffer; ownTenantId: string; onCancel: () => void }) {
  const isOwn = offer.tenant_id === ownTenantId
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[var(--c-border)] hover:border-[var(--c-accent-dim)] transition-colors" style={{ background: 'var(--c-surface)' }}>
      <Truck size={18} className="text-[var(--c-muted)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--c-text)]">
          {offer.driver_count} driver{offer.driver_count > 1 ? 's' : ''} · {offer.zone}
          {offer.vehicle_type && <span className="ml-2 text-xs text-[var(--c-muted)]">{offer.vehicle_type}</span>}
        </p>
        <p className="text-xs text-[var(--c-muted)] mt-0.5">
          {fmt(offer.offer_date)}
          {offer.rate_per_stop != null && <> · ₹{offer.rate_per_stop}/stop</>}
        </p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[offer.status] ?? ''}`}>
        {offer.status}
      </span>
      {isOwn && offer.status === 'OPEN' && (
        <button onClick={onCancel} className="text-[var(--c-muted)] hover:text-red-400 transition-colors">
          <X size={14} />
        </button>
      )}
      {!isOwn && <span className="text-[10px] text-[var(--c-muted)]">external</span>}
    </div>
  )
}

function RequestCard({ req }: { req: CapacityRequest }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[var(--c-border)]" style={{ background: 'var(--c-surface)' }}>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--c-text)]">{req.order_count} orders · {req.zone}</p>
        <p className="text-xs text-[var(--c-muted)] mt-0.5">{fmt(req.request_date)} · {req.priority} priority</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[req.status] ?? ''}`}>
        {req.status}
      </span>
    </div>
  )
}

function MatchCard({ match, ownTenantId, onRespond, responding }: {
  match: CapacityMatch; ownTenantId: string
  onRespond: (s: 'ACCEPTED' | 'REJECTED') => void; responding: boolean
}) {
  const isRequester = match.requesting_tenant_id === ownTenantId
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[var(--c-border)]" style={{ background: 'var(--c-surface)' }}>
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--c-text)]">{match.matched_orders} orders covered</p>
        <p className="text-xs text-[var(--c-muted)] mt-0.5">
          {isRequester ? 'You are requesting · ' : 'You are offering · '}
          {fmt(match.created_at)}
        </p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[match.status] ?? ''}`}>
        {match.status.replace('_', ' ')}
      </span>
      {isRequester && match.status === 'PENDING_ACCEPTANCE' && (
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => onRespond('ACCEPTED')} disabled={responding}>Accept</Button>
          <Button size="sm" variant="danger" onClick={() => onRespond('REJECTED')} disabled={responding}>Reject</Button>
        </div>
      )}
    </div>
  )
}
