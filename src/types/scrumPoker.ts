export type CardValue = '1' | '2' | '3' | '5' | '8' | '13' | '21' | '34' | '55' | '?' | '☕'

export const CARD_VALUES: CardValue[] = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '?', '☕']

export const REACTION_EMOJIS = ['🎉', '😱', '🤔', '👍', '👎', '🔥', '💯', '🤡'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'vote'; card: CardValue }
  | { type: 'reveal' }
  | { type: 'reset' }
  | { type: 'react'; targetId: string; emoji: ReactionEmoji }

export type ServerMessage =
  | { type: 'state'; state: RoomState }
  | { type: 'reaction'; fromId: string; toId: string; emoji: ReactionEmoji }

export interface Participant {
  id: string
  name: string
  vote: CardValue | null
  hasVoted: boolean
}

export interface RoomState {
  participants: Participant[]
  revealed: boolean
  round: number
}
