import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Broadcasts and listens for "open card" events on a per-couple channel,
 * so when either partner taps a card it opens live on both screens.
 * Also listens for postgres changes on the `answers` table so a reveal
 * fires the instant both partners have submitted.
 */
export function useCoupleRealtime(coupleId: string | undefined) {
  const [openCardId, setOpenCardId] = useState<number | null>(null)

  useEffect(() => {
    if (!coupleId) return

    const channel = supabase.channel(`couple:${coupleId}`)

    channel
      .on('broadcast', { event: 'open_card' }, (payload) => {
        setOpenCardId(payload.payload.cardId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [coupleId])

  const broadcastOpenCard = useCallback(
    (cardId: number) => {
      if (!coupleId) return
      supabase.channel(`couple:${coupleId}`).send({
        type: 'broadcast',
        event: 'open_card',
        payload: { cardId }
      })
      setOpenCardId(cardId)
    },
    [coupleId]
  )

  return { openCardId, broadcastOpenCard, setOpenCardId }
}

/**
 * Subscribes to new rows in `answers` for a specific card so we know the
 * instant the partner submits, without polling.
 */
export function useAnswerSubscription(
  coupleId: string | undefined,
  cardId: number | null,
  onNewAnswer: (userId: string) => void
) {
  useEffect(() => {
    if (!coupleId || !cardId) return

    const channel = supabase
      .channel(`answers:${coupleId}:${cardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `couple_id=eq.${coupleId}`
        },
        (payload) => {
          if (payload.new.card_id === cardId) {
            onNewAnswer(payload.new.user_id as string)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, cardId])
}
