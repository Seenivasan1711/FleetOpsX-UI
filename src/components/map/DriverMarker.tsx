import { useMemo } from 'react'
import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import type { LivePosition } from '../../api/tracking'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function DriverMarker({ position, color = '#2563eb' }: { position: LivePosition; color?: string }) {
  const icon = useMemo(() => L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;
      background:${color};
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:13px;font-weight:700;
    ">D</div>`,
    iconSize:    [32, 32],
    iconAnchor:  [16, 16],
    popupAnchor: [0, -18],
  }), [color])

  return (
    <Marker position={[position.latitude, position.longitude]} icon={icon}>
      <Popup>
        <div className="text-sm min-w-[140px]">
          <p className="font-semibold text-gray-900">{position.driver_name}</p>
          <p className="text-gray-500 text-xs mt-1">
            Last update: {formatTime(position.recorded_at)}
          </p>
          {position.speed_kmh != null && (
            <p className="text-gray-500 text-xs">{position.speed_kmh.toFixed(1)} km/h</p>
          )}
          {position.accuracy_m != null && (
            <p className="text-gray-400 text-xs">±{position.accuracy_m.toFixed(0)} m</p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
