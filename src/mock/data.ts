// Central mock data store — all dashboard mock data lives here.
// Import from this file in components; never hardcode mock data in components directly.

// ---------------------------------------------------------------------------
// RouteTimeline mock routes
// ---------------------------------------------------------------------------
export type MockRoute = {
  id:     string
  name:   string
  color:  string
  stops:  number
  rStart: number  // minutes from midnight
  rEnd:   number
  bStart: number
  bEnd:   number
}

export const MOCK_ROUTES: MockRoute[] = [
  { id: 'd1', name: 'Arjun Mehta',  color: '#8b5cf6', stops: 8,  rStart: 510, rEnd: 690, bStart: 690, bEnd: 780 },
  { id: 'd2', name: 'Priya Sharma', color: '#34d399', stops: 6,  rStart: 510, rEnd: 695, bStart: 695, bEnd: 765 },
  { id: 'd3', name: 'Rahul Iyer',   color: '#60a5fa', stops: 1,  rStart: 510, rEnd: 690, bStart: 690, bEnd: 795 },
  { id: 'd4', name: 'Sneha Reddy',  color: '#f472b6', stops: 11, rStart: 510, rEnd: 705, bStart: 705, bEnd: 765 },
  { id: 'd5', name: 'Vikram Singh', color: '#f59e0b', stops: 4,  rStart: 510, rEnd: 660, bStart: 660, bEnd: 750 },
  { id: 'd6', name: 'Ananya Iyer',  color: '#22d3ee', stops: 1,  rStart: 510, rEnd: 690, bStart: 690, bEnd: 755 },
  { id: 'd7', name: 'Rohan Das',    color: '#818cf8', stops: 7,  rStart: 540, rEnd: 690, bStart: 690, bEnd: 748 },
]

// ---------------------------------------------------------------------------
// AtRiskPanel mock at-risk orders
// ---------------------------------------------------------------------------
export type MockAtRiskItem = {
  id:         string
  address:    string
  minsLate:   number
  reason:     string
  suggestion: string
}

export const MOCK_AT_RISK: MockAtRiskItem[] = [
  {
    id:         'ORD-2026-115',
    address:    '42, HSR Sector 2',
    minsLate:   18,
    reason:     'Driver running 18 min late · Traffic on ORR',
    suggestion: 'Reassign to Ananya Iyer (Electronic City depot)',
  },
  {
    id:         'ORD-2026-119',
    address:    'Banaswadi Main Rd',
    minsLate:   12,
    reason:     'Stop window closes 12 min after current ETA',
    suggestion: 'Skip ORD-118 stop, return after delivery',
  },
  {
    id:         'ORD-2026-103',
    address:    'JP Nagar Phase 7',
    minsLate:   7,
    reason:     'Customer rescheduled — earlier time window',
    suggestion: 'Swap with ORD-2026-122 in same area',
  },
]

// ---------------------------------------------------------------------------
// FleetStatusCards mock fleet data
// ---------------------------------------------------------------------------
export type MockSegment = { label: string; value: number; color: string }

export type MockFleet = {
  drivers:        MockSegment[]
  driversTotal:   number
  vehicles:       MockSegment[]
  vehiclesTotal:  number
  efficiency:     MockSegment[]
  efficiencyTotal: number
}

export const MOCK_FLEET: MockFleet = {
  drivers: [
    { label: 'Available', value: 13, color: '#34d399' },
    { label: 'On Route',  value: 5,  color: '#60a5fa' },
    { label: 'On Break',  value: 1,  color: '#f59e0b' },
    { label: 'Off Duty',  value: 1,  color: '#505065' },
  ],
  driversTotal: 20,
  vehicles: [
    { label: 'Available',   value: 4,  color: '#34d399' },
    { label: 'In Use',      value: 14, color: '#60a5fa' },
    { label: 'Maintenance', value: 1,  color: '#f59e0b' },
    { label: 'Low Fuel',    value: 1,  color: '#f87171' },
  ],
  vehiclesTotal: 20,
  efficiency: [
    { label: 'Capacity used', value: 78, color: '#34d399' },
    { label: 'Idle time',     value: 14, color: '#f59e0b' },
    { label: 'Avg detour',    value: 8,  color: '#f87171' },
  ],
  efficiencyTotal: 100,
}

// ---------------------------------------------------------------------------
// LiveOpsTicker mock items
// Note: plain data objects — no JSX. The component renders bold spans via
// renderTickerText() using the `bold` substrings list.
// ---------------------------------------------------------------------------
export type MockTickerItem = {
  id:      string
  type:    'critical' | 'warning' | 'info' | 'success'
  variant: 'truck' | 'check' | 'lightning' | 'warning' | 'dot'
  text:    string      // plain text shown in ticker
  bold:    string[]    // substrings of text to render bold+mono
}

