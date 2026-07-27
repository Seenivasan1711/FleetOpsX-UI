/**
 * Custom icon set — converted from icons.jsx design file.
 * Usage: <Icon.Home size={16} className="..." />
 *
 * All icons accept standard SVG props + an optional `size` shorthand
 * that sets both width and height.
 */
import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number }

// Shared defaults every icon uses
const D = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function svg(inner: React.ReactNode, extra?: SVGProps<SVGSVGElement>) {
  return function IcoComponent({ size = 16, width, height, ...p }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size ?? width}
        height={size ?? height}
        {...D}
        {...extra}
        {...p}
      >
        {inner}
      </svg>
    )
  }
}

export const Icon = {
  Dashboard: svg(<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>),
  Orders:    svg(<><path d="M9 4h6a2 2 0 0 1 2 2v0H7v0a2 2 0 0 1 2-2Z"/><rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 12h6M9 16h4"/></>),
  Plan:      svg(<><path d="M3 17c3-5 5-5 9 0s6 5 9 0"/><path d="M3 7c3 5 5 5 9 0s6-5 9 0"/></>),
  Map:       svg(<><path d="m3 7 6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></>),
  Chart:     svg(<><path d="M4 20V8M10 20V4M16 20v-8M22 20H2"/></>),
  Drivers:   svg(<><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5M14.4 20c.4-2.4 2.3-4 4.6-4s3 1.5 3 4"/></>),
  Truck:     svg(<><rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>),
  Depot:     svg(<><path d="M3 11 12 4l9 7v9H3z"/><path d="M9 20v-6h6v6"/></>),
  History:   svg(<><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 7v5l3 2"/></>),
  Chat:      svg(<><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z"/></>),
  Plug:      svg(<><path d="M12 22v-5M9 13V7M15 13V7M5 7h14M7 13h10v2a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z"/></>),
  Shop:      svg(<><path d="M4 7h16l-1 5H5z"/><path d="M5 12v8h14v-8M9 16h6"/></>),
  Shield:    svg(<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/></>),
  Layers:    svg(<><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/></>),
  Bolt:      svg(<><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></>),
  Settings:  svg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1.1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>),
  Bell:      svg(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/></>),
  Search:    svg(<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>),
  Plus:      svg(<><path d="M12 5v14M5 12h14"/></>, { strokeWidth: 2 }),
  ChevR:     svg(<><path d="m9 6 6 6-6 6"/></>, { strokeWidth: 2 }),
  ChevL:     svg(<><path d="m15 6-6 6 6 6"/></>, { strokeWidth: 2 }),
  ChevD:     svg(<><path d="m6 9 6 6 6-6"/></>, { strokeWidth: 2 }),
  ChevU:     svg(<><path d="m6 15 6-6 6 6"/></>, { strokeWidth: 2 }),
  X:         svg(<><path d="M6 6l12 12M18 6 6 18"/></>, { strokeWidth: 2 }),
  Filter:    svg(<><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>),
  Sun:       svg(<><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></>),
  Moon:      svg(<><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z"/></>),
  Send:      svg(<><path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/></>, { strokeWidth: 2 }),
  Sparkle:   svg(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/></>),
  Pin:       svg(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>),
  Alert:     svg(<><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18h.01"/></>),
  Check:     svg(<><path d="m4 12 5 5L20 6"/></>, { strokeWidth: 2.4 }),
  Clock:     svg(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  Home:      svg(<><path d="m3 11 9-8 9 8v10h-6v-7h-6v7H3z"/></>),
  Logout:    svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>),
  Mic:       svg(<><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>),
  Expand:    svg(<><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></>),
  Download:  svg(<><path d="M12 3v13m0 0 5-5m-5 5-5-5M4 21h16"/></>),
  Message:   svg(<><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z"/></>),
  Gauge:     svg(<><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12 8 8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M2 12h3M12 22v-3"/></>),
  Package:   svg(<><path d="M12 3 2 8v8l10 5 10-5V8z"/><path d="M2 8l10 5M22 8l-10 5M12 13v9M7 5.5l10 5"/></>),
  Users:     svg(<><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5M14.4 20c.4-2.4 2.3-4 4.6-4s3 1.5 3 4"/></>),
  Book:      svg(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>),
} as const

export type IconName = keyof typeof Icon
