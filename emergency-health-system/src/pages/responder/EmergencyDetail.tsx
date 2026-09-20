import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { AlertTriangle, MapPin, Building2 as Hospital, Truck as Ambulance, Clock, User, Phone, MessageSquare, CheckCircle, X, Loader2, RotateCcw, Heart, Zap, ChevronDown, ChevronUp, Navigation, Locate, Stethoscope, Pill, Droplet, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { cn, formatRelativeTime, formatDateTime, getStatusLabel, getPriorityLabel, calculateDistance } from '../../utils/helpers'
import type { Emergency, EmergencyStatus, EmergencyResponse } from '../../types'
import { getDemoEmergencyById } from '../../services/mockData'
import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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

function MapComponent({ emergency, responderLocation, hospitalLocation, currentLocation }: { 
  emergency: Emergency; 
  responderLocation?: { lat: number; lng: number } | null;
  hospitalLocation?: { lat: number; lng: number } | null;
  currentLocation?: { lat: number; lng: number } | null;
}) {
  const patLat = emergency.patient_latitude || 17.3850
  const patLng = emergency.patient_longitude || 78.4867
  const center: [number, number] = currentLocation && !isNaN(currentLocation.lat)
    ? [currentLocation.lat, currentLocation.lng]
    : [patLat, patLng]

  const points: [number, number][] = [[patLat, patLng]]
  if (responderLocation && !isNaN(responderLocation.lat) && !isNaN(responderLocation.lng)) {
    points.push([responderLocation.lat, responderLocation.lng])
  }
  if (hospitalLocation && !isNaN(hospitalLocation.lat) && !isNaN(hospitalLocation.lng)) {
    points.push([hospitalLocation.lat, hospitalLocation.lng])
  }
  if (currentLocation && !isNaN(currentLocation.lat) && !isNaN(currentLocation.lng)) {
    points.push([currentLocation.lat, currentLocation.lng])
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
      <Marker position={[patLat, patLng]} icon={patientIcon}>
        <Popup>
          <div className="p-1">
            <p className="font-medium">Patient</p>
            <p className="text-sm text-gray-500">{emergency.patient_address || 'Patient Location'}</p>
          </div>
        </Popup>
      </Marker>
      {hospitalLocation && (
        <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={hospitalIcon}>
          <Popup>
            <div className="p-1">
              <p className="font-medium">Hospital</p>
            </div>
          </Popup>
        </Marker>
      )}
      {(currentLocation || responderLocation) && (
        <Marker position={currentLocation ? [currentLocation.lat, currentLocation.lng] : [responderLocation!.lat, responderLocation!.lng]} icon={responderIcon}>
          <Popup>
            <div className="p-1">
              <p className="font-medium">Your Location</p>
              <p className="text-sm text-gray-500">{currentLocation ? 'Live' : 'Last known'}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}

export function ResponderEmergencyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { updateEmergencyStatus, subscribeToEmergency } = useEmergency()
  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [responses, setResponses] = useState<EmergencyResponse[]>([])
  const [hospital, setHospital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [showMap, setShowMap] = useState(true)
  const [notes, setNotes] = useState('')
  const [vitals, setVitals] = useState<Record<string, string>>({})
  const [vitalKey, setVitalKey] = useState('')
  const [vitalValue, setVitalValue] = useState('')

  useEffect(() => {
    if (!id) return

    const fetchEmergency = async () => {
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

        const { data: respData } = await supabase
          .from('emergency_responses')
          .select('*')
          .eq('emergency_id', id)
          .order('created_at', { ascending: true })
        setResponses(respData || [])

        if (data.hospital) setHospital(data.hospital)
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to local emergency data:', error)
        // Try localStorage for locally-created emergencies
        let fallback = getDemoEmergencyById(id)
        if (!fallback) {
          try {
            const raw = localStorage.getItem('emergency_system_emergencies')
            if (raw) {
              const list = JSON.parse(raw) as any[]
              fallback = list.find((e: any) => e.id === id)
            }
          } catch { /* ignore */ }
        }
        if (fallback) {
          setEmergency(fallback)
          if (fallback.hospital) setHospital(fallback.hospital)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEmergency()
    const unsubscribe = subscribeToEmergency(id)
    return unsubscribe
  }, [id, subscribeToEmergency])

  // Start location tracking when on the way or arrived
  useEffect(() => {
    if (emergency && ['on_the_way', 'arrived'].includes(emergency.status)) {
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
            // Update responder location in database
            if (authUser?.responder?.id) {
              supabase
                .from('responders')
                .update({
                  current_latitude: position.coords.latitude,
                  current_longitude: position.coords.longitude,
                  last_location_update: new Date().toISOString(),
                })
                .eq('id', authUser.responder.id)
                .then()
            }
          },
          (error) => console.error('Location error:', error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        )
        setWatchId(id)
      }
    }
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [emergency?.status, authUser?.responder?.id])

  const handleStatusUpdate = async (newStatus: EmergencyStatus) => {
    if (!emergency) return
    try {
      const { error } = await updateEmergencyStatus(emergency.id, newStatus)
      if (error) throw error
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAddResponse = async () => {
    if (!emergency || !authUser?.responder?.id) return
    try {
      const { error } = await supabase
        .from('emergency_responses')
        .insert({
          emergency_id: emergency.id,
          responder_id: authUser.responder.id,
          status: emergency.status === 'on_the_way' ? 'en_route' : 
                  emergency.status === 'arrived' ? 'on_scene' : 'assigned',
          latitude: currentLocation?.lat,
          longitude: currentLocation?.lng,
          notes: notes || undefined,
          vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
        })
      if (error) throw error
      setNotes('')
      setVitals({})
      setVitalKey('')
      setVitalValue('')
    } catch (error) {
      console.error('Error adding response:', error)
    }
  }

  const addVital = () => {
    if (vitalKey && vitalValue) {
      setVitals(prev => ({ ...prev, [vitalKey]: vitalValue }))
      setVitalKey('')
      setVitalValue('')
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
        <Button onClick={() => navigate('/responder/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  const isEnRoute = emergency.status === 'on_the_way'
  const isOnScene = emergency.status === 'arrived'
  const isAtHospital = emergency.status === 'resolved' // Simplified

  const responderLocation = currentLocation || (emergency.responder_latitude && emergency.responder_longitude
    ? { lat: emergency.responder_latitude, lng: emergency.responder_longitude }
    : null)

  const hospitalLocation = authUser?.responder?.hospital_id ? null : (emergency.hospital_latitude && emergency.hospital_longitude
    ? { lat: emergency.hospital_latitude, lng: emergency.hospital_longitude }
    : null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Emergency Response</h1>
            <Badge variant={emergency.status as any}>{getStatusLabel(emergency.status)}</Badge>
            {emergency.priority === 'critical' && <Badge variant="critical">CRITICAL</Badge>}
            <Badge variant={emergency.priority as any}>{getPriorityLabel(emergency.priority)}</Badge>
          </div>
          <p className="text-gray-600">{emergency.chief_complaint}</p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button variant="secondary" size="sm" onClick={() => setShowMap(!showMap)}>
            {showMap ? <RotateCcw className="w-4 h-4 mr-1" /> : <MapPin className="w-4 h-4 mr-1" />}
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardBody className="py-4">
          <div className="flex items-center justify-between">
            {['accepted', 'on_the_way', 'arrived', 'resolved'].map((status, index) => {
              const isCompleted = ['accepted', 'on_the_way', 'arrived', 'resolved'].indexOf(emergency.status) >= index
              const isCurrent = emergency.status === status
              return (
                <div key={status} className="flex items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-3',
                    isCompleted ? 'bg-emergency-green border-emergency-green' : 'bg-white border-gray-300',
                    isCurrent && 'animate-pulse-ring'
                  )}>
                    <CheckCircle className={cn('w-5 h-5', isCompleted ? 'text-white' : 'text-gray-400')} />
                  </div>
                  {index < 3 && (
                    <div className={cn(
                      'w-16 h-0.5 mx-2',
                      isCompleted ? 'bg-emergency-green' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Accepted</span>
            <span>En Route</span>
            <span>On Scene</span>
            <span>Resolved</span>
          </div>
        </CardBody>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map & Patient Info */}
        <div className="lg:col-span-2 space-y-6">
          {showMap && (
            <Card className="overflow-hidden">
              <div style={{ height: '400px' }}>
                <MapComponent
                  emergency={emergency}
                  responderLocation={responderLocation}
                  hospitalLocation={hospitalLocation}
                  currentLocation={currentLocation}
                />
              </div>
            </Card>
          )}

          {/* Patient Details */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-emergency-red" />
                Patient Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Chief Complaint</p>
                  <p className="font-medium text-gray-900">{emergency.chief_complaint}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium text-gray-900">
                    <Badge variant={emergency.priority as any}>{getPriorityLabel(emergency.priority)}</Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900 truncate">{emergency.patient_address || 'GPS coordinates'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Distance</p>
                  <p className="font-medium text-gray-900">
                    {responderLocation && authUser?.responder ? 
                      `${calculateDistance(
                        responderLocation.lat,
                        responderLocation.lng,
                        emergency.patient_latitude,
                        emergency.patient_longitude
                      ).toFixed(1)} km` : 'Calculating...'}
                  </p>
                </div>
                {emergency.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-700">{emergency.description}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Medical Info */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emergency-blue" />
                Medical Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {authUser?.profile?.allergies && authUser.profile.allergies.length > 0 && (
                  <div className="p-3 bg-emergency-red-light rounded-lg">
                    <p className="text-emergency-red-dark font-medium flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Allergies
                    </p>
                    <p className="text-emergency-red-dark mt-1">{authUser.profile.allergies.join(', ')}</p>
                  </div>
                )}
                {authUser?.profile?.medical_conditions && authUser.profile.medical_conditions.length > 0 && (
                  <div className="p-3 bg-emergency-amber-light rounded-lg">
                    <p className="text-emergency-amber-dark font-medium flex items-center gap-1">
                      <Stethoscope className="w-4 h-4" />
                      Conditions
                    </p>
                    <p className="text-emergency-amber-dark mt-1">{authUser.profile.medical_conditions.join(', ')}</p>
                  </div>
                )}
                {authUser?.profile?.medications && authUser.profile.medications.length > 0 && (
                  <div className="p-3 bg-emergency-blue-light rounded-lg">
                    <p className="text-emergency-blue-dark font-medium flex items-center gap-1">
                      <Pill className="w-4 h-4" />
                      Medications
                    </p>
                    <p className="text-emergency-blue-dark mt-1">{authUser.profile.medications.join(', ')}</p>
                  </div>
                )}
                {authUser?.profile?.blood_type && (
                  <div className="p-3 bg-emergency-green-light rounded-lg">
                    <p className="text-emergency-green-dark font-medium flex items-center gap-1">
                      <Droplet className="w-4 h-4" />
                      Blood Type
                    </p>
                    <p className="text-emergency-green-dark mt-1 text-xl">{authUser.profile.blood_type}</p>
                  </div>
                )}
                {authUser?.profile?.emergency_notes && (
                  <div className="md:col-span-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Emergency Notes
                    </p>
                    <p className="text-gray-700 mt-1">{authUser.profile.emergency_notes}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Response Log & Notes */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emergency-green" />
                  Response Log
                </h2>
                <Button variant="secondary" size="sm" onClick={handleAddResponse} disabled={!notes.trim() && Object.keys(vitals).length === 0}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Add Entry
                </Button>
              </div>

              {/* Add Response Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                <Textarea
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter your observations, actions taken, etc."
                  rows={3}
                >
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </Textarea>

                <div className="flex gap-2">
                  <Input
                    label="Vital Sign (e.g., BP, HR, SpO2)"
                    value={vitalKey}
                    onChange={(e) => setVitalKey(e.target.value)}
                    placeholder="BP"
                    className="w-32"
                  />
                  <Input
                    label="Value"
                    value={vitalValue}
                    onChange={(e) => setVitalValue(e.target.value)}
                    placeholder="120/80"
                    className="w-32"
                  />
                  <Button variant="secondary" size="sm" onClick={addVital} className="self-end">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {Object.keys(vitals).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(vitals).map(([key, value]) => (
                      <span key={key} className="px-3 py-1 bg-white rounded-lg text-sm border">
                               {key}: {String(value)}
                        <button onClick={() => setVitals(prev => { const n = { ...prev }; delete n[key]; return n })} className="ml-1 text-gray-400 hover:text-gray-600">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Response History */}
              <div className="divide-y divide-gray-100">
                {responses.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No response entries yet</p>
                  </div>
                ) : (
                  responses.slice().reverse().map((response) => (
                    <div key={response.id} className="py-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={response.status as any}>{response.status.replace('_', ' ')}</Badge>
                        <span className="text-sm text-gray-500">{formatDateTime(response.created_at)}</span>
                      </div>
                      {response.notes && (
                        <p className="text-sm text-gray-700 mb-2">{response.notes}</p>
                      )}
                      {response.vitals && Object.keys(response.vitals).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(response.vitals).map(([key, value]) => (
                            <span key={key} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {/* Status Controls */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emergency-blue" />
                Update Status
              </h2>
              <div className="space-y-2">
                {emergency.status === 'accepted' && (
                  <Button
                    variant="primary"
                    className="w-full justify-start gap-3"
                    onClick={() => handleStatusUpdate('on_the_way')}
                  >
                    <Ambulance className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">En Route</p>
                      <p className="text-xs text-gray-500">Start navigation to patient</p>
                    </div>
                  </Button>
                )}
                {emergency.status === 'on_the_way' && (
                  <Button
                    variant="success"
                    className="w-full justify-start gap-3"
                    onClick={() => handleStatusUpdate('arrived')}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Arrived on Scene</p>
                      <p className="text-xs text-gray-500">Patient contact made</p>
                    </div>
                  </Button>
                )}
                {emergency.status === 'arrived' && (
                  <Button
                    variant="success"
                    className="w-full justify-start gap-3"
                    onClick={() => handleStatusUpdate('resolved')}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Transport Complete</p>
                      <p className="text-xs text-gray-500">Patient delivered to hospital</p>
                    </div>
                  </Button>
                )}
                {['accepted', 'on_the_way', 'arrived'].includes(emergency.status) && (
                  <Button
                    variant="danger"
                    className="w-full justify-start gap-3 border-emergency-red text-emergency-red hover:bg-emergency-red-light"
                    onClick={() => handleStatusUpdate('cancelled')}
                  >
                    <X className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Cancel Response</p>
                      <p className="text-xs text-gray-500">Release assignment</p>
                    </div>
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emergency-amber" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start gap-3">
                  <Navigation className="w-5 h-5" />
                  Navigate to Patient
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-3">
                  <Phone className="w-5 h-5" />
                  Call Hospital
                </Button>
                <Button variant="secondary" className="w-full justify-start gap-3">
                  <MessageSquare className="w-5 h-5" />
                  Message Hospital
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Hospital Info */}
          {hospital && (
            <Card>
              <CardBody>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Hospital className="w-5 h-5 text-emergency-blue" />
                  Destination Hospital
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emergency-blue-light flex items-center justify-center">
                      <Hospital className="w-5 h-5 text-emergency-blue" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{hospital.name}</p>
                      <p className="text-sm text-gray-500">{hospital.address}, {hospital.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${hospital.phone}`} className="hover:text-emergency-blue">{hospital.phone}</a>
                  </div>
                  {responderLocation && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {calculateDistance(
                          responderLocation.lat,
                          responderLocation.lng,
                          hospital.latitude,
                          hospital.longitude
                        ).toFixed(1)} km to hospital
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