export const MOCK_TICKER_ITEMS: MockTickerItem[] = [
  { id: 't1', type: 'info',     variant: 'lightning', text: 'AI plan generated for 11 routes · 4.2hr saved',                  bold: ['11 routes', '4.2hr'] },
  { id: 't2', type: 'warning',  variant: 'warning',   text: 'SLA risk on ORD-2026-115 · rerouted via HSR',                    bold: ['ORD-2026-115'] },
  { id: 't3', type: 'success',  variant: 'truck',     text: 'Driver Arjun Mehta picked up 8 packages from Depot',             bold: ['Arjun Mehta', '8 packages'] },
  { id: 't4', type: 'warning',  variant: 'warning',   text: 'ORD-2026-119 window closes in 12 min · action needed',           bold: ['ORD-2026-119', '12 min'] },
  { id: 't5', type: 'success',  variant: 'check',     text: 'Priya Sharma completed 6 stops · on time',                      bold: ['Priya Sharma', '6', 'on time'] },
  { id: 't6', type: 'info',     variant: 'lightning', text: '13 drivers available · 4 vehicles idle today',                   bold: ['13', '4'] },
  { id: 't7', type: 'success',  variant: 'truck',     text: 'Driver Rohan Das dispatched 7 stops · ETA on track',             bold: ['Rohan Das', '7 stops'] },
  { id: 't8', type: 'critical', variant: 'dot',       text: 'ORD-2026-103 rescheduled · swap with ORD-2026-122 in progress',  bold: ['ORD-2026-103', 'ORD-2026-122'] },
]

// ---------------------------------------------------------------------------
// Orders mock data — matches the Figma design (118 orders, realistic Bangalore data)
// ---------------------------------------------------------------------------
import type { Order } from '../types'

const TODAY = new Date().toISOString().slice(0, 10)

const mkOrder = (
  n: number,
  address: string,
  window: [string, string],
  priority: Order['priority'],
  status: Order['status'],
  driver: string | null,
  value: number,
): Order => ({
  id:                   `mock-ord-${n}`,
  tenant_id:            'mock-tenant',
  external_ref:         `ORD-2026-${n}`,
  delivery_address:     address,
  scheduled_date:       TODAY,
  time_window_start:    window[0],
  time_window_end:      window[1],
  priority,
  status,
  assigned_driver_id:   driver ? `mock-driver-${driver.split(' ')[0]!.toLowerCase()}` : undefined,
  assigned_driver_name: driver ?? undefined,
  value,
  created_at:           TODAY + 'T00:00:00Z',
})

