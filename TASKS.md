# FleetOpsX UI — Task Tracker

> Updated: 2026-05-17. Work top-to-bottom; mark ✅ when done.

---

## 🟣 Feature Backlog — 2026-05-17 (After QA bugs are done)

| # | Feature | Details | Ref |
|---|---------|---------|-----|
| F-01 | **Live Feed — match Figma** | Dark CartoDB tiles; update MOCK_DRIVER_FEED (Indiranagar/HSR Layout/Koramangala/etc areas, correct ETAs + util); "Idle / available" label; On break status; fleet counts 4 on route / 3 idle+break / 0 off duty | Image #25 |
| F-02 | **Plan History — redesign** | Flat row list (no accordion); each row: purple icon + "Balanced · 11 routes" + date/time + Orders/Drivers/OTD%/Saved cols + View button. Mock: 4 entries (Balanced 94.6%, Fastest 92.1%, Economical 96.3%, Balanced 91.7%). OTD color green ≥94%, amber <94% | Image #26 |
| F-03 | **Drivers page — redesign table** | New columns: DRIVER (avatar+name+D-00X+phone) / VEHICLE (plate) / STATUS pill (On Route green, Idle gray, On Break amber, Available green) / STOPS TODAY / UTILIZATION bar+% / SCORE number+bar / ETA NEXT. Mock overlay for demo: MOCK_DRIVER_TABLE keyed by name | Image #27 |
| F-04 | **Analytics page — redesign** | 4 KPI cards top row: ON-TIME DELIVERY 94.6% (green), COST PER STOP ₹38.20 (cyan), AVG DETOUR 8.2% (amber), CO₂ PER ROUTE 3.1 kg (purple) — each with 12-week sparkline + "last 12 weeks" label. Lower left: Driver utilization horizontal bars sorted by usage (Sneha 91% amber, Arjun 78% green, Rohan 72%, Priya 65%, Vikram 45% purple). Lower right: Hourly throughput bar chart 8h-19h | Image #28 |
| F-05 | **Export / Import on Drivers, Vehicles, Depots** | Add Export (CSV download) + Import (CSV upload) buttons to each page toolbar alongside Add button. Demo mode: export generates CSV from mock data, import shows toast. Live mode: POST to `/api/v1/{resource}/import`, GET `/api/v1/{resource}/export` | — |
| F-06 | **Fleet & Platform sidebar items** | Deprioritised — revisit after F-01–F-05 | — |
| F-07 | **End-to-end QA** | Full manual + automated regression pass after ALL bugs + features complete. Block release on this. | — |

---

## 🔴 QA Round — 2026-05-17 (Fix These First)

All items below were logged during a manual QA pass. Start a new session by working through this list.

### Bugs — UI / Data

