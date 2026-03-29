import { useQuery } from '@tanstack/react-query'
import AppLayout from '../components/layout/AppLayout'
import FleetMap from '../components/map/FleetMap'
import { fetchLivePositions } from '../api/tracking'

export default function LiveMap() {
  const { data: positions = [], dataUpdatedAt } = useQuery({
    queryKey: ['live-positions'],
    queryFn: fetchLivePositions,
    refetchInterval: 10_000, // poll every 10 s
  })

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <AppLayout>
      <div className="flex flex-col h-full space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold dark:text-white">Live Fleet Map</h2>
            <p className="text-sm text-gray-500">
              {positions.length} driver{positions.length !== 1 ? 's' : ''} active · refreshes every 10s · last at {lastUpdated}
            </p>
          </div>
          {positions.length === 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
              No active drivers — waiting for GPS pings
            </span>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 180px)' }}>
          <FleetMap positions={positions} />
        </div>

        {/* Driver list below map (visible on smaller screens) */}
        {positions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {positions.map(p => (
              <div key={p.driver_id} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{p.driver_name}</p>
                <p className="text-gray-400 text-xs">
                  {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
