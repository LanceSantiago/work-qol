export type CardValue = '1' | '2' | '3' | '5' | '8' | '13' | '21' | '34' | '55' | '?' | '☕'

export const CARD_VALUES: CardValue[] = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '?', '☕']

export const REACTION_EMOJIS = ['🎉', '😱', '🤔', '👍', '👎', '🔥', '💯', '🤡'] as const
export type ReactionEmoji = string

export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'vote'; card: CardValue }
  | { type: 'reveal' }
  | { type: 'reset' }
  | { type: 'react'; targetId: string; emoji: string }

export type ServerMessage =
  | { type: 'state'; state: RoomState }
  | { type: 'reaction'; fromId: string; toId: string; emoji: string }

export interface Participant {
  id: string
  name: string
  vote: CardValue | null
  hasVoted: boolean
  originalVote: CardValue | null // snapshot taken at reveal, null until then
}

export interface RoomState {
  participants: Participant[]
  revealed: boolean
  round: number
}
