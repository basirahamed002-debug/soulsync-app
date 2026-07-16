import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import BottomNav from './BottomNav'

export function RequireAuth({ children, requireCouple = false }: { children: React.ReactNode; requireCouple?: boolean }) {
  const { user, couple, partner, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)

  // Show an in-app popup whenever the partner sends a new chat message,
  // unless you're already looking at the Chat screen.
  useEffect(() => {
    if (!couple) return
    const channel = supabase
      .channel(`messages-notify:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const msg = payload.new as { sender_id: string; content: string }
          if (msg.sender_id === user?.id) return
          if (location.pathname === '/chat') return
          setToast(msg.content)
          setTimeout(() => setToast(null), 4000)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [couple, user, location.pathname])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-white/40 text-sm">Loading…</div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  if (requireCouple && !couple) return <Navigate to="/pairing" replace />

  return (
    <div className="relative h-full">
      {children}
      {couple && <BottomNav />}
      {toast && (
        <div
          className="absolute top-4 left-4 right-4 z-[95] cursor-pointer"
          onClick={() => {
            setToast(null)
            navigate('/chat')
          }}
        >
          <div className="glass p-3.5 flex items-center gap-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
            <span className="text-xl">💬</span>
            <div className="min-w-0">
              <div className="font-bold text-[12.5px]">{partner?.nickname ?? 'Your partner'}</div>
              <div className="text-white/70 text-[12px] truncate">{toast}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
