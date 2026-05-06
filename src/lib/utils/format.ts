export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(time: string | undefined): string {
  return time ?? '—'
}

export function truncate(str: string, max = 30): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}

export function shortId(id: string): string {
  return id.slice(0, 8)
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}
