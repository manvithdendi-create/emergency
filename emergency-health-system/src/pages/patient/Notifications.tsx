import { useEffect } from 'react'
import { Bell, Check, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { cn, formatRelativeTime } from '../../utils/helpers'
import type { Notification } from '../../types'

const notificationIcons: Record<string, React.ReactNode> = {
  emergency_created: <Bell className="w-5 h-5 text-emergency-red" />,
  emergency_accepted: <Check className="w-5 h-5 text-emergency-blue" />,
  responder_assigned: <Bell className="w-5 h-5 text-emergency-green" />,
  responder_en_route: <Bell className="w-5 h-5 text-emergency-blue" />,
  responder_arrived: <Check className="w-5 h-5 text-emergency-green" />,
  emergency_resolved: <Check className="w-5 h-5 text-emergency-green" />,
  emergency_cancelled: <X className="w-5 h-5 text-gray-500" />,
  system_alert: <Bell className="w-5 h-5 text-emergency-amber" />,
}

const notificationTitles: Record<string, string> = {
  emergency_created: 'Emergency Created',
  emergency_accepted: 'Emergency Accepted',
  responder_assigned: 'Responder Assigned',
  responder_en_route: 'Responder En Route',
  responder_arrived: 'Responder Arrived',
  emergency_resolved: 'Emergency Resolved',
  emergency_cancelled: 'Emergency Cancelled',
  system_alert: 'System Alert',
}

export function PatientNotifications() {
  const { authUser } = useAuth()
  const { notifications, unreadCount, loading, fetchNotifications, markNotificationRead } = useEmergency()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    await Promise.all(unread.map(n => markNotificationRead(n.id)))
  }

  if (loading) {
    return (
      <div className="space-y-4">
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">You'll see emergency updates and system alerts here</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'transition-colors',
                !notification.is_read && 'bg-emergency-blue-light/30 ring-1 ring-emergency-blue'
              )}
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    !notification.is_read ? 'bg-emergency-blue text-white' : 'bg-gray-100 text-gray-500'
                  )}>
                    {notificationIcons[notification.type] || <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        'font-medium',
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      )}>
                        {notificationTitles[notification.type] || notification.type}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emergency-blue" />
                      )}
                    </div>
                    <p className={cn(
                      'text-sm mt-1',
                      !notification.is_read ? 'text-gray-700' : 'text-gray-500'
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(notification.created_at)}</p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markNotificationRead(notification.id)}
                      aria-label="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}