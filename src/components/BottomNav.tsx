import { NavLink } from 'react-router-dom'

const items = [
  { to: '/home', label: 'Home' },
  { to: '/board', label: 'Board' },
  { to: '/chat', label: 'Chat' },
  { to: '/journey', label: 'Journey' },
  { to: '/memory', label: 'Memory' }
]

export default function BottomNav() {
  return (
    <div className="absolute left-3.5 right-3.5 bottom-4 flex justify-around items-center px-2 py-3 rounded-[22px] bg-[#141118]/80 border border-white/10 backdrop-blur-xl z-40">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-xl transition-colors ${
              isActive ? 'text-primary' : 'text-white/50'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}
