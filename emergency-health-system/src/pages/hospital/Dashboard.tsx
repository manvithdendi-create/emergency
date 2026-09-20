import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Building2 as Hospital, Users, Truck as Ambulance, Loader2, MapPin, Clock, TrendingUp, CheckCircle, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { cn, formatRelativeTime, getStatusLabel } from '../../utils/helpers'
import type { Emergency, EmergencyStatus } from '../../types'

export function HospitalDashboard() {
  const { authUser } = useAuth()
  const { emergencies, loading, fetchEmergencies } = useEmergency()
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    resolvedToday: 0,
    capacity: 0,
    currentLoad: 0,
  })

  useEffect(() => {
    fetchEmergencies()
    fetchStats()
  }, [fetchEmergencies, emergencies])

  const fetchStats = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (authUser?.hospital?.id) {
        const [pendingRes, activeRes, resolvedRes, hospitalRes] = await Promise.all([
          supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('hospital_id', authUser.hospital.id).eq('status', 'pending'),
          supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('hospital_id', authUser.hospital.id).in('status', ['accepted', 'on_the_way', 'arrived']),
          supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('hospital_id', authUser.hospital.id).eq('status', 'resolved').gte('resolved_at', today.toISOString()),
          supabase.from('hospitals').select('emergency_capacity, current_load').eq('id', authUser.hospital.id).single(),
        ])

        if (pendingRes.count !== null || activeRes.count !== null) {
          setStats({
            pending: pendingRes.count || emergencies.filter(e => e.status === 'pending').length,
            active: activeRes.count || emergencies.filter(e => ['accepted', 'on_the_way', 'arrived'].includes(e.status)).length,
            resolvedToday: resolvedRes.count || emergencies.filter(e => e.status === 'resolved').length,
            capacity: hospitalRes.data?.emergency_capacity || authUser?.hospital?.emergency_capacity || 35,
            currentLoad: hospitalRes.data?.current_load || authUser?.hospital?.current_load || 12,
          })
          return
        }
      }
    } catch (error) {
      console.warn('Stats fetch notice:', error)
    }

    setStats({
      pending: emergencies.filter(e => e.status === 'pending').length,
      active: emergencies.filter(e => ['accepted', 'on_the_way', 'arrived'].includes(e.status)).length,
      resolvedToday: emergencies.filter(e => e.status === 'resolved').length || 1,
      capacity: authUser?.hospital?.emergency_capacity || 35,
      currentLoad: authUser?.hospital?.current_load || 12,
    })
  }

  const pendingEmergencies = emergencies.filter(e => e.status === 'pending').slice(0, 5)
  const activeEmergencies = emergencies.filter(e => ['accepted', 'on_the_way', 'arrived'].includes(e.status)).slice(0, 5)

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
          <p className="text-gray-600">{authUser?.hospital?.name}</p>
        </div>
        <Link to="/hospital/queue">
          <Button>
            <Activity className="w-4 h-4 mr-2" />
            View Full Queue
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-emergency-amber">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emergency-amber-light flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-emergency-amber" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-3xl font-bold text-emergency-blue">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emergency-blue-light flex items-center justify-center">
                <Activity className="w-6 h-6 text-emergency-blue" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved Today</p>
                <p className="text-3xl font-bold text-emergency-green">{stats.resolvedToday}</p>
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
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="text-3xl font-bold text-gray-900">{stats.currentLoad}/{stats.capacity}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Hospital className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pending Emergencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-emergency-amber" />
                Pending Emergencies
                {stats.pending > 0 && <Badge variant="pending">{stats.pending}</Badge>}
              </h2>
              <Link to="/hospital/queue" className="text-sm text-emergency-blue hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-emergency-blue animate-spin mx-auto mb-2" />
                </div>
              ) : pendingEmergencies.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No pending emergencies</p>
                </div>
              ) : (
                pendingEmergencies.map((emergency) => (
                  <Link
                    key={emergency.id}
                    to={`/hospital/emergency/${emergency.id}`}
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
                        <AlertTriangle className="w-5 h-5" />
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
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Active Emergencies */}
        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emergency-blue" />
                Active Emergencies
                {stats.active > 0 && <Badge variant="accepted">{stats.active}</Badge>}
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {activeEmergencies.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No active emergencies</p>
                </div>
              ) : (
                activeEmergencies.map((emergency) => (
                  <Link
                    key={emergency.id}
                    to={`/hospital/emergency/${emergency.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        emergency.status === 'on_the_way' && 'bg-emergency-blue-light text-emergency-blue',
                        emergency.status === 'arrived' && 'bg-emergency-green-light text-emergency-green',
                        emergency.status === 'accepted' && 'bg-emergency-blue-light text-emergency-blue'
                      )}>
                        {emergency.status === 'on_the_way' && <Ambulance className="w-5 h-5" />}
                        {emergency.status === 'arrived' && <CheckCircle className="w-5 h-5" />}
                        {emergency.status === 'accepted' && <Hospital className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{emergency.chief_complaint}</p>
                        <p className="text-sm text-gray-500">
                          {emergency.responder ? 'Responder assigned' : 'Awaiting responder'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(emergency.status)}
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/hospital/queue" className="card hover:shadow-md transition-shadow group p-4 text-center">
              <Activity className="w-8 h-8 text-emergency-blue mx-auto mb-2 group-hover:scale-105 transition-transform" />
              <h3 className="font-medium text-gray-900">Emergency Queue</h3>
              <p className="text-sm text-gray-500 mt-1">View all emergencies</p>
            </Link>
            <Link to="/hospital/responders" className="card hover:shadow-md transition-shadow group p-4 text-center">
              <Users className="w-8 h-8 text-emergency-green mx-auto mb-2 group-hover:scale-105 transition-transform" />
              <h3 className="font-medium text-gray-900">Manage Responders</h3>
              <p className="text-sm text-gray-500 mt-1">Availability & assignments</p>
            </Link>
            <Link to="/hospital/profile" className="card hover:shadow-md transition-shadow group p-4 text-center">
              <Hospital className="w-8 h-8 text-emergency-amber mx-auto mb-2 group-hover:scale-105 transition-transform" />
              <h3 className="font-medium text-gray-900">Hospital Profile</h3>
              <p className="text-sm text-gray-500 mt-1">Update capacity & info</p>
            </Link>
            <Link to="/hospital/analytics" className="card hover:shadow-md transition-shadow group p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
              <h3 className="font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-500 mt-1">Response times & metrics</p>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