| # | Bug | Location | Fix Needed |
|---|-----|----------|------------|
| QA-01 | Stat card labels ("+2.5pp this week", "4 fewer than yesterday") appear in **live mode** — should only show in demo | `Dashboard` stat cards (SparklineCard) | Guard trend-label render behind `isMock`; live mode shows `—` or nothing |
| QA-02 | "Today's Orders" stat card missing sparkline line entirely in live mode | `Dashboard` SparklineCard | Ensure a flat/empty sparkline path still renders when live data returns 0 |
| QA-03 | Drivers fleet card shows **NaN** for "On Route" count | `Dashboard` FleetStatusCard | Divide-by-zero or undefined field when live API returns null — add fallback `?? 0` |
| QA-04 | LiveOps Ticker shows **demo events in live mode** | `LiveOpsTicker` | Guard mock events behind `isMock`; in live mode render a centered "No live updates yet" empty state with icon |
| QA-05 | Route Timeline blocks all same brightness — no active/past/future distinction | `RouteTimeline` | Currently-active block (now-time falls in range) = full brightness; past blocks = strikethrough text + opacity 0.35; future blocks = opacity 0.55 |
| QA-06 | At-Risk Inbox AI suggestion buttons (Reroute / Swap / Notify) do nothing | `AtRiskInbox` / `Dashboard` | Demo: show a contextual toast ("Rerouting [driver]… ETA adjusted"); Live: POST to re-plan API then toast success/error |
| QA-07 | Profile page layout is left-aligned, not modern | `src/pages/Profile.tsx` | Redesign to centered max-w-2xl card layout; avatar at top, sections as clean panels |
| QA-08 | Settings page same issue as QA-07 | `src/pages/Settings.tsx` | Apply same centered modern card layout |
| QA-11 | Orders sort button always shows static ↑↓ icon regardless of direction | `Orders.tsx` sort button | Show `↑` when asc, `↓` when desc (single arrow, not bidirectional) |
| QA-12 | Import CSV fails: `badly formed hexadecimal UUID string` on rows 2 & 3 | `Orders.tsx` import handler / BE | FE: strip/ignore `id` column from CSV before sending. BE: investigate UUID parsing on import route |
| QA-13 | Planning banner icon uses `Sparkles` which looks out of place | `Planning.tsx` AI Planner banner | Replace `<Sparkles>` with the 8-spoke loader SVG (same as Ask AI / ChatPanel — consistent AI identity) |
| QA-15 | Live Fleet overlay covers Leaflet zoom controls (+/−) | `LiveMap.tsx` fleet stats overlay | Move overlay below zoom buttons — change `top-4` to `top-[80px]` or place in a non-conflicting quadrant |
| QA-17 | Map blank / doesn't resize when Driver Feed panel is collapsed | `LiveMap.tsx` | Call `map.invalidateSize()` after toggling `showFeed`; or use a resize observer on the map wrapper div |
| QA-18 | Some dashboard section shows empty in demo mode | `Dashboard` | Identify which widget; ensure mock data is wired for all widgets that guard behind `isMock` |

### Bugs — Icons / Labels

