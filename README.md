# FleetOpsX UI

*The Operations Command Center*

The FleetOpsX UI is a modern dashboard for operations managers and drivers. It provides real-time visibility into fleet status, route planning, and delivery execution.

## 🚀 Getting Started

This repository contains the frontend dashboard built with **React**, **Vite**, and **Tailwind CSS**.

### Prerequisites

- **Node.js**: v20+
- **npm** or **yarn**

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd FleetOpsX-UI
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SENTRY_DSN=your-sentry-dsn
   ```

### Running the Project

#### 1. Development Mode
```bash
npm run dev
```
The app will be available at [http://localhost:5173](http://localhost:5173).

#### 2. Docker Mode (via API repo)
It is recommended to run the UI using the `docker-compose.yml` located in the `FleetOpsX-API` repository to ensure backend connectivity.

```bash
cd ../FleetOpsX-API
docker compose up ui
```

### Building for Production

```bash
npm run build
```

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query & Zustand
- **Observability**: Sentry for error tracking
- **Routing**: React Router
