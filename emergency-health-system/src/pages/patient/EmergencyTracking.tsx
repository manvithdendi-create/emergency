import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { AlertTriangle, MapPin, Building2 as Hospital, Truck as Ambulance, Clock, CheckCircle, X, Loader2, Phone, MessageSquare, Shield, User, ArrowUpRight, Locate } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { cn, formatRelativeTime, formatDateTime, getStatusLabel, calculateDistance } from '../../utils/helpers'
import type { Emergency, EmergencyStatus, EmergencyResponse } from '../../types'
import { getDemoEmergencyById } from '../../services/mockData'
import 'leaflet/dist/leaflet.css'

// Fix for Leaflet marker icons
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const statusOrder: EmergencyStatus[] = ['pending', 'accepted', 'on_the_way', 'arrived', 'resolved', 'cancelled']
const statusLabels: Record<EmergencyStatus, string> = {
  pending: 'Emergency Created',
  accepted: 'Hospital Accepted',
  on_the_way: 'Responder En Route',
  arrived: 'Responder Arrived',
  resolved: 'Emergency Resolved',
  cancelled: 'Emergency Cancelled',
}

const statusIcons: Record<EmergencyStatus, React.ReactNode> = {
  pending: <AlertTriangle className="w-5 h-5 text-emergency-amber" />,
  accepted: <Hospital className="w-5 h-5 text-emergency-blue" />,
  on_the_way: <Ambulance className="w-5 h-5 text-emergency-blue" />,
  arrived: <CheckCircle className="w-5 h-5 text-emergency-green" />,
  resolved: <CheckCircle className="w-5 h-5 text-emergency-green" />,
  cancelled: <X className="w-5 h-5 text-gray-500" />,
}

const statusColors: Record<EmergencyStatus, string> = {
  pending: 'emergency-amber',
  accepted: 'emergency-blue',
  on_the_way: 'emergency-blue',
  arrived: 'emergency-green',
  resolved: 'emergency-green',
  cancelled: 'gray',
}

function MapViewController({ center, points }: { center: [number, number]; points: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 15 })
    } else if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, 14)
    }
  }, [center, points, map])

  return null
}

