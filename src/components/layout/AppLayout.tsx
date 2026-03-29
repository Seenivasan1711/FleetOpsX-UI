import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import { LayoutDashboard, Package, Route, Truck, Car, MapPin, Map, LogOut } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: Package },
  { path: '/planning', label: 'Planning', icon: Route },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/drivers', label: 'Drivers', icon: Truck },
  { path: '/vehicles', label: 'Vehicles', icon: Car },
  { path: '/depots', label: 'Depots', icon: MapPin },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAppStore()

  const handleLogout = () => { clearAuth(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-blue-600">FleetOpsX</h1>
          <p className="text-xs text-gray-500 truncate">{user?.full_name}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === path
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 text-sm text-gray-500 hover:text-red-500 border-t border-gray-200 dark:border-gray-700"
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
