import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import CardModal from '@/components/CardModal'
import ChatOverlay from '@/components/ChatOverlay'
import type { Card, CoupleProgress } from '@/types'

const CATEGORY_CLASSES: Record<string, string> = {
  love: 'bg-gradient-to-br from-primary to-[#c22a63] text-white',
  deep: 'bg-gradient-to-br from-catblue to-[#2c6fa8] text-white',
  fantasy: 'bg-gradient-to-br from-secondary to-[#5b34a8] text-white',
  funny: 'bg-gradient-to-br from-catfunny to-[#c98f2c] text-[#231a06]',
  gold: 'bg-gradient-to-br from-gold to-[#a8792a] text-[#231a06] shadow-[0_0_18px_-2px_rgba(245,201,75,0.7)]'
}

export default function Board() {
  const { couple } = useAuth()
  const [cards, setCards] = useState<Card[]>([])
  const [progress, setProgress] = useState<Record<number, CoupleProgress>>({})
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!couple) return
      const [{ data: cardData }, { data: progressData }] = await Promise.all([
        supabase.from('cards').select('*').order('order_index'),
        supabase.from('couple_progress').select('*').eq('couple_id', couple.id)
      ])
      setCards((cardData as Card[]) ?? [])
      const map: Record<number, CoupleProgress> = {}
      ;((progressData as CoupleProgress[]) ?? []).forEach((p) => (map[p.card_id] = p))
      setProgress(map)
      setLoading(false)
    }
    load()
  }, [couple])

  async function handleOpen(card: Card) {
    if (!couple) return
    setActiveCard(card)
    const existing = progress[card.id]
    if (!existing) {
      await supabase.from('couple_progress').upsert({
        couple_id: couple.id,
        card_id: card.id,
        status: 'opened',
        opened_at: new Date().toISOString()
      })
      setProgress((p) => ({ ...p, [card.id]: { ...p[card.id], status: 'opened' } as CoupleProgress }))
    }
  }

  const completedCount = Object.values(progress).filter((p) => p.status === 'completed').length

  return (
    <div className="h-full overflow-y-auto p-6 pb-28">
      <div className="flex justify-between items-center mb-1.5">
        <h1 className="font-display text-2xl">Mystery Board</h1>
        <div className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
          {completedCount}/{cards.length || 300}
        </div>
      </div>
      <p className="text-white/60 text-[14.5px] mb-4">Pick a card. It opens for you both at once.</p>

      <div className="flex gap-3 flex-wrap mb-4 text-[11px] text-white/60">
        <Legend color="#ff4d8d" label="Love" />
        <Legend color="#5AA9E6" label="Deep" />
        <Legend color="#8B5CF6" label="Fantasy" />
        <Legend color="#FFC15E" label="Funny" />
        <Legend color="#F5C94B" label="Gold" />
      </div>

      {loading ? (
        <p className="text-white/40 text-sm mt-10 text-center">Loading board…</p>
      ) : cards.length === 0 ? (
        <p className="text-white/40 text-sm mt-10 text-center">
          No cards found. Run <code className="text-primary">supabase/seed.sql</code> against your project
          to populate the question bank.
        </p>
      ) : (
        <div className="grid grid-cols-5 gap-2.5">
          {cards.map((card) => {
            const p = progress[card.id]
            const isDone = p?.status === 'completed'
            const isOpened = !!p
            const cls = isDone
              ? 'bg-gradient-to-br from-[#2a2730] to-[#19171d] text-white/30'
              : isOpened
              ? CATEGORY_CLASSES[card.category]
              : 'bg-gradient-to-br from-[#232028] to-[#17151b] text-white/40'
            return (
              <button
                key={card.id}
                onClick={() => handleOpen(card)}
                className={`aspect-[3/4] rounded-2xl flex items-center justify-center font-extrabold text-[13px] border border-white/10 active:scale-90 transition-transform ${cls}`}
              >
                {String(card.id).padStart(3, '0')}
              </button>
            )
          })}
        </div>
      )}

      {activeCard && <CardModal card={activeCard} onClose={() => setActiveCard(null)} />}
      <ChatOverlay />
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  )
}
