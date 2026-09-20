import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Mail, Lock, User, Shield, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { cn } from '../../utils/helpers'
import type { UserRole } from '../../types'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['patient', 'hospital', 'responder', 'admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

const roleOptions = [
  { value: 'patient', label: 'Patient - Request emergency assistance' },
  { value: 'hospital', label: 'Hospital - Manage emergency intake and responders' },
  { value: 'responder', label: 'Responder - Respond to assigned emergencies' },
  { value: 'admin', label: 'Admin - System administration and oversight' },
]

const roleIcons: Record<UserRole, React.ReactNode> = {
  patient: <User className="w-5 h-5" />,
  hospital: <Shield className="w-5 h-5" />,
  responder: <UserPlus className="w-5 h-5" />,
  admin: <Shield className="w-5 h-5" />,
}

export function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'patient',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)

    const { error } = await signUp(data.email, data.password, data.role as UserRole, data.fullName)

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emergency-red mx-auto mb-6">
            <Activity className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="mt-2 text-gray-600">Join the Emergency Health Alert System</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && (
              <div className="mb-6 p-4 bg-emergency-red-light border border-emergency-red rounded-lg flex items-center gap-3 text-emergency-red-dark" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                {...register('fullName')}
                error={errors.fullName?.message}
                disabled={loading}
                autoComplete="name"
              >
                <User className="w-5 h-5 text-gray-400" />
              </Input>

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={loading}
                autoComplete="email"
              >
                <Mail className="w-5 h-5 text-gray-400" />
              </Input>

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  disabled={loading}
                  autoComplete="new-password"
                >
                  <Lock className="w-5 h-5 text-gray-400" />
                </Input>
                <button
                  type="button"
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  disabled={loading}
                  autoComplete="new-password"
                >
                  <Lock className="w-5 h-5 text-gray-400" />
                </Input>
              </div>

              <div>
                <label className="label">Register As</label>
                <Select
                  options={roleOptions}
                  placeholder="Select your role"
                  {...register('role')}
                  error={errors.role?.message}
                  disabled={loading}
                >
                  {roleIcons[selectedRole as UserRole] || <User className="w-5 h-5 text-gray-400" />}
                </Select>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-medium text-gray-900 mb-2">Role Permissions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedRole === 'patient' && (
                    <>
                      <li>• Create SOS emergency alerts</li>
                      <li>• Manage medical profile & contacts</li>
                      <li>• Track emergency status in real-time</li>
                    </>
                  )}
                  {selectedRole === 'hospital' && (
                    <>
                      <li>• View & accept nearby emergencies</li>
                      <li>• Assign responders to emergencies</li>
                      <li>• Manage hospital capacity & staff</li>
                    </>
                  )}
                  {selectedRole === 'responder' && (
                    <>
                      <li>• Receive assigned emergency alerts</li>
                      <li>• Navigate to patient location</li>
                      <li>• Update response status in real-time</li>
                    </>
                  )}
                  {selectedRole === 'admin' && (
                    <>
                      <li>• Full system access & user management</li>
                      <li>• View analytics & audit logs</li>
                      <li>• Configure system settings</li>
                    </>
                  )}
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-emergency-blue font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}