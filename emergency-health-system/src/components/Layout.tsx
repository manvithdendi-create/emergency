import { Outlet, NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useEmergency } from '../context/EmergencyContext'
import { cn, getInitials, formatRelativeTime } from '../utils/helpers'
import {
  LayoutDashboard,
  User,
  Phone,
  AlertTriangle,
  History,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  MapPin,
  Users,
  Building2 as Hospital,
  Truck as Ambulance,
  Settings,
  Shield,
  Activity,
  FileText,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navigation = {
  patient: [
    { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Medical Profile', href: '/patient/profile', icon: User },
    { name: 'Emergency Contacts', href: '/patient/emergency-contacts', icon: Phone },
    { name: 'SOS Alert', href: '/patient/sos', icon: AlertTriangle },
    { name: 'Active Emergency', href: '/patient/emergency/active', icon: MapPin },
    { name: 'History', href: '/patient/history', icon: History },
    { name: 'Notifications', href: '/patient/notifications', icon: Bell },
  ],
  hospital: [
    { name: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard },
    { name: 'Emergency Queue', href: '/hospital/queue', icon: Activity },
    { name: 'Hospital Profile', href: '/hospital/profile', icon: Hospital },
    { name: 'Responders', href: '/hospital/responders', icon: Users },
  ],
  responder: [
    { name: 'Dashboard', href: '/responder/dashboard', icon: LayoutDashboard },
    { name: 'Availability', href: '/responder/availability', icon: Ambulance },
    { name: 'Profile', href: '/responder/profile', icon: User },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Hospitals', href: '/admin/hospitals', icon: Hospital },
    { name: 'Responders', href: '/admin/responders', icon: Ambulance },
    { name: 'Emergencies', href: '/admin/emergencies', icon: Activity },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  ],
}

export function Layout({ children }: { children?: ReactNode }) {
  const { authUser, signOut } = useAuth()
  const { unreadCount } = useEmergency()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeEmergencyBanner, setActiveEmergencyBanner] = useState(false)

  useEffect(() => {
    if (authUser?.role === 'patient' && location.pathname.startsWith('/patient')) {
      // Check for active emergency
    }
  }, [authUser, location.pathname])

  const navItems = navigation[authUser?.role as keyof typeof navigation] || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emergency-red flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EmergencyAlert</span>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emergency-red text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Active emergency banner for patients */}
        {authUser?.role === 'patient' && activeEmergencyBanner && (
          <div className="mx-4 mt-auto mb-4 p-4 bg-emergency-red-light border border-emergency-red rounded-lg animate-pulse">
            <div className="flex items-center gap-2 text-emergency-red-dark mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Active Emergency</span>
            </div>
            <NavLink
              to="/patient/emergency/active"
              className="text-sm font-medium text-emergency-red-dark hover:underline"
              onClick={() => setSidebarOpen(false)}
            >
              View Emergency →
            </NavLink>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Role badge */}
              <span
                className={cn(
                  'hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  authUser?.role === 'patient' && 'bg-emergency-blue-light text-emergency-blue-dark',
                  authUser?.role === 'hospital' && 'bg-emergency-green-light text-emergency-green-dark',
                  authUser?.role === 'responder' && 'bg-emergency-amber-light text-emergency-amber-dark',
                  authUser?.role === 'admin' && 'bg-purple-100 text-purple-800'
                )}
              >
                {authUser?.role?.charAt(0).toUpperCase() + authUser?.role?.slice(1)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification bell */}
              <button
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  if (authUser?.role === 'patient') {
                    window.location.href = '/patient/notifications'
                  }
                }}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emergency-red text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-emergency-red flex items-center justify-center text-white font-medium text-sm">
                    {getInitials(authUser?.profile?.full_name || 'User')}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {authUser?.profile?.full_name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{authUser?.profile?.full_name}</p>
                        <p className="text-xs text-gray-500">{authUser?.email}</p>
                      </div>
                      <NavLink
                        to={`/${authUser?.role}/profile`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </NavLink>
                      <NavLink
                        to={`/${authUser?.role}/settings`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </NavLink>
                      {authUser?.role === 'admin' && (
                        <NavLink
                          to="/admin/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </NavLink>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={signOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emergency-red hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8" role="main">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
