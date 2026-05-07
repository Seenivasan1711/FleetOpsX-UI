const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ASSIGNED:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_TRANSIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  DELIVERED:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  FAILED:     'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CANCELLED:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ACTIVE:     'bg-green-100 text-green-800',
  INACTIVE:   'bg-gray-100 text-gray-500',
  CRITICAL:   'bg-red-100 text-red-700',
  HIGH:       'bg-orange-100 text-orange-700',
  NORMAL:     'bg-gray-100 text-gray-600',
  LOW:        'bg-blue-100 text-blue-600',
}

export default function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[value] || STATUS_STYLES.NORMAL}`}>
      {value}
    </span>
  )
}
