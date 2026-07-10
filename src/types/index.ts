export type Category = 'love' | 'deep' | 'fantasy' | 'funny' | 'gold'

export type LoveStage = 'stranger' | 'friends' | 'close_hearts' | 'soulmates' | 'forever' | 'eternal_love'

export interface Profile {
  id: string
  nickname: string
  age: number | null
  gender: string | null
  country: string | null
  timezone: string | null
  anniversary_date: string | null
  photo_url: string | null
  favorite_color: string | null
  relationship_status: string | null
  created_at: string
}

export interface Couple {
  id: string
  player_a: string
  player_b: string | null
  invite_code: string
  status: 'pending' | 'paired' | 'disconnected'
  paired_at: string | null
  xp: number
  coins: number
  current_streak: number
  longest_streak: number
  love_stage: LoveStage
  created_at: string
}

export interface Card {
  id: number
  category: Category
  question: string
  is_gold: boolean
  order_index: number
  min_love_stage: LoveStage
}

export interface CoupleProgress {
  id: string
  couple_id: string
  card_id: number
  status: 'locked' | 'opened' | 'completed'
  opened_at: string | null
  completed_at: string | null
}

export interface Answer {
  id: string
  couple_id: string
  card_id: number
  user_id: string
  answer_type: 'text' | 'voice' | 'photo'
  content: string | null
  media_url: string | null
  submitted_at: string
}
