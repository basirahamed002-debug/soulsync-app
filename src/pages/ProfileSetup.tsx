import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')
  const [country, setCountry] = useState('')
  const [anniversary, setAnniversary] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      nickname,
      age: age ? Number(age) : null,
      country,
      anniversary_date: anniversary || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    await refreshProfile()
    navigate('/pairing')
  }

  return (
    <div className="h-full overflow-y-auto p-6 pb-24">
      <h2 className="font-display text-2xl font-semibold mb-1">Let's build your profile</h2>
      <p className="text-white/60 text-[14.5px] mb-6">This is how your partner will see you.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[12.5px] text-white/60 font-semibold mb-1.5 block">Nickname</label>
          <input
            className="input-field"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Mira"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[12.5px] text-white/60 font-semibold mb-1.5 block">Age</label>
            <input
              className="input-field"
              type="number"
              min={13}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="24"
            />
          </div>
          <div className="flex-1">
            <label className="text-[12.5px] text-white/60 font-semibold mb-1.5 block">Country</label>
            <input
              className="input-field"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="India"
            />
          </div>
        </div>
        <div>
          <label className="text-[12.5px] text-white/60 font-semibold mb-1.5 block">
            Relationship anniversary
          </label>
          <input
            className="input-field"
            type="date"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
          />
        </div>
        {error && <p className="text-primary text-[13px]">{error}</p>}
        <button className="btn-primary mt-4" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Create my profile →'}
        </button>
      </form>
    </div>
  )
}
