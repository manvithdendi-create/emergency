import { useEffect, useState } from 'react'
import { Search, Filter, Loader2, AlertTriangle, MapPin, Building2 as Hospital, Truck as Ambulance, User, Clock, MoreVertical, Eye } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { cn, formatRelativeTime, formatDateTime, getStatusLabel, getPriorityLabel } from '../../utils/helpers'
import { INITIAL_DEMO_EMERGENCIES } from '../../services/mockData'
import type { Emergency } from '../../types'

export function AdminEmergencies() {
  const { authUser } = useAuth()
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | string>('all')
  const [viewingEmergency, setViewingEmergency] = useState<Emergency | null>(null)

  useEffect(() => {
    fetchEmergencies()
  }, [])

  const fetchEmergencies = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('emergencies')
        .select(`
          *,
          patient:profiles!emergencies_patient_id_fkey(full_name),
          hospital:hospitals(name),
          responder:responders(vehicle_type, profiles(full_name))
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('chief_complaint', `%${search}%`)
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any)
      }
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter as any)
      }

      const { data, error } = await query.limit(100)
      if (!error && data && data.length > 0) {
        setEmergencies(data)
        return
      }
    } catch (error) {
      console.warn('Admin emergencies fetch fallback:', error)
    } finally {
      setLoading(false)
    }

    setEmergencies(INITIAL_DEMO_EMERGENCIES as any)
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emergency Management</h1>
            <p className="text-gray-600">View and monitor all system emergencies</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Emergency Management</h1>
          <p className="text-gray-600">View and monitor all system emergencies</p>
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
                placeholder="Search emergencies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'on_the_way', label: 'En Route' },
                { value: 'arrived', label: 'Arrived' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              className="w-44"
            >
              <Filter className="w-4 h-4" />
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              className="w-44"
            >
              <AlertTriangle className="w-4 h-4" />
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Emergencies Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emergencies.map((emergency) => (
                  <tr key={emergency.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
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
                          <p className="text-xs text-gray-500">ID: {emergency.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {emergency.patient?.full_name || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(emergency.status)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={emergency.priority as any}>{emergency.priority.charAt(0).toUpperCase() + emergency.priority.slice(1)}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Hospital className="w-3.5 h-3.5" />
                        {emergency.hospital?.name || 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Ambulance className="w-3.5 h-3.5" />
                        {emergency.responder?.profiles?.full_name || 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(emergency.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewingEmergency(emergency)}>
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={!!viewingEmergency}
        onClose={() => setViewingEmergency(null)}
        title="Emergency Details"
        size="xl"
      >
        {viewingEmergency && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Chief Complaint</label>
                <p className="text-gray-900">{viewingEmergency.chief_complaint}</p>
              </div>
              <div>
                <label className="label">Description</label>
                <p className="text-gray-900">{viewingEmergency.description || 'No description'}</p>
              </div>
              <div>
                <label className="label">Status</label>
                {getStatusBadge(viewingEmergency.status)}
              </div>
              <div>
                <label className="label">Priority</label>
                <Badge variant={viewingEmergency.priority as any}>{viewingEmergency.priority}</Badge>
              </div>
              <div>
                <label className="label">Patient</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {viewingEmergency.patient?.full_name || 'Unknown'}
                </p>
              </div>
              <div>
                <label className="label">Hospital</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <Hospital className="w-4 h-4" />
                  {viewingEmergency.hospital?.name || 'Unassigned'}
                </p>
              </div>
              <div>
                <label className="label">Responder</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <Ambulance className="w-4 h-4" />
                  {viewingEmergency.responder?.profiles?.full_name || 'Unassigned'}
                </p>
              </div>
              <div>
                <label className="label">Location</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {viewingEmergency.patient_address || `${viewingEmergency.patient_latitude.toFixed(4)}, ${viewingEmergency.patient_longitude.toFixed(4)}`}
                </p>
              </div>
              <div>
                <label className="label">Created</label>
                <p className="text-gray-900">{formatDateTime(viewingEmergency.created_at)}</p>
              </div>
              <div>
                <label className="label">Updated</label>
                <p className="text-gray-900">{formatDateTime(viewingEmergency.updated_at)}</p>
              </div>
              {viewingEmergency.resolved_at && (
                <div>
                  <label className="label">Resolved</label>
                  <p className="text-gray-900">{formatDateTime(viewingEmergency.resolved_at)}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setViewingEmergency(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
