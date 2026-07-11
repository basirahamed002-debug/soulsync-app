import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  couple_id: string
  sender_id: string
  content: string
  created_at: string
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
    }
    loadMessages()
  }, [couple])

  // Listen for new messages in real time.
  useEffect(() => {
    if (!couple) return
    const channel = supabase
      .channel(`messages:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [couple])

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
          messages.map((m) => {
            const mine = m.sender_id === user?.id
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13.5px] ${
                    mine
                      ? 'bg-gradient-to-br from-primary to-accent text-white rounded-br-md'
                      : 'glass rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
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
