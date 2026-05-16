import { useQuery }         from '@tanstack/react-query'
import { fetchFleetAvailability } from '../../../api/fleet'
import { useMockData }     from '../../../mock/config'
import { MOCK_FLEET }      from '../../../mock/data'
import type { MockSegment } from '../../../mock/data'

type CardData = {
  title:    string
  total:    number
  unit?:    string
  icon:     React.ReactNode
  iconBg:   string
  segments: MockSegment[]
}

function SegmentBar({ segments, total }: { segments: MockSegment[]; total: number }) {
  return (
    <div className="flex h-[6px] rounded-full overflow-hidden gap-[2px]">
      {segments.map((s) => (
        <div
          key={s.label}
          style={{ flex: s.value / total, background: s.color, borderRadius: 999 }}
        />
      ))}
    </div>
  )
}

function FleetCard({ card }: { card: CardData }) {
  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-2xl"
      style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: card.iconBg }}
        >
          {card.icon}
        </div>
        <div>
          <p className="text-[15px] font-bold text-[var(--c-text)]">{card.title}</p>
          <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--c-muted)' }}>
            {card.total} total
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <SegmentBar segments={card.segments} total={card.total} />

      {/* Legend */}
      <div className="flex flex-col gap-2.5">
        {card.segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-[13px]" style={{ color: 'var(--c-muted)' }}>
                {s.label}
              </span>
            </div>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--c-text)' }}>
              {s.value}{card.unit ?? ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FleetStatusCards() {
  const isMock = useMockData()
  const { data: fleet } = useQuery({
    queryKey: ['fleet-availability'],
    queryFn:  fetchFleetAvailability,
    enabled:  !isMock,
    refetchInterval: 60_000,
  })

  // Build the 3-card data from either real API or mock
  let cards: CardData[]

  if (isMock || !fleet) {
    cards = [
      {
        title:  'Drivers',
        total:  MOCK_FLEET.driversTotal,
        iconBg: 'rgba(139,92,246,0.18)',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
        segments: MOCK_FLEET.drivers,
      },
      {
        title:  'Vehicles',
        total:  MOCK_FLEET.vehiclesTotal,
        iconBg: 'rgba(34,211,238,0.14)',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="12" height="9" rx="1"/>
            <path d="M14 10h4l3 3v3h-7"/>
            <circle cx="7"  cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        ),
        segments: MOCK_FLEET.vehicles,
      },
      {
        title:  'Efficiency',
        total:  MOCK_FLEET.efficiencyTotal,
        unit:   '%',
        iconBg: 'rgba(52,211,153,0.14)',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
          </svg>
        ),
        segments: MOCK_FLEET.efficiency,
      },
    ]
  } else {
    // Compute on_route as remainder if BE does not supply it yet
    const onRoute = fleet.drivers.on_route
      ?? Math.max(0, fleet.drivers.total - fleet.drivers.available - fleet.drivers.on_break - fleet.drivers.off_duty)

    const driversSegments: MockSegment[] = [
      { label: 'Available', value: fleet.drivers.available, color: '#34d399' },
      { label: 'On Route',  value: onRoute,                 color: '#60a5fa' },
      { label: 'On Break',  value: fleet.drivers.on_break,  color: '#f59e0b' },
      { label: 'Off Duty',  value: fleet.drivers.off_duty,  color: '#505065' },
    ]

    const vehiclesSegments: MockSegment[] = [
      { label: 'Available',   value: fleet.vehicles.available,   color: '#34d399' },
      { label: 'In Use',      value: fleet.vehicles.in_use,      color: '#60a5fa' },
      { label: 'Maintenance', value: fleet.vehicles.maintenance, color: '#f59e0b' },
      { label: 'Low Fuel',    value: fleet.vehicles.low_fuel,    color: '#f87171' },
    ]

    // Efficiency: use real data if BE provides it; fall back to mock segments.
    // TODO: remove MOCK_FLEET.efficiency fallback once BE endpoint is implemented.
    const efficiencySegments: MockSegment[] = fleet.efficiency
      ? [
          { label: 'Capacity used', value: fleet.efficiency.capacity_used_pct, color: '#34d399' },
          { label: 'Idle time',     value: fleet.efficiency.idle_time_pct,     color: '#f59e0b' },
          { label: 'Avg detour',    value: fleet.efficiency.avg_detour_pct,    color: '#f87171' },
        ]
      : MOCK_FLEET.efficiency

    cards = [
      {
        title:    'Drivers',
        total:    fleet.drivers.total,
        iconBg:   'rgba(139,92,246,0.18)',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
        segments: driversSegments,
      },
      {
        title:    'Vehicles',
        total:    fleet.vehicles.total,
        iconBg:   'rgba(34,211,238,0.14)',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="12" height="9" rx="1"/>
            <path d="M14 10h4l3 3v3h-7"/>
            <circle cx="7"  cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        ),
        segments: vehiclesSegments,
      },
      {
        title:    'Efficiency',
        total:    100,
        unit:     '%',
        iconBg:   'rgba(52,211,153,0.14)',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
          </svg>
        ),
        segments: efficiencySegments,
      },
    ]
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <FleetCard key={card.title} card={card} />
      ))}
    </div>
  )
}