export const MOCK_ORDERS: Order[] = [
  mkOrder(118, 'Brigade Road, Bangalore',      ['10:00', '14:00'], 'HIGH',   'IN_TRANSIT', 'Arjun Mehta',  4820),
  mkOrder(117, '12, Sarjapur Outer Ring',      ['09:00', '12:00'], 'NORMAL', 'DELIVERED',  'Priya Sharma', 2150),
  mkOrder(116, '88, Indiranagar 100ft Rd',     ['14:00', '18:00'], 'NORMAL', 'ASSIGNED',   'Sneha Reddy',  6400),
  mkOrder(115, '42, HSR Sector 2',             ['12:00', '16:00'], 'HIGH',   'IN_TRANSIT', 'Rohan Das',    3290),
  mkOrder(114, 'Whitefield Main Road',         ['10:00', '22:00'], 'LOW',    'PENDING',    null,           980),
  mkOrder(113, 'Koramangala 5th Block',        ['15:00', '19:00'], 'NORMAL', 'IN_TRANSIT', 'Sneha Reddy',  5750),
  mkOrder(112, 'Jayanagar 4th Block',          ['08:00', '11:00'], 'NORMAL', 'DELIVERED',  'Vikram Singh', 1840),
  mkOrder(111, 'Hebbal Outer Ring Rd',         ['13:00', '17:00'], 'NORMAL', 'IN_TRANSIT', 'Vikram Singh', 2610),
  mkOrder(110, 'BTM Layout Stage 2',           ['10:00', '13:00'], 'LOW',    'FAILED',     'Rohan Das',    720),
  mkOrder(109, 'Marathahalli Bridge',          ['11:00', '15:00'], 'NORMAL', 'DELIVERED',  'Priya Sharma', 3300),
  mkOrder(108, 'Electronic City Phase 1',      ['09:00', '13:00'], 'NORMAL', 'DELIVERED',  'Arjun Mehta',  1960),
  mkOrder(107, 'Bellandur Lake Road',          ['14:00', '18:00'], 'HIGH',   'IN_TRANSIT', 'Ananya Iyer',  4100),
  mkOrder(106, 'JP Nagar Phase 3',             ['10:00', '14:00'], 'NORMAL', 'ASSIGNED',   'Rahul Iyer',   2750),
  mkOrder(105, 'Bannerghatta Road',            ['08:00', '12:00'], 'NORMAL', 'DELIVERED',  'Vikram Singh', 1450),
  mkOrder(104, 'Yelahanka New Town',           ['13:00', '17:00'], 'LOW',    'PENDING',    null,           880),
  mkOrder(103, 'JP Nagar Phase 7',             ['09:00', '13:00'], 'HIGH',   'ASSIGNED',   'Ananya Iyer',  5200),
  mkOrder(102, 'Whitefield ITPL Road',         ['11:00', '15:00'], 'NORMAL', 'DELIVERED',  'Priya Sharma', 2980),
  mkOrder(101, 'Hennur Main Road',             ['14:00', '18:00'], 'NORMAL', 'IN_TRANSIT', 'Rahul Iyer',   3600),
  mkOrder(100, 'Sarjapur Road Wipro Gate',     ['09:00', '12:00'], 'NORMAL', 'DELIVERED',  'Arjun Mehta',  2200),
  mkOrder(99,  'HSR Layout Sector 7',          ['12:00', '16:00'], 'LOW',    'DELIVERED',  'Rohan Das',    1100),
  mkOrder(98,  'Cunningham Road',              ['10:00', '14:00'], 'NORMAL', 'DELIVERED',  'Sneha Reddy',  4500),
  mkOrder(97,  'Domlur Flyover',               ['08:00', '11:00'], 'HIGH',   'IN_TRANSIT', 'Vikram Singh', 3870),
  mkOrder(96,  'Bommanahalli Signal',          ['15:00', '19:00'], 'NORMAL', 'ASSIGNED',   'Priya Sharma', 2300),
  mkOrder(95,  'Richmond Road',                ['11:00', '15:00'], 'NORMAL', 'DELIVERED',  'Ananya Iyer',  1780),
  mkOrder(94,  'Majestic Bus Stand Area',      ['09:00', '13:00'], 'LOW',    'PENDING',    null,           650),
  mkOrder(93,  'MG Road Metro Station',        ['10:00', '14:00'], 'NORMAL', 'DELIVERED',  'Rahul Iyer',   3100),
  mkOrder(92,  'Ulsoor Lake Road',             ['13:00', '17:00'], 'NORMAL', 'DELIVERED',  'Rohan Das',    2050),
  mkOrder(91,  'Frazer Town Cross Rd',         ['14:00', '18:00'], 'NORMAL', 'ASSIGNED',   'Arjun Mehta',  3400),
  mkOrder(90,  'Rajajinagar 1st Block',        ['08:00', '12:00'], 'NORMAL', 'DELIVERED',  'Sneha Reddy',  1920),
  mkOrder(89,  'Peenya Industrial Area',       ['11:00', '15:00'], 'LOW',    'FAILED',     'Vikram Singh', 760),
  mkOrder(88,  'Tumkur Road Junction',         ['09:00', '13:00'], 'NORMAL', 'DELIVERED',  'Priya Sharma', 2700),
  mkOrder(87,  'Nagarbhavi Circle',            ['12:00', '16:00'], 'NORMAL', 'IN_TRANSIT', 'Ananya Iyer',  3250),
  mkOrder(86,  'Kengeri Satellite Town',       ['10:00', '14:00'], 'LOW',    'DELIVERED',  'Rahul Iyer',   890),
  mkOrder(85,  'Mysore Road Ring Road',        ['13:00', '17:00'], 'NORMAL', 'DELIVERED',  'Rohan Das',    1630),
  mkOrder(84,  'Vijayanagar 4th Stage',        ['08:00', '12:00'], 'NORMAL', 'ASSIGNED',   'Arjun Mehta',  2840),
  mkOrder(83,  'Hosur Road Sony World Sig.',   ['14:00', '18:00'], 'HIGH',   'IN_TRANSIT', 'Sneha Reddy',  4960),
  mkOrder(82,  'Silk Board Junction',          ['10:00', '14:00'], 'CRITICAL','PENDING',   null,           6200),
  mkOrder(81,  'HSR Layout BDA Complex',       ['11:00', '15:00'], 'NORMAL', 'DELIVERED',  'Vikram Singh', 2430),
  mkOrder(80,  'Koramangala 1st Block',        ['09:00', '13:00'], 'NORMAL', 'DELIVERED',  'Priya Sharma', 3050),
  mkOrder(79,  'Indiranagar Double Road',      ['12:00', '16:00'], 'NORMAL', 'DELIVERED',  'Ananya Iyer',  1750),
  mkOrder(78,  'Kundanahalli Gate',            ['13:00', '17:00'], 'LOW',    'FAILED',     'Rahul Iyer',   680),
  mkOrder(77,  'Varthur Road',                 ['10:00', '14:00'], 'NORMAL', 'DELIVERED',  'Rohan Das',    2200),
  mkOrder(76,  'Thubarahalli Signal',          ['08:00', '12:00'], 'NORMAL', 'ASSIGNED',   'Arjun Mehta',  3600),
  mkOrder(75,  'Outer Ring Road Kadubeesana', ['14:00', '18:00'], 'LOW',    'DELIVERED',  'Sneha Reddy',  1100),
]