| # | Bug | Fix |
|---|-----|-----|
| QA-B25 | Orders badge only shows while on Orders page — not visible on other pages. Count also wrong (showed total not unassigned) | ✅ Fixed — moved count fetch to AppShell; always-on 60s refetch; PENDING count |
| QA-B26 | Text sizes too small vs Figma across multiple pages | ✅ Fixed — Orders headers 10.5→12px, filter labels 11→12px, DataTable headers 11→12px, Analytics axes/drivers bumped |
| QA-I1 | Sidebar "Planning" nav icon doesn't match "AI Plan Routes" Quick Action card icon (Image #13) | Update sidebar Planning icon to use the same SVG used in Quick Action card |
| QA-I2 | Route Timeline widget header icon (Image #14) already has gradient — verify sidebar icon also uses violet→cyan gradient, not old purple-only |
| QA-16 | "Live Map" label is wrong everywhere | Rename to **"Live Feed"** in: Sidebar nav label, `Topbar.tsx` PAGE_META key `/map`, router `<Route>` title, page heading |

### Bugs — Backend / API

| # | Bug | Fix |
|---|-----|-----|
| QA-14 | `POST /api/v1/plan/options` returns **500** when Generate Plan is clicked | Investigate BE traceback (ASGI middleware error); likely LLM provider key missing or prompt format broken. Check `app/services/planning.py` |
| QA-14b | Import/Export BE route also suspected to have UUID parsing errors | Fix UUID coercion on import endpoint; export should return clean CSV without internal UUIDs |

### Features / Scope (Do Not Fix Now — Plan Later)

| # | Feature | Notes |
|---|---------|-------|
| QA-09 | AI Providers — tenant-level view needed | Superadmin admin page is separate. Tenant page: show platform default (read-only) + any custom providers they added. Warn if no provider selected for Planning / SLA categories. If custom set for planning but not others, silently fall back to platform default on BE |
| QA-10 | All Tenants dropdown — show tenant list with recent + search | When clicking "All Tenants" chip, show popover: recently-used tenants at top, then search results. Not a new page |
| QA-F1 | At Risk AI buttons — deep real-mode action | Real mode: POST re-plan suggestion → stream response → apply driver change → toast with ETA delta |
| QA-F2 | Plan History page — view past plans | `/plan-history` route already exists in nav; wire to BE `GET /api/v1/plans/history` |
| QA-F3 | Planning regenerate — accept manual text suggestions | Add a textarea on Planning page: "Manual hints (optional)" — passed as `user_hints` param to plan/options API |
| QA-F4 | MongoDB plan storage architecture | Confirm: are dispatched plans saved to Mongo? If not, define save-on-approve flow. Plan history depends on this |

---

## Immediate / In-Progress

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | **Quick Actions — fix styling to match Figma #41** | ✅ Done | Visible in dashboard, layout matches |
| 2 | **Timeline coloring — past=dark, future=light** | ✅ Done | `routeTouched` / `breakTouched` alpha logic; green dot dims for future routes |
| 3 | **Superadmin demo-mode toggle** | ✅ Done | `demoMode` in auth store; SuperadminBanner + TenantSelector header pill |
| 4 | **AI Providers — dynamic provider name input** | ✅ Done | Free-text + datalist presets; mistral/cohere/groq/together added; model suggestions expanded |
| 5 | **Mock data → auth-store-driven** | ✅ Done | `useMockData()` hook reads `isSuperadmin && demoMode`; non-superadmin always live |
| 6 | **Quick Actions — grow-only hover, re-enabled** | ✅ Done | `hover:scale-[1.03]` only; re-enabled below timeline row |
| 7 | **Dashboard stat cards show 0 in demo mode** | ✅ Done | Dashboard checks `isMock`; all 4 stat cards use `MOCK_STATS` when demo on |
| 8 | **AI Providers — platform-scope fix** | ✅ Done | `client.ts` skips `X-Acting-Tenant-Id` for `/api/v1/admin/` routes; platform-scope banner in AiProviders |
| 9 | **All Tenants and System Health — now functional** | ✅ Done | "All Tenants" shows count + active state; "System Health" fetches API health inline |
| 10 | **Demo mode toggle — accessible without tenant impersonation** | ✅ Done | Toggle added to TenantSelector header (always visible to superadmin) |

---

## Upcoming

| # | Task | Notes |
|---|------|-------|
| 17 | Wire real APIs end-to-end when BE is live | All components have `enabled: !isMock` + `refetchInterval`; test with real backend |
| 18 | BE contract fields implementation | `on_route`, `efficiency`, `reason`, `break_start/end` documented in TypeScript interfaces; BE team to implement |

---

## Recently Completed (this session)

| # | Task | Completed |
|---|------|-----------|
| 19 | **Live Map — remove Simulate GPS button; auto-simulate in demo mode** | 2026-05-17 |
| 20 | **Orders filter — from/to date range (replaces single date)** | 2026-05-17 |
| 21 | **AI gradient consistency — ChatPanel, RouteTimeline, Planning banner** | 2026-05-17 |
| 22 | **Live Feed redesign — fleet stats overlay, dashed depot lines, driver cards** | 2026-05-17 |

---

## Recently Completed

| # | Task | Completed |
|---|------|-----------|
| 11 | **Horizontal scroll — all pages** | 2026-05-17 |
| 12 | **Real API wiring verified** | 2026-05-17 |
| 13 | **BE contract fields documented** | 2026-05-17 |
| 14 | **Ticker live events — suggestion_type → variant mapping** | 2026-05-17 |
| 15 | **Sparkline history — on-time & drivers use `fetchKpiTrend(10)`** | 2026-05-17 |
| 16 | **Superadmin impersonation + demo-mode combo validated** | 2026-05-17 |

---

## Completed

| # | Task | Completed |
|---|------|-----------|
| A | Dashboard mock data centralised (`src/mock/data.ts`) | 2026-05-17 |
| B | Single file toggle `src/mock/config.ts` | 2026-05-17 |
| C | Components refactored to mock/live switch | 2026-05-17 |
| D | Route Timeline 07:00–18:00 axis + 24h "now" marker | 2026-05-17 |
| E | At-Risk Inbox mock with AI suggestion buttons | 2026-05-17 |
| F | Fleet Status Cards (Drivers / Vehicles / Efficiency) | 2026-05-17 |
| G | Quick Actions redesign (purple icons, Figma layout) | 2026-05-17 |
| H | LiveOpsTicker mock items from central data | 2026-05-17 |
| I | Orders page default to "all dates" | 2026-05-17 |
| J | Ask AI button gradient + remove green dot | 2026-05-17 |
| K | Sidebar user card dropdown (Profile/Settings/Shortcuts/Sign out) | 2026-05-17 |
