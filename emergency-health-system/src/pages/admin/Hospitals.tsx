import { useEffect, useState } from 'react'
import { Search, Filter, Loader2, Building2 as Hospital, MapPin, Phone, CheckCircle, X, MoreVertical, Edit, Shield, Truck as Ambulance } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { cn, formatRelativeTime } from '../../utils/helpers'
import { DEMO_HOSPITALS } from '../../services/mockData'

export function AdminHospitals() {
  const { authUser } = useAuth()
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'active' | 'inactive'>('all')
  const [editingHospital, setEditingHospital] = useState<any | null>(null)

  useEffect(() => {
    fetchHospitals()
  }, [])

  const fetchHospitals = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('hospitals')
        .select(`
          *,
          profile:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }
      if (statusFilter === 'verified') {
        query = query.eq('is_verified', true)
      } else if (statusFilter === 'unverified') {
        query = query.eq('is_verified', false)
      } else if (statusFilter === 'active') {
        query = query.eq('is_active', true)
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data, error } = await query.limit(100)
      if (!error && data && data.length > 0) {
        setHospitals(data)
        return
      }
    } catch (error) {
      console.warn('Admin hospitals fetch fallback:', error)
    } finally {
      setLoading(false)
    }

    setHospitals(DEMO_HOSPITALS)
  }

  const handleVerify = async (hospitalId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ is_verified: verified })
        .eq('id', hospitalId)
      if (error) throw error
      setHospitals(prev => prev.map(h => h.id === hospitalId ? { ...h, is_verified: verified } : h))
    } catch (error) {
      console.error('Error updating hospital:', error)
    }
  }

  const handleToggleActive = async (hospitalId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('hospitals')
        .update({ is_active: active })
        .eq('id', hospitalId)
      if (error) throw error
      setHospitals(prev => prev.map(h => h.id === hospitalId ? { ...h, is_active: active } : h))
    } catch (error) {
      console.error('Error updating hospital:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital Management</h1>
            <p className="text-gray-600">Manage hospital profiles and verification</p>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Hospital Management</h1>
          <p className="text-gray-600">Manage hospital profiles and verification</p>
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
                placeholder="Search hospitals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'verified', label: 'Verified' },
                { value: 'unverified', label: 'Unverified' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              className="w-48"
            >
              <Filter className="w-4 h-4" />
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Hospitals Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emergency-green-light flex items-center justify-center">
                          <Hospital className="w-5 h-5 text-emergency-green" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{hospital.name}</p>
                          <p className="text-sm text-gray-500">{hospital.license_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {hospital.city}, {hospital.state}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {hospital.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{hospital.current_load}/{hospital.emergency_capacity}</span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emergency-blue rounded-full transition-all"
                            style={{ width: `${(hospital.current_load / hospital.emergency_capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={hospital.is_verified ? 'resolved' : 'pending'}>
                          {hospital.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                        <Badge variant={hospital.is_active ? 'accepted' : 'default'}>
                          {hospital.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingHospital(hospital)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!hospital.is_verified && (
                          <Button variant="ghost" size="sm" onClick={() => handleVerify(hospital.id, true)}>
                            <CheckCircle className="w-4 h-4 text-emergency-green" />
                          </Button>
                        )}
                        {hospital.is_verified && (
                          <Button variant="ghost" size="sm" onClick={() => handleVerify(hospital.id, false)}>
                            <X className="w-4 h-4 text-emergency-amber" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleActive(hospital.id, !hospital.is_active)}
                        >
                          {hospital.is_active ? <X className="w-4 h-4 text-gray-400" /> : <CheckCircle className="w-4 h-4 text-emergency-green" />}
                        </Button>
                      </div>
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
        isOpen={!!editingHospital}
        onClose={() => setEditingHospital(null)}
        title="Edit Hospital"
        size="lg"
      >
        {editingHospital && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" defaultValue={editingHospital.name} disabled />
              <Input label="License Number" defaultValue={editingHospital.license_number} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" defaultValue={editingHospital.phone} disabled />
              <Input label="Email" defaultValue={editingHospital.email} disabled />
            </div>
            <Input label="Address" defaultValue={`${editingHospital.address}, ${editingHospital.city}, ${editingHospital.state} ${editingHospital.zip_code}`} disabled />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Verified</label>
                <Select
                  value={editingHospital.is_verified.toString()}
                  onChange={(e) => handleVerify(editingHospital.id, e.target.value === 'true')}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
              </div>
              <div>
                <label className="label">Active</label>
                <Select
                  value={editingHospital.is_active.toString()}
                  onChange={(e) => handleToggleActive(editingHospital.id, e.target.value === 'true')}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setEditingHospital(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
