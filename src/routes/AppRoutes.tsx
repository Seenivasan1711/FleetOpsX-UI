import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import useAppStore from '../store/useAppStore'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Orders from '../pages/Orders'
import Planning from '../pages/Planning'
import Drivers from '../pages/Drivers'
import Vehicles from '../pages/Vehicles'
import Depots from '../pages/Depots'
import DriverView from '../pages/DriverView'

export default function AppRoutes() {
  const theme = useAppStore(s => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute role="dispatcher"><Dashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute role="dispatcher"><Orders /></ProtectedRoute>} />
        <Route path="/planning" element={<ProtectedRoute role="dispatcher"><Planning /></ProtectedRoute>} />
        <Route path="/drivers" element={<ProtectedRoute role="dispatcher"><Drivers /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute role="dispatcher"><Vehicles /></ProtectedRoute>} />
        <Route path="/depots" element={<ProtectedRoute role="dispatcher"><Depots /></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute role="driver"><DriverView /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
