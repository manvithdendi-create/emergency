import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, MapPin, History, Bell, User, Phone, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn, formatRelativeTime, getStatusLabel, getPriorityLabel } from '../../utils/helpers'
import type { EmergencyStatus } from '../../types'

export function PatientDashboard() {
  const { authUser } = useAuth()
  const { activeEmergency, emergencies, loading, fetchEmergencies } = useEmergency()

  useEffect(() => {
    fetchEmergencies()
  }, [fetchEmergencies])

  const recentEmergencies = emergencies.slice(0, 5)

  const getStatusBadge = (status: EmergencyStatus) => {
    const variantMap: Record<EmergencyStatus, any> = {
      pending: 'pending',
      accepted: 'accepted',
      on_the_way: 'on_the_way',
      arrived: 'arrived',
      resolved: 'resolved',
      cancelled: 'default',
    }
    return <Badge variant={variantMap[status] || 'default'}>{getStatusLabel(status)}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {authUser?.profile?.full_name?.split(' ')[0]}</p>
        </div>
        <Link to="/patient/sos">
          <Button variant="sos" size="lg" className="w-full sm:w-auto">
            <AlertTriangle className="w-5 h-5 mr-2" />
            SOS Emergency
          </Button>
        </Link>
      </div>

      {/* Active Emergency Banner */}
      {activeEmergency && (
        <div className="card border-emergency-red bg-emergency-red-light animate-pulse-ring relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emergency-red/10 to-transparent" />
          <CardBody className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emergency-red flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emergency-red-dark">Active Emergency</h3>
                  <p className="text-sm text-emergency-red-dark">
                    {activeEmergency.chief_complaint} • {getStatusLabel(activeEmergency.status)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(activeEmergency.status)}
                <Link to={`/patient/emergency/${activeEmergency.id}`}>
                  <Button variant="danger" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </CardBody>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/patient/sos" className="card hover:shadow-md transition-shadow group">
          <CardBody className="text-center">
            <div className="w-14 h-14 rounded-xl bg-emergency-red-light flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-7 h-7 text-emergency-red" />
            </div>
            <h3 className="font-medium text-gray-900">SOS Alert</h3>
            <p className="text-sm text-gray-500 mt-1">Create emergency</p>
          </CardBody>
        </Link>

        <Link to="/patient/profile" className="card hover:shadow-md transition-shadow group">
          <CardBody className="text-center">
            <div className="w-14 h-14 rounded-xl bg-emergency-blue-light flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <User className="w-7 h-7 text-emergency-blue" />
            </div>
            <h3 className="font-medium text-gray-900">Medical Profile</h3>
            <p className="text-sm text-gray-500 mt-1">Update health info</p>
          </CardBody>
        </Link>

        <Link to="/patient/emergency-contacts" className="card hover:shadow-md transition-shadow group">
          <CardBody className="text-center">
            <div className="w-14 h-14 rounded-xl bg-emergency-green-light flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Phone className="w-7 h-7 text-emergency-green" />
            </div>
            <h3 className="font-medium text-gray-900">Emergency Contacts</h3>
            <p className="text-sm text-gray-500 mt-1">Manage contacts</p>
          </CardBody>
        </Link>

        <Link to="/patient/history" className="card hover:shadow-md transition-shadow group">
          <CardBody className="text-center">
            <div className="w-14 h-14 rounded-xl bg-emergency-amber-light flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <History className="w-7 h-7 text-emergency-amber" />
            </div>
            <h3 className="font-medium text-gray-900">History</h3>
            <p className="text-sm text-gray-500 mt-1">Past emergencies</p>
          </CardBody>
        </Link>
      </div>

      {/* Recent Emergencies */}
      <div className="card">
        <CardBody className="p-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Emergencies</h2>
            <Link to="/patient/history" className="text-sm text-emergency-blue hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-emergency-blue animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : recentEmergencies.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No emergencies yet</h3>
                <p className="text-gray-500 mb-4">Your emergency history will appear here</p>
                <Link to="/patient/sos">
                  <Button variant="primary" size="sm">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Create SOS Alert
                  </Button>
                </Link>
              </div>
            ) : (
              recentEmergencies.map((emergency) => (
                <Link
                  key={emergency.id}
                  to={`/patient/emergency/${emergency.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      emergency.priority === 'critical' && 'bg-emergency-red-light text-emergency-red',
                      emergency.priority === 'high' && 'bg-emergency-red-light text-emergency-red',
                      emergency.priority === 'medium' && 'bg-emergency-amber-light text-emergency-amber',
                      emergency.priority === 'low' && 'bg-emergency-blue-light text-emergency-blue'
                    )}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{emergency.chief_complaint}</p>
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(emergency.created_at)} • {getPriorityLabel(emergency.priority)} Priority
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(emergency.status)}
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardBody>
      </div>
    </div>
  )
}
