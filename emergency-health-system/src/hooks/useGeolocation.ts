import { useState, useCallback, useEffect } from 'react'
import type { LocationCoords } from '../types'

interface UseGeolocationReturn {
  location: LocationCoords | null
  error: GeolocationPositionError | null
  loading: boolean
  getCurrentLocation: () => Promise<LocationCoords | null>
  watchLocation: (onUpdate: (location: LocationCoords) => void) => number | null
  clearWatch: (watchId: number) => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [loading, setLoading] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  const getCurrentLocation = useCallback((): Promise<LocationCoords | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by this browser') as unknown as GeolocationPositionError
        setError(err)
        resolve(null)
        return
      }

      setLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setLocation(coords)
          setLoading(false)
          resolve(coords)
        },
        (err) => {
          setError(err)
          setLoading(false)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  const watchLocation = useCallback((onUpdate: (location: LocationCoords) => void): number | null => {
    if (!navigator.geolocation) {
      return null
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const coords: LocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setLocation(coords)
        onUpdate(coords)
      },
      (err) => {
        setError(err)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    setWatchId(id)
    return id
  }, [])

  const clearWatch = useCallback((id: number) => {
    navigator.geolocation.clearWatch(id)
    if (watchId === id) {
      setWatchId(null)
    }
  }, [watchId])

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  }
}
