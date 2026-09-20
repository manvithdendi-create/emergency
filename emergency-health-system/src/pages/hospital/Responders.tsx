import { useState, useEffect } from 'react'
import { Users, Truck as Ambulance, Shield, Phone, MapPin, Search, Filter, CheckCircle2, XCircle, Clock, AlertCircle, Plus, Activity } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { DEMO_RESPONDERS } from '../../services/mockData'
import type { Responder } from '../../types'

const LOCAL_RESPONDERS_KEY = 'emergency_system_responders'

export function HospitalResponders() {
  const { authUser } = useAuth()
  const [responders, setResponders] = useState<Responder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [newResponder, setNewResponder] = useState({
    name: '',
    phone: '',
    certification: 'Paramedic',
    vehicleId: '',
    vehicleType: 'ambulance',
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_RESPONDERS_KEY)
      if (stored) {
        setResponders(JSON.parse(stored))
        return
      }
    } catch (e) {
      console.warn('Could not read responders from localStorage', e)
    }
    setResponders(DEMO_RESPONDERS)
  }, [])

  const saveResponders = (newList: Responder[]) => {
    setResponders(newList)
    try {
      localStorage.setItem(LOCAL_RESPONDERS_KEY, JSON.stringify(newList))
    } catch (e) {
      console.warn('Could not save responders', e)
    }
  }

  const toggleAvailability = (id: string) => {
    const updated = responders.map(r => {
      if (r.id === id) {
        return { ...r, is_available: !r.is_available }
      }
      return r
    })
    saveResponders(updated)
  }

  const handleAddResponder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newResponder.name.trim()) return

    const created: Responder = {
      id: 'resp-' + Date.now(),
      profile_id: 'prof-resp-' + Date.now(),
      employee_id: 'EMP-MEDIC-' + Math.floor(100 + Math.random() * 900),
      hospital_id: authUser?.hospital?.id || 'hosp-001',
      license_number: 'LIC-' + Math.floor(1000 + Math.random() * 9000),
      certification_level: newResponder.certification as any,
      specialties: ['Emergency Medical Response', 'Pre-Hospital Triage'],
      is_available: true,
      current_latitude: 37.7749,
      current_longitude: -122.4194,
      last_location_update: new Date().toISOString(),
      shift_start: '08:00',
      shift_end: '20:00',
      vehicle_type: newResponder.vehicleType as any,
      vehicle_id: newResponder.vehicleId || 'AMB-Unit-' + Math.floor(10 + Math.random() * 90),
      full_name: newResponder.name,
      distance_km: 1.5,
      profiles: {
        full_name: newResponder.name,
        phone: newResponder.phone || '+1 (555) 000-9988',
        avatar_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [created, ...responders]
    saveResponders(updated)
    setModalOpen(false)
    setNewResponder({
      name: '',
      phone: '',
      certification: 'Paramedic',
      vehicleId: '',
      vehicleType: 'ambulance',
    })
  }

  const filtered = responders.filter(r => {
    const name = r.full_name || r.profiles?.full_name || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || r.employee_id?.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (statusFilter === 'available') return r.is_available
    if (statusFilter === 'busy') return !r.is_available
    return true
  })

  const availableCount = responders.filter(r => r.is_available).length
  const busyCount = responders.filter(r => !r.is_available).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Responders & EMS Fleet</h1>
          <p className="text-gray-600">Active paramedics, EMTs, ambulances, and mobile triage units</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Responder Unit
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-emergency-blue">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Total Field Units</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{responders.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-emergency-blue flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-emerald-500">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Available For Dispatch</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{availableCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <CardBody className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">En Route / On Duty</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{busyCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <Input
                placeholder="Search by name, employee ID, unit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({responders.length})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Available ({availableCount})
              </button>
              <button
                onClick={() => setStatusFilter('busy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'busy' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                On Assignment ({busyCount})
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Responder Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(resp => {
          const name = resp.full_name || resp.profiles?.full_name || 'Responder Unit'
          const phone = resp.profiles?.phone || '+1 (555) 345-6789'
          const avatar = resp.profiles?.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop'

          return (
            <Card key={resp.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-5">
                <div className="flex items-start gap-4">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-base truncate">{name}</h3>
                      {resp.is_available ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          On Call
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                      <span className="font-mono text-gray-600 font-medium">{resp.employee_id}</span>
                      <span>•</span>
                      <span className="text-emergency-blue font-semibold">{resp.certification_level}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Ambulance className="w-3.5 h-3.5 text-gray-400" />
                        {resp.vehicle_id || 'Ambulance'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Shift: {resp.shift_start || '07:00'} - {resp.shift_end || '19:00'}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        📍 ~{resp.distance_km || 1.8} km from hospital
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(resp.id)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                          resp.is_available
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {resp.is_available ? 'Set Off-Duty' : 'Set Available'}
                      </button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Modal Add Responder */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Emergency Responder Unit">
        <form onSubmit={handleAddResponder} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <Input
              required
              placeholder="e.g. Paramedic Alex Carter"
              value={newResponder.name}
              onChange={e => setNewResponder({ ...newResponder, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Certification Level</label>
              <select
                className="input"
                value={newResponder.certification}
                onChange={e => setNewResponder({ ...newResponder, certification: e.target.value })}
              >
                <option value="Paramedic">Paramedic</option>
                <option value="AEMT">Advanced EMT (AEMT)</option>
                <option value="EMT">EMT</option>
                <option value="RN">Critical Care Nurse (RN)</option>
              </select>
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={newResponder.phone}
                onChange={e => setNewResponder({ ...newResponder, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vehicle Type</label>
              <select
                className="input"
                value={newResponder.vehicleType}
                onChange={e => setNewResponder({ ...newResponder, vehicleType: e.target.value })}
              >
                <option value="ambulance">Type I / III Ambulance</option>
                <option value="medic_unit">Medic Rapid Response Unit</option>
                <option value="supervisor">EMS Supervisor Squad</option>
              </select>
            </div>
            <div>
              <label className="label">Vehicle ID / Call Sign</label>
              <Input
                placeholder="e.g. AMB-Unit-15"
                value={newResponder.vehicleId}
                onChange={e => setNewResponder({ ...newResponder, vehicleId: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Register Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
