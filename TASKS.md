# FleetOpsX UI — Task Tracker

> Updated: 2026-05-20. Work top-to-bottom; mark ✅ when done.

---

## 🟣 Feature Backlog — 2026-05-17 (After QA bugs are done)

| # | Feature | Details | Ref | Status |
|---|---------|---------|-----|--------|
| ~~F-01~~ | ~~**Live Feed — match Figma**~~ | `DriverStatus` union now includes `'onBreak'`. `DriverMarker.tsx` accepts `color?` prop, builds useMemo div-icon. `FleetMap.tsx` accepts `colorMap?: Record<string,string>`, passes per-driver color. `LiveMap.tsx`: `atRisk`→red `#f87171`, new `onBreak`→amber `#f59e0b`; `STATUS_LABEL` map added; idle count includes onBreak; "On Break"/"At Risk" pill badge on driver card; legend updated (On Route/At Risk/On Break/Idle); `colorMap` built from `driverFeedItems` and passed to `<FleetMap>`. | Image #25 | ✅ Done 2026-05-20 |
| ~~F-02~~ | ~~**Plan History — redesign**~~ | Single card container with divider rows. Purple clock icon per row. "Balanced · 11 routes" on one line; date/time below. Saved = "+X.X hr". OTD ≥94% green, <94% amber. Mock data: 4 entries matching Figma Image #26. View opens detail modal; live mode includes Add Note + star rating. | Image #26 | ✅ Done 2026-05-20 |
| ~~F-03~~ | ~~**Drivers page — redesign table**~~ | `MOCK_DRIVER_TABLE` keyed by driver name (overlaid on live API data too). New columns: DRIVER (gradient avatar+name+D-00X+phone) / VEHICLE (plate) / STATUS pill (On Route/At Risk/On Break/Idle/Available) / STOPS TODAY / UTILIZATION bar+% / SCORE number+bar / ETA NEXT. Demo: 7 mock drivers, no Add button. Live: real API + MOCK_DRIVER_TABLE overlay + Add/Edit/Toggle preserved. | Image #27 | ✅ Done 2026-05-20 |
| ~~F-04~~ | ~~**Analytics page — redesign**~~ | 4 KPI cards: dark surface bg + colored top border + large value (36px) + full-width area sparkline (52px, bleeds to card edges) + "last 12 weeks". Driver util: name+% on one line, full-width colored bar below, sorted by usage. Hourly throughput: Recharts BarChart 8h–19h with peak bars highlighted in full purple. Live mode: OTD from API, rest uses mock sparklines. | Image #28 | ✅ Done 2026-05-20 |
| ~~F-05~~ | ~~**Export / Import on Drivers, Vehicles, Depots**~~ | Export+Import buttons added to all 3 page toolbars. Demo: CSV from MOCK_DRIVER_TABLE/MOCK_VEHICLES/MOCK_DEPOTS + toast import. Live: GET `/api/v1/{resource}/export` + POST `/api/v1/{resource}/import`. API helpers in `exportImport.ts`. | — | ✅ Done 2026-05-20 |
| F-06 | **Fleet & Platform sidebar items** | Deprioritised — revisit after F-01–F-05 | — | ⏸ Skipped |
| ~~**F-07**~~ | ~~**End-to-end QA**~~ | TypeScript: 0 errors (fixed `MOCK_ROUTES as MockRoute[]`; 3x `!` in Dashboard trend calcs). Logic: PlanHistory live "Drivers" label → "Routes" (was showing `total_routes` with wrong label). Orders Import/Export icons swapped → corrected. Planning: redundant ternary removed. Build: clean, 0 warnings. | — | ✅ Done 2026-05-20 |
| ~~**F-08**~~ | ~~**BE API contract spec + implementation — all unimplemented endpoints**~~ | Fleet availability schema rewritten to count aggregates (`DriverCountSummary`, `VehicleCountSummary`, `EfficiencySummary`). `get_fleet_availability` service rebuilt to derive counts from DB (drivers on route via Route+RoutePlan join, on_break/off_duty from DriverAvailability, low_fuel from fuel_level_pct < 25). CSV export/import added for drivers, vehicles, depots — `export_service.py` (`drivers_to_csv`, `vehicles_to_csv`, `depots_to_csv`) + `import_service.py` (`import_drivers_from_csv`, `import_vehicles_from_csv`, `import_depots_from_csv`). Routes `GET /export` + `POST /import` added to all 3 routers (ordered before `/{id}` routes to avoid UUID param conflict). Other listed endpoints (route-timeline, kpi-trend, chat, plan/options, orders export/import) were already implemented. | — | ✅ Done 2026-05-20 |

