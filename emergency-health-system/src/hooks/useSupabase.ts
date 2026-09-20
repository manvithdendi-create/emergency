import { useState, useCallback } from 'react'
import { supabase } from '../services/supabase'
import type { Hospital, Responder } from '../types'

interface UseNearbyHospitalsReturn {
  hospitals: Hospital[]
  loading: boolean
  error: Error | null
  fetchNearbyHospitals: (lat: number, lng: number, radiusKm?: number) => Promise<void>
}

export function useNearbyHospitals(): UseNearbyHospitalsReturn {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchNearbyHospitals = useCallback(async (lat: number, lng: number, radiusKm = 50) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_nearby_hospitals', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm,
        limit: 20,
      })

      if (rpcError) throw rpcError
      setHospitals(data || [])
    } catch (err) {
      setError(err as Error)
      setHospitals([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { hospitals, loading, error, fetchNearbyHospitals }
}

interface UseAvailableRespondersReturn {
  responders: Responder[]
  loading: boolean
  error: Error | null
  fetchAvailableResponders: (hospitalId: string, lat?: number, lng?: number) => Promise<void>
}

export function useAvailableResponders(): UseAvailableRespondersReturn {
  const [responders, setResponders] = useState<Responder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAvailableResponders = useCallback(async (hospitalId: string, lat?: number, lng?: number) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_available_responders', {
        hospital_id: hospitalId,
        lat: lat,
        lng: lng,
        radius_km: 20,
      })

      if (rpcError) throw rpcError
      setResponders(data || [])
    } catch (err) {
      setError(err as Error)
      setResponders([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { responders, loading, error, fetchAvailableResponders }
}
