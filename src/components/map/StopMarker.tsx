import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'

type Props = {
  lat:        number
  lng:        number
  sequence:   number
  driverName: string
  address:    string
  color:      string
}

function makeIcon(color: string, seq: number) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;
      background:${color};
      border:2.5px solid rgba(255,255,255,0.9);
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,.40);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:10px;font-weight:800;font-family:system-ui,sans-serif;
    ">${seq}</div>`,
    iconSize:    [26, 26],
    iconAnchor:  [13, 13],
    popupAnchor: [0, -16],
  })
}

export default function StopMarker({ lat, lng, sequence, driverName, address, color }: Props) {
  return (
    <Marker position={[lat, lng]} icon={makeIcon(color, sequence)}>
      <Popup>
        <div style={{ minWidth: 160, fontSize: 13, lineHeight: 1.4 }}>
          <p style={{ fontWeight: 700, margin: '0 0 4px', color }}>Stop #{sequence}</p>
          <p style={{ margin: '0 0 3px', fontWeight: 600, color: '#111' }}>{address}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#666' }}>{driverName}</p>
        </div>
      </Popup>
    </Marker>
  )
}