---

## 🔴 QA Round — 2026-05-17 (Fix These First)

All items below were logged during a manual QA pass. Start a new session by working through this list.

### Bugs — UI / Data

| # | Bug | Location | Fix Needed |
|---|-----|----------|------------|
| ~~QA-01~~ | ~~Stat card labels appear in live mode~~ | ~~`Dashboard`~~ | ✅ Fixed — trend guarded by `isMock`; live mode derives real delta from API (`kpiTrend` / `deliveries_by_day`); hidden when delta = 0 or no data |
| ~~QA-02~~ | ~~"Today's Orders" sparkline missing in live mode~~ | ~~`Dashboard`~~ | ✅ Fixed — empty `deliveries_by_day` array no longer silently drops sparkline; falls back to flat line at current value |
| ~~QA-03~~ | ~~Drivers fleet card shows NaN for "On Route" count~~ | ~~`Dashboard`~~ | ✅ Fixed — `?? 0` on all driver/vehicle/efficiency fields; `onRoute` computed as remainder; `SegmentBar` guards total=0 |
| ~~QA-04~~ | ~~LiveOps Ticker shows demo events in live mode~~ | ~~`LiveOpsTicker`~~ | ✅ Fixed — removed mock fallback; live mode with no suggestions shows "No live updates yet" empty state; dot turns grey and stops pulsing |
| ~~QA-05~~ | ~~Route Timeline blocks all same brightness~~ | ~~`RouteTimeline`~~ | ✅ Fixed — 3-state logic: past = opacity 0.35 + strikethrough text + muted dot; active = full brightness + green dot; future = opacity 0.55 |
| ~~QA-06~~ | ~~At-Risk Inbox AI suggestion buttons do nothing~~ | ~~`AtRiskInbox`~~ | ✅ Fixed — demo: contextual toast per action type (reroute/swap/skip); live: PATCH suggestion ACCEPTED with loading + error state |
| ~~QA-07~~ | ~~Profile page layout is left-aligned~~ | ~~`src/pages/Profile.tsx`~~ | ✅ Fixed — `mx-auto max-w-2xl`; avatar hero centered at top (w-20, rounded-3xl); cards use header-bar / body split |
| ~~QA-08~~ | ~~Settings page same issue as QA-07~~ | ~~`src/pages/Settings.tsx`~~ | ✅ Fixed — same `mx-auto` wrapper pattern; inner tab content already well-structured |
| ~~QA-11~~ | ~~Orders sort button always shows static ↑↓ icon regardless of direction~~ | ~~`Orders.tsx` sort button~~ | ✅ Fixed — replaced `<ArrowUpDown>` with `<ArrowUp>` / `<ArrowDown>` conditional on `sortDir` state |
| ~~QA-12~~ | ~~Import CSV fails: `badly formed hexadecimal UUID string` on rows 2 & 3~~ | ~~`Orders.tsx` import handler / BE~~ | ✅ Fixed — `User.tenant_id` is nullable for superadmins; `str(None)` → `UUID("None")` crashed per-row. Endpoint now returns 403 if no tenant context; import service accepts `UUID` directly, no string round-trip |
| ~~QA-13~~ | ~~Planning banner icon uses `Sparkles` which looks out of place~~ | ~~`Planning.tsx` AI Planner banner~~ | ✅ Fixed — replaced `<Sparkles>` with 8-spoke SVG (matches Ask AI / Topbar AI identity); removed unused `Sparkles` import |
| ~~QA-15~~ | ~~Live Fleet overlay covers Leaflet zoom controls (+/−)~~ | ✅ Fixed (extended) — overlay `top-4 right-4`; theme-aware frosted glass (dark: `rgba(10,11,20,0.76)`, light: `rgba(255,255,255,0.82)`); CartoDB dark/light tiles switch by theme in FleetMap + plan view; legend also theme-aware; ChatPanel fully theme-aware via `DARK_C`/`LIGHT_C` + React Context (`ThemeCtx`); chat backdrop/panel z-index raised to 1000/1001 (above fleet overlay at 900 + Leaflet controls) |
| ~~QA-17~~ | ~~Map blank / doesn't resize when Driver Feed panel is collapsed~~ | ~~`LiveMap.tsx`~~ | ✅ Fixed — `MapResizer` inner component uses `useMap()` + `useEffect` on `showFeed` toggle; calls `map.invalidateSize()` after 50ms to let container reflow. Applied to both live view (`FleetMap` children) and plan view (`MapContainer`) |
| ~~QA-18~~ | ~~Some dashboard section shows empty in demo mode~~ | ~~`Dashboard`~~ | ✅ Fixed — `RouteTimeline` mock routes were hardcoded to 8:30 AM–2:30 PM, making all bars show as dimmed "past" after ~14:30. Added `shiftedMockRoutes(nowMins)` that offsets all segment times so the midpoint of activity always aligns with current time — demo always shows past + active + future bars |

