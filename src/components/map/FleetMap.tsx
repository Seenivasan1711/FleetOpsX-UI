import { useEffect, type ReactNode } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import DriverMarker from './DriverMarker'
import type { LivePosition } from '../../api/tracking'

// Fix Leaflet default marker icon paths broken by Vite's asset bundling
// Must be done once before any map renders
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// To swap to Mapbox later: change TILE_URL + add accessToken query param
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'

// Inner component that auto-pans the map to fit all markers when positions change
function AutoFit({ positions }: { positions: LivePosition[] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
  }, [positions.length]) // re-fit only when driver count changes
  return null
}

interface Props {
  positions:  LivePosition[]
  center?:    [number, number]
  zoom?:      number
  children?:  ReactNode
}

export default function FleetMap({
  positions,
  center = [12.9716, 77.5946],
  zoom = 12,
  children,
}: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full rounded-lg">
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {positions.length > 0 && <AutoFit positions={positions} />}
      {positions.map(p => (
        <DriverMarker key={p.driver_id} position={p} />
      ))}
      {children}
    </MapContainer>
  )
}
