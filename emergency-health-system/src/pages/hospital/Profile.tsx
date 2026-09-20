import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2 as HospitalIcon, Shield, Phone, Mail, MapPin, Activity, Clock, CheckCircle, Save, Loader2, Truck, AlertTriangle, Stethoscope, BedDouble } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../hooks/useToast'
import type { Hospital } from '../../types'

const hospitalSchema = z.object({
  name: z.string().min(2, 'Hospital name is required'),
  license_number: z.string().optional(),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email('Valid email address is required').optional().or(z.literal('')),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip_code: z.string().optional(),
  emergency_capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  current_load: z.coerce.number().min(0, 'Current load cannot be negative'),
  accepts_ambulance: z.boolean(),
  specialties: z.string().optional(),
})

type HospitalForm = z.infer<typeof hospitalSchema>

export function HospitalProfile() {
  const { authUser, refreshAuthUser } = useAuth()
  const hospital = authUser?.hospital
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const defaultHospitalData: Hospital = hospital || {
    id: 'hosp-001',
    name: 'City General Hospital',
    license_number: 'HOSP-001-CA',
    address: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94102',
    country: 'US',
    phone: '+1 (415) 555-0100',
    email: 'emergency@citygeneral.org',
    latitude: 37.7749,
    longitude: -122.4194,
    emergency_capacity: 35,
    current_load: 12,
    accepts_ambulance: true,
    specialties: ['Level 1 Trauma Center', 'Comprehensive Stroke Center', 'Cardiology & Cath Lab', 'Pediatric ICU', 'Burn Unit'],
    is_verified: true,
    is_active: true,
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HospitalForm>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: {
      name: defaultHospitalData.name,
      license_number: defaultHospitalData.license_number || '',
      phone: defaultHospitalData.phone,
      email: defaultHospitalData.email || '',
      address: defaultHospitalData.address,
      city: defaultHospitalData.city,
      state: defaultHospitalData.state,
      zip_code: defaultHospitalData.zip_code || '',
      emergency_capacity: defaultHospitalData.emergency_capacity,
      current_load: defaultHospitalData.current_load,
      accepts_ambulance: defaultHospitalData.accepts_ambulance,
      specialties: defaultHospitalData.specialties.join(', '),
    },
  })

  const currentCapacity = watch('emergency_capacity') || defaultHospitalData.emergency_capacity
  const currentLoad = watch('current_load') || defaultHospitalData.current_load
  const acceptsAmbulance = watch('accepts_ambulance')
  const occupancyRate = Math.min(100, Math.round((currentLoad / (currentCapacity || 1)) * 100))

  const onSubmit = async (data: HospitalForm) => {
    setSaving(true)
    try {
      const specialtiesArray = data.specialties
        ? data.specialties.split(',').map(s => s.trim()).filter(Boolean)
        : defaultHospitalData.specialties

      const updatedHospital: Hospital = {
        ...defaultHospitalData,
        name: data.name,
        license_number: data.license_number || defaultHospitalData.license_number,
        phone: data.phone,
        email: data.email || defaultHospitalData.email,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code || defaultHospitalData.zip_code,
        emergency_capacity: Number(data.emergency_capacity),
        current_load: Number(data.current_load),
        accepts_ambulance: data.accepts_ambulance,
        specialties: specialtiesArray,
        updated_at: new Date().toISOString(),
      }

      // 1. Try Supabase update
      try {
        if (hospital?.id) {
          await supabase
            .from('hospitals')
            .update({
              name: updatedHospital.name,
              phone: updatedHospital.phone,
              email: updatedHospital.email,
              address: updatedHospital.address,
              city: updatedHospital.city,
              state: updatedHospital.state,
              emergency_capacity: updatedHospital.emergency_capacity,
              current_load: updatedHospital.current_load,
              accepts_ambulance: updatedHospital.accepts_ambulance,
              specialties: updatedHospital.specialties,
            })
            .eq('id', hospital.id)
        }
      } catch (dbErr) {
        console.warn('Supabase hospital update notice:', dbErr)
      }

      // 2. Persist locally to active auth user
      if (authUser) {
        authUser.hospital = updatedHospital
        localStorage.setItem('emergency_session_user', JSON.stringify(authUser))
      }

      setIsEditing(false)
      toast.success('Hospital Profile Updated', 'Facility details and emergency capacity have been updated.')
      await refreshAuthUser()
    } catch (err: any) {
      toast.error('Update Failed', err.message || 'Could not update hospital profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{defaultHospitalData.name}</h1>
            <Badge variant="accepted">Verified Facility</Badge>
            {defaultHospitalData.accepts_ambulance ? (
              <Badge variant="on_the_way">Intake Open</Badge>
            ) : (
              <Badge variant="critical">Ambulance Divert</Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">Hospital Profile, Emergency Intake & Bed Capacity Management</p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Hospital Profile
            </Button>
          )}
        </div>
      </div>

      {/* Live Capacity & Intake Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-emergency-blue">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Capacity</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {currentLoad} <span className="text-lg font-normal text-gray-400">/ {currentCapacity} beds</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-emergency-blue flex items-center justify-center">
                <BedDouble className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Occupancy Rate</span>
                <span className="font-semibold">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    occupancyRate > 85 ? 'bg-emergency-red' : occupancyRate > 65 ? 'bg-emergency-amber' : 'bg-emergency-green'
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-emerald-500">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ambulance Intake</p>
                <p className={`text-xl font-bold mt-1 ${acceptsAmbulance ? 'text-emerald-700' : 'text-emergency-red'}`}>
                  {acceptsAmbulance ? 'ACCEPTING INCOMING' : 'DIVERT ACTIVE'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${acceptsAmbulance ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-emergency-red'}`}>
                <Truck className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {acceptsAmbulance
                ? 'EMS dispatch centers receive immediate routing to this facility.'
                : 'Facility is on diversion protocol due to critical capacity.'}
            </p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Emergency Hotline</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{defaultHospitalData.phone}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              24/7 dedicated intake desk and trauma triage line.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Main Profile Form / Details View */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardBody className="p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <HospitalIcon className="w-5 h-5 text-emergency-red" />
                Facility Information & Settings
              </h2>
              {isEditing && (
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium border border-amber-200">
                  Editing Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Hospital / Center Name</label>
                <Input
                  {...register('name')}
                  error={errors.name?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">License / Accreditation Number</label>
                <Input
                  {...register('license_number')}
                  error={errors.license_number?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Emergency Intake Direct Phone</label>
                <Input
                  {...register('phone')}
                  error={errors.phone?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Emergency Department Email</label>
                <Input
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Street Address</label>
                <Input
                  {...register('address')}
                  error={errors.address?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">City</label>
                <Input
                  {...register('city')}
                  error={errors.city?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">State</label>
                  <Input
                    {...register('state')}
                    error={errors.state?.message}
                    disabled={!isEditing || saving}
                  />
                </div>
                <div>
                  <label className="label">Zip Code</label>
                  <Input
                    {...register('zip_code')}
                    error={errors.zip_code?.message}
                    disabled={!isEditing || saving}
                  />
                </div>
              </div>

              {/* Capacity Controls */}
              <div>
                <label className="label">Max Emergency Capacity (Beds)</label>
                <Input
                  type="number"
                  {...register('emergency_capacity')}
                  error={errors.emergency_capacity?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Current Occupancy (Occupied Beds)</label>
                <Input
                  type="number"
                  {...register('current_load')}
                  error={errors.current_load?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              {/* Ambulance Reception Switch */}
              <div className="md:col-span-2 p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Ambulance Reception Protocol</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Toggle whether your emergency department is actively accepting arriving EMS ambulance units.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('accepts_ambulance')}
                    disabled={!isEditing || saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emergency-green"></div>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="label">Trauma Levels & Medical Specialties (comma separated)</label>
                <Input
                  {...register('specialties')}
                  error={errors.specialties?.message}
                  disabled={!isEditing || saving}
                  placeholder="e.g. Level 1 Trauma, Comprehensive Stroke, Cardiology, Burn Unit"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {defaultHospitalData.specialties.map((spec, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <Stethoscope className="w-3 h-3 text-blue-600" />
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" type="button" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Hospital Changes
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
