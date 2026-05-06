import { Polyline } from 'react-leaflet'

type Props = {
  positions: [number, number][]
  color:     string
}

export default function RoutePolyline({ positions, color }: Props) {
  if (positions.length < 2) return null
  return (
    <Polyline
      positions={positions}
      pathOptions={{ color, weight: 3, opacity: 0.72, dashArray: '8 5' }}
    />
  )
}
