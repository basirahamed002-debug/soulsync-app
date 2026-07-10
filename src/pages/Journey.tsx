import { useAuth } from '@/hooks/useAuth'

const STAGES = [
  { key: 'stranger', label: '🌱 Stranger', pack: 'Icebreaker pack' },
  { key: 'friends', label: '😊 Friends', pack: 'Funny pack' },
  { key: 'close_hearts', label: '💕 Close Hearts', pack: 'Deep Talks pack' },
  { key: 'soulmates', label: '❤️ Soulmates', pack: 'Deep Talks+ pack' },
  { key: 'forever', label: '💍 Forever', pack: 'Future & Marriage pack' },
  { key: 'eternal_love', label: '∞ Eternal Love', pack: 'Secret finale pack' }
]

export default function Journey() {
  const { couple } = useAuth()
  const currentIndex = STAGES.findIndex((s) => s.key === (couple?.love_stage ?? 'stranger'))

  return (
    <div className="h-full overflow-y-auto p-6 pb-28">
      <h1 className="font-display text-2xl mb-1.5">Love Journey</h1>
      <p className="text-white/60 text-[14.5px] mb-6">Every stage unlocks a new question pack.</p>

      <div className="relative pl-6">
        <div className="absolute left-[9px] top-1.5 bottom-1.5 w-0.5 bg-gradient-to-b from-primary to-white/10" />
        {STAGES.map((stage, i) => {
          const done = i < currentIndex
          const current = i === currentIndex
          return (
            <div key={stage.key} className="relative pb-6">
              <div
                className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 ${
                  done
                    ? 'bg-primary border-primary'
                    : current
                    ? 'bg-secondary border-secondary shadow-[0_0_0_4px_rgba(139,92,246,0.25)]'
                    : 'bg-bg2 border-white/15'
                }`}
              />
              <div className={`font-bold text-[14.5px] ${!done && !current ? 'text-white/40' : ''}`}>
                {stage.label}
              </div>
              <div className="text-white/50 text-[12px]">
                {done ? `Unlocked · ${stage.pack}` : current ? `In progress · ${stage.pack}` : `Locked · ${stage.pack}`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
