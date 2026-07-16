import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  couple_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export default function ChatWindow({ compact = false }: { compact?: boolean }) {
  const { user, couple, partner } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMessages() {
      if (!couple) return
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: true })
        .limit(200)
      setMessages((data as Message[]) ?? [])
      setLoading(false)
      await supabase.rpc('mark_messages_read', { p_couple_id: couple.id })
    }
    loadMessages()
  }, [couple])

  // Listen for new messages, and for read-receipt updates, in real time.
  useEffect(() => {
    if (!couple) return
    const channel = supabase
      .channel(`messages:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
        async (payload) => {
          const incoming = payload.new as Message
          setMessages((prev) => [...prev, incoming])
          if (incoming.sender_id !== user?.id) {
            await supabase.rpc('mark_messages_read', { p_couple_id: couple.id })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const updated = payload.new as Message
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [couple, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim() || !couple || !user) return
    const content = text.trim()
    setText('')
    const { error } = await supabase.from('messages').insert({
      couple_id: couple.id,
      sender_id: user.id,
      content
    })
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-[60vh]' : 'h-full'}`}>
      <div className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-2.5">
        {loading ? (
          <p className="text-white/40 text-sm text-center mt-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-white/40 text-sm text-center mt-8">
            No messages yet — say hi to {partner?.nickname ?? 'your partner'} 👋
          </p>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === user?.id
            const isLastMine = mine && !messages.slice(i + 1).some((later) => later.sender_id === user?.id)
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13.5px] ${
                    mine
                      ? 'bg-gradient-to-br from-primary to-accent text-white rounded-br-md'
                      : 'glass rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
                {isLastMine && (
                  <span className="text-white/40 text-[10.5px] mt-1 mr-1">
                    {m.read_at ? 'Seen' : 'Delivered'}
                  </span>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 pt-2">
        <input
          className="input-field flex-1"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
        />
        <button
          className="px-5 rounded-2xl font-bold text-white bg-gradient-to-br from-primary to-accent active:scale-95 transition-transform disabled:opacity-40"
          onClick={send}
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}
