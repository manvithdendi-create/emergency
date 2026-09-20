import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Calendar, Droplet, AlertTriangle, Pill, Stethoscope, FileText, Save, Loader2, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Card, CardBody } from '../../components/ui/Card'
import { toast } from '../../hooks/useToast'
import { cn } from '../../utils/helpers'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  medications: z.string().optional(),
  emergency_notes: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => ({ value: t, label: t }))

export function PatientProfile() {
  const { authUser, refreshAuthUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: authUser?.profile?.full_name || '',
      phone: authUser?.profile?.phone || '',
      date_of_birth: authUser?.profile?.date_of_birth || '',
      blood_type: authUser?.profile?.blood_type || '',
      allergies: authUser?.profile?.allergies?.join(', ') || '',
      medical_conditions: authUser?.profile?.medical_conditions?.join(', ') || '',
      medications: authUser?.profile?.medications?.join(', ') || '',
      emergency_notes: authUser?.profile?.emergency_notes || '',
      address: authUser?.profile?.address || '',
      city: authUser?.profile?.city || '',
      state: authUser?.profile?.state || '',
      zip_code: authUser?.profile?.zip_code || '',
      country: authUser?.profile?.country || 'US',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true)
    try {
      if (authUser?.profile?.id) {
        await supabase
          .from('profiles')
          .update({
            full_name: data.full_name,
            phone: data.phone,
            date_of_birth: data.date_of_birth || null,
            blood_type: data.blood_type || null,
            allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()) : [],
            medical_conditions: data.medical_conditions ? data.medical_conditions.split(',').map(s => s.trim()) : [],
            medications: data.medications ? data.medications.split(',').map(s => s.trim()) : [],
            emergency_notes: data.emergency_notes || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            zip_code: data.zip_code || null,
            country: data.country || 'US',
          })
          .eq('id', authUser.profile.id)
      }

      if (authUser) {
        const updatedProfile = {
          ...(authUser.profile || {}),
          full_name: data.full_name,
          phone: data.phone,
          date_of_birth: data.date_of_birth || null,
          blood_type: data.blood_type || null,
          allergies: data.allergies ? data.allergies.split(',').map(s => s.trim()) : [],
          medical_conditions: data.medical_conditions ? data.medical_conditions.split(',').map(s => s.trim()) : [],
          medications: data.medications ? data.medications.split(',').map(s => s.trim()) : [],
          emergency_notes: data.emergency_notes || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          country: data.country || 'US',
          updated_at: new Date().toISOString(),
        }
        authUser.profile = updatedProfile as any
        localStorage.setItem('emergency_session_user', JSON.stringify(authUser))
      }

      toast.success('Profile updated successfully')
      await refreshAuthUser()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Profile</h1>
        <p className="text-gray-600">Manage your personal and medical information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emergency-blue" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                {...register('full_name')}
                error={errors.full_name?.message}
                required
              >
                <User className="w-5 h-5 text-gray-400" />
              </Input>
              <Input
                label="Phone Number"
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="(555) 123-4567"
              >
                <span className="text-gray-400">📞</span>
              </Input>
              <Input
                label="Date of Birth"
                type="date"
                {...register('date_of_birth')}
                error={errors.date_of_birth?.message}
              >
                <Calendar className="w-5 h-5 text-gray-400" />
              </Input>
              <Select
                label="Blood Type"
                options={bloodTypes}
                placeholder="Select blood type"
                {...register('blood_type')}
                error={errors.blood_type?.message}
              >
                <Droplet className="w-5 h-5 text-gray-400" />
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emergency-blue" />
              Medical Information
            </h2>
            <div className="space-y-4">
              <Textarea
                label="Allergies (comma separated)"
                {...register('allergies')}
                placeholder="Penicillin, Peanuts, Latex..."
                rows={3}
              >
                <AlertTriangle className="w-5 h-5 text-gray-400" />
              </Textarea>
              <Textarea
                label="Medical Conditions (comma separated)"
                {...register('medical_conditions')}
                placeholder="Diabetes, Hypertension, Asthma..."
                rows={3}
              >
                <Stethoscope className="w-5 h-5 text-gray-400" />
              </Textarea>
              <Textarea
                label="Current Medications (comma separated)"
                {...register('medications')}
                placeholder="Metformin 500mg, Lisinopril 10mg..."
                rows={3}
              >
                <Pill className="w-5 h-5 text-gray-400" />
              </Textarea>
              <Textarea
                label="Emergency Notes"
                {...register('emergency_notes')}
                placeholder="Any additional information for emergency responders..."
                rows={3}
              >
                <FileText className="w-5 h-5 text-gray-400" />
              </Textarea>
            </div>
          </CardBody>
        </Card>

        {/* Address */}
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emergency-blue" />
              Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Street Address"
                {...register('address')}
                error={errors.address?.message}
              >
                <MapPin className="w-5 h-5 text-gray-400" />
              </Input>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="City"
                  {...register('city')}
                  error={errors.city?.message}
                />
                <Input
                  label="State"
                  {...register('state')}
                  error={errors.state?.message}
                />
                <Input
                  label="ZIP Code"
                  {...register('zip_code')}
                  error={errors.zip_code?.message}
                />
              </div>
              <Select
                label="Country"
                options={[{ value: 'US', label: 'United States' }]}
                {...register('country')}
                error={errors.country?.message}
              >
                <MapPin className="w-5 h-5 text-gray-400" />
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving} disabled={!isDirty || saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
