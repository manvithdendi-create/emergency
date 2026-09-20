import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MapPin, Clock, Filter, Loader2, MapPin as MapPinIcon, Building2 as Hospital, Truck as Ambulance, CheckCircle, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { cn, formatRelativeTime, getStatusLabel, getPriorityLabel, calculateDistance } from '../../utils/helpers'
import type { Emergency, EmergencyStatus } from '../../types'

export function HospitalEmergencyQueue() {
  const { authUser } = useAuth()
  const { emergencies, loading, fetchEmergencies } = useEmergency()
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'on_the_way' | 'arrived'>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'distance'>('priority')

  useEffect(() => {
    fetchEmergencies()
  }, [fetchEmergencies])

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

  let filteredEmergencies = emergencies.filter(e => {
    if (filterStatus === 'all') return !['resolved', 'cancelled'].includes(e.status)
    return e.status === filterStatus
  })

  // Sort emergencies
  filteredEmergencies.sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    if (sortBy === 'time') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    return 0
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Queue</h1>
          <p className="text-gray-600">Manage incoming emergency requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                options={[
                  { value: 'all', label: 'All Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'on_the_way', label: 'En Route' },
                  { value: 'arrived', label: 'Arrived' },
                ]}
                className="w-40"
              >
                <Filter className="w-4 h-4" />
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'priority', label: 'Priority' },
                  { value: 'time', label: 'Time (Oldest First)' },
                  { value: 'distance', label: 'Distance' },
                ]}
                className="w-48"
              >
                <Clock className="w-4 h-4" />
              </Select>
            </div>
            <div className="flex-1" />
            <span className="flex items-center gap-2 text-sm text-gray-500 self-center">
              {filteredEmergencies.length} emergencies
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Emergency List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredEmergencies.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emergencies found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </CardBody>
          </Card>
        ) : (
          filteredEmergencies.map((emergency) => (
            <Card key={emergency.id} className={emergency.priority === 'critical' ? 'ring-2 ring-emergency-red' : ''}>
              <CardBody>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Priority & Status */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 sm:w-16 sm:h-16',
                    emergency.priority === 'critical' && 'bg-emergency-red-light text-emergency-red animate-pulse',
                    emergency.priority === 'high' && 'bg-emergency-red-light text-emergency-red',
                    emergency.priority === 'medium' && 'bg-emergency-amber-light text-emergency-amber',
                    emergency.priority === 'low' && 'bg-emergency-blue-light text-emergency-blue'
                  )}>
                    <AlertTriangle className={cn('w-6 h-6', emergency.priority === 'critical' && 'w-8 h-8')} />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{emergency.chief_complaint}</h3>
                      {getStatusBadge(emergency.status)}
                      <Badge variant={emergency.priority as any}>{getPriorityLabel(emergency.priority)}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      {emergency.patient_address || `${emergency.patient_latitude.toFixed(4)}, ${emergency.patient_longitude.toFixed(4)}`}
                    </p>
                    {emergency.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{emergency.description}</p>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-col items-end gap-2 sm:w-48">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatRelativeTime(emergency.created_at)}</p>
                      <p className="text-xs text-gray-400">Created</p>
                    </div>
                    {emergency.hospital_latitude && emergency.hospital_longitude && authUser?.hospital && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-emergency-blue">
                          {calculateDistance(
                            authUser.hospital.latitude,
                            authUser.hospital.longitude,
                            emergency.patient_latitude,
                            emergency.patient_longitude
                          ).toFixed(1)} km
                        </p>
                        <p className="text-xs text-gray-400">From Hospital</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <Link
                      to={`/hospital/emergency/${emergency.id}`}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
