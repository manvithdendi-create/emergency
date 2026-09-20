import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Truck as Ambulance, Shield, Phone, Mail, Award, Clock, Activity, CheckCircle, Save, Loader2, MapPin, Stethoscope, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { toast } from '../../hooks/useToast'
import type { Responder, Profile } from '../../types'

const responderProfileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  employee_id: z.string().min(2, 'Employee ID is required'),
  license_number: z.string().optional(),
  certification_level: z.string(),
  vehicle_id: z.string().optional(),
  vehicle_type: z.string().optional(),
  shift_start: z.string().optional(),
  shift_end: z.string().optional(),
  specialties: z.string().optional(),
})

type ResponderProfileForm = z.infer<typeof responderProfileSchema>

export function ResponderProfile() {
  const { authUser, refreshAuthUser } = useAuth()
  const responder = authUser?.responder
  const profile = authUser?.profile
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const defaultResponderData: Responder = responder || {
    id: 'resp-001',
    profile_id: 'prof-responder-003',
    employee_id: 'EMP-MEDIC-42',
    hospital_id: 'hosp-001',
    license_number: 'PARAMEDIC-9921',
    certification_level: 'Paramedic',
    specialties: ['Advanced Cardiac Life Support', 'Trauma Triage', 'Pediatric Life Support'],
    is_available: true,
    current_latitude: 37.7712,
    current_longitude: -122.3925,
    last_location_update: new Date().toISOString(),
    shift_start: '07:00',
    shift_end: '19:00',
    vehicle_type: 'ambulance',
    vehicle_id: 'AMB-Unit-4',
    full_name: profile?.full_name || 'Marcus Miller',
    distance_km: 1.8,
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResponderProfileForm>({
    resolver: zodResolver(responderProfileSchema),
    defaultValues: {
      full_name: profile?.full_name || defaultResponderData.full_name || 'Marcus Miller',
      phone: profile?.phone || '+1 (555) 345-6789',
      email: authUser?.email || profile?.email || 'responder@demo.com',
      employee_id: defaultResponderData.employee_id,
      license_number: defaultResponderData.license_number || 'PARAMEDIC-9921',
      certification_level: defaultResponderData.certification_level || 'Paramedic',
      vehicle_id: defaultResponderData.vehicle_id || 'AMB-Unit-4',
      vehicle_type: defaultResponderData.vehicle_type || 'ambulance',
      shift_start: defaultResponderData.shift_start || '07:00',
      shift_end: defaultResponderData.shift_end || '19:00',
      specialties: defaultResponderData.specialties ? defaultResponderData.specialties.join(', ') : 'ACLS, PALS, PHTLS',
    },
  })

  const onSubmit = async (data: ResponderProfileForm) => {
    setSaving(true)
    try {
      const specialtiesArray = data.specialties
        ? data.specialties.split(',').map(s => s.trim()).filter(Boolean)
        : defaultResponderData.specialties

      const updatedResponder: Responder = {
        ...defaultResponderData,
        employee_id: data.employee_id,
        license_number: data.license_number,
        certification_level: data.certification_level as any,
        vehicle_id: data.vehicle_id,
        vehicle_type: data.vehicle_type as any,
        shift_start: data.shift_start,
        shift_end: data.shift_end,
        specialties: specialtiesArray,
        full_name: data.full_name,
        updated_at: new Date().toISOString(),
      }

      const updatedProfile: Profile = {
        ...(profile || ({} as Profile)),
        id: profile?.id || 'prof-responder-003',
        user_id: authUser?.id || 'demo-responder-uuid-003',
        role: 'responder',
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || authUser?.email,
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (authUser) {
        authUser.responder = updatedResponder
        authUser.profile = updatedProfile
        localStorage.setItem('emergency_session_user', JSON.stringify(authUser))
      }

      setIsEditing(false)
      toast.success('Profile Updated', 'Responder credentials and vehicle assignment saved successfully.')
      await refreshAuthUser()
    } catch (err: any) {
      toast.error('Error Saving Profile', err.message || 'Could not update responder profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile?.full_name || defaultResponderData.full_name}
            </h1>
            <Badge variant="on_the_way">{defaultResponderData.certification_level}</Badge>
            {defaultResponderData.is_available ? (
              <Badge variant="accepted">Active On-Duty</Badge>
            ) : (
              <Badge variant="default">Off-Duty</Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">First Responder Credentials & Emergency Unit Assignment</p>
        </div>
        <div>
          {isEditing ? (
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Highlights & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-emergency-green">
          <CardBody className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Call Sign</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{defaultResponderData.vehicle_id || 'AMB-Unit-4'}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Type I Advanced Ambulance</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-emergency-blue">
          <CardBody className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Hospital</p>
            <p className="text-base font-bold text-gray-900 mt-1 truncate">City General Hospital</p>
            <p className="text-xs text-gray-500 mt-1">Level 1 Trauma Center</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <CardBody className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Response Time</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">6.2 min</p>
            <p className="text-xs text-gray-500 mt-1">Top 5% Rapid Arrival</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardBody className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Calls Completed</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">142</p>
            <p className="text-xs text-gray-500 mt-1">100% Verified Care</p>
          </CardBody>
        </Card>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardBody className="p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emergency-red" />
                Responder Personal & Professional Details
              </h2>
              {isEditing && (
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium border border-amber-200">
                  Editing Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name</label>
                <Input
                  {...register('full_name')}
                  error={errors.full_name?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Official Employee Badge ID</label>
                <Input
                  {...register('employee_id')}
                  error={errors.employee_id?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Dispatch & Radio Phone</label>
                <Input
                  {...register('phone')}
                  error={errors.phone?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Contact Email</label>
                <Input
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Certification / Rank</label>
                <select
                  className="input"
                  {...register('certification_level')}
                  disabled={!isEditing || saving}
                >
                  <option value="Paramedic">Paramedic (EMT-P)</option>
                  <option value="AEMT">Advanced EMT (AEMT)</option>
                  <option value="EMT">Emergency Medical Technician (EMT)</option>
                  <option value="RN">Critical Care Transport Nurse (RN)</option>
                  <option value="MD">Emergency Physician (MD/DO)</option>
                </select>
              </div>

              <div>
                <label className="label">State Medical License Number</label>
                <Input
                  {...register('license_number')}
                  error={errors.license_number?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Assigned Vehicle Unit</label>
                <Input
                  {...register('vehicle_id')}
                  error={errors.vehicle_id?.message}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Vehicle Class</label>
                <select
                  className="input"
                  {...register('vehicle_type')}
                  disabled={!isEditing || saving}
                >
                  <option value="ambulance">Type I / Type III Ambulance</option>
                  <option value="medic_unit">Rapid Intervention Medic Squad</option>
                  <option value="supervisor">Supervisor Command Unit</option>
                  <option value="other">Other Tactical Medical Unit</option>
                </select>
              </div>

              <div>
                <label className="label">Scheduled Shift Start</label>
                <Input
                  type="time"
                  {...register('shift_start')}
                  disabled={!isEditing || saving}
                />
              </div>

              <div>
                <label className="label">Scheduled Shift End</label>
                <Input
                  type="time"
                  {...register('shift_end')}
                  disabled={!isEditing || saving}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Clinical Endorsements & Specialties</label>
                <Input
                  {...register('specialties')}
                  disabled={!isEditing || saving}
                  placeholder="e.g. Advanced Cardiac Life Support, Pediatric Life Support, Prehospital Trauma"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {(defaultResponderData.specialties || []).map((spec, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Stethoscope className="w-3 h-3 text-emerald-600" />
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
                  Save Responder Profile
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
