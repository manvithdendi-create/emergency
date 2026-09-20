import { useEffect, useState } from 'react'
import { Search, Filter, Loader2, User, Database, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { cn, formatDateTime } from '../../utils/helpers'
import { DEMO_AUDIT_LOGS } from '../../services/mockData'
import type { AuditLog } from '../../types'

export function AdminAuditLogs() {
  const { authUser } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 50
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    fetchLogs()
    fetchFilters()
  }, [page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (search) {
        query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`)
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter)
      }

      const { data, error, count } = await query
      if (!error && data && data.length > 0) {
        setLogs(data)
        setTotalPages(Math.ceil((count || 0) / pageSize))
        return
      }
    } catch (error) {
      console.warn('Admin audit logs fetch fallback:', error)
    } finally {
      setLoading(false)
    }

    setLogs(DEMO_AUDIT_LOGS as any)
    setTotalPages(1)
  }

  const fetchFilters = async () => {
    // Could fetch distinct actions and entity types for filter options
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, any> = {
      emergency_created: 'critical',
      emergency_status_change: 'accepted',
      responder_assigned: 'on_the_way',
      emergency_resolved: 'resolved',
      emergency_cancelled: 'default',
      user_created: 'pending',
      user_updated: 'pending',
      hospital_verified: 'accepted',
    }
    return <Badge variant={variants[action] || 'default'}>{action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600">System activity and security audit trail</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">System activity and security audit trail</p>
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
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Actions' },
                { value: 'emergency_created', label: 'Emergency Created' },
                { value: 'emergency_status_change', label: 'Status Change' },
                { value: 'responder_assigned', label: 'Responder Assigned' },
                { value: 'emergency_resolved', label: 'Emergency Resolved' },
                { value: 'emergency_cancelled', label: 'Emergency Cancelled' },
                { value: 'user_created', label: 'User Created' },
                { value: 'user_updated', label: 'User Updated' },
                { value: 'hospital_verified', label: 'Hospital Verified' },
              ]}
              className="w-56"
            >
              <Filter className="w-4 h-4" />
            </Select>
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Entities' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'user', label: 'User' },
                { value: 'hospital', label: 'Hospital' },
                { value: 'responder', label: 'Responder' },
              ]}
              className="w-48"
            >
              <Database className="w-4 h-4" />
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{log.entity_type}</Badge>
                        <span className="text-xs text-gray-500 font-mono">{log.entity_id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {log.user_id?.slice(0, 8) || 'System'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 font-mono">{log.ip_address || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewingLog(log)}>
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={!!viewingLog}
        onClose={() => setViewingLog(null)}
        title="Audit Log Details"
        size="lg"
      >
        {viewingLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Action</label>
                {getActionBadge(viewingLog.action)}
              </div>
              <div>
                <label className="label">Entity Type</label>
                <p className="text-gray-900">{viewingLog.entity_type}</p>
              </div>
              <div>
                <label className="label">Entity ID</label>
                <p className="text-gray-900 font-mono">{viewingLog.entity_id}</p>
              </div>
              <div>
                <label className="label">User ID</label>
                <p className="text-gray-900 font-mono">{viewingLog.user_id || 'System'}</p>
              </div>
              <div>
                <label className="label">IP Address</label>
                <p className="text-gray-900 font-mono">{viewingLog.ip_address || 'N/A'}</p>
              </div>
              <div>
                <label className="label">User Agent</label>
                <p className="text-gray-900 text-xs truncate">{viewingLog.user_agent || 'N/A'}</p>
              </div>
              <div>
                <label className="label">Timestamp</label>
                <p className="text-gray-900">{formatDateTime(viewingLog.created_at)}</p>
              </div>
            </div>
            {viewingLog.old_data && (
              <div>
                <label className="label">Old Data</label>
                <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(viewingLog.old_data, null, 2)}
                </pre>
              </div>
            )}
            {viewingLog.new_data && (
              <div>
                <label className="label">New Data</label>
                <pre className="p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(viewingLog.new_data, null, 2)}
                </pre>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setViewingLog(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
