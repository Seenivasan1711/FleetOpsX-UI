interface Column<T> {
  key:     string
  header:  string
  render:  (row: T) => React.ReactNode
  width?:  string
}

interface DataTableProps<T> {
  columns:       Column<T>[]
  data:          T[]
  isLoading?:    boolean
  emptyMessage?: string
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: 'var(--c-accent)' }}
        />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--c-muted)]"
                style={col.width ? { width: col.width } : {}}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-12 text-sm text-[var(--c-muted)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="transition-colors"
                style={{ borderBottom: '1px solid var(--c-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--c-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[var(--c-text)]">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
