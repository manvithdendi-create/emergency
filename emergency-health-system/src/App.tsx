import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useEmergency } from './context/EmergencyContext'
import { Layout } from './components/Layout'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { PatientDashboard } from './pages/patient/Dashboard'
import { PatientProfile } from './pages/patient/Profile'
import { PatientEmergencyContacts } from './pages/patient/EmergencyContacts'
import { PatientSOS } from './pages/patient/SOS'
import { PatientEmergencyTracking } from './pages/patient/EmergencyTracking'
import { PatientEmergencyHistory } from './pages/patient/EmergencyHistory'
import { PatientNotifications } from './pages/patient/Notifications'
import { HospitalDashboard } from './pages/hospital/Dashboard'
import { HospitalEmergencyQueue } from './pages/hospital/EmergencyQueue'
import { HospitalEmergencyDetail } from './pages/hospital/EmergencyDetail'
import { HospitalResponderAssignment } from './pages/hospital/ResponderAssignment'
import { HospitalProfile } from './pages/hospital/Profile'
import { HospitalResponders } from './pages/hospital/Responders'
import { ResponderDashboard } from './pages/responder/Dashboard'
import { ResponderAvailability } from './pages/responder/Availability'
import { ResponderEmergencyDetail } from './pages/responder/EmergencyDetail'
import { ResponderProfile } from './pages/responder/Profile'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminUsers } from './pages/admin/Users'
import { AdminHospitals } from './pages/admin/Hospitals'
import { AdminResponders } from './pages/admin/Responders'
import { AdminEmergencies } from './pages/admin/Emergencies'
import { AdminAuditLogs } from './pages/admin/AuditLogs'
import { LoadingScreen } from './components/LoadingScreen'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { authUser, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(authUser.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { authUser, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (authUser) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { authUser } = useAuth()
  const { activeEmergency } = useEmergency()

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Patient Routes */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="emergency-contacts" element={<PatientEmergencyContacts />} />
                <Route path="sos" element={<PatientSOS />} />
                <Route path="emergency/:id" element={<PatientEmergencyTracking />} />
                <Route path="history" element={<PatientEmergencyHistory />} />
                <Route path="notifications" element={<PatientNotifications />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Hospital Routes */}
      <Route
        path="/hospital/*"
        element={
          <ProtectedRoute allowedRoles={['hospital']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<HospitalDashboard />} />
                <Route path="queue" element={<HospitalEmergencyQueue />} />
                <Route path="profile" element={<HospitalProfile />} />
                <Route path="responders" element={<HospitalResponders />} />
                <Route path="emergency/:id" element={<HospitalEmergencyDetail />} />
                <Route path="emergency/:id/assign" element={<HospitalResponderAssignment />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Responder Routes */}
      <Route
        path="/responder/*"
        element={
          <ProtectedRoute allowedRoles={['responder']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<ResponderDashboard />} />
                <Route path="availability" element={<ResponderAvailability />} />
                <Route path="profile" element={<ResponderProfile />} />
                <Route path="emergency/:id" element={<ResponderEmergencyDetail />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="hospitals" element={<AdminHospitals />} />
                <Route path="responders" element={<AdminResponders />} />
                <Route path="emergencies" element={<AdminEmergencies />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect based on role */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['patient', 'hospital', 'responder', 'admin']}>
            {authUser?.role === 'patient' && <Navigate to="/patient/dashboard" replace />}
            {authUser?.role === 'hospital' && <Navigate to="/hospital/dashboard" replace />}
            {authUser?.role === 'responder' && <Navigate to="/responder/dashboard" replace />}
            {authUser?.role === 'admin' && <Navigate to="/admin/dashboard" replace />}
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return <AppRoutes />
}