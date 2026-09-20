import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Truck as Ambulance, User, MapPin, Clock, Loader2, ChevronLeft, CheckCircle, MapPin as MapPinIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { cn, calculateDistance, formatRelativeTime } from '../../utils/helpers'
import { DEMO_RESPONDERS } from '../../services/mockData'
import type { Responder } from '../../types'

export function HospitalResponderAssignment() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { assignResponder } = useEmergency()
  const [responders, setResponders] = useState<Responder[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailableResponders()
  }, [])

  const fetchAvailableResponders = async () => {
    if (!id) return
    setLoading(true)
    try {
      if (authUser?.hospital?.id) {
        const { data, error } = await supabase.rpc('get_available_responders', {
          hospital_id: authUser.hospital.id,
          lat: authUser.hospital.latitude,
          lng: authUser.hospital.longitude,
          radius_km: 50,
        })
        if (!error && data && data.length > 0) {
          setResponders(data)
          return
        }
      }
    } catch (error) {
      console.warn('RPC failed, using fallback responders:', error)
    }

    setResponders(DEMO_RESPONDERS.filter(r => r.is_available))
    setLoading(false)
  }

  const handleAssign = async (responderId: string) => {
    if (!id) return
    setAssigning(responderId)
    try {
      await assignResponder(id, responderId)
      navigate(`/hospital/emergency/${id}`)
    } catch (error) {
      console.error('Error assigning responder:', error)
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/hospital/emergency/${id}`)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assign Responder</h1>
          <p className="text-gray-600">Select an available responder for this emergency</p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-emergency-blue animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading available responders...</p>
          </CardBody>
        </Card>
      ) : responders.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Ambulance className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Responders</h3>
            <p className="text-gray-500 mb-6">There are currently no responders available for assignment</p>
            <Button variant="secondary" onClick={fetchAvailableResponders}>
              <Loader2 className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {responders.map((responder) => (
            <Card key={responder.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-emergency-green-light flex items-center justify-center flex-shrink-0">
                    <Ambulance className="w-8 h-8 text-emergency-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{responder.full_name}</h3>
                      <Badge variant="accepted">{responder.certification_level}</Badge>
                      <Badge variant="pending">{responder.vehicle_type || 'Ambulance'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {responder.employee_id}
                      </span>
                      {responder.distance_km !== null && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {responder.distance_km.toFixed(1)} km from hospital
                        </span>
                      )}
                      {responder.specialties && responder.specialties.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Specialties: {responder.specialties.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:ml-auto">
                    <Button
                      variant="primary"
                      onClick={() => handleAssign(responder.id)}
                      disabled={assigning === responder.id}
                      loading={assigning === responder.id}
                      className="w-full sm:w-auto"
                    >
                      {assigning === responder.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Assign
                        </>
                      )}
                    </Button>
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
