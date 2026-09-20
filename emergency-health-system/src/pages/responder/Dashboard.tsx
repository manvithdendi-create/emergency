import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck as Ambulance, MapPin, AlertTriangle, CheckCircle, Clock, Loader2, User, Shield, Bell, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { cn, formatRelativeTime, getStatusLabel } from '../../utils/helpers'
import type { Emergency, EmergencyStatus } from '../../types'

export function ResponderDashboard() {
  const { authUser } = useAuth()
  const { emergencies, loading, fetchEmergencies } = useEmergency()
  const [availability, setAvailability] = useState(false)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [stats, setStats] = useState({
    assigned: 0,
    completedToday: 0,
    onDuty: false,
  })

  useEffect(() => {
    fetchEmergencies()
    fetchAvailability()
    fetchStats()
  }, [fetchEmergencies])

  const fetchAvailability = async () => {
    if (!authUser?.responder?.id) return
    try {
      const { data } = await supabase
        .from('responders')
        .select('is_available')
        .eq('id', authUser.responder.id)
        .single()
      setAvailability(data?.is_available || false)
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }

  const fetchStats = async () => {
    if (!authUser?.responder?.id) return
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [assignedRes, completedRes] = await Promise.all([
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('responder_id', authUser.responder.id).in('status', ['accepted', 'on_the_way', 'arrived']),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('responder_id', authUser.responder.id).eq('status', 'resolved').gte('resolved_at', today.toISOString()),
      ])

      setStats({
        assigned: assignedRes.count || 0,
        completedToday: completedRes.count || 0,
        onDuty: availability,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const toggleAvailability = async () => {
    if (!authUser?.responder?.id) return
    setLoadingAvailability(true)
    try {
      const newAvailability = !availability
      const { error } = await supabase
        .from('responders')
        .update({ is_available: newAvailability })
        .eq('id', authUser.responder.id)
      if (error) throw error
      setAvailability(newAvailability)
      fetchStats()
    } catch (error) {
      console.error('Error updating availability:', error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const assignedEmergencies = emergencies.filter(e => 
    ['accepted', 'on_the_way', 'arrived'].includes(e.status)
  ).slice(0, 3)

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
      {/* Header with Availability Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Responder Dashboard</h1>
          <p className="text-gray-600">{authUser?.profile?.full_name} • {authUser?.responder?.certification_level}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Availability</span>
            <Button
              variant={availability ? 'success' : 'secondary'}
              size="sm"
              onClick={toggleAvailability}
              loading={loadingAvailability}
              className="w-24"
            >
              {availability ? (
                <>
                  <ToggleRight className="w-4 h-4 mr-1" />
                  On Duty
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 mr-1" />
                  Off Duty
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned</p>
                <p className="text-3xl font-bold text-emergency-blue">{stats.assigned}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emergency-blue-light flex items-center justify-center">
                <Ambulance className="w-6 h-6 text-emergency-blue" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Today</p>
                <p className="text-3xl font-bold text-emergency-green">{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emergency-green-light flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emergency-green" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-3xl font-bold text-gray-900">{stats.onDuty ? 'On Duty' : 'Off Duty'}</p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                stats.onDuty ? 'bg-emergency-green-light' : 'bg-gray-100'
              )}>
                {stats.onDuty ? (
                  <Shield className="w-6 h-6 text-emergency-green" />
                ) : (
                  <Bell className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Current Assignment */}
      {assignedEmergencies.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-emergency-red" />
                Current Assignments
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {assignedEmergencies.map((emergency) => (
                <Link
                  key={emergency.id}
                  to={`/responder/emergency/${emergency.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      emergency.status === 'on_the_way' && 'bg-emergency-blue-light text-emergency-blue',
                      emergency.status === 'arrived' && 'bg-emergency-green-light text-emergency-green',
                      emergency.status === 'accepted' && 'bg-emergency-blue-light text-emergency-blue'
                    )}>
                      {emergency.status === 'on_the_way' && <Ambulance className="w-6 h-6" />}
                      {emergency.status === 'arrived' && <CheckCircle className="w-6 h-6" />}
                      {emergency.status === 'accepted' && <MapPin className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{emergency.chief_complaint}</p>
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(emergency.created_at)} • {emergency.priority} Priority
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(emergency.status)}
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/responder/availability" className="card hover:shadow-md transition-shadow group p-4 text-center">
          {availability ? <ToggleRight className="w-8 h-8 text-emergency-green mx-auto mb-2 group-hover:scale-105 transition-transform" /> : <ToggleLeft className="w-8 h-8 text-emergency-green mx-auto mb-2 group-hover:scale-105 transition-transform" />}
          <h3 className="font-medium text-gray-900">Availability</h3>
          <p className="text-sm text-gray-500 mt-1">Toggle on/off duty</p>
        </Link>

        <Link to="/responder/profile" className="card hover:shadow-md transition-shadow group p-4 text-center">
          <User className="w-8 h-8 text-emergency-blue mx-auto mb-2 group-hover:scale-105 transition-transform" />
          <h3 className="font-medium text-gray-900">Profile</h3>
          <p className="text-sm text-gray-500 mt-1">Update your info</p>
        </Link>

        <div className="card hover:shadow-md transition-shadow group p-4 text-center">
          <Ambulance className="w-8 h-8 text-emergency-amber mx-auto mb-2 group-hover:scale-105 transition-transform" />
          <h3 className="font-medium text-gray-900">Vehicle</h3>
          <p className="text-sm text-gray-500 mt-1">{authUser?.responder?.vehicle_type || 'Ambulance'}</p>
        </div>

        <div className="card hover:shadow-md transition-shadow group p-4 text-center">
          <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
          <h3 className="font-medium text-gray-900">Certification</h3>
          <p className="text-sm text-gray-500 mt-1">{authUser?.responder?.certification_level}</p>
        </div>
      </div>
    </div>
  )
}
