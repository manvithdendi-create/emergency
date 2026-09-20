import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, MapPin, Loader2, CheckCircle, X, RotateCcw, HelpCircle, Heart, Zap, Crosshair } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { useAuth } from '../../context/AuthContext'
import { useEmergency } from '../../context/EmergencyContext'
import { supabase } from '../../services/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Card, CardBody } from '../../components/ui/Card'
import { Modal, ConfirmModal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../hooks/useToast'
import { cn } from '../../utils/helpers'
import type { EmergencyStatus } from '../../types'

const sosSchema = z.object({
  chief_complaint: z.string().min(1, 'Please select a chief complaint'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
})

type SOSForm = z.infer<typeof sosSchema>

const chiefComplaints = [
  { value: 'chest_pain', label: 'Chest Pain / Heart Attack' },
  { value: 'difficulty_breathing', label: 'Difficulty Breathing' },
  { value: 'unconscious', label: 'Unconscious / Unresponsive' },
  { value: 'severe_bleeding', label: 'Severe Bleeding' },
  { value: 'stroke_symptoms', label: 'Stroke Symptoms' },
  { value: 'severe_allergic_reaction', label: 'Severe Allergic Reaction' },
  { value: 'trauma_injury', label: 'Trauma / Serious Injury' },
  { value: 'seizure', label: 'Seizure' },
  { value: 'poisoning', label: 'Poisoning / Overdose' },
  { value: 'burns', label: 'Severe Burns' },
  { value: 'mental_health', label: 'Mental Health Crisis' },
  { value: 'other', label: 'Other Emergency' },
].map(c => ({ value: c.value, label: c.label }))

const priorityOptions = [
  { value: 'critical', label: 'Critical - Life Threatening' },
  { value: 'high', label: 'High - Urgent' },
  { value: 'medium', label: 'Medium - Serious' },
  { value: 'low', label: 'Low - Non-Urgent' },
]

export function PatientSOS() {
  const navigate = useNavigate()
  const { authUser } = useAuth()
  const { createEmergency } = useEmergency()
  const { getCurrentLocation, location, loading: locationLoading, error: locationError } = useGeolocation()

  const [step, setStep] = useState<'idle' | 'confirm' | 'location' | 'details' | 'submitting' | 'success'>('idle')
  const [capturedLocation, setCapturedLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [autoSubmit, setAutoSubmit] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SOSForm>({
    resolver: zodResolver(sosSchema),
    defaultValues: { priority: 'high' },
  })

  const watchedPriority = watch('priority')

  // Auto-capture location on mount
  useEffect(() => {
    if (step === 'location') {
      captureLocation()
    }
  }, [step])

  // Countdown timer for auto-submit
  useEffect(() => {
    if (step === 'confirm' && autoSubmit) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleConfirm()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, autoSubmit])

  const captureLocation = async () => {
    const coords = await getCurrentLocation()
    if (coords) {
      setCapturedLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      // Try to get address from coordinates
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
        )
        const data = await response.json()
        if (data.display_name) {
          setCapturedLocation(prev => prev ? { ...prev, address: data.display_name } : null)
        }
      } catch {
        // Ignore address lookup errors
      }
    }
  }

  const handleConfirm = () => {
    setStep('location')
    setCountdown(10)
  }

  const handleBack = () => {
    if (step === 'confirm') setStep('idle')
    else if (step === 'location') setStep('confirm')
    else if (step === 'details') setStep('location')
  }

  const handleLocationConfirm = () => {
    if (capturedLocation) {
      setStep('details')
    } else {
      toast.error('Unable to get location. Please enable location services.')
    }
  }

  const onSubmit = async (data: SOSForm) => {
    if (!capturedLocation) {
      toast.error('Location coordinates are required to send an alert.')
      return
    }

    setSubmitting(true)
    setStep('submitting')

    try {
      const { error, emergency } = await createEmergency({
        chief_complaint: data.chief_complaint,
        description: data.description || '',
        patient_latitude: capturedLocation.latitude,
        patient_longitude: capturedLocation.longitude,
        patient_address: capturedLocation.address || 'Patient Current Location',
        priority: data.priority,
      })

      if (error) throw error

      if (emergency) {
        setStep('success')
        // Navigate to tracking after a moment
        setTimeout(() => navigate(`/patient/emergency/${emergency.id}`), 2000)
      }
    } catch (error) {
      toast.error('Failed to create emergency alert')
      setStep('details')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetryLocation = () => {
    captureLocation()
  }

  // Step 1: Idle - Big SOS Button
  if (step === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emergency-red-light mb-6 animate-pulse-ring">
              <AlertTriangle className="w-12 h-12 text-emergency-red" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency SOS</h1>
            <p className="text-gray-600">Press the button below to call for emergency help</p>
          </div>

          <Button
            variant="sos"
            onClick={() => setStep('confirm')}
            className="w-64 h-64 rounded-full text-2xl font-bold"
            aria-label="Activate Emergency SOS"
          >
            <span className="flex flex-col items-center">
              <AlertTriangle className="w-10 h-10 mb-1" />
              <span>SOS</span>
              <span className="text-xs font-normal">EMERGENCY</span>
            </span>
          </Button>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white rounded-xl">
              <Heart className="w-6 h-6 text-emergency-red mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Medical</p>
              <p className="text-xs text-gray-500">Emergencies</p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <Zap className="w-6 h-6 text-emergency-amber mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Immediate</p>
              <p className="text-xs text-gray-500">Response</p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <Crosshair className="w-6 h-6 text-emergency-blue mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">GPS</p>
              <p className="text-xs text-gray-500">Location</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Confirmation
  if (step === 'confirm') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-emergency-red-light flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-emergency-red" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Confirm Emergency</h1>
            <p className="text-gray-600 mt-2">
              This will alert nearby hospitals and emergency responders with your location.
            </p>
          </div>

          <Card>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emergency-red-light rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-emergency-red flex-shrink-0" />
                  <div>
                    <p className="font-medium text-emergency-red-dark">Emergency services will be notified</p>
                    <p className="text-sm text-emergency-red-dark">Your location will be shared with responders</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emergency-amber-light rounded-lg">
                  <HelpCircle className="w-6 h-6 text-emergency-amber flex-shrink-0" />
                  <div>
                    <p className="font-medium text-emergency-amber-dark">Auto-submit in {countdown}s</p>
                    <p className="text-sm text-emergency-amber-dark">Or press cancel to stop</p>
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoSubmit}
                    onChange={(e) => setAutoSubmit(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emergency-blue focus:ring-emergency-blue"
                  />
                  <span className="text-sm text-gray-700">Auto-submit after countdown</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setStep('idle')}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="danger" className="flex-1" onClick={handleConfirm}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm SOS
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  // Step 3: Location Capture
  if (step === 'location') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
              capturedLocation ? 'bg-emergency-green-light' : 'bg-emergency-blue-light animate-pulse'
            )}>
              {capturedLocation ? (
                <CheckCircle className="w-10 h-10 text-emergency-green" />
              ) : (
                <Loader2 className="w-10 h-10 text-emergency-blue animate-spin" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {capturedLocation ? 'Location Captured' : 'Getting Your Location'}
            </h1>
            <p className="text-gray-600 mt-2">
              {capturedLocation
                ? 'Your GPS coordinates have been captured'
                : 'Please wait while we get your exact location...'}
            </p>
          </div>

          <Card>
            <CardBody>
              {capturedLocation && capturedLocation.address && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-emergency-blue mb-2" />
                  <p className="text-sm text-gray-700">{capturedLocation.address}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Latitude</p>
                  <p className="font-mono text-sm">{capturedLocation?.latitude.toFixed(6) || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Longitude</p>
                  <p className="font-mono text-sm">{capturedLocation?.longitude.toFixed(6) || '—'}</p>
                </div>
              </div>

              {locationError && (
                <div className="mb-4 p-3 bg-emergency-red-light rounded-lg text-emergency-red-dark text-sm">
                  <p>Unable to get location automatically</p>
                  <p className="mt-1">Please enable location services in your browser settings</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleBack}
                  disabled={!capturedLocation}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={capturedLocation ? handleLocationConfirm : handleRetryLocation}
                  loading={locationLoading && !capturedLocation}
                >
                  {capturedLocation
                    ? <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Continue
                      </>
                    : <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry Location
                      </>
                  }
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  // Step 4: Details Form
  if (step === 'details') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emergency-blue-light flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-emergency-blue" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Emergency Details</h1>
            <p className="text-gray-600 mt-2">Provide details to help responders prepare</p>
          </div>

          <Card>
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Select
                  label="Type of Emergency"
                  options={chiefComplaints}
                  placeholder="Select emergency type"
                  {...register('chief_complaint')}
                  error={errors.chief_complaint?.message}
                  required
                >
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                </Select>

                <Textarea
                  label="Additional Details (optional)"
                  {...register('description')}
                  placeholder="Describe symptoms, injuries, or any other relevant information..."
                  rows={3}
                />

                <Select
                  label="Priority Level"
                  options={priorityOptions}
                  {...register('priority')}
                  error={errors.priority?.message}
                >
                  <Zap className="w-5 h-5 text-gray-400" />
                </Select>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" className="flex-1" type="button" onClick={handleBack}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" variant="danger" className="flex-1" loading={submitting}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Send Emergency Alert
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <div className="mt-4 p-3 bg-emergency-red-light rounded-lg text-center">
            <p className="text-sm text-emergency-red-dark font-medium">
              Your location: {capturedLocation?.address || `${capturedLocation?.latitude.toFixed(4)}, ${capturedLocation?.longitude.toFixed(4)}`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Step 5: Submitting
  if (step === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-emergency-blue-light flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-10 h-10 text-emergency-blue animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sending Emergency Alert</h1>
          <p className="text-gray-600">Notifying nearby hospitals and responders...</p>
        </div>
      </div>
    )
  }

  // Step 6: Success
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-emergency-green-light flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emergency-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Alert Sent</h1>
        <p className="text-gray-600 mb-6">
          Your emergency has been broadcast to nearby hospitals and responders.
          Help is on the way.
        </p>
        <div className="p-4 bg-white rounded-xl border border-emergency-green">
          <p className="text-sm text-gray-600 mb-2">Emergency ID</p>
          <p className="font-mono text-lg text-emergency-green">EMR-{Date.now().toString(36).toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}
