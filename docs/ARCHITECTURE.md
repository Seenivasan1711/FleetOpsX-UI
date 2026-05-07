# FleetOpsX UI — Architecture & Engineering Standards

> **Status:** PP-E7 in progress (2026-04-30)
> **Stack:** React 19 · TypeScript · Vite · Tailwind v4 · TanStack Query v5 · Zustand v5 · Framer Motion

---

## Folder Structure

```
src/
├── app/
│   └── providers.tsx           # QueryClient, Toaster, theme effect wired here
├── components/
│   ├── layout/                 # Shell — touches every page
│   │   ├── AppShell.tsx        # Root layout: sidebar + topbar + scrollable content
│   │   ├── Sidebar.tsx         # Icon rail (64px) / expanded (224px) with toggle
│   │   ├── Topbar.tsx          # Page title + LIVE badge + notifications + user menu
│   │   ├── NotificationBell.tsx
│   │   ├── UserMenu.tsx
│   │   └── PageWrapper.tsx     # Framer Motion page entry animation + scroll container
│   ├── ui/                     # Design-system primitives — no business logic
│   │   ├── Badge.tsx           # PriorityBadge, StatusBadge, RoleBadge
│   │   ├── Button.tsx          # variant: primary | secondary | ghost | danger
│   │   ├── Card.tsx            # Surface card with optional accent bar
│   │   ├── Collapsible.tsx     # Expand/collapse section (At-Risk, AI Suggestions)
│   │   ├── EmptyState.tsx      # Dashed-circle illustration + title + subtitle
│   │   ├── Input.tsx           # Text input, SearchInput
│   │   ├── Modal.tsx           # Headless UI Dialog wrapper
│   │   ├── Select.tsx          # Native select with design token styling
│   │   ├── Skeleton.tsx        # Shimmer placeholder loaders
│   │   ├── Toggle.tsx          # iOS-style toggle switch
│   │   └── Tooltip.tsx         # Hover tooltip (used in collapsed sidebar)
│   └── features/               # Domain-scoped components — one sub-folder per feature
│       ├── dashboard/
│       │   ├── StatCard.tsx
│       │   ├── OnboardingBanner.tsx
│       │   ├── QuickActions.tsx
│       │   ├── AtRiskPanel.tsx
│       │   └── AiSuggestionsPanel.tsx
│       ├── planning/
│       │   ├── AgentFeed.tsx
│       │   └── PlanResultTable.tsx
│       ├── map/
│       │   ├── FleetMap.tsx
│       │   ├── DriverMarker.tsx
│       │   ├── RoutePolyline.tsx   # PP-E6 — implemented when ready
│       │   └── MapLegend.tsx       # PP-E6
│       ├── chat/
│       │   └── ChatPanel.tsx       # PP-E4 — slide-in panel
│       ├── orders/
│       │   └── OrderForm.tsx
│       ├── drivers/
│       │   └── DriverForm.tsx
│       ├── vehicles/
│       │   └── VehicleForm.tsx
│       └── depots/
│           └── DepotForm.tsx
├── hooks/
│   ├── useCounterAnimation.ts  # Animated number from 0 → target (easeOutCubic)
│   ├── useKeyboardShortcuts.ts # G+key navigation, ? shortcut modal
│   └── useOutsideClick.ts      # Ref-based outside-click handler
├── lib/
│   ├── api/                    # One file per backend resource
│   │   ├── client.ts           # Axios instance — base URL, auth header interceptor
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   ├── drivers.ts
│   │   ├── vehicles.ts
│   │   ├── depots.ts
│   │   ├── planning.ts
│   │   ├── tracking.ts
│   │   ├── analytics.ts
│   │   ├── sla.ts
│   │   ├── agent-logs.ts
│   │   └── agent-suggestions.ts
│   └── utils/
│       ├── cn.ts               # clsx + tailwind-merge (use everywhere for class merging)
│       ├── format.ts           # formatDate, formatTime, initials, truncate
│       └── constants.ts        # QUERY_KEYS, NAV_ITEMS, KEYBOARD_SHORTCUTS, COMING_SOON_ITEMS
├── pages/                      # Thin orchestrators — fetch data, compose features
│   ├── Dashboard.tsx
│   ├── Orders.tsx
│   ├── Planning.tsx
│   ├── LiveMap.tsx
│   ├── Analytics.tsx
│   ├── Drivers.tsx
│   ├── Vehicles.tsx
│   ├── Depots.tsx
│   ├── Settings.tsx
│   ├── Login.tsx
│   └── DriverView.tsx
├── routes/
│   ├── AppRoutes.tsx
│   └── ProtectedRoute.tsx
├── store/
│   ├── auth.store.ts           # accessToken, user, setAuth, clearAuth
│   ├── ui.store.ts             # theme, variant, sidebarExpanded, chatOpen, gPressed
│   └── index.ts                # re-exports both stores
├── styles/
│   └── globals.css             # CSS variables, theme definitions, animations, scrollbar
└── types/
    ├── domain.ts               # User, Driver, Vehicle, Order, etc.
    ├── api.ts                  # API request/response shapes
    └── index.ts                # Re-exports
```

---

## Theming System

The design has **two axes**: mode (`dark` | `light`) and variant (`midnight` | `storm` | `amethyst`).

They are applied as HTML attributes:
```html
<html data-theme="dark" data-variant="midnight">
```

All components use CSS custom properties (`var(--c-surface)`, `var(--c-accent)`, etc.) defined in `globals.css`.  
Tailwind's `@theme inline` block maps these to Tailwind utilities (`bg-surface`, `text-muted`, etc.).

**Color tokens:**
| Token | Purpose |
|---|---|
| `--c-bg` | Page background |
| `--c-surface` | Card / panel background |
| `--c-elevated` | Hover state background / table header |
| `--c-border` | All borders |
| `--c-text` | Primary text |
| `--c-muted` | Secondary / label text |
| `--c-sidebar-bg` | Sidebar background (slightly darker than bg) |
| `--c-accent` | Brand color (changes with variant) |
| `--c-accent-dim` | Accent at ~12% opacity (active nav, highlight bg) |
| `--c-accent-glow` | Accent glow for button shadows |
| `--c-red / -dim` | Error / critical / at-risk |
| `--c-green / -dim` | Success / on-time |
| `--c-orange / -dim` | Warning / pending |
| `--c-purple / -dim` | AI / analytics |

Theme switching triggers a 380ms CSS transition on `background-color`, `border-color`, `color`.

---

## State Management

Two Zustand stores, both persisted to `localStorage`:

### `auth.store.ts`
```ts
{ accessToken, user, setAuth, clearAuth }
```
Used by: `ProtectedRoute`, Axios interceptor, `UserMenu`, `Topbar`.

### `ui.store.ts`
```ts
{
  theme: 'dark' | 'light'
  variant: 'midnight' | 'storm' | 'amethyst'
  sidebarExpanded: boolean
  chatOpen: boolean           // PP-E4
  setTheme, setVariant, toggleSidebar, toggleChat
}
```
Used by: `AppShell`, `Settings`, `Sidebar`, `Topbar`.

---

## Component Conventions

- **Named exports** for all components. Default export only for pages.
- **Prop interface above component** — always typed, never `any`.
- **No inline business logic in UI primitives** — Button, Card, Badge are purely visual.
- **Feature components** may call `useQuery` / `useMutation` directly (co-location).
- **Pages** are thin: they compose feature components, handle top-level loading/error states.
- **`cn()` everywhere** for conditional class merging — never string interpolation.

---

## API Layer

Single Axios instance in `lib/api/client.ts` with:
- Base URL from `import.meta.env.VITE_API_URL`
- Request interceptor: injects `Authorization: Bearer <token>` from `auth.store`
- Response interceptor: auto-logout on 401

Each resource file exports typed functions used directly in `useQuery` / `useMutation`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `G` then `D/O/P/M/A/R/V/E/S` | Navigate to page |
| `[` / `]` | Collapse / expand sidebar |
| `?` | Show keyboard shortcuts modal |
| `Esc` | Close modals |

Implemented in `hooks/useKeyboardShortcuts.ts`, used in `AppShell`.

---

## Coming Soon Pattern

Sidebar items and features planned but not yet implemented use the `comingSoon` flag:

```ts
{ id: 'chat', label: 'Chat AI', icon: MessageSquare, comingSoon: true }
```

Rendered as: dimmed icon, `SOON` badge, cursor `not-allowed`, no click handler, tooltip shows "Coming soon".

Phase 4 items appear in a separate "Roadmap" section at the bottom of the sidebar.

---

## Form Pattern

All create/edit forms use `react-hook-form` + `zod`:
1. Schema defined in `lib/validators/[entity].ts`
2. Form component in `components/features/[entity]/[Entity]Form.tsx`
3. Opened via `Modal` from a page-level button
4. Submits via `useMutation` → `queryClient.invalidateQueries` on success → toast

---

## Code Style Rules

- No comments unless the WHY is non-obvious
- No AI-style docblocks or multi-line comment blocks
- Prefer `const` arrow functions for components: `export const Button = () => {}`
- Use `type` for object shapes, `interface` only when extending
- Group imports: React → third-party → internal (types last)
- Max 300 lines per component file; split if larger
