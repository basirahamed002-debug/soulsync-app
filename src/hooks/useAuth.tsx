import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Couple } from '@/types'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  couple: Couple | null
  partner: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  refreshCouple: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // One combined request instead of separate profile / couple / partner calls.
  async function loadBootstrap() {
    const { data, error } = await supabase.rpc('get_app_bootstrap')
    if (error) {
      // eslint-disable-next-line no-console
      console.error('bootstrap load failed', error)
      return
    }
    setProfile((data?.profile as Profile | null) ?? null)
    setCouple((data?.couple as Couple | null) ?? null)
    setPartner((data?.partner as Profile | null) ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        await loadBootstrap()
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await loadBootstrap()
      } else {
        setProfile(null)
        setCouple(null)
        setPartner(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function refreshProfile() {
    if (user) await loadBootstrap()
  }
  async function refreshCouple() {
    if (user) await loadBootstrap()
  }
  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, couple, partner, loading, refreshProfile, refreshCouple, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
