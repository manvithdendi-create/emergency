import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ToggleLeft, ToggleRight, Clock, MapPin, Save, Loader2, User, Truck as Ambulance, Shield, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card, CardBody } from '../../components/ui/Card'
import { toast } from '../../hooks/useToast'
import { cn } from '../../utils/helpers'

const availabilitySchema = z.object({
  is_available: z.boolean(),
  shift_start: z.string().optional(),
  shift_end: z.string().optional(),
  vehicle_type: z.string().optional(),
  vehicle_id: z.string().optional(),
})

type AvailabilityForm = z.infer<typeof availabilitySchema>

const vehicleTypes = [
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'medic_unit', label: 'Medic Unit' },
  { value: 'supervisor', label: 'Supervisor Vehicle' },
  { value: 'other', label: 'Other' },
]

export function ResponderAvailability() {
  const { authUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      is_available: authUser?.responder?.is_available || false,
      shift_start: authUser?.responder?.shift_start || '08:00',
      shift_end: authUser?.responder?.shift_end || '20:00',
      vehicle_type: authUser?.responder?.vehicle_type || 'ambulance',
      vehicle_id: authUser?.responder?.vehicle_id || '',
    },
  })

  const isAvailable = watch('is_available')

  const onSubmit = async (data: AvailabilityForm) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('responders')
        .update({
          is_available: data.is_available,
          shift_start: data.shift_start || null,
          shift_end: data.shift_end || null,
          vehicle_type: (data.vehicle_type || null) as any,
          vehicle_id: data.vehicle_id || null,
        })
        .eq('id', authUser?.responder?.id)

      if (error) throw error

      toast.success('Availability updated successfully')
    } catch (error) {
      toast.error('Failed to update availability')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability Settings</h1>
        <p className="text-gray-600">Manage your on-duty status and shift schedule</p>
      </div>

      {/* Current Status Card */}
      <Card className={cn(isAvailable ? 'ring-2 ring-emergency-green' : 'ring-2 ring-gray-200')}>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                isAvailable ? 'bg-emergency-green-light' : 'bg-gray-100'
              )}>
                {isAvailable ? (
                  <ToggleRight className="w-8 h-8 text-emergency-green" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isAvailable ? 'Currently On Duty' : 'Currently Off Duty'}
                </h3>
                <p className="text-gray-500">
                  {isAvailable
                    ? 'You are visible to hospitals for emergency assignments'
                    : 'You will not receive new emergency assignments'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                isAvailable ? 'bg-emergency-green-light text-emergency-green' : 'bg-gray-100 text-gray-600'
              )}>
                {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Availability Toggle */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emergency-blue" />
              Duty Status
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    isAvailable ? 'bg-emergency-green-light' : 'bg-gray-200'
                  )}>
                    {isAvailable ? (
                      <ToggleRight className="w-5 h-5 text-emergency-green" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Available for Emergencies</p>
                    <p className="text-sm text-gray-500">
                      {isAvailable
                        ? 'Hospitals can assign you to emergencies'
                        : 'You will not receive new assignments'}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setValue('is_available', e.target.checked)}
                  className="w-6 h-6 rounded border-gray-300 text-emergency-blue focus:ring-emergency-blue"
                />
              </label>
            </div>
          </CardBody>
        </Card>

        {/* Shift Schedule */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emergency-blue" />
              Shift Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Shift Start"
                type="time"
                {...register('shift_start')}
                error={errors.shift_start?.message}
              >
                <Clock className="w-5 h-5 text-gray-400" />
              </Input>
              <Input
                label="Shift End"
                type="time"
                {...register('shift_end')}
                error={errors.shift_end?.message}
              >
                <Clock className="w-5 h-5 text-gray-400" />
              </Input>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Hospitals will only assign emergencies during your shift hours
            </p>
          </CardBody>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Ambulance className="w-5 h-5 text-emergency-blue" />
              Vehicle Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Vehicle Type"
                options={vehicleTypes}
                {...register('vehicle_type')}
                error={errors.vehicle_type?.message}
              >
                <Ambulance className="w-5 h-5 text-gray-400" />
              </Select>
              <Input
                label="Vehicle ID / Unit Number"
                {...register('vehicle_id')}
                error={errors.vehicle_id?.message}
                placeholder="MED-123"
              >
                <Shield className="w-5 h-5 text-gray-400" />
              </Input>
            </div>
          </CardBody>
        </Card>

        {/* Location Sharing Notice */}
        <Card className="bg-emergency-blue-light border-emergency-blue">
          <CardBody>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emergency-blue mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-emergency-blue-dark mb-1">Location Sharing</h3>
                <p className="text-sm text-emergency-blue-dark">
                  When you are on duty and assigned to an emergency, your GPS location will be shared with the hospital and patient for real-time tracking. Your location is only updated when actively responding to an emergency.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving} disabled={!isDirty || saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
