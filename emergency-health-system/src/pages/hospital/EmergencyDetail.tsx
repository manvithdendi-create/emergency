import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { AlertTriangle, MapPin, Building2 as Hospital, Truck as Ambulance, Clock, User, Phone, MessageSquare, CheckCircle, X, Loader2, RotateCcw, Shield, Heart, Zap, ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { cn, formatRelativeTime, formatDateTime, getStatusLabel, getPriorityLabel, calculateDistance } from '../../utils/helpers'
import type { Emergency, EmergencyStatus, EmergencyResponse } from '../../types'
import { getDemoEmergencyById, DEMO_RESPONDERS } from '../../services/mockData'
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

export function HospitalEmergencyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { updateEmergencyStatus, subscribeToEmergency, emergencies } = useEmergency()
  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [responses, setResponses] = useState<EmergencyResponse[]>([])
  const [hospital, setHospital] = useState<any>(null)
  const [responder, setResponder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [availableResponders, setAvailableResponders] = useState<any[]>([])
  const [loadingResponders, setLoadingResponders] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [showMap, setShowMap] = useState(true)

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
        if (data.responder) setResponder(data.responder)
      } catch (error) {
        console.warn('Supabase fetch failed, falling back to local emergency data:', error)
        let fallback = getDemoEmergencyById(id) || emergencies.find(e => e.id === id)
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
          if (fallback.responder) setResponder(fallback.responder)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEmergency()
    const unsubscribe = subscribeToEmergency(id)
    return unsubscribe
  }, [id, subscribeToEmergency, emergencies])

  const fetchAvailableResponders = async () => {
    if (!authUser?.hospital?.id) return
    setLoadingResponders(true)
    try {
      const { data, error } = await supabase.rpc('get_available_responders', {
        hospital_id: authUser.hospital.id,
      })
      if (!error && data && data.length > 0) {
        setAvailableResponders(data)
        return
      }
    } catch (error) {
      console.warn('RPC failed, using demo responders:', error)
    }

    // Fallback to demo responders
    setAvailableResponders(DEMO_RESPONDERS.filter(r => r.is_available))
    setLoadingResponders(false)
  }

  const handleAccept = async () => {
    if (!emergency) return
    try {
      await updateEmergencyStatus(emergency.id, 'accepted')
      setEmergency(prev => prev ? { ...prev, status: 'accepted', updated_at: new Date().toISOString() } : null)
      // Auto-open assignment modal
      setTimeout(() => {
        fetchAvailableResponders()
        setAssignModalOpen(true)
      }, 500)
    } catch (error) {
      console.error('Error accepting emergency:', error)
    }
  }

  const handleAssignResponder = async (responderId: string) => {
    if (!emergency) return
    try {
      const assigned = availableResponders.find(r => r.id === responderId) || DEMO_RESPONDERS.find(r => r.id === responderId)
      await updateEmergencyStatus(emergency.id, 'accepted')
      setEmergency(prev => prev ? {
        ...prev,
        responder_id: responderId,
        responder: assigned || prev.responder,
        status: 'accepted',
        updated_at: new Date().toISOString()
      } : null)
      if (assigned) setResponder(assigned)
      setAssignModalOpen(false)
    } catch (error) {
      console.error('Error assigning responder:', error)
    }
  }

  const handleCancel = async () => {
    if (!emergency) return
    try {
      const { error } = await updateEmergencyStatus(emergency.id, 'cancelled')
      if (error) throw error
      setCancelModalOpen(false)
      navigate('/hospital/dashboard')
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
        <Button onClick={() => navigate('/hospital/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  const isAccepted = ['accepted', 'on_the_way', 'arrived', 'resolved'].includes(emergency.status)
  const canAccept = emergency.status === 'pending'
  const canCancel = ['pending', 'accepted'].includes(emergency.status)
  const hasResponder = !!emergency.responder_id

  const responderLocation = emergency.responder_latitude && emergency.responder_longitude
    ? { lat: emergency.responder_latitude, lng: emergency.responder_longitude }
    : null

  const hospitalLocation = authUser?.hospital
    ? { lat: authUser.hospital.latitude, lng: authUser.hospital.longitude }
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Emergency Details</h1>
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
          {canAccept && (
            <Button variant="success" onClick={handleAccept} size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Emergency
            </Button>
          )}
          {isAccepted && !hasResponder && (
            <Button variant="primary" onClick={() => { fetchAvailableResponders(); setAssignModalOpen(true) }} size="lg">
              <Ambulance className="w-4 h-4 mr-2" />
              Assign Responder
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => setCancelModalOpen(true)} size="lg">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map & Patient Info */}
        <div className="lg:col-span-2 space-y-6">
          {showMap && (
            <Card className="overflow-hidden">
              <div style={{ height: '400px' }}>
                <MapContainer
                  center={[emergency.patient_latitude, emergency.patient_longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[emergency.patient_latitude, emergency.patient_longitude]} icon={patientIcon}>
                    <Popup>
                      <div className="p-1">
                        <p className="font-medium">Patient Location</p>
                        <p className="text-sm text-gray-500">{emergency.patient_address || 'GPS Location'}</p>
                      </div>
                    </Popup>
                  </Marker>
                  {hospitalLocation && (
                    <Marker position={[hospitalLocation.lat, hospitalLocation.lng]} icon={hospitalIcon}>
                      <Popup>
                        <div className="p-1">
                          <p className="font-medium">Hospital</p>
                          <p className="text-sm text-gray-500">{authUser?.hospital?.name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {responderLocation && (
                    <Marker position={[responderLocation.lat, responderLocation.lng]} icon={responderIcon}>
                      <Popup>
                        <div className="p-1">
                          <p className="font-medium">Responder</p>
                          <p className="text-sm text-gray-500">En route</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </Card>
          )}

          {/* Emergency Triage & Check-in Timeline Stepper */}
          <Card className="border-t-4 border-emergency-red">
            <CardBody>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emergency-red" />
                Emergency Check-In & Triage Timeline
              </h2>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                <div className="relative">
                  <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emergency-green border-2 border-white"></div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">1. Emergency SOS Triggered</p>
                    <span className="text-xs text-gray-400">{formatDateTime(emergency.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">GPS location confirmed at {emergency.patient_address || 'Coordinates'}</p>
                </div>

                <div className="relative">
                  <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    ['accepted', 'on_the_way', 'arrived', 'resolved'].includes(emergency.status) ? 'bg-emergency-green' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">2. Hospital Intake Check-In</p>
                    <span className="text-xs font-semibold text-emergency-blue">
                      {['accepted', 'on_the_way', 'arrived', 'resolved'].includes(emergency.status) ? 'ACCEPTED & BED PREPARED' : 'PENDING ACCEPTANCE'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {['accepted', 'on_the_way', 'arrived', 'resolved'].includes(emergency.status)
                      ? 'Trauma Bay assigned at City General Hospital. Clinical team on standby.'
                      : 'Awaiting triage decision from emergency intake nurse.'}
                  </p>
                </div>

                <div className="relative">
                  <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    emergency.responder_id || ['on_the_way', 'arrived', 'resolved'].includes(emergency.status) ? 'bg-emergency-green' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">3. Field Responder Dispatched</p>
                    <span className="text-xs text-gray-500">
                      {emergency.responder ? `${emergency.responder.full_name || 'Marcus Miller'} (${emergency.responder.vehicle_id || 'AMB-Unit-4'})` : 'Awaiting Assignment'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {emergency.estimated_arrival ? `Estimated ETA: ~${formatRelativeTime(emergency.estimated_arrival)}` : 'Live telemetry tracking active'}
                  </p>
                </div>

                <div className="relative">
                  <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    ['arrived', 'resolved'].includes(emergency.status) ? 'bg-emergency-green' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">4. Scene Arrival & Triage Assessment</p>
                    <span className="text-xs text-gray-500">
                      {['arrived', 'resolved'].includes(emergency.status) ? 'On Scene' : 'In Transit'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Initial primary survey and vital signs evaluation.</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Patient Details */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-emergency-blue" />
                Patient Medical Profile & Incident Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Patient Name</p>
                  <p className="font-bold text-gray-900 mt-0.5">{emergency.patient?.full_name || 'Alex Johnson'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Emergency Phone</p>
                  <p className="font-bold text-emergency-blue mt-0.5">{emergency.patient?.phone || '+1 (555) 234-5678'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Blood Group</p>
                  <p className="font-bold text-emergency-red mt-0.5">{emergency.patient?.blood_type || 'O+'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Chief Complaint</p>
                  <p className="font-bold text-gray-900 text-base mt-0.5">{emergency.chief_complaint}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Triage Priority</p>
                  <div className="mt-1">
                    <Badge variant={emergency.priority as any}>{getPriorityLabel(emergency.priority)}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Incident Location</p>
                  <p className="font-medium text-gray-900 truncate mt-0.5">{emergency.patient_address || '742 Evergreen Terrace, San Francisco, CA'}</p>
                </div>

                {emergency.description && (
                  <div className="md:col-span-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Clinical Description & Dispatch Notes</p>
                    <p className="text-sm text-amber-950 mt-1">{emergency.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500">Allergies</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(emergency.patient?.allergies || ['Penicillin', 'Peanuts']).map((a: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200 font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Known Conditions</p>
                  <p className="text-xs font-medium text-gray-800 mt-1">
                    {(emergency.patient?.medical_conditions || ['Hypertension', 'Asthma']).join(', ')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Current Medications</p>
                  <p className="text-xs font-medium text-gray-800 mt-1">
                    {(emergency.patient?.medications || ['Albuterol Inhaler', 'Lisinopril 10mg']).join(', ')}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vital Signs & Clinical Data */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emergency-red" />
                Live Field Vitals & Clinical Interventions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                  <span className="text-xs font-semibold text-red-700">Heart Rate</span>
                  <p className="text-xl font-bold text-red-900 mt-1">{emergency.vitals?.heart_rate || '118 bpm'}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <span className="text-xs font-semibold text-blue-700">Blood Pressure</span>
                  <p className="text-xl font-bold text-blue-900 mt-1">{emergency.vitals?.blood_pressure || '148/94 mmHg'}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <span className="text-xs font-semibold text-emerald-700">O2 Saturation</span>
                  <p className="text-xl font-bold text-emerald-900 mt-1">{emergency.vitals?.oxygen_saturation || '94%'}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                  <span className="text-xs font-semibold text-purple-700">Respiratory Rate</span>
                  <p className="text-xl font-bold text-purple-900 mt-1">{emergency.vitals?.respiratory_rate || '24 /min'}</p>
                </div>
              </div>

              {emergency.medications_given && emergency.medications_given.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pre-Hospital Medications Administered</p>
                  <div className="flex flex-wrap gap-2">
                    {emergency.medications_given.map((med: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 font-medium">
                        💊 {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {emergency.procedures_performed && emergency.procedures_performed.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Procedures Performed On Scene</p>
                  <div className="flex flex-wrap gap-2">
                    {emergency.procedures_performed.map((proc: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-medium">
                        ✓ {proc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Responder Updates */}
          {responses.length > 0 && (
            <Card>
              <CardBody className="p-0">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Ambulance className="w-5 h-5 text-emergency-green" />
                    Responder Activity Log
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {responses.slice().reverse().map((response) => (
                    <div key={response.id} className="p-4">
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
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hospital Info */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hospital className="w-5 h-5 text-emergency-blue" />
                Hospital Information
              </h2>
              {hospital ? (
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
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4" />
                    <span>Capacity: {hospital.current_load}/{hospital.emergency_capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span>Ambulance: {hospital.accepts_ambulance ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Not assigned to a hospital yet</p>
              )}
            </CardBody>
          </Card>

          {/* Responder Info */}
          {hasResponder && responder && (
            <Card>
              <CardBody>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-emergency-green" />
                  Assigned Responder
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emergency-green-light flex items-center justify-center">
                      <User className="w-6 h-6 text-emergency-green" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{responder.profiles?.full_name || 'Responder'}</p>
                      <p className="text-sm text-gray-500">{responder.certification_level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Ambulance className="w-4 h-4" />
                    <span>{responder.vehicle_type || 'Ambulance'}</span>
                  </div>
                  {responder.current_latitude && responder.current_longitude && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>Live tracking active</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" className="flex-1" size="sm">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    <Button variant="primary" className="flex-1" size="sm">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Quick Actions */}
          {isAccepted && !hasResponder && (
            <Card className="bg-emergency-blue-light border-emergency-blue">
              <CardBody className="text-center">
                <Ambulance className="w-12 h-12 text-emergency-blue mx-auto mb-3" />
                <h3 className="font-semibold text-emergency-blue-dark mb-1">No Responder Assigned</h3>
                <p className="text-sm text-emergency-blue-dark mb-4">Assign an available responder to this emergency</p>
                <Button variant="primary" onClick={() => { fetchAvailableResponders(); setAssignModalOpen(true) }} className="w-full">
                  <Ambulance className="w-4 h-4 mr-2" />
                  Assign Responder
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Responder Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Responder"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Select an available responder to assign to this emergency</p>
          {loadingResponders ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emergency-blue animate-spin" />
            </div>
          ) : availableResponders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ambulance className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No available responders at this time</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableResponders.map((r) => (
                <Button
                  key={r.id}
                  variant="secondary"
                  className="w-full justify-start gap-4 p-3"
                  onClick={() => handleAssignResponder(r.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-emergency-green-light flex items-center justify-center">
                    <Ambulance className="w-5 h-5 text-emergency-green" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{r.full_name}</p>
                    <p className="text-sm text-gray-500">{r.certification_level} • {r.vehicle_type}</p>
                  </div>
                  {r.distance_km !== null && (
                    <Badge variant="accepted">{r.distance_km.toFixed(1)} km away</Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Emergency"
        message="Are you sure you want to cancel this emergency? This will notify the patient and any assigned responders."
        confirmText="Cancel Emergency"
        variant="danger"
      />
    </div>
  )
}
