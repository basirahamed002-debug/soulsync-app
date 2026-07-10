import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from './BottomNav'

export function RequireAuth({ children, requireCouple = false }: { children: React.ReactNode; requireCouple?: boolean }) {
  const { user, couple, loading } = useAuth()

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
    </div>
  )
}
