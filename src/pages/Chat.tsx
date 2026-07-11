import { useAuth } from '@/hooks/useAuth'
import ChatWindow from '@/components/ChatWindow'

export default function Chat() {
  const { partner } = useAuth()

  return (
    <div className="h-full flex flex-col p-6 pb-28">
      <div className="mb-3">
        <h1 className="font-display text-2xl">Chat</h1>
        <p className="text-white/60 text-[13.5px]">
          {partner ? `Talking with ${partner.nickname}` : 'Waiting to pair'}
        </p>
      </div>
      <ChatWindow />
    </div>
  )
}
