import { useEffect, useState } from 'react'
import { Search, Filter, Loader2, Truck as Ambulance, User, Shield, MapPin, Phone, CheckCircle, X, MoreVertical, Edit, Building2 as Hospital, Award } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { cn } from '../../utils/helpers'
import { DEMO_RESPONDERS } from '../../services/mockData'
import type { Responder } from '../../types'

const certificationOptions = ['EMT', 'AEMT', 'Paramedic', 'RN', 'MD']

export function AdminResponders() {
  const { authUser } = useAuth()
  const [responders, setResponders] = useState<any[]>([])
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('all')
  const [certFilter, setCertFilter] = useState('all')
  const [editingResponder, setEditingResponder] = useState<any | null>(null)

  useEffect(() => {
    fetchResponders()
    fetchHospitals()
  }, [])

  const fetchResponders = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('responders')
        .select(`
          *,
          profile:profiles(full_name, email, phone),
          hospital:hospitals(name)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('profile.full_name', `%${search}%`)
      }
      if (hospitalFilter !== 'all') {
        query = query.eq('hospital_id', hospitalFilter)
      }
      if (certFilter !== 'all') {
        query = query.eq('certification_level', certFilter as any)
      }

      const { data, error } = await query.limit(100)
      if (!error && data && data.length > 0) {
        setResponders(data)
        return
      }
    } catch (error) {
      console.warn('Admin responders fetch fallback:', error)
    } finally {
      setLoading(false)
    }

    setResponders(DEMO_RESPONDERS)
  }

  const fetchHospitals = async () => {
    const { data } = await supabase.from('hospitals').select('id, name').order('name')
    setHospitals(data || [])
  }

  const handleAvailabilityToggle = async (responderId: string, available: boolean) => {
    try {
      const { error } = await supabase
        .from('responders')
        .update({ is_available: available })
        .eq('id', responderId)
      if (error) throw error
      setResponders(prev => prev.map(r => r.id === responderId ? { ...r, is_available: available } : r))
    } catch (error) {
      console.error('Error updating responder:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Responder Management</h1>
            <p className="text-gray-600">Manage responder fleet and assignments</p>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Responder Management</h1>
          <p className="text-gray-600">Manage responder fleet and assignments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search responders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Hospitals' },
                ...hospitals.map(h => ({ value: h.id, label: h.name })),
              ]}
              className="w-56"
            >
              <Hospital className="w-4 h-4" />
            </Select>
            <Select
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Certifications' },
                ...certificationOptions.map(c => ({ value: c, label: c })),
              ]}
              className="w-48"
            >
              <Award className="w-4 h-4" />
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Responders Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responders.map((responder) => (
                  <tr key={responder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emergency-amber-light flex items-center justify-center">
                          <User className="w-5 h-5 text-emergency-amber" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{responder.profile?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{responder.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Hospital className="w-3.5 h-3.5" />
                        {responder.hospital?.name || 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="accepted">{responder.certification_level}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Ambulance className="w-3.5 h-3.5" />
                        {responder.vehicle_type || 'Ambulance'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={responder.is_available}
                          onChange={(e) => handleAvailabilityToggle(responder.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-emergency-blue focus:ring-emergency-blue"
                        />
                        <span className={cn(
                          'text-sm font-medium',
                          responder.is_available ? 'text-emergency-green' : 'text-gray-500'
                        )}>
                          {responder.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditingResponder(responder)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingResponder}
        onClose={() => setEditingResponder(null)}
        title="Edit Responder"
        size="lg"
      >
        {editingResponder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" defaultValue={editingResponder.profile?.full_name} disabled />
              <Input label="Employee ID" defaultValue={editingResponder.employee_id} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" defaultValue={editingResponder.profile?.email} disabled />
              <Input label="Phone" defaultValue={editingResponder.profile?.phone} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Hospital"
                value={editingResponder.hospital_id || ''}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...hospitals.map(h => ({ value: h.id, label: h.name })),
                ]}
              >
                <Hospital className="w-4 h-4" />
              </Select>
              <Select
                label="Certification"
                value={editingResponder.certification_level}
                options={certificationOptions.map(c => ({ value: c, label: c }))}
              >
                <Award className="w-4 h-4" />
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Vehicle Type"
                value={editingResponder.vehicle_type || 'ambulance'}
                options={[
                  { value: 'ambulance', label: 'Ambulance' },
                  { value: 'medic_unit', label: 'Medic Unit' },
                  { value: 'supervisor', label: 'Supervisor' },
                  { value: 'other', label: 'Other' },
                ]}
              >
                <Ambulance className="w-4 h-4" />
              </Select>
              <Input label="Vehicle ID" defaultValue={editingResponder.vehicle_id} />
            </div>
            <div>
              <label className="label">Availability</label>
              <Select
                value={editingResponder.is_available.toString()}
                onChange={(e) => handleAvailabilityToggle(editingResponder.id, e.target.value === 'true')}
                options={[
                  { value: 'true', label: 'Available' },
                  { value: 'false', label: 'Unavailable' },
                ]}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setEditingResponder(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
