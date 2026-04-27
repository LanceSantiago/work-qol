import type * as Party from 'partykit/server'
import type { ClientMessage, RoomState, Participant } from '../types/scrumPoker'

/**
 * PartyKit server for the Scrum Poker room.
 * Maintains the shared `RoomState` in memory and handles join, vote, reveal, reset,
 * and emoji-reaction messages from connected clients, broadcasting updated state after each change.
 */
const DISCONNECT_TIMEOUT_MS = 60_000

export default class ScrumPokerServer implements Party.Server {
  private state: RoomState = {
    participants: [],
    revealed: false,
    round: 1,
  }
  private disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(readonly room: Party.Room) {}

  /** Sends the current room state to a newly connected client so they can render immediately. */
  onConnect(conn: Party.Connection) {
    // Clear any pending removal timer for this connection
    const timer = this.disconnectTimers.get(conn.id)
    if (timer) {
      clearTimeout(timer)
      this.disconnectTimers.delete(conn.id)
    }
    const existing = this.state.participants.find((p) => p.id === conn.id)
    if (existing) {
      existing.connected = true
      this.room.broadcast(JSON.stringify({ type: 'state', state: this.state }))
    }
    conn.send(JSON.stringify({ type: 'state', state: this.state }))
  }

  /**
   * Handles incoming client messages. Mutates `this.state` based on message type,
   * then broadcasts the updated state to all clients (except for `react` which broadcasts
   * a reaction event directly without updating state).
   */
  onMessage(message: string, sender: Party.Connection) {
    const msg: ClientMessage = JSON.parse(message)

    switch (msg.type) {
      case 'join': {
        const existing = this.state.participants.find((p) => p.id === sender.id)
        if (!existing) {
          const participant: Participant = {
            id: sender.id,
            name: msg.name,
            vote: null,
            hasVoted: false,
            originalVote: null,
            connected: true,
          }
          this.state.participants.push(participant)
        } else {
          existing.name = msg.name
          existing.connected = true
        }
        break
      }

      case 'vote': {
        const participant = this.state.participants.find((p) => p.id === sender.id)
        if (participant) {
          // Allow re-voting after reveal — originalVote is preserved from reveal snapshot
          participant.vote = msg.card
          participant.hasVoted = true
        }
        break
      }

      case 'reveal': {
        this.state.revealed = true
        // Snapshot each participant's vote as their originalVote
        this.state.participants.forEach((p) => {
          if (p.hasVoted) p.originalVote = p.vote
        })
        break
      }

      case 'reset': {
        this.state.revealed = false
        this.state.round += 1
        this.state.participants.forEach((p) => {
          p.vote = null
          p.hasVoted = false
          p.originalVote = null
        })
        break
      }

      case 'react': {
        this.room.broadcast(
          JSON.stringify({
            type: 'reaction',
            fromId: sender.id,
            toId: msg.targetId,
            emoji: msg.emoji,
          })
        )
        return
      }
    }

    this.room.broadcast(JSON.stringify({ type: 'state', state: this.state }))
  }

  /** Marks the participant as disconnected and schedules removal after the grace period. */
  onClose(conn: Party.Connection) {
    const participant = this.state.participants.find((p) => p.id === conn.id)
    if (!participant) return

    participant.connected = false
    this.room.broadcast(JSON.stringify({ type: 'state', state: this.state }))

    const timer = setTimeout(() => {
      this.state.participants = this.state.participants.filter((p) => p.id !== conn.id)
      this.disconnectTimers.delete(conn.id)
      this.room.broadcast(JSON.stringify({ type: 'state', state: this.state }))
    }, DISCONNECT_TIMEOUT_MS)

    this.disconnectTimers.set(conn.id, timer)
  }
}

ScrumPokerServer satisfies Party.Worker
