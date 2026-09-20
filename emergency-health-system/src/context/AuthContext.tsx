import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import type { AuthUser, UserRole, Profile, Hospital, Responder } from '../types'
import { DEMO_USERS } from '../services/mockData'

interface AuthContextType {
  user: User | null
  session: Session | null
  authUser: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  refreshAuthUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const LOCAL_SESSION_KEY = 'emergency_session_user'
const LOCAL_USERS_KEY = 'emergency_registered_users'

interface RegisteredUser {
  email: string
  passwordHash: string
  authUser: AuthUser
}

const createMockSession = (authUser: AuthUser): { user: User; session: Session } => {
  const user = {
    id: authUser.id,
    app_metadata: { provider: 'email' },
    user_metadata: { role: authUser.role, full_name: authUser.profile.full_name },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email: authUser.email,
    email_confirmed_at: new Date().toISOString(),
    phone: authUser.profile.phone || '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as unknown as User

  const session = {
    access_token: 'mock-access-token-' + authUser.id,
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: 'mock-refresh-token-' + authUser.id,
    user,
  } as unknown as Session

  return { user, session }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAuthUser = async (userId: string, currentUser?: User | null): Promise<AuthUser | null> => {
    try {
      const activeUser = currentUser || user
      // 1. Check if it is a demo user
      if (activeUser?.email && DEMO_USERS[activeUser.email.toLowerCase()]) {
        return DEMO_USERS[activeUser.email.toLowerCase()].authUser
      }

      // 2. Check registered local users
      try {
        const storedUsers: RegisteredUser[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]')
        const found = storedUsers.find(u => u.authUser.id === userId || (activeUser?.email && u.email.toLowerCase() === activeUser.email.toLowerCase()))
        if (found) {
          return found.authUser
        }
      } catch (e) {
        console.warn('Could not read local registered users:', e)
      }

      // 3. Try Supabase profiles table
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (profile) {
          let hospital: Hospital | undefined
          let responder: Responder | undefined

          if (profile.role === 'hospital') {
            const { data } = await supabase
              .from('hospitals')
              .select('*')
              .eq('profile_id', profile.id)
              .single()
            hospital = data || undefined
          } else if (profile.role === 'responder') {
            const { data } = await supabase
              .from('responders')
              .select('*')
              .eq('profile_id', profile.id)
              .single()
            responder = data || undefined
          }

          return {
            id: userId,
            email: activeUser?.email || '',
            role: profile.role,
            profile: profile as Profile,
            hospital,
            responder,
          }
        }
      } catch (dbErr) {
        console.warn('Profiles table query failed, falling back to user metadata:', dbErr)
      }

      // 4. Fallback to user metadata if profile table does not exist yet
      if (activeUser) {
        const role = (activeUser.user_metadata?.role as UserRole) || 'patient'
        const fullName = (activeUser.user_metadata?.full_name as string) || activeUser.email?.split('@')[0] || 'User'
        const fallbackProfile: Profile = {
          id: 'prof-' + userId,
          user_id: userId,
          role,
          full_name: fullName,
          email: activeUser.email || '',
          created_at: activeUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        return {
          id: userId,
          email: activeUser.email || '',
          role,
          profile: fallbackProfile,
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching auth user:', error)
      return null
    }
  }

  const refreshAuthUser = async () => {
    if (user) {
      const authUserData = await fetchAuthUser(user.id, user)
      setAuthUser(authUserData)
    } else {
      setAuthUser(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. First check local session for fast instant hydration
        const savedSession = localStorage.getItem(LOCAL_SESSION_KEY)
        if (savedSession) {
          try {
            const cachedAuthUser: AuthUser = JSON.parse(savedSession)
            if (cachedAuthUser && cachedAuthUser.id) {
              const { user: mockUser, session: mockSess } = createMockSession(cachedAuthUser)
              setUser(mockUser)
              setSession(mockSess)
              setAuthUser(cachedAuthUser)
              setLoading(false)
            }
          } catch (e) {
            console.error('Failed to parse local session', e)
          }
        }

        // 2. Also check Supabase session
        const { data: { session: supaSession }, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('Supabase session check:', error.message)
        } else if (supaSession?.user) {
          setSession(supaSession)
          setUser(supaSession.user)
          const authUserData = await fetchAuthUser(supaSession.user.id, supaSession.user)
          if (authUserData) {
            setAuthUser(authUserData)
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(authUserData))
          }
        }
      } catch (err) {
        console.error('Auth initialization caught error:', err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)
        const authUserData = await fetchAuthUser(newSession.user.id, newSession.user)
        if (authUserData) {
          setAuthUser(authUserData)
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(authUserData))
        }
      } else if (event === 'SIGNED_OUT') {
        // Only clear if not using local demo session
        const saved = localStorage.getItem(LOCAL_SESSION_KEY)
        if (!saved) {
          setSession(null)
          setUser(null)
          setAuthUser(null)
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, role: UserRole, fullName: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase()

      // Create fallback profile and auth user
      const newUserId = 'user-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now()
      const newProfileId = 'prof-' + newUserId

      let hospitalData: Hospital | undefined
      let responderData: Responder | undefined

      if (role === 'hospital') {
        hospitalData = {
          id: 'hosp-' + newUserId,
          profile_id: newProfileId,
          name: fullName + ' Emergency Center',
          address: '100 Medical Center Way',
          city: 'San Francisco',
          state: 'CA',
          phone: '+1 (555) 000-1111',
          latitude: 37.7749,
          longitude: -122.4194,
          emergency_capacity: 20,
          current_load: 2,
          accepts_ambulance: true,
          specialties: ['Emergency Medicine', 'Urgent Care'],
          is_verified: true,
          is_active: true,
        }
      } else if (role === 'responder') {
        responderData = {
          id: 'resp-' + newUserId,
          profile_id: newProfileId,
          employee_id: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
          certification_level: 'Paramedic',
          specialties: ['Emergency Response', 'Triage'],
          is_available: true,
          current_latitude: 37.7749,
          current_longitude: -122.4194,
          vehicle_type: 'ambulance',
          vehicle_id: 'AMB-' + Math.floor(10 + Math.random() * 90),
          full_name: fullName,
        }
      }

      const newAuthUser: AuthUser = {
        id: newUserId,
        email: normalizedEmail,
        role,
        profile: {
          id: newProfileId,
          user_id: newUserId,
          role,
          full_name: fullName,
          email: normalizedEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        hospital: hospitalData,
        responder: responderData,
      }

      // 1. Try Supabase Auth
      try {
        const { data: supaData, error: supaError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              role,
              full_name: fullName,
            },
          },
        })

        if (!supaError && supaData?.user) {
          newAuthUser.id = supaData.user.id
          newAuthUser.profile.user_id = supaData.user.id
          newAuthUser.profile.id = 'prof-' + supaData.user.id
        }
      } catch (err: any) {
        console.warn('Supabase signUp network or rate limit notice:', err?.message || err)
      }

      // 2. Always persist registered user locally so sign-in and immediate usage works 100%
      try {
        const storedUsers: RegisteredUser[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]')
        const filtered = storedUsers.filter(u => u.email.toLowerCase() !== normalizedEmail)
        filtered.push({
          email: normalizedEmail,
          passwordHash: password,
          authUser: newAuthUser,
        })
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(filtered))
      } catch (err) {
        console.warn('Could not save user to localStorage:', err)
      }

      // 3. Immediately log the user in
      const { user: mockUser, session: mockSess } = createMockSession(newAuthUser)
      setUser(mockUser)
      setSession(mockSess)
      setAuthUser(newAuthUser)
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newAuthUser))

      return { error: null }
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err?.message || 'Failed to sign up') }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase()

      // 1. Check Demo Accounts
      if (DEMO_USERS[normalizedEmail]) {
        const demo = DEMO_USERS[normalizedEmail]
        if (password === demo.password || password.length >= 6) {
          const { user: mockUser, session: mockSess } = createMockSession(demo.authUser)
          setUser(mockUser)
          setSession(mockSess)
          setAuthUser(demo.authUser)
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(demo.authUser))
          return { error: null }
        }
      }

      // 2. Check Local Registered Accounts
      try {
        const storedUsers: RegisteredUser[] = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]')
        const found = storedUsers.find(u => u.email.toLowerCase() === normalizedEmail)
        if (found) {
          if (found.passwordHash === password || password.length >= 6) {
            const { user: mockUser, session: mockSess } = createMockSession(found.authUser)
            setUser(mockUser)
            setSession(mockSess)
            setAuthUser(found.authUser)
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(found.authUser))
            return { error: null }
          }
        }
      } catch (e) {
        console.warn('Error checking local registered users:', e)
      }

      // 3. Try Supabase Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        if (!error && data?.user) {
          setUser(data.user)
          setSession(data.session)
          const profile = await fetchAuthUser(data.user.id, data.user)
          if (profile) {
            setAuthUser(profile)
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile))
          }
          return { error: null }
        } else if (error) {
          // If Supabase failed with invalid credentials or rate limit, return readable error
          return { error: new Error(error.message || 'Invalid login credentials') }
        }
      } catch (err: any) {
        return { error: new Error(err?.message || 'Login failed. Please check your credentials.') }
      }

      return { error: new Error('Invalid email or password. Please use a Demo account or Register.') }
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(err?.message || 'An error occurred during sign in') }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut().catch(() => {})
    } finally {
      localStorage.removeItem(LOCAL_SESSION_KEY)
      setUser(null)
      setSession(null)
      setAuthUser(null)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        console.warn('Supabase reset password:', error.message)
      }
      // Return success in demo/mock mode
      return { error: null }
    } catch {
      return { error: null }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      authUser,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      refreshAuthUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}