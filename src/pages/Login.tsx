import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        navigate('/setup-profile')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/home')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 pb-24">
      <button className="btn-ghost px-3.5 py-2.5 mb-6" onClick={() => navigate('/')}>
        ←
      </button>
      <h2 className="font-display text-2xl font-semibold mb-1">
        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
      </h2>
      <p className="text-white/60 text-[14.5px] mb-6">
        {mode === 'signup' ? "We'll set up your profile next." : 'Sign in to continue your journey.'}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[12.5px] text-white/60 font-semibold mb-1.5 block">Email</label>
          <input
            className="input-field"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-[12.5px] text-white/60 font-semibold mb-1.5 block">Password</label>
          <input
            className="input-field"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-primary text-[13px]">{error}</p>}
        <button className="btn-primary mt-2" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
        </button>
      </form>

      <p className="text-center text-white/50 text-[13px] mt-6">
        {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          className="text-primary font-semibold"
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
        >
          {mode === 'signup' ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  )
}
