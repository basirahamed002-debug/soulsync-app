import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { RequireAuth } from '@/components/RequireAuth'
import Welcome from '@/pages/Welcome'
import Login from '@/pages/Login'
import ProfileSetup from '@/pages/ProfileSetup'
import Pairing from '@/pages/Pairing'
import Home from '@/pages/Home'
import Board from '@/pages/Board'
import Journey from '@/pages/Journey'
import Memory from '@/pages/Memory'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="max-w-[460px] h-screen mx-auto relative overflow-hidden bg-bg bg-[radial-gradient(circle_at_15%_8%,rgba(255,77,141,0.20),transparent_45%),radial-gradient(circle_at_90%_15%,rgba(139,92,246,0.22),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(124,58,237,0.18),transparent_55%)]">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/setup-profile"
              element={
                <RequireAuth>
                  <ProfileSetup />
                </RequireAuth>
              }
            />
            <Route
              path="/pairing"
              element={
                <RequireAuth>
                  <Pairing />
                </RequireAuth>
              }
            />
            <Route
              path="/home"
              element={
                <RequireAuth requireCouple>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/board"
              element={
                <RequireAuth requireCouple>
                  <Board />
                </RequireAuth>
              }
            />
            <Route
              path="/journey"
              element={
                <RequireAuth requireCouple>
                  <Journey />
                </RequireAuth>
              }
            />
            <Route
              path="/memory"
              element={
                <RequireAuth requireCouple>
                  <Memory />
                </RequireAuth>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
