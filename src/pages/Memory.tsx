import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface MemoryEntry {
  card_id: number
  question: string
  category: string
  completed_at: string
}

export default function Memory() {
  const { couple } = useAuth()
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!couple) return
      const { data } = await supabase
        .from('couple_progress')
        .select('card_id, completed_at, cards(question, category)')
        .eq('couple_id', couple.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      const rows = (data ?? []).map((row: any) => ({
        card_id: row.card_id,
        completed_at: row.completed_at,
        question: row.cards?.question ?? '',
        category: row.cards?.category ?? 'love'
      }))
      setEntries(rows)
      setLoading(false)
    }
    load()
  }, [couple])

  return (
    <div className="h-full overflow-y-auto p-6 pb-28">
      <h1 className="font-display text-2xl mb-1.5">Memory Book</h1>
      <p className="text-white/60 text-[14.5px] mb-4">Everything you've unlocked together, saved forever.</p>

      {loading ? (
        <p className="text-white/40 text-sm mt-10 text-center">Loading memories…</p>
      ) : entries.length === 0 ? (
        <p className="text-white/40 text-sm mt-10 text-center">
          No completed cards yet — head to the board and open your first one 💫
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <div key={e.card_id} className="glass p-4">
              <div className="text-[11px] tracking-wide uppercase text-white/50 font-semibold">
                {new Date(e.completed_at).toLocaleDateString()} · {e.category}
              </div>
              <p className="text-white/70 text-[13.5px] mt-1.5">{e.question}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
