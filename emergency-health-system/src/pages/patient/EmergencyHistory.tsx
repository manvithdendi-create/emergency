import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, MapPin, Building2 as Hospital, Truck as Ambulance, CheckCircle, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn, formatDateTime, getStatusLabel, getPriorityLabel, getPriorityColor } from '../../utils/helpers'
import type { Emergency, EmergencyStatus } from '../../types'

export function PatientEmergencyHistory() {
  const { authUser } = useAuth()
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all')

  useEffect(() => {
    fetchEmergencies()
  }, [])

  const fetchEmergencies = async () => {
    if (!authUser?.profile?.id) return
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .select(`
          *,
          hospital:hospitals(name),
          responder:responders(vehicle_type, profiles(full_name))
        `)
        .eq('patient_id', authUser.profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmergencies(data || [])
    } catch (error) {
      console.error('Error fetching emergencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmergencies = emergencies.filter(e => {
    if (filter === 'active') return !['resolved', 'cancelled'].includes(e.status)
    if (filter === 'past') return ['resolved', 'cancelled'].includes(e.status)
    return true
  })

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

  const getPriorityBadge = (priority: string) => (
    <Badge variant={priority as any}>{getPriorityLabel(priority)}</Badge>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardBody>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardBody>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency History</h1>
          <p className="text-gray-600">View all your past and current emergencies</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'past', label: 'Past' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value as any)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              filter === value
                ? 'bg-white text-emergency-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredEmergencies.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'active' ? 'No active emergencies' : filter === 'past' ? 'No past emergencies' : 'No emergencies yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'active'
                ? 'When you create an SOS alert, it will appear here'
                : filter === 'past'
                ? 'Your resolved emergencies will appear here'
                : 'Create an SOS alert to see it here'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEmergencies.map((emergency) => (
            <Card key={emergency.id} className={emergency.status === 'cancelled' ? 'opacity-75' : ''}>
              <CardBody>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                      emergency.priority === 'critical' && 'bg-emergency-red-light text-emergency-red',
                      emergency.priority === 'high' && 'bg-emergency-red-light text-emergency-red',
                      emergency.priority === 'medium' && 'bg-emergency-amber-light text-emergency-amber',
                      emergency.priority === 'low' && 'bg-emergency-blue-light text-emergency-blue'
                    )}>
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">{emergency.chief_complaint}</h3>
                        {getStatusBadge(emergency.status)}
                        {getPriorityBadge(emergency.priority)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {formatDateTime(emergency.created_at)}
                      </p>
                      {emergency.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{emergency.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:ml-auto">
                    {emergency.hospital && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Hospital className="w-4 h-4" />
                        <span>{emergency.hospital.name}</span>
                      </div>
                    )}
                    {emergency.responder && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Ambulance className="w-4 h-4" />
                        <span>{emergency.responder.vehicle_type || 'Responder'}</span>
                      </div>
                    )}
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