function MapComponent({ emergency, responderLocation, hospitalLocation }: { 
  emergency: Emergency; 
  responderLocation?: { lat: number; lng: number } | null;
  hospitalLocation?: { lat: number; lng: number } | null;
}) {
  const patLat = emergency.patient_latitude || 17.3850
  const patLng = emergency.patient_longitude || 78.4867
  const center: [number, number] = [patLat, patLng]

  const points: [number, number][] = [[patLat, patLng]]
  if (responderLocation && !isNaN(responderLocation.lat) && !isNaN(responderLocation.lng)) {
    points.push([responderLocation.lat, responderLocation.lng])
  }
  if (hospitalLocation && !isNaN(hospitalLocation.lat) && !isNaN(hospitalLocation.lng)) {
    points.push([hospitalLocation.lat, hospitalLocation.lng])
  }

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <MapViewController center={center} points={points} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Patient Marker */}
      <Marker position={center} icon={patientIcon}>
        <Popup>
          <div className="p-1">
            <p className="font-medium">Your Location</p>
            <p className="text-sm text-gray-500">{emergency.patient_address || 'Current Location'}</p>
          </div>
        </Popup>
      </Marker>

      {/* Hospital Marker */}
      {hospitalLocation && (
        <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={hospitalIcon}>
          <Popup>
            <div className="p-1">
              <p className="font-medium">Hospital</p>
              <p className="text-sm text-gray-500">{emergency.hospital_id ? 'Assigned Hospital' : 'Nearest Hospital'}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Responder Marker */}
      {responderLocation && (
        <Marker position={[responderLocation.lat, responderLocation.lng]} icon={responderIcon}>
          <Popup>
            <div className="p-1">
              <p className="font-medium">Responder</p>
              <p className="text-sm text-gray-500">En route to you</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

const patientIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="w-10 h-10 rounded-full bg-emergency-red flex items-center justify-center border-3 border-white shadow-lg"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const hospitalIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="w-10 h-10 rounded-full bg-emergency-blue flex items-center justify-center border-3 border-white shadow-lg"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const responderIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div class="w-10 h-10 rounded-full bg-emergency-green flex items-center justify-center border-3 border-white shadow-lg animate-pulse"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

export function PatientEmergencyTracking() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { activeEmergency, subscribeToEmergency, updateEmergencyStatus } = useEmergency()
  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [responses, setResponses] = useState<EmergencyResponse[]>([])
  const [hospital, setHospital] = useState<any>(null)
  const [responder, setResponder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchEmergency = async () => {
      if (id === 'active') {
        const target = activeEmergency || getDemoEmergencyById('emg-demo-101')
        if (target) {
          setEmergency(target)
          if (target.hospital) setHospital(target.hospital)
          if (target.responder) setResponder(target.responder)
        }
        setLoading(false)
        return
      }

      // Helper to find emergency from localStorage
      const findLocalEmergency = (emergencyId: string) => {
        try {
          const raw = localStorage.getItem('emergency_system_emergencies')
          if (raw) {
            const list = JSON.parse(raw) as any[]
            return list.find((e: any) => e.id === emergencyId) || null
          }
        } catch { /* ignore */ }
        return null
      }

      try {
        const { data, error } = await supabase
          .from('emergencies')
          .select(`
            *,
            hospital:hospitals(*),
            responder:responders(*, profiles(*))
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setEmergency(data)

        // Fetch responses
        const { data: respData } = await supabase
          .from('emergency_responses')
          .select('*')
          .eq('emergency_id', id)
          .order('created_at', { ascending: true })
        setResponses(respData || [])

        if (data.hospital) setHospital(data.hospital)
        if (data.responder) setResponder(data.responder)
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to local emergency data:', error)
        // Try multiple fallback sources in order of specificity
        const fallback = getDemoEmergencyById(id) || activeEmergency || findLocalEmergency(id)
        if (fallback) {
          setEmergency(fallback)
          if (fallback.hospital) setHospital(fallback.hospital)
          if (fallback.responder) setResponder(fallback.responder)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEmergency()
    const unsubscribe = subscribeToEmergency(id)
    return unsubscribe
  }, [id, subscribeToEmergency, activeEmergency])

  // Update local state when activeEmergency changes
  useEffect(() => {
    if (activeEmergency && activeEmergency.id === id) {
      setEmergency(activeEmergency)
    }
  }, [activeEmergency, id])

  const responderLocation = emergency?.responder_latitude && emergency?.responder_longitude
    ? { lat: emergency.responder_latitude, lng: emergency.responder_longitude }
    : null

  const hospitalLocation = emergency?.hospital_latitude && emergency?.hospital_longitude
    ? { lat: emergency.hospital_latitude, lng: emergency.hospital_longitude }
    : null

  const currentStatusIndex = emergency ? statusOrder.indexOf(emergency.status) : -1

  const handleCancel = async () => {
    if (!emergency) return
    try {
      const { error } = await updateEmergencyStatus(emergency.id, 'cancelled')
      if (error) throw error
      setCancelModalOpen(false)
      navigate('/patient/dashboard')
    } catch (error) {
      console.error('Error cancelling emergency:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!emergency) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Emergency Not Found</h2>
        <Button onClick={() => navigate('/patient/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  const isActive = !['resolved', 'cancelled'].includes(emergency.status)
  const canCancel = ['pending', 'accepted'].includes(emergency.status) && isActive

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Tracking</h1>
          <p className="text-gray-600">{emergency.chief_complaint}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={emergency.status as any}>{getStatusLabel(emergency.status)}</Badge>
          {emergency.priority === 'critical' && (
            <Badge variant="critical">CRITICAL</Badge>
          )}
        </div>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div style={{ height: '400px' }}>
          <MapComponent
            emergency={emergency}
            responderLocation={responderLocation}
            hospitalLocation={hospitalLocation}
          />
        </div>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardBody className="p-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Status Timeline</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {statusOrder.map((status) => {
              const isCompleted = currentStatusIndex >= statusOrder.indexOf(status)
              const isCurrent = currentStatusIndex === statusOrder.indexOf(status)
              const isFuture = currentStatusIndex < statusOrder.indexOf(status)

              return (
                <div
                  key={status}
                  className={cn(
                    'flex items-start gap-4 p-4 relative',
                    isCurrent && 'bg-emergency-blue-light/50'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-3',
                      isCompleted ? `bg-${statusColors[status]} border-${statusColors[status]}` : 'bg-white border-gray-300',
                      isCurrent && 'animate-pulse-ring'
                    )}>
                      {statusIcons[status]}
                    </div>
                    {!isFuture && status !== statusOrder[statusOrder.length - 1] && (
                      <div className="absolute left-3.5 top-8 bottom-8 w-0.5 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        'font-medium',
                        isCompleted ? 'text-gray-900' : 'text-gray-500',
                        isCurrent && 'text-emergency-blue'
                      )}>
                        {statusLabels[status]}
                      </h3>
                      {isCurrent && <span className="text-xs bg-emergency-blue text-white px-2 py-0.5 rounded">Current</span>}
                    </div>
                    {emergency && status === 'pending' && (
                      <p className="text-sm text-gray-500 mt-1">Emergency created at {formatDateTime(emergency.created_at)}</p>
                    )}
                    {emergency && status === 'accepted' && emergency.hospital_id && (
                      <p className="text-sm text-gray-500 mt-1">Accepted by hospital at {formatDateTime(emergency.updated_at)}</p>
                    )}
                    {emergency && status === 'on_the_way' && emergency.responder_id && (
                      <p className="text-sm text-gray-500 mt-1">Responder dispatched at {formatDateTime(emergency.updated_at)}</p>
                    )}
                    {emergency && status === 'arrived' && emergency.actual_arrival && (
                      <p className="text-sm text-gray-500 mt-1">Arrived at {formatDateTime(emergency.actual_arrival)}</p>
                    )}
                    {emergency && status === 'resolved' && emergency.resolved_at && (
                      <p className="text-sm text-gray-500 mt-1">Resolved at {formatDateTime(emergency.resolved_at)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <MapPin className="w-8 h-8 text-emergency-red mx-auto mb-2" />
            <p className="text-sm text-gray-500">Your Location</p>
            <p className="font-medium text-gray-900 truncate">{emergency.patient_address || 'GPS coordinates'}</p>
          </CardBody>
        </Card>

        {hospital && (
          <Card>
            <CardBody className="text-center">
              <Hospital className="w-8 h-8 text-emergency-blue mx-auto mb-2" />
              <p className="text-sm text-gray-500">Hospital</p>
              <p className="font-medium text-gray-900 truncate">{hospital.name}</p>
              <p className="text-xs text-gray-500">{hospital.phone}</p>
            </CardBody>
          </Card>
        )}

        {responder && (
          <Card>
            <CardBody className="text-center">
              <Ambulance className="w-8 h-8 text-emergency-green mx-auto mb-2" />
              <p className="text-sm text-gray-500">Responder</p>
              <p className="font-medium text-gray-900 truncate">{responder.profiles?.full_name || 'Assigned'}</p>
              <p className="text-xs text-gray-500">{responder.vehicle_type || 'Ambulance'}</p>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="text-center">
            <Clock className="w-8 h-8 text-emergency-amber mx-auto mb-2" />
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium text-gray-900">{formatRelativeTime(emergency.created_at)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Actions */}
      {isActive && (
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              {hospital && (
                <Button variant="secondary" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Hospital
                </Button>
              )}
              {responder && (
                <Button variant="secondary" className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Responder
                </Button>
              )}
              {canCancel && (
                <Button variant="danger" className="flex-1" onClick={() => setCancelModalOpen(true)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Emergency
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Responder Updates */}
      {responses.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Responder Updates</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {responses.slice().reverse().map((response) => (
                <div key={response.id} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={response.status as any}>{response.status.replace('_', ' ')}</Badge>
                    <span className="text-sm text-gray-500">{formatDateTime(response.created_at)}</span>
                  </div>
                  {response.notes && (
                    <p className="text-sm text-gray-700">{response.notes}</p>
                  )}
                  {response.vitals && Object.keys(response.vitals).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(response.vitals).map(([key, value]) => (
                        <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                           {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Emergency"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel this emergency? This will notify the hospital and responder.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
            Keep Active
          </Button>
          <Button variant="danger" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel Emergency
          </Button>
        </div>
      </Modal>
    </div>
  )
}