### Bugs — Icons / Labels

| # | Bug | Fix |
|---|-----|-----|
| ~~QA-B25~~ | ~~Orders badge only shows while on Orders page — not visible on other pages. Count also wrong (showed total not unassigned)~~ | ✅ Fixed — moved count fetch to AppShell; always-on 60s refetch; PENDING count |
| ~~QA-B26~~ | ~~Text sizes too small vs Figma across multiple pages~~ | ✅ Fixed — Orders headers 10.5→12px, filter labels 11→12px, DataTable headers 11→12px, Analytics axes/drivers bumped |
| ~~QA-I1~~ | ~~Sidebar "Planning" nav icon doesn't match "AI Plan Routes" Quick Action card icon~~ | ✅ Fixed — `Icon.Plan` updated to the same double-wave paths used in QuickActions card (`M3 17c3-5 5-5 9 0s6 5 9 0` + `M3 7c3 5 5 5 9 0s6-5 9 0`) |
| ~~QA-I2~~ | ~~Route Timeline widget header icon already has gradient — sidebar icons used old purple-only (`#4f46e5`)~~ | ✅ Fixed — updated all 3 gradient usages in Sidebar.tsx (brand logo L205, user footer avatar L399, user popup avatar L315) from `#4f46e5` → `#06b6d4` to match the system-wide `#7c3aed → #06b6d4` gradient |
| ~~QA-16~~ | ~~"Live Map" label is wrong everywhere~~ | ✅ Fixed — renamed to "Live Feed" in: Sidebar nav label (`constants.ts` NAV_ITEMS), `AppLayout.tsx` navItems, `Topbar.tsx` PAGE_META `/map`, `QuickActions.tsx` card label, `constants.ts` keyboard shortcut desc |

### Bugs — Backend / API

| # | Bug | Fix |
|---|-----|-----|
| ~~QA-14~~ | ~~`POST /api/v1/plan/options` returns **500** when Generate Plan is clicked~~ | ✅ Fixed — SQLAlchemy `uselist=False` back-populates eviction set old RouteStop `order_id=NULL` (NOT NULL violation) on 2nd/3rd mode iteration. Fixed by using Core `sa_insert(RouteStop)` to bypass ORM relationship management; also skip `RuleBasedPlanner` fallback when `commit_assignments=False`. Doc: `FleetOpsX-API/docs/bugfix-qa14-plan-options-500.md` |
| ~~QA-14b~~ | ~~Import/Export BE route also suspected to have UUID parsing errors~~ | ✅ Fixed — `export_service.py` now takes `tenant_id: UUID` directly (no `UUID(str)` round-trip); removed internal "ID" UUID column from orders export; plan export replaces "Order ID" UUID column with "External Ref"; `export.py` passes `current_user.tenant_id` (UUID) without `str()` wrapping |

### Features / Scope (Do Not Fix Now — Plan Later)

