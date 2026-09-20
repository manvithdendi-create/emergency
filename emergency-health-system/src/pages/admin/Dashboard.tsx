import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2 as Hospital, Truck as Ambulance, Activity, TrendingUp, Loader2, AlertTriangle, CheckCircle, Clock, MapPin, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { cn, formatRelativeTime } from '../../utils/helpers'
import type { Emergency } from '../../types'

export function AdminDashboard() {
  const { authUser } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHospitals: 0,
    totalResponders: 0,
    totalEmergencies: 0,
    activeEmergencies: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
  })
  const [recentEmergencies, setRecentEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentEmergencies()
  }, [])

  const fetchStats = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        usersRes,
        hospitalsRes,
        respondersRes,
        emergenciesRes,
        activeRes,
        resolvedRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('hospitals').select('*', { count: 'exact', head: true }),
        supabase.from('responders').select('*', { count: 'exact', head: true }),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).in('status', ['pending', 'accepted', 'on_the_way', 'arrived']),
        supabase.from('emergencies').select('*', { count: 'exact', head: true }).eq('status', 'resolved').gte('resolved_at', today.toISOString()),
      ])

      // Calculate average response time
      const { data: resolvedEmergencies } = await supabase
        .from('emergencies')
        .select('created_at, resolved_at')
        .eq('status', 'resolved')
        .gte('resolved_at', today.toISOString())

      let avgResponseTime = 0
      if (resolvedEmergencies && resolvedEmergencies.length > 0) {
        const totalMs = resolvedEmergencies.reduce((sum, e) => {
          if (e.resolved_at) {
            return sum + (new Date(e.resolved_at).getTime() - new Date(e.created_at).getTime())
          }
          return sum
        }, 0)
        avgResponseTime = Math.round(totalMs / resolvedEmergencies.length / 60000) // minutes
      }

      setStats({
        totalUsers: usersRes.count || 0,
        totalHospitals: hospitalsRes.count || 0,
        totalResponders: respondersRes.count || 0,
        totalEmergencies: emergenciesRes.count || 0,
        activeEmergencies: activeRes.count || 0,
        resolvedToday: resolvedRes.count || 0,
        avgResponseTime,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentEmergencies = async () => {
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .select(`
          *,
          hospital:hospitals(name),
          patient:profiles!emergencies_patient_id_fkey(full_name),
          responder:responders(vehicle_type, profiles(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentEmergencies(data || [])
    } catch (error) {
      console.error('Error fetching emergencies:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, any> = {
      pending: 'pending',
      accepted: 'accepted',
      on_the_way: 'on_the_way',
      arrived: 'arrived',
      resolved: 'resolved',
      cancelled: 'default',
    }
    return <Badge variant={variantMap[status] || 'default'}>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emergency-blue-light flex items-center justify-center">
                <Users className="w-5 h-5 text-emergency-blue" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hospitals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHospitals}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emergency-green-light flex items-center justify-center">
                <Hospital className="w-5 h-5 text-emergency-green" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Responders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalResponders}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emergency-amber-light flex items-center justify-center">
                <Ambulance className="w-5 h-5 text-emergency-amber" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Emergencies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmergencies}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emergency-red-light flex items-center justify-center">
                <Activity className="w-5 h-5 text-emergency-red" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Now</p>
                <p className="text-2xl font-bold text-emergency-amber">{stats.activeEmergencies}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emergency-amber-light flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-emergency-amber" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved Today</p>
                <p className="text-2xl font-bold text-emergency-green">{stats.resolvedToday}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emergency-green-light flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emergency-green" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgResponseTime} min</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/users" className="card hover:shadow-md transition-shadow group p-4 text-center">
          <Users className="w-8 h-8 text-emergency-blue mx-auto mb-2 group-hover:scale-105 transition-transform" />
          <h3 className="font-medium text-gray-900">User Management</h3>
          <p className="text-sm text-gray-500 mt-1">View & manage all users</p>
        </Link>
        <Link to="/admin/hospitals" className="card hover:shadow-md transition-shadow group p-4 text-center">
          <Hospital className="w-8 h-8 text-emergency-green mx-auto mb-2 group-hover:scale-105 transition-transform" />
          <h3 className="font-medium text-gray-900">Hospitals</h3>
          <p className="text-sm text-gray-500 mt-1">Manage hospital profiles</p>
        </Link>
        <Link to="/admin/responders" className="card hover:shadow-md transition-shadow group p-4 text-center">
          <Ambulance className="w-8 h-8 text-emergency-amber mx-auto mb-2 group-hover:scale-105 transition-transform" />
          <h3 className="font-medium text-gray-900">Responders</h3>
          <p className="text-sm text-gray-500 mt-1">Manage responder fleet</p>
        </Link>
        <Link to="/admin/emergencies" className="card hover:shadow-md transition-shadow group p-4 text-center">
          <Activity className="w-8 h-8 text-emergency-red mx-auto mb-2 group-hover:scale-105 transition-transform" />
          <h3 className="font-medium text-gray-900">All Emergencies</h3>
          <p className="text-sm text-gray-500 mt-1">View emergency history</p>
        </Link>
      </div>

      {/* Recent Emergencies */}
      <Card>
        <CardBody className="p-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emergency-red" />
              Recent Emergencies
            </h2>
            <Link to="/admin/emergencies" className="text-sm text-emergency-blue hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-emergency-blue animate-spin mx-auto mb-2" />
              </div>
            ) : recentEmergencies.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No emergencies yet</p>
              </div>
            ) : (
              recentEmergencies.map((emergency) => (
                <div key={emergency.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                          Patient: {emergency.patient?.full_name || 'Unknown'} • {formatRelativeTime(emergency.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:ml-auto">
                      {getStatusBadge(emergency.status)}
                      <Badge variant={emergency.priority as any}>{emergency.priority}</Badge>
                      {emergency.hospital && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {emergency.hospital.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))) }
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
