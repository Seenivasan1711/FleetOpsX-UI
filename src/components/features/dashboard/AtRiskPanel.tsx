import { useQuery }            from '@tanstack/react-query'
import toast                   from 'react-hot-toast'
import { fetchAtRiskStops }    from '../../../api/sla'
import { fetchSuggestions }    from '../../../api/agentSuggestions'
import { useMockData }         from '../../../mock/config'
import { MOCK_AT_RISK }        from '../../../mock/data'
import type { MockAtRiskItem } from '../../../mock/data'

function SpinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/>
    </svg>
  )
}

export const AtRiskPanel = ({ planDate }: { planDate?: string }) => {
  const isMock = useMockData()
  const date = planDate ?? new Date().toISOString().slice(0, 10)

  const { data: atRiskStops } = useQuery({
    queryKey: ['at-risk-stops', date],
    queryFn:  () => fetchAtRiskStops(date),
    enabled:  !isMock,
    refetchInterval: 30_000,
  })

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', date, 'PENDING'],
    queryFn:  () => fetchSuggestions(date, 'PENDING'),
    enabled:  !isMock,
    refetchInterval: 30_000,
  })

  // Map API data → UI shape, or fall back to mock
  const items: MockAtRiskItem[] = isMock
    ? MOCK_AT_RISK
    : (atRiskStops ?? []).map(stop => {
        const match = (suggestions ?? []).find(
          s => (s.context as Record<string, unknown>)?.order_id === stop.order_id
        )
        return {
          id:         stop.order_id,
          address:    stop.delivery_address,
          minsLate:   stop.overdue_by_minutes,
          reason:     stop.reason
            ?? `${stop.driver_name} running ${stop.overdue_by_minutes} min late`,
          suggestion: match?.title ?? 'AI is analyzing this stop…',
        }
      })

  return (
    <div
      className="rounded-2xl"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--c-border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-[var(--c-text)]">At-Risk Inbox</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-muted)' }}>
            {items.length} SLAs need attention
          </p>
        </div>
        <span
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[13px] font-bold"
          style={{ background: 'var(--c-red-dim)', color: 'var(--c-red)' }}
        >
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="p-4 flex flex-col gap-0">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="flex flex-col gap-2"
            style={{
              paddingTop:    idx === 0 ? 4 : 16,
              paddingBottom: 16,
              borderBottom:  idx < items.length - 1 ? '1px solid var(--c-border)' : 'none',
            }}
          >
            {/* Order ID + delay badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-mono font-semibold" style={{ color: 'var(--c-accent)' }}>
                {item.id}
              </span>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
              >
                {item.minsLate} min late
              </span>
            </div>

            {/* Address */}
            <p className="text-[16px] font-bold leading-snug text-[var(--c-text)]">
              {item.address}
            </p>

            {/* Reason */}
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--c-muted)' }}>
              {item.reason}
            </p>

            {/* AI suggestion action */}
            <button
              onClick={() => toast(`AI: ${item.suggestion}`, { icon: '🤖' })}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-[12.5px] font-medium text-left transition-all"
              style={{ background: 'var(--c-accent-dim)', color: 'var(--c-accent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              <SpinIcon />
              <span>{item.suggestion}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
