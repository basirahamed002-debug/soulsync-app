import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `SOUL-${code}`
}

export default function Pairing() {
  const navigate = useNavigate()
  const { user, refreshCouple } = useAuth()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function ensureRoom() {
      if (!user) return
      // Check for an existing pending room owned by this user first.
      const { data: existing } = await supabase
        .from('couples')
        .select('*')
        .eq('player_a', user.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (existing) {
        setInviteCode(existing.invite_code)
        return
      }

      const code = generateCode()
      const { data, error } = await supabase
        .from('couples')
        .insert({ player_a: user.id, invite_code: code, status: 'pending' })
        .select()
        .single()

      if (!error && data) setInviteCode(data.invite_code)
    }
    if (mode === 'create') ensureRoom()
  }, [mode, user])

  // Listen for the partner joining our room in real time, so we don't have to poll.
  useEffect(() => {
    if (!inviteCode || !user) return
    const channel = supabase
      .channel(`pairing:${inviteCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couples', filter: `player_a=eq.${user.id}` },
        async (payload) => {
          if (payload.new.status === 'paired') {
            await refreshCouple()
            navigate('/home')
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode, user])

  async function joinRoom() {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data: room, error: findErr } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (findErr || !room) {
      setError('Invite code not found or already used.')
      setLoading(false)
      return
    }
    if (room.player_a === user.id) {
      setError("You can't join your own room.")
      setLoading(false)
      return
    }

    const { error: updateErr } = await supabase
      .from('couples')
      .update({ player_b: user.id, status: 'paired', paired_at: new Date().toISOString() })
      .eq('id', room.id)

    setLoading(false)
    if (updateErr) {
      setError(updateErr.message)
      return
    }
    await refreshCouple()
    navigate('/home')
  }

  return (
    <div className="h-full overflow-y-auto p-6 pt-14 text-center">
      <div className="text-4xl mb-2">🔗</div>
      <h2 className="font-display text-2xl font-semibold">Pair with your partner</h2>

      <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 my-6 mx-auto max-w-[260px]">
        <button
          className={`flex-1 text-[13px] font-bold py-2.5 rounded-xl transition ${
            mode === 'create' ? 'bg-gradient-to-br from-primary to-accent' : 'text-white/60'
          }`}
          onClick={() => setMode('create')}
        >
          Create room
        </button>
        <button
          className={`flex-1 text-[13px] font-bold py-2.5 rounded-xl transition ${
            mode === 'join' ? 'bg-gradient-to-br from-primary to-accent' : 'text-white/60'
          }`}
          onClick={() => setMode('join')}
        >
          Join room
        </button>
      </div>

      {mode === 'create' ? (
        <>
          <p className="text-white/60 text-[14.5px] mb-6">
            Share this code — it links your accounts permanently, until you choose to disconnect.
          </p>
          <div className="glass p-6 mb-6">
            <div className="text-[11px] tracking-widest uppercase text-white/50 font-semibold">
              Your invite code
            </div>
            <div className="font-display text-[32px] tracking-[0.1em] mt-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
              {inviteCode ?? '…'}
            </div>
          </div>
          <p className="text-white/40 text-[12.5px]">Waiting for your partner to enter this code…</p>
        </>
      ) : (
        <>
          <p className="text-white/60 text-[14.5px] mb-6">Enter the code your partner shared with you.</p>
          <input
            className="input-field text-center tracking-widest font-bold mb-4"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="SOUL-XXXX"
          />
          {error && <p className="text-primary text-[13px] mb-3">{error}</p>}
          <button className="btn-primary w-full" onClick={joinRoom} disabled={loading || !joinCode}>
            {loading ? 'Pairing…' : 'Pair now →'}
          </button>
        </>
      )}
    </div>
  )
}
