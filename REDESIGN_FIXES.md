# Dashboard Redesign — Fix Tracker

All differences between the **current build** (Images 1–2) and the **Figma target** (Images 3–4).
Work through each section in order. Check off each item when done.

---

## Section 1 · Sidebar

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| S1 | Org subtitle | "FleetOpsX Demo" | "Acme Logistics · Bangalore" (tenant name + city from DB) | ⬜ |
| S2 | Dashboard nav item | Text only | Home icon + "Dashboard" label | ⬜ |
| S3 | Active item style | Purple filled pill | Purple filled pill (same — verify no regression) | ⬜ |
| S4 | User section at bottom | Shows "Platform Admin / Superadmin" | Shows actual logged-in user name + role (e.g. "Riya Dispatcher · Dispatcher · L2") | ⬜ |
| S5 | "Fleet & Platform" collapsible | Present | Not in Figma — hide or remove | ⬜ |

---

## Section 2 · Topbar / Header

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| T1 | Theme toggle | Absent | Sun/moon icon button, right of search bar | ⬜ |
| T2 | Bell icon badge | No badge when count = 0 | Red dot/count badge when notifications exist | ⬜ |
| T3 | Ask AI button | Purple pill | Purple pill — verify style matches (slightly rounder in Figma) | ⬜ |

---

## Section 3 · SuperAdmin Banner

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| SA1 | Yellow SUPERADMIN MODE banner | Always shown for superadmin login | Only shown when a superadmin is **impersonating** a tenant, not on regular views | ⬜ |

---

## Section 4 · Live Ops Ticker

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| LO1 | Static alert text | "SLA risk on 33 unassigned orders" (duplicated) | Scrolling multi-item ticker: on-time count · AI plan savings · SLA risk with specific order ID + reroute detail | ⬜ |
| LO2 | Ticker items | Driven purely by counts | Include: `X–Y on time`, `AI plan generated for N routes · Xhr saved`, `SLA risk on ORD-XXXX · rerouted via HSR`, `✓ Driver clocked-in` items | ⬜ |
| LO3 | Alert duplication | "SLA risk on 33 unassigned orders" appears twice | Dedup the ticker loop so no message repeats side-by-side | ⬜ |

---

## Section 5 · KPI Cards (4 top cards)

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| K1 | Top border accent | None | Colored 3px top border per card: Today's Orders=purple, On-Time=green, At-Risk=amber/yellow, Active Drivers=blue | ⬜ |
| K2 | Sparkline charts | Implemented but empty (zeros) | Populated from real/seeded KPI trend data | ⬜ |
| K3 | Data values | All zeros (0%, 0/0) | Realistic: 118 orders, 94.6%, 3 at-risk, 13/20 drivers | ⬜ → Seed fix |
| K4 | At-Risk SLAs value | Shows `unassigned` order count | Should show actual at-risk SLA stops count from `/sla/at-risk` | ⬜ |
| K5 | Card icon style | Rounded-xl bg box | Same shape — verify consistent with Figma | ⬜ |

---

## Section 6 · Dashboard Layout (biggest structural gap)

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| L1 | Hero section | Fleet Availability (3 sub-cards) | Route Timeline — full-width Gantt as the main operational view | ⬜ |
| L2 | Route Timeline position | Bottom, below Quick Actions | Promoted: directly below KPI cards, takes ~60% width | ⬜ |
| L3 | At-Risk panel position | Below Route Timeline | Right column beside Route Timeline (40% width), renamed "At-Risk Inbox" | ⬜ |
| L4 | Fleet Availability position | Hero / middle | Moved to bottom — smaller 3-column cards | ⬜ |
| L5 | AI Suggestions section | Separate full-width section below At-Risk | Removed as standalone section — AI actions are inline per order card | ⬜ |

---

## Section 7 · Route Timeline Component

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| RT1 | State | "No data" / "No route plans generated for today" | Shows 7+ driver rows with colored Gantt bars | ⬜ → Seed fix |
| RT2 | Header | "Today's Route Timeline · No data" | "Today's Route Timeline · 11 active routes · auto-refreshes every 30s" + green LIVE badge | ⬜ |
| RT3 | Driver rows | Renders from API data | Match Figma: Arjun Mehta (8 stops), Priya Sharma (6), Rahul Iyer (1), Sneha Reddy (11), Vikram Singh (4), Ananya Iyer (1), Rohan Das (7) | ⬜ → Seed fix |
| RT4 | Stop bar colors | Status-based colors (delivered=green, in-transit=accent, etc.) | Figma shows distinct per-driver colors for stop blocks + separate depot/break blocks | ⬜ |
| RT5 | Depot/break blocks | Not shown | Small "depot" + "break" labeled segments at end of each row | ⬜ |
| RT6 | Auto-refresh label | Not shown | Sub-header: "auto-refreshes every 30s" | ⬜ |
| RT7 | LIVE badge | Shows driver count "N drivers" | Green "LIVE" badge (not count) | ⬜ |