| # | Feature | Notes |
|---|---------|-------|
| ~~QA-09~~ | ~~AI Providers — superadmin platform view needed~~ | ✅ Fixed — `AiProviders.tsx` at `/admin/ai-providers` now uses standalone superadmin layout (no AppShell/tenant sidebar); ← Platform Home back link above heading; Sign out in header; accessible from `/select-tenant` Platform Management section |
| ~~QA-10~~ | ~~All Tenants dropdown — show tenant list with recent + search~~ | ✅ Fixed — "All Tenants" button now opens an upward popover (closes on outside click, `autoFocus` search). Top section shows up to 5 recently-used tenants (stored in `localStorage`). Below: search input + scrollable tenant list. Each row has hover-reveal "Act" + read-only buttons. Recents updated on every `handleSelect`. |
| ~~QA-F1~~ | ~~At Risk AI buttons — deep real-mode action~~ | ✅ Fixed — live mode: PATCH suggestion ACCEPTED; button shows "Re-planning route…" / "Notifying team…" depending on `suggestion_type`; response `context` parsed for `driver_name` + `eta_delta`; toast: "Ananya re-routed · ETA improved by 12 min" (REPLAN_DRIVER) or SLA acknowledged message (EARLY_SLA_WARNING) |
| ~~QA-F2~~ | ~~Plan History page — view past plans~~ | ✅ Already wired — `PlanHistory.tsx` calls `listPlanHistory()` → `GET /api/v1/plan/history`; BE endpoint exists at `planning.py:254`; no further work needed |
| ~~QA-F3~~ | ~~Planning regenerate — accept manual text suggestions~~ | ✅ Fixed — "Manual hints (optional)" textarea added to Planning page (live mode only); `userHints` state wired to `generatePlanOptions(planDate, userHints)`; BE `POST /plan/options` accepts `user_hints` query param and logs it (future: pass to multi-agent planner) |
| ~~QA-F4~~ | ~~MongoDB plan storage architecture~~ | ✅ Resolved — Plans are stored in PostgreSQL (`route_plans` PUBLISHED + `plan_history`). MongoDB is chat history only. Gap found + fixed: `POST /plan/confirm` now auto-writes a `PlanHistory` row (source=or_tools) so Plan History page shows every dispatched plan |

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
| 23 | **QA-01 — Stat card trend labels guarded (live mode shows real API delta or nothing)** | 2026-05-17 |
| 24 | **QA-02 — Sparkline flat-line fallback when API returns 0/empty deliveries_by_day** | 2026-05-17 |
| 25 | **Mock data → JSON files (9 JSON files in src/mock/; data.ts is now a thin typed wrapper)** | 2026-05-17 |
| 26 | **QA-03 — FleetStatusCards NaN fixed (`?? 0` on all fleet fields; SegmentBar divide-by-zero guard)** | 2026-05-17 |
| 27 | **QA-04 — LiveOpsTicker mock fallback removed; "No live updates yet" empty state in live mode** | 2026-05-17 |
| 28 | **Efficiency card — removed MOCK_FLEET fallback; shows 0% when BE doesn't return efficiency data** | 2026-05-17 |
| 29 | **Dashboard polling — added refetchInterval to all 5 queries (kpis 120s, fleet/orders/drivers 60s, kpiTrend 300s)** | 2026-05-17 |
| 30 | **QA-06 — At-Risk Inbox: contextual demo toasts + live PATCH suggestion ACCEPTED** | 2026-05-17 |
| 31 | **QA-07 — Profile page: centered max-w-2xl layout, avatar hero at top** | 2026-05-17 |
| 32 | **QA-08 — Settings page: mx-auto centering (same pattern as QA-07)** | 2026-05-17 |
| 33 | **QA-09 — TenantAiConfig page at /ai-config: platform defaults read-only, per-task overrides, warning banners** | 2026-05-17 |
| 34 | **QA-11 — Orders sort icon: replaced static ArrowUpDown with ArrowUp/ArrowDown conditional on sortDir** | 2026-05-17 |
| 35 | **QA-12 — Import UUID error: 403 guard for no-tenant superadmin; import service takes UUID directly** | 2026-05-17 |

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
