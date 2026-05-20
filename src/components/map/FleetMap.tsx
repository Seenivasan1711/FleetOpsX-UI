import { useEffect, type ReactNode } from 'react'
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import DriverMarker from './DriverMarker'
import type { LivePosition } from '../../api/tracking'
import { useUiStore } from '../../store'

// Fix Leaflet default marker icon paths broken by Vite's asset bundling
// Must be done once before any map renders
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const TILE_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

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
  colorMap?:  Record<string, string>
}

export default function FleetMap({
  positions,
  center = [12.9716, 77.5946],
  zoom = 12,
  children,
  colorMap,
}: Props) {
  const theme = useUiStore((s) => s.theme)
  const tileUrl = theme === 'dark' ? TILE_DARK : TILE_LIGHT
  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full rounded-lg" zoomControl={false}>
      <TileLayer key={tileUrl} url={tileUrl} attribution={TILE_ATTR} />
      <ZoomControl position="topright" />
      {positions.length > 0 && <AutoFit positions={positions} />}
      {positions.map(p => (
        <DriverMarker key={p.driver_id} position={p} color={colorMap?.[p.driver_id]} />
      ))}
      {children}
    </MapContainer>
  )
}
