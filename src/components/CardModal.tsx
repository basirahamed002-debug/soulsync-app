import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAnswerSubscription } from '@/hooks/useCoupleRealtime'
import type { Answer, Card } from '@/types'

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  love: { label: '❤️ Love', color: '#FF4D8D' },
  deep: { label: '🌙 Deep Talks', color: '#5AA9E6' },
  fantasy: { label: '🪐 Fantasy', color: '#8B5CF6' },
  funny: { label: '😂 Funny', color: '#FFC15E' },
  gold: { label: '✨ Special', color: '#F5C94B' }
}

export default function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const { user, couple, refreshCouple } = useAuth()
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [text, setText] = useState('')
  const [mySubmitted, setMySubmitted] = useState(false)
  const [partnerSubmitted, setPartnerSubmitted] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [saving, setSaving] = useState(false)

  const meta = CATEGORY_META[card.category]

  // Check on open whether either side has already answered.
  useEffect(() => {
    async function check() {
      if (!couple) return
      const { data } = await supabase
        .from('answers')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('card_id', card.id)
      const rows = (data as Answer[]) ?? []
      setAnswers(rows)
      if (user) setMySubmitted(rows.some((a) => a.user_id === user.id))
      setPartnerSubmitted(rows.some((a) => a.user_id !== user?.id))
    }
    check()
  }, [couple, card.id, user])

  useAnswerSubscription(couple?.id, card.id, (userId) => {
    if (userId !== user?.id) setPartnerSubmitted(true)
  })

  // Once both sides have submitted, fetch both answers and reveal.
  useEffect(() => {
    async function tryReveal() {
      if (!(mySubmitted && partnerSubmitted) || !couple) return
      const { data } = await supabase
        .from('answers')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('card_id', card.id)
      setAnswers((data as Answer[]) ?? [])
      setRevealed(true)
      await supabase.rpc('award_card_completion', { p_couple_id: couple.id, p_card_id: card.id })
      await refreshCouple()
    }
    tryReveal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySubmitted, partnerSubmitted])

  async function submit() {
    if (!user || !couple || !text.trim()) return
    setSaving(true)
    const { error } = await supabase.from('answers').insert({
      couple_id: couple.id,
      card_id: card.id,
      user_id: user.id,
      answer_type: mode,
      content: text.trim()
    })
    setSaving(false)
    if (!error) setMySubmitted(true)
  }

  return (
    <div className="absolute inset-0 z-[80] flex items-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-h-[88vh] bg-bg2 border border-white/10 border-b-0 rounded-t-[28px] p-6 pb-9 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full bg-white/20 mx-auto mb-5" />

        {!revealed ? (
          <>
            <div
              className="inline-block text-[11px] font-extrabold tracking-wide px-3.5 py-1.5 rounded-full mb-4"
              style={{ background: `${meta.color}22`, color: meta.color }}
            >
              {meta.label} · Card {String(card.id).padStart(3, '0')}
            </div>
            <h2 className="font-display text-[21px] leading-[1.3] mb-5">{card.question}</h2>

            {!mySubmitted ? (
              <>
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
                  <button
                    className={`flex-1 text-center py-2.5 rounded-xl text-[13px] font-bold transition ${
                      mode === 'text' ? 'bg-gradient-to-br from-primary to-accent text-white' : 'text-white/60'
                    }`}
                    onClick={() => setMode('text')}
                  >
                    ✍️ Text
                  </button>
                  <button
                    className={`flex-1 text-center py-2.5 rounded-xl text-[13px] font-bold transition ${
                      mode === 'voice' ? 'bg-gradient-to-br from-primary to-accent text-white' : 'text-white/60'
                    }`}
                    onClick={() => setMode('voice')}
                  >
                    🎙️ Voice
                  </button>
                </div>

                {mode === 'text' ? (
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Type your honest answer…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                ) : (
                  <div className="glass p-6 text-center">
                    <div className="text-3xl mb-2">🎙️</div>
                    <p className="text-white/60 text-[13px] mb-3">
                      Voice recording needs the MediaRecorder API + Supabase Storage upload — wire this up
                      once storage is configured (see README).
                    </p>
                  </div>
                )}

                <button className="btn-primary w-full mt-4" onClick={submit} disabled={saving || !text.trim()}>
                  {saving ? 'Submitting…' : 'Submit my answer'}
                </button>
              </>
            ) : (
              <div className="glass p-5 text-center text-white/60 text-[13.5px]">
                Your answer is locked in. Waiting on your partner to reveal both 💌
              </div>
            )}

            <div className="flex flex-col gap-2.5 mt-5">
              <StatusRow label="You" done={mySubmitted} />
              <StatusRow label="Your partner" done={partnerSubmitted} />
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="text-4xl">🎉</div>
              <h2 className="font-display text-xl mt-1.5">Both answers unlocked!</h2>
            </div>
            <div className="flex flex-col gap-3 mb-5">
              {answers.map((a) => (
                <div key={a.id} className="glass p-4">
                  <div className="font-bold text-[13px] mb-1.5">
                    {a.user_id === user?.id ? 'You' : 'Your partner'}
                  </div>
                  <p className="text-white/60 text-[13.5px]">{a.content}</p>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={onClose}>
              Back to board
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function StatusRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white/[0.04] border border-white/10">
      <span className={`w-2 h-2 rounded-full ${done ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-white/30'}`} />
      <span className="text-[13px] font-semibold">
        {label} — {done ? 'answered ✓' : 'not answered yet'}
      </span>
    </div>
  )
}
