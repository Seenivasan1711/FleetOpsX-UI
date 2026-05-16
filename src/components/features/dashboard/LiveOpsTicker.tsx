import { useQuery }           from '@tanstack/react-query'
import { fetchSuggestions }  from '../../../api/agentSuggestions'
import { useMockData }       from '../../../mock/config'
import { MOCK_TICKER_ITEMS } from '../../../mock/data'
import type { MockTickerItem } from '../../../mock/data'

type Props = {
  orders?:   unknown[]
  drivers?:  unknown[]
  planDate?: string
}

function ItemIcon({ type, variant }: Pick<MockTickerItem, 'type' | 'variant'>) {
  const which = variant ?? typeToVariant[type]
  if (which === 'truck') return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="12" height="9" rx="1" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" />
    </svg>
  )
  if (which === 'lightning') return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
    </svg>
  )
  if (which === 'warning') return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
  if (which === 'dot') return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
  // check (default success)
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const typeToVariant: Record<MockTickerItem['type'], MockTickerItem['variant']> = {
  success:  'check',
  info:     'lightning',
  warning:  'warning',
  critical: 'dot',
}

/** Render item text with bold+mono spans for each substring listed in item.bold. */
function renderTickerText(item: MockTickerItem): React.ReactNode {
  if (item.bold.length === 0) return item.text

  // Build a regex that matches any of the bold substrings
  const escaped = item.bold.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g')
  const parts = item.text.split(pattern)

  return parts.map((part, i) =>
    item.bold.includes(part)
      ? (
          <strong
            key={i}
            style={{ color: '#e2e8f0', fontWeight: 700, fontFamily: 'ui-monospace, "SF Mono", monospace', letterSpacing: '-0.01em' }}
          >
            {part}
          </strong>
        )
      : part
  )
}

export function LiveOpsTicker({ orders: _orders, drivers: _drivers, planDate }: Props) {
  const isMock = useMockData()
  const date   = planDate ?? new Date().toISOString().slice(0, 10)

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', date, 'PENDING'],
    queryFn:  () => fetchSuggestions(date, 'PENDING'),
    enabled:  !isMock,
    refetchInterval: 30_000,
  })

  // Derive ticker items from live suggestions when not mocked
  const items: MockTickerItem[] = isMock
    ? MOCK_TICKER_ITEMS
    : (suggestions ?? []).map((s) => {
        const typeMap: Record<string, MockTickerItem['type']> = {
          EARLY_SLA_WARNING: 'warning',
          REPLAN_DRIVER:     'warning',
          DEMAND_WARNING:    'info',
          RESCHEDULE_STOP:   'critical',
        }
        const variantMap: Record<string, MockTickerItem['variant']> = {
          EARLY_SLA_WARNING: 'warning',
          REPLAN_DRIVER:     'truck',
          DEMAND_WARNING:    'lightning',
          RESCHEDULE_STOP:   'warning',
        }
        const type    = s.priority === 'HIGH' ? 'critical' as const : (typeMap[s.suggestion_type] ?? 'warning' as const)
        const variant = variantMap[s.suggestion_type] ?? 'warning' as const
        // Extract order IDs from title to bold them
        const bold = (s.title.match(/[A-Z]{2,}-\d{4}-\d+/g) ?? [])
        return { id: s.id, type, variant, text: s.title, bold }
      })

  // Fall back to mock items if suggestions are empty so ticker is never blank
  const displayItems = items.length > 0 ? items : MOCK_TICKER_ITEMS

  // Repeat enough sets so the track always exceeds the viewport width.
  const minSets = Math.max(2, Math.ceil(8 / displayItems.length))
  const trackItems = Array.from({ length: minSets }, (_, s) =>
    displayItems.map((item, i) => ({ ...item, _key: `${s}-${i}` }))
  ).flat()

  const tickerEnd = `${(-(100 / minSets)).toFixed(4)}%`
  const duration  = Math.max(displayItems.length * 5, 5)

  return (
    <div
      className="flex items-center overflow-hidden"
      style={{
        background:   'var(--c-surface)',
        border:       '1px solid var(--c-border)',
        borderRadius: 12,
        height:       36,
      }}
    >
      {/* LIVE OPS label */}
      <div className="flex items-center gap-2 pl-4 pr-3 shrink-0 h-full">
        <span
          className="w-[6px] h-[6px] rounded-full shrink-0"
          style={{
            background: '#6ee7b7',
            boxShadow:  '0 0 0 2px rgba(110,231,183,0.25)',
            animation:  'pulse-dot 2s ease-in-out infinite',
          }}
        />
        <span
          className="text-[10px] font-bold tracking-[1.8px] uppercase whitespace-nowrap select-none"
          style={{ color: 'var(--c-muted)' }}
        >
          Live Ops
        </span>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-hidden relative h-full">
        {/* Fade masks */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{ width: 80, background: 'linear-gradient(to right, var(--c-surface) 25%, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{ width: 80, background: 'linear-gradient(to left, var(--c-surface) 25%, transparent)' }}
        />

        {/* Scrolling track */}
        <div
          className="flex items-center h-full whitespace-nowrap"
          style={{
            animation:    `ticker-scroll ${duration}s linear infinite`,
            willChange:   'transform',
            width:        'max-content',
            '--ticker-end': tickerEnd,
          } as React.CSSProperties}
        >
          {trackItems.map((item) => (
            <span
              key={item._key}
              className="inline-flex items-center gap-[7px] h-full text-[12px]"
              style={{ paddingLeft: 36 }}
            >
              <span
                style={{ color: 'var(--c-accent)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <ItemIcon type={item.type} variant={item.variant} />
              </span>
              <span style={{ color: '#adb5c7', fontSize: 12 }}>
                {renderTickerText(item)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
