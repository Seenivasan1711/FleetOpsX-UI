import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { Skeleton } from '../components/ui/Skeleton'

// Code-split all pages — only the current page loads
const Login          = lazy(() => import('../pages/Login'))
const TenantSelector = lazy(() => import('../pages/TenantSelector'))
const AiProviders    = lazy(() => import('../pages/AiProviders'))
const TenantAiConfig = lazy(() => import('../pages/TenantAiConfig'))
const Dashboard  = lazy(() => import('../pages/Dashboard'))
const Orders     = lazy(() => import('../pages/Orders'))
const Planning   = lazy(() => import('../pages/Planning'))
const LiveMap    = lazy(() => import('../pages/LiveMap'))
const Analytics  = lazy(() => import('../pages/Analytics'))
const Drivers    = lazy(() => import('../pages/Drivers'))
const Vehicles   = lazy(() => import('../pages/Vehicles'))
const Depots     = lazy(() => import('../pages/Depots'))
const Settings      = lazy(() => import('../pages/Settings'))
const Integrations  = lazy(() => import('../pages/Integrations'))
const Marketplace   = lazy(() => import('../pages/Marketplace'))
const AuditLog      = lazy(() => import('../pages/AuditLog'))
const Scenarios     = lazy(() => import('../pages/Scenarios'))
const DriverView    = lazy(() => import('../pages/DriverView'))
const PlanHistory   = lazy(() => import('../pages/PlanHistory'))
const TrackOrder      = lazy(() => import('../pages/TrackOrder'))
const UserManagement  = lazy(() => import('../pages/UserManagement'))
<<<<<<< HEAD
const ChatPage              = lazy(() => import('../pages/ChatPage'))
const PlanningInstructions  = lazy(() => import('../pages/PlanningInstructions'))
=======
const Profile         = lazy(() => import('../pages/Profile'))
// ChatPage removed in Phase 6 — Ask AI is now in topbar drawer
>>>>>>> origin/main

const PageLoader = () => (
  <div className="flex-1 p-6 space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-2xl" />
  </div>
)

const dispatcher = (element: React.ReactNode) => (
  <ProtectedRoute role="dispatcher">{element}</ProtectedRoute>
)

const superadmin = (element: React.ReactNode) => (
  <ProtectedRoute role="superadmin">{element}</ProtectedRoute>
)

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/track/:token"  element={<TrackOrder />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/select-tenant" element={<TenantSelector />} />

          <Route path="/"          element={dispatcher(<Dashboard />)} />
          <Route path="/orders"    element={dispatcher(<Orders />)} />
          <Route path="/planning"  element={dispatcher(<Planning />)} />
          <Route path="/map"       element={dispatcher(<LiveMap />)} />
          <Route path="/analytics" element={dispatcher(<Analytics />)} />
          <Route path="/drivers"   element={dispatcher(<Drivers />)} />
          <Route path="/vehicles"  element={dispatcher(<Vehicles />)} />
          <Route path="/depots"    element={dispatcher(<Depots />)} />
          <Route path="/settings"      element={dispatcher(<Settings />)} />
          <Route path="/integrations"  element={dispatcher(<Integrations />)} />
          <Route path="/marketplace"   element={dispatcher(<Marketplace />)} />
          <Route path="/governance"    element={dispatcher(<AuditLog />)} />
          <Route path="/scenarios"     element={dispatcher(<Scenarios />)} />

<<<<<<< HEAD
          <Route path="/admin/ai-providers"   element={dispatcher(<AiProviders />)} />
          <Route path="/admin/instructions"  element={dispatcher(<PlanningInstructions />)} />
          <Route path="/chat"               element={dispatcher(<ChatPage />)} />
=======
          <Route path="/admin/ai-providers" element={superadmin(<AiProviders />)} />
          <Route path="/ai-config"          element={dispatcher(<TenantAiConfig />)} />
>>>>>>> origin/main
          <Route path="/plan-history"       element={dispatcher(<PlanHistory />)} />
          <Route path="/team"               element={dispatcher(<UserManagement />)} />
          <Route path="/profile"            element={dispatcher(<Profile />)} />

          <Route path="/driver" element={<ProtectedRoute role="driver"><DriverView /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