---

## Section 8 · At-Risk Inbox

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| AR1 | Title | "At-Risk Deliveries" (Collapsible) | "At-Risk Inbox" with count badge | ⬜ |
| AR2 | Empty state | Shows when stops = 0 | With seeded data, shows 3 at-risk order cards | ⬜ → Seed fix |
| AR3 | Order cards | Basic card with address + priority badge | Each card shows: order ID (e.g. ORD-2026-115), minutes-late badge (18 min late / 12 / 7), delivery address, delay reason text, single AI action chip | ⬜ |
| AR4 | Order ID in card | Not shown | Shown in purple/amber link style (e.g. "ORD-2026-115") | ⬜ |
| AR5 | Delay reason | Not shown | Short reason text (e.g. "Driver running 18 min late · Traffic on ORR") | ⬜ |
| AR6 | Minutes-late badge | "+X min" in red | Colored badge in top-right of card: "18 min late" amber/orange style | ⬜ |
| AR7 | AI action chips | 4 chips: Reassign / Notify Driver / Reschedule / Navigate | Single contextual AI suggestion per card (e.g. "Reassign to Ananya Iyer (Electronic City depot)") | ⬜ |

---

## Section 9 · Fleet Availability Cards (bottom)

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| FA1 | Drivers card statuses | Available / On Break / Off Duty | Available / **On Route** / On Break / Off Duty (add On Route) | ⬜ |
| FA2 | Vehicles card bars | Plain bars | Multi-color stacked/segmented bar | ⬜ |
| FA3 | Efficiency card | Single % value + text | Capacity used % / Idle time % / Avg detour % with colored dot legend | ⬜ |
| FA4 | Overall data | Zeros (0 drivers available) | Realistic: 13 available, 5 on route, 1 on break, 1 off duty | ⬜ → Seed fix |

---

## Section 10 · Quick Actions

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| QA1 | "Plan Routes" label | "Plan Routes" | "AI Plan Routes" | ⬜ |
| QA2 | 4th action | "Analytics" | "Scenario Sim" (links to /scenarios) | ⬜ |

---

## Section 11 · Bottom Dispatch CTA

| # | Item | Current | Target | Status |
|---|------|---------|--------|--------|
| CTA1 | "Ready to dispatch?" banner | Full-width at page bottom | Figma does not show it — remove or make conditional (only when >0 unassigned AND no active plan) | ⬜ |

---

## Section 12 · Seed Data (prerequisite for all visual fixes)

| # | Item | Notes | Status |
|---|------|-------|--------|
| SD1 | `scripts/seed_figma_demo.py` created | Seeds tenant "Acme Logistics", 20 drivers, 20 vehicles, 118 orders, 7 routes with Gantt timing, 3 at-risk orders | ⬜ |
| SD2 | `scripts/unseed_figma_demo.py` created | Removes only the figma demo tenant and all its data | ⬜ |
| SD3 | Vehicle statuses set | 4 available, 14 in use, 1 maintenance, 1 low fuel | ⬜ |
| SD4 | Driver statuses set | 13 available, 5 on route (ASSIGNED orders), 1 on break, 1 off duty | ⬜ |
| SD5 | Route timeline data | RoutePlan + Routes + RouteStops with estimated_arrival timestamps across 07:00–18:00 | ⬜ |
| SD6 | At-risk orders | 3 orders with overdue SLA windows matching Figma (ORD-2026-115, -119, -103) | ⬜ |
| SD7 | KPI trend history | 7 days of analytics trend data so sparklines render | ⬜ |

---

## Fix Order (recommended)

```
1. SD1–SD7  — seed data first so every UI fix can be visually verified
2. K1        — add colored top border to StatCard
3. K4        — wire At-Risk KPI card to /sla/at-risk count
4. L1–L5    — reorder Dashboard layout sections
5. RT2,RT6,RT7 — Route Timeline header updates (LIVE badge, subtitle)
6. RT4,RT5  — stop bar color + depot/break segments
7. AR1–AR7  — At-Risk Inbox redesign
8. FA1–FA4  — Fleet cards (On Route status + efficiency breakdown)
9. QA1,QA2  — Quick Actions label + 4th item
10. LO1–LO3 — Ticker content improvements
11. S1–S5   — Sidebar updates
12. T1–T3   — Topbar (theme toggle, bell badge)
13. SA1      — SuperAdmin banner visibility logic
14. CTA1     — dispatch CTA conditional logic
```

---

*Created: 2026-05-12 | Branch: redesign/v2-ux*
