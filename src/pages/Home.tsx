import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types'

function daysSince(dateStr: string | null) {
  if (!dateStr) return null
  const start = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const years = Math.floor(diff / 365)
  const months = Math.floor((diff % 365) / 30)
  const days = (diff % 365) % 30
  return { years, months, days }
}

const STAGE_LABELS: Record<string, string> = {
  stranger: '🌱 Stranger',
  friends: '😊 Friends',
  close_hearts: '💕 Close Hearts',
  soulmates: '❤️ Soulmates',
  forever: '💍 Forever',
  eternal_love: '∞ Eternal Love'
}

export default function Home() {
  const { user, profile, couple } = useAuth()
  const [partner, setPartner] = useState<Profile | null>(null)

  useEffect(() => {
    async function loadPartner() {
      if (!couple || !user) return
      const partnerId = couple.player_a === user.id ? couple.player_b : couple.player_a
      if (!partnerId) return
      const { data } = await supabase.from('profiles').select('*').eq('id', partnerId).maybeSingle()
      setPartner(data as Profile | null)
    }
    loadPartner()
  }, [couple, user])

  const together = daysSince(profile?.anniversary_date ?? null)

  return (
    <div className="h-full overflow-y-auto p-6 pb-28">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-lg border-2 border-white/15">
            {profile?.nickname?.[0]?.toUpperCase() ?? '💗'}
          </div>
          <div>
            <div className="font-bold text-[15px]">Hey {profile?.nickname ?? 'there'} 👋</div>
            <div className="text-white/60 text-[12.5px]">Day {couple?.current_streak ?? 0} streak 🔥</div>
          </div>
        </div>
        <div className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/10 flex items-center gap-1">
          🪙 {couple?.coins ?? 0}
        </div>
      </div>

      <div className="glass p-5 mb-4">
        <div className="flex justify-between items-center mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center font-bold text-base">
              {partner?.nickname?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="font-bold text-[14.5px]">{partner?.nickname ?? 'Waiting to pair'}</div>
              <div className="text-white/60 text-[11.5px]">{partner?.country ?? '—'}</div>
            </div>
          </div>
        </div>
        <div className="text-[11px] tracking-widest uppercase text-white/50 font-semibold">Together for</div>
        <div className="font-display text-[22px] my-1 mb-3">
          {together ? `${together.years}y ${together.months}m ${together.days}d` : 'Set your anniversary date'}
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: '63%' }} />
        </div>
        <div className="text-white/50 text-[11.5px] mt-2">
          {STAGE_LABELS[couple?.love_stage ?? 'stranger']}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <Stat icon="⭐" value={`Lvl ${Math.floor((couple?.xp ?? 0) / 250) + 1}`} label={`${couple?.xp ?? 0} XP`} />
        <Stat icon="🃏" value="—/300" label="Cards opened" />
        <Stat icon="🔥" value={`${couple?.current_streak ?? 0}`} label="Day streak" />
      </div>

      <Link to="/board" className="btn-primary block text-center mb-6">
        Open today's cards →
      </Link>

      {!couple && (
        <div className="glass p-4 text-center">
          <p className="text-white/60 text-[13.5px]">
            You're not paired yet. <Link to="/pairing" className="text-primary font-semibold">Pair with your partner</Link> to unlock the board.
          </p>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="glass flex-1 p-4 text-center">
      <div className="text-xl">{icon}</div>
      <div className="font-extrabold text-[16px] mt-0.5">{value}</div>
      <div className="text-white/50 text-[11px]">{label}</div>
    </div>
  )
}
