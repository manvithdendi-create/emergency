import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Mail, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { cn } from '../../utils/helpers'

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true)
    setError(null)

    const { error } = await resetPassword(data.email)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emergency-green-light flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emergency-green" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to your email address.
            Please check your inbox and follow the instructions.
          </p>
          <Link to="/login" className="text-emergency-blue font-medium hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emergency-red mx-auto mb-6">
            <Activity className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="mt-2 text-gray-600">Enter your email and we'll send you a reset link</p>
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

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-emergency-blue hover:underline">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}