# FleetOpsX UI — Operations Command Centre

> The dispatcher-facing web dashboard and driver mobile view for the FleetOpsX fleet operations platform.

---

## Overview

FleetOpsX UI is a React + TypeScript single-page application that provides:

- **Dispatcher Dashboard** — overview of today's orders, generate AI-assisted route plans, manage drivers, vehicles, and depots
- **Driver View** — mobile-optimised stop list with one-tap arrival and delivery confirmation

The UI is part of the FleetOpsX platform. It is intended to be run alongside the API (`FleetOpsX-API`).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite (rolldown-vite) |
| Styling | Tailwind CSS |
| State | Zustand v5 (persisted) |
| Data Fetching | TanStack React Query v5 |
| Forms | react-hook-form v7 + Zod v4 |
| Routing | React Router v7 |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Icons | lucide-react |
| Error Tracking | Sentry |

---

## Running the UI

### Option 1 — Via Docker Compose (Recommended)

The UI is included in the `docker-compose.yml` in the `FleetOpsX-API` repository. Running the full stack is the recommended approach:

```bash
cd ../FleetOpsX-API
docker compose up -d

docker compose build --no-cache ui && docker compose up -d ui 
docker compose down ui && docker compose build --no-cache ui && docker compose up -d ui
```

The UI will be available at **http://localhost:5173**

### Option 2 — Local Development

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**

### Option 3 — Production Build

```bash
npm run build
npm run preview
```

---

## Environment Variables

Create a `.env` file in the root of this repo:

```env
VITE_API_URL=http://localhost:8000
VITE_SENTRY_DSN=your-sentry-dsn   # optional
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Base URL of the FleetOpsX API |
| `VITE_SENTRY_DSN` | No | Sentry DSN for frontend error tracking |

---

## Application Routes

| Path | Role | Description |
|------|------|-------------|
| `/login` | Public | Login with email, password, and Tenant ID |
| `/` | Dispatcher | Dashboard — today's order stats + quick actions |
| `/planning` | Dispatcher | Generate route plans, review assignments |
| `/orders` | Dispatcher | Full order list with date/status filters + create/edit |
| `/drivers` | Dispatcher | Driver management — create, edit, toggle active |
| `/vehicles` | Dispatcher | Vehicle management — create, edit, cold chain toggle |
| `/depots` | Dispatcher | Depot management — create, edit with coordinates |
| `/driver` | Driver | Mobile stop list — mark arrived, delivered, failed |

---

## Project Structure

```
src/
├── api/              ← Axios API client modules
│   ├── client.ts     ← Axios instance with JWT interceptor
│   ├── auth.ts
│   ├── orders.ts
│   ├── planning.ts
│   ├── drivers.ts
│   ├── vehicles.ts
│   ├── depots.ts
│   └── driver.ts     ← Driver stop endpoints
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx     ← Sidebar navigation shell
│   ├── shared/
│   │   ├── DataTable.tsx     ← Generic sortable table
│   │   ├── FormModal.tsx     ← Slide-over form panel
│   │   ├── FormField.tsx     ← Labeled input wrapper
│   │   ├── StatusBadge.tsx   ← Coloured status pills
│   │   └── ToggleSwitch.tsx  ← Active/inactive toggle
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Planning.tsx       ← Key demo screen
│   ├── Orders.tsx
│   ├── Drivers.tsx
│   ├── Vehicles.tsx
│   ├── Depots.tsx
│   └── DriverView.tsx     ← Mobile driver screen
├── routes/
│   ├── AppRoutes.tsx
│   └── ProtectedRoute.tsx
├── store/
│   └── useAppStore.ts     ← Auth state + theme (Zustand + persist)
└── types/
    └── index.ts           ← TypeScript interfaces
```

---

## Demo Credentials

After running the seed script from `FleetOpsX-API`:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Dispatcher | dispatcher@demo.com | demo1234 | Full dashboard access |
| Driver | driver@demo.com | demo1234 | Driver stop view only |

Both users require the **Tenant ID** printed by the seed script at login.

For the full demo script, see **[FleetOpsX-API/DEMO_GUIDE.md](../FleetOpsX-API/DEMO_GUIDE.md)**.
