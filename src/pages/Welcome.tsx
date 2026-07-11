import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Welcome() {
  const navigate = useNavigate()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="h-full flex flex-col justify-end p-6 pb-10">
      <div className="mt-auto text-center">
        <div className="text-5xl mb-2">💗</div>
        <h1 className="font-display text-[34px] font-semibold leading-[1.08] -tracking-[0.01em]">
          Sync your
          <br />
          souls, daily.
        </h1>
        <p className="text-white/60 text-[14.5px] leading-relaxed mt-3 max-w-[280px] mx-auto">
          A private game for long-distance couples. Answer together. Reveal together. Grow closer,
          one card at a time.
        </p>
      </div>
      <div className="flex flex-col gap-3 mt-10">
        <button className="btn-primary" onClick={signInWithGoogle}>
          Continue with Google
        </button>
        <button className="btn-ghost" onClick={() => navigate('/login')}>
          Continue with Email
        </button>
        <p className="text-white/40 text-center text-[12px] mt-0.5">
          By continuing you agree to keep your partner's answers private &amp; sacred 💫
        </p>
      </div>
    </div>
  )
}
