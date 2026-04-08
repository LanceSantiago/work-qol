/** Union of all valid planning poker card face values. */
export type CardValue = '1' | '2' | '3' | '5' | '8' | '13' | '21' | '34' | '55' | '?' | '☕'

export const CARD_VALUES: CardValue[] = ['1', '2', '3', '5', '8', '13', '21', '34', '55', '?', '☕']

export const REACTION_EMOJIS = ['🎉', '😱', '🤔', '👍', '👎', '🔥', '💯', '🤡'] as const
export type ReactionEmoji = string

/** Discriminated union of all messages a client can send to the PartyKit server. */
export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'vote'; card: CardValue }
  | { type: 'reveal' }
  | { type: 'reset' }
  | { type: 'react'; targetId: string; emoji: string }

/** Discriminated union of all messages the PartyKit server can broadcast to clients. */
export type ServerMessage =
  | { type: 'state'; state: RoomState }
  | { type: 'reaction'; fromId: string; toId: string; emoji: string }

/** Represents a single player connected to the scrum poker room. */
export interface Participant {
  id: string
  name: string
  vote: CardValue | null
  hasVoted: boolean
  originalVote: CardValue | null // snapshot taken at reveal, null until then
}

/** Full shared state of a scrum poker room, broadcast to all connected clients. */
export interface RoomState {
  participants: Participant[]
  revealed: boolean
  round: number
}
