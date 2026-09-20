import { useEffect, useState } from 'react'
import { Search, Filter, Loader2, User, Shield, Building2 as Hospital, Truck as Ambulance, MoreVertical, Edit, Trash2, Mail, Phone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { cn, formatRelativeTime } from '../../utils/helpers'
import { DEMO_USERS } from '../../services/mockData'
import type { Profile, UserRole } from '../../types'

const roleOptions = [
  { value: 'patient', label: 'Patient' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'responder', label: 'Responder' },
  { value: 'admin', label: 'Admin' },
]

const roleIcons: Record<UserRole, React.ReactNode> = {
  patient: <User className="w-4 h-4" />,
  hospital: <Hospital className="w-4 h-4" />,
  responder: <Ambulance className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
}

export function AdminUsers() {
  const { authUser } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Profile | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('full_name', `%${search}%`)
      }
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      const { data, error } = await query.limit(100)
      if (!error && data && data.length > 0) {
        setUsers(data)
        return
      }
    } catch (error) {
      console.warn('Admin users fetch fallback:', error)
    } finally {
      setLoading(false)
    }

    try {
      const storedUsers = JSON.parse(localStorage.getItem('emergency_registered_users') || '[]')
      const regProfiles = storedUsers.map((u: any) => u.authUser.profile)
      const demoProfiles = Object.values(DEMO_USERS).map(u => u.authUser.profile)
      setUsers([...regProfiles, ...demoProfiles])
    } catch {
      setUsers(Object.values(DEMO_USERS).map(u => u.authUser.profile))
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
      if (error) throw error
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleDelete = async (user: Profile) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.user_id)
      if (error) throw error
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users and roles</p>
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and roles</p>
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
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'patient', label: 'Patients' },
                { value: 'hospital', label: 'Hospitals' },
                { value: 'responder', label: 'Responders' },
                { value: 'admin', label: 'Admins' },
              ]}
              className="w-48"
            >
              <Filter className="w-4 h-4" />
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Users Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          user.role === 'patient' && 'bg-emergency-blue-light text-emergency-blue',
                          user.role === 'hospital' && 'bg-emergency-green-light text-emergency-green',
                          user.role === 'responder' && 'bg-emergency-amber-light text-emergency-amber',
                          user.role === 'admin' && 'bg-purple-100 text-purple-600'
                        )}>
                          {roleIcons[user.role]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        options={roleOptions}
                        className="w-32"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {user.email && <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</p>}
                        {user.phone && <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="pending">Active</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatRelativeTime(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(user)}>
                          <Trash2 className="w-4 h-4 text-emergency-red" />
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
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        size="md"
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <p className="text-gray-900">{editingUser.full_name}</p>
            </div>
            <div>
              <label className="label">Email</label>
              <p className="text-gray-900">{editingUser.email}</p>
            </div>
            <div>
              <label className="label">Role</label>
              <Select
                value={editingUser.role}
                onChange={(e) => handleRoleChange(editingUser.id, e.target.value as UserRole)}
                options={roleOptions}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setEditingUser(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
        size="sm"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
