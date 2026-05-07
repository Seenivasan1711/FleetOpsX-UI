type Entry = { driverName: string; color: string; stopCount: number }

type Props = { entries: Entry[] }

export default function MapLegend({ entries }: Props) {
  if (entries.length === 0) return null
  return (
    <div
      style={{
        position:      'absolute',
        bottom:        24,
        right:         16,
        zIndex:        1000,
        background:    'var(--c-surface)',
        border:        '1px solid var(--c-border)',
        borderRadius:  12,
        padding:       '10px 14px',
        minWidth:      160,
        boxShadow:     '0 4px 20px rgba(0,0,0,.28)',
        pointerEvents: 'none',
      }}
    >
      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--c-muted)', margin: '0 0 8px',
      }}>
        Route Legend
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map((e) => (
          <div key={e.driverName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: e.color, flexShrink: 0 }} />
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--c-text)',
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {e.driverName}
            </span>
            <span style={{ fontSize: 11, color: 'var(--c-muted)', fontFamily: 'monospace' }}>
              {e.stopCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
