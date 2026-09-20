import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, User, Building2, Truck, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const demoAccounts = [
  {
    role: 'patient',
    name: 'Patient',
    email: 'patient@demo.com',
    icon: User,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    iconColor: 'text-emerald-600',
    desc: 'Alex Johnson (SOS & Health)',
  },
  {
    role: 'hospital',
    name: 'Hospital',
    email: 'hospital@demo.com',
    icon: Building2,
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600',
    desc: 'City General ER (Queue & Intake)',
  },
  {
    role: 'responder',
    name: 'Responder',
    email: 'responder@demo.com',
    icon: Truck,
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    iconColor: 'text-amber-600',
    desc: 'Paramedic Marcus (Unit 4)',
  },
  {
    role: 'admin',
    name: 'Admin',
    email: 'admin@demo.com',
    icon: ShieldCheck,
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    iconColor: 'text-purple-600',
    desc: 'System Administrator',
  },
]

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const registered = searchParams.get('registered') === 'true'

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)

    const { error } = await signIn(data.email, data.password)

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  const handleQuickDemoLogin = async (email: string, role: string) => {
    setActiveDemoRole(role)
    setLoading(true)
    setError(null)
    setValue('email', email)
    setValue('password', 'password123')

    const { error } = await signIn(email, 'password123')

    if (error) {
      setError(error.message)
      setLoading(false)
      setActiveDemoRole(null)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emergency-red mx-auto mb-4 shadow-lg shadow-emergency-red/30">
            <Activity className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="mt-1.5 text-gray-600">Sign in to Emergency Health Alert & Response</p>
        </div>

        {/* 1-Click Demo Login Panel */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emergency-red" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">Quick 1-Click Demo Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {demoAccounts.map((account) => {
              const Icon = account.icon
              const isLoggingInThis = loading && activeDemoRole === account.role

              return (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => handleQuickDemoLogin(account.email, account.role)}
                  disabled={loading}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${account.color} ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs">{account.name}</span>
                    <Icon className={`w-4 h-4 ${account.iconColor}`} />
                  </div>
                  <span className="text-[11px] opacity-80 line-clamp-1">{isLoggingInThis ? 'Signing in...' : account.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card shadow-lg border-gray-100">
          <div className="card-body">
            {registered && (
              <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800" role="alert">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
                <p className="text-sm">Account created successfully! You can now sign in.</p>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-emergency-red-light border border-emergency-red/30 rounded-xl flex items-center gap-3 text-emergency-red-dark" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
                disabled={loading}
                autoComplete="email"
              >
                <Mail className="w-5 h-5 text-gray-400" aria-hidden="true" />
              </Input>

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  disabled={loading}
                  autoComplete="current-password"
                >
                  <Lock className="w-5 h-5 text-gray-400" aria-hidden="true" />
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-emergency-blue focus:ring-emergency-blue" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-emergency-blue hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full mt-2" size="lg" loading={loading && !activeDemoRole}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center border-t border-gray-100 pt-5">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-emergency-blue font-semibold hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}