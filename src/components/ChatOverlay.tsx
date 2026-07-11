import { useState } from 'react'
import ChatWindow from './ChatWindow'

export default function ChatOverlay() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="absolute right-4 bottom-24 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_8px_24px_-8px_rgba(255,77,141,0.6)] flex items-center justify-center text-2xl active:scale-90 transition-transform"
        onClick={() => setOpen(true)}
        aria-label="Open chat"
      >
        💬
      </button>

      {open && (
        <div className="absolute inset-0 z-[70] flex items-end bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full bg-bg2 border border-white/10 border-b-0 rounded-t-[28px] p-5 pb-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-display text-lg">Chat</h2>
              <button className="text-white/50 text-sm font-semibold" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ChatWindow compact />
          </div>
        </div>
      )}
    </>
  )
}
