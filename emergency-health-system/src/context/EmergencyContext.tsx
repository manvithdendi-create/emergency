import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../services/supabase'
import type { Emergency, EmergencyResponse, Notification, EmergencyStatus } from '../types'
import { useAuth } from './AuthContext'
import { INITIAL_DEMO_EMERGENCIES, INITIAL_DEMO_NOTIFICATIONS } from '../services/mockData'

interface EmergencyContextType {
  activeEmergency: Emergency | null
  emergencies: Emergency[]
  emergencyResponses: EmergencyResponse[]
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  createEmergency: (data: CreateEmergencyData) => Promise<{ error: Error | null; emergency: Emergency | null }>
  updateEmergencyStatus: (emergencyId: string, status: EmergencyStatus) => Promise<{ error: Error | null }>
  assignResponder: (emergencyId: string, responderId: string) => Promise<{ error: Error | null }>
  fetchEmergencies: () => Promise<void>
  fetchNotifications: () => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
  subscribeToEmergency: (emergencyId: string) => () => void
}

interface CreateEmergencyData {
  chief_complaint: string
  description?: string
  patient_latitude: number
  patient_longitude: number
  patient_address?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

const LOCAL_EMERGENCIES_KEY = 'emergency_system_emergencies'
const LOCAL_NOTIFICATIONS_KEY = 'emergency_system_notifications'

const getLocalEmergencies = (): Emergency[] => {
  try {
    const raw = localStorage.getItem(LOCAL_EMERGENCIES_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Could not parse local emergencies:', e)
  }
  return INITIAL_DEMO_EMERGENCIES
}

const saveLocalEmergencies = (emergencies: Emergency[]) => {
  try {
    localStorage.setItem(LOCAL_EMERGENCIES_KEY, JSON.stringify(emergencies))
  } catch (e) {
    console.warn('Could not save local emergencies:', e)
  }
}

const getLocalNotifications = (): Notification[] => {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Could not parse local notifications:', e)
  }
  return INITIAL_DEMO_NOTIFICATIONS
}

const saveLocalNotifications = (notifications: Notification[]) => {
  try {
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications))
  } catch (e) {
    console.warn('Could not save local notifications:', e)
  }
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined)

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const { authUser } = useAuth()
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null)
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [emergencyResponses, setEmergencyResponses] = useState<EmergencyResponse[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authUser) {
      fetchEmergencies()
      fetchNotifications()
      const cleanup = setupRealtimeSubscriptions()
      return () => {
        cleanup?.()
      }
    } else {
      setEmergencies([])
      setNotifications([])
      setUnreadCount(0)
      setActiveEmergency(null)
      setLoading(false)
    }
  }, [authUser])

  const setupRealtimeSubscriptions = () => {
    try {
      const emergenciesChannel = supabase
        .channel('emergencies_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergencies' },
          (payload) => {
            handleEmergencyChange(payload)
          }
        )
        .subscribe()

      const responsesChannel = supabase
        .channel('responses_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergency_responses' },
          (payload) => {
            handleResponseChange(payload)
          }
        )
        .subscribe()

      const notificationsChannel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${authUser?.profile?.id}` },
          (payload) => {
            handleNotificationChange(payload)
          }
        )
        .subscribe()

      return () => {
        emergenciesChannel.unsubscribe().catch(() => {})
        responsesChannel.unsubscribe().catch(() => {})
        notificationsChannel.unsubscribe().catch(() => {})
      }
    } catch (e) {
      console.warn('Realtime subscription not available:', e)
    }
  }

  const handleEmergencyChange = (payload: any) => {
    const emergency = payload.new as Emergency
    const oldEmergency = payload.old as Emergency

    switch (payload.eventType) {
      case 'INSERT':
        setEmergencies(prev => [emergency, ...prev])
        if (emergency.patient_id === authUser?.profile?.id) {
          setActiveEmergency(emergency)
        }
        break
      case 'UPDATE':
        setEmergencies(prev => prev.map(e => e.id === emergency.id ? emergency : e))
        if (activeEmergency?.id === emergency.id) {
          setActiveEmergency(emergency)
        }
        break
      case 'DELETE':
        setEmergencies(prev => prev.filter(e => e.id !== oldEmergency.id))
        if (activeEmergency?.id === oldEmergency.id) {
          setActiveEmergency(null)
        }
        break
    }
  }

  const handleResponseChange = (payload: any) => {
    const response = payload.new as EmergencyResponse

    switch (payload.eventType) {
      case 'INSERT':
        setEmergencyResponses(prev => [response, ...prev])
        break
      case 'UPDATE':
        setEmergencyResponses(prev => prev.map(r => r.id === response.id ? response : r))
        break
      case 'DELETE':
        setEmergencyResponses(prev => prev.filter(r => r.id !== payload.old.id))
        break
    }
  }

  const handleNotificationChange = (payload: any) => {
    const notification = payload.new as Notification

    switch (payload.eventType) {
      case 'INSERT':
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + (notification.is_read ? 0 : 1))
        break
      case 'UPDATE':
        setNotifications(prev => prev.map(n => n.id === notification.id ? notification : n))
        if (payload.old.is_read === false && notification.is_read === true) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        break
      case 'DELETE':
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
        if (!payload.old.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        break
    }
  }

  const fetchEmergencies = async () => {
    if (!authUser) return

    try {
      let query = supabase.from('emergencies').select('*').order('created_at', { ascending: false })

      if (authUser.role === 'patient') {
        query = query.eq('patient_id', authUser.profile?.id)
      } else if (authUser.role === 'hospital' && authUser.hospital) {
        query = query.or(`hospital_id.eq.${authUser.hospital.id},status.eq.pending`)
      } else if (authUser.role === 'responder' && authUser.responder) {
        query = query.eq('responder_id', authUser.responder.id)
      }

      const { data, error } = await query.limit(50)

      if (error || !data || data.length === 0) {
        const local = getLocalEmergencies()
        setEmergencies(local)
        if (authUser.role === 'patient') {
          const active = local.find(e => !['resolved', 'cancelled'].includes(e.status))
          setActiveEmergency(active || null)
        }
        return
      }

      setEmergencies(data)
      if (authUser.role === 'patient') {
        const active = data.find(e => !['resolved', 'cancelled'].includes(e.status))
        setActiveEmergency(active || null)
      }
    } catch (error) {
      console.warn('Fetch emergencies fallback:', error)
      const local = getLocalEmergencies()
      setEmergencies(local)
      if (authUser.role === 'patient') {
        const active = local.find(e => !['resolved', 'cancelled'].includes(e.status))
        setActiveEmergency(active || null)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    if (!authUser?.profile?.id) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authUser.profile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error || !data || data.length === 0) {
        const local = getLocalNotifications()
        setNotifications(local)
        setUnreadCount(local.filter(n => !n.is_read).length)
        return
      }

      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    } catch (error) {
      console.warn('Fetch notifications fallback:', error)
      const local = getLocalNotifications()
      setNotifications(local)
      setUnreadCount(local.filter(n => !n.is_read).length)
    }
  }

  const createEmergency = async (emergencyData: CreateEmergencyData) => {
    const patientId = authUser?.profile?.id || authUser?.id || 'patient-user-001'

    try {
      const { data, error } = await supabase
        .from('emergencies')
        .insert({
          patient_id: patientId,
          ...emergencyData,
          status: 'pending',
        })
        .select()
        .single()

      if (!error && data) {
        setEmergencies(prev => [data, ...prev])
        setActiveEmergency(data)
        return { error: null, emergency: data }
      }
    } catch (err) {
      console.warn('Supabase createEmergency falling back locally:', err)
    }

    // Local resilient creation
    const newEmergency: Emergency = {
      id: 'emg-local-' + Date.now(),
      patient_id: patientId,
      status: 'pending',
      priority: emergencyData.priority || 'high',
      chief_complaint: emergencyData.chief_complaint,
      description: emergencyData.description,
      patient_latitude: emergencyData.patient_latitude,
      patient_longitude: emergencyData.patient_longitude,
      patient_address: emergencyData.patient_address || 'Patient Current Location',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const currentList = emergencies.length > 0 ? emergencies : getLocalEmergencies()
    const updated = [newEmergency, ...currentList]
    saveLocalEmergencies(updated)
    setEmergencies(updated)
    setActiveEmergency(newEmergency)

    return { error: null, emergency: newEmergency }
  }

  const updateEmergencyStatus = async (emergencyId: string, status: EmergencyStatus) => {
    if (!authUser) return { error: new Error('Not authenticated') }

    try {
      await supabase.rpc('update_emergency_status', {
        emergency_id: emergencyId,
        new_status: status,
        user_id: authUser.profile?.id,
        user_role: authUser.role,
      })
    } catch (e) {
      console.warn('RPC update_emergency_status notice:', e)
    }

    // Always update local state
    setEmergencies(prev => {
      const updated = prev.map(e => e.id === emergencyId ? { ...e, status, updated_at: new Date().toISOString() } : e)
      saveLocalEmergencies(updated)
      return updated
    })

    if (activeEmergency?.id === emergencyId) {
      setActiveEmergency(prev => prev ? { ...prev, status, updated_at: new Date().toISOString() } : null)
    }

    return { error: null }
  }

  const assignResponder = async (emergencyId: string, responderId: string) => {
    try {
      await supabase.rpc('assign_responder_to_emergency', {
        emergency_id: emergencyId,
        responder_id: responderId,
        hospital_id: authUser?.hospital?.id || 'hosp-001',
      })
    } catch (e) {
      console.warn('RPC assign_responder notice:', e)
    }

    setEmergencies(prev => {
      const updated = prev.map(e => e.id === emergencyId ? {
        ...e,
        responder_id: responderId,
        hospital_id: authUser?.hospital?.id || 'hosp-001',
        status: 'accepted' as EmergencyStatus,
        updated_at: new Date().toISOString(),
      } : e)
      saveLocalEmergencies(updated)
      return updated
    })

    return { error: null }
  }

  const markNotificationRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
    } catch (error) {
      console.warn('Mark notification read notice:', error)
    }

    setNotifications(prev => {
      const updated = prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      saveLocalNotifications(updated)
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const subscribeToEmergency = (emergencyId: string) => {
    try {
      const channel = supabase
        .channel(`emergency_${emergencyId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'emergencies', filter: `id=eq.${emergencyId}` },
          (payload) => {
            const emergency = payload.new as Emergency
            setActiveEmergency(emergency)
            setEmergencies(prev => prev.map(e => e.id === emergency.id ? emergency : e))
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe().catch(() => {})
      }
    } catch {
      return () => {}
    }
  }

  return (
    <EmergencyContext.Provider value={{
      activeEmergency,
      emergencies,
      emergencyResponses,
      notifications,
      unreadCount,
      loading,
      createEmergency,
      updateEmergencyStatus,
      assignResponder,
      fetchEmergencies,
      fetchNotifications,
      markNotificationRead,
      subscribeToEmergency,
    }}>
      {children}
    </EmergencyContext.Provider>
  )
}

export function useEmergency() {
  const context = useContext(EmergencyContext)
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider')
  }
  return context
}
