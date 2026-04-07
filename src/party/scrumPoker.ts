import type * as Party from 'partykit/server'
import type { ClientMessage, RoomState, Participant } from '../types/scrumPoker'

export default class ScrumPokerServer implements Party.Server {
  private state: RoomState = {
    participants: [],
    revealed: false,
    round: 1,
  }

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send current state to newly connected client
    conn.send(JSON.stringify({ type: 'state', state: this.state }))
  }

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
          }
          this.state.participants.push(participant)
        } else {
          // Rejoin (e.g. page refresh) — update name in case it changed
          existing.name = msg.name
        }
        break
      }

      case 'vote': {
        const participant = this.state.participants.find((p) => p.id === sender.id)
        if (participant && !this.state.revealed) {
          participant.vote = msg.card
          participant.hasVoted = true
        }
        break
      }

      case 'reveal': {
        this.state.revealed = true
        break
      }

      case 'reset': {
        this.state.revealed = false
        this.state.round += 1
        this.state.participants.forEach((p) => {
          p.vote = null
          p.hasVoted = false
        })
        break
      }

      case 'react': {
        // Broadcast the reaction to all clients — no state mutation needed
        this.room.broadcast(
          JSON.stringify({
            type: 'reaction',
            fromId: sender.id,
            toId: msg.targetId,
            emoji: msg.emoji,
          })
        )
        return // skip the state broadcast below
      }
    }

    // Broadcast updated state to all connected clients
    this.room.broadcast(JSON.stringify({ type: 'state', state: this.state }))
  }

  onClose(conn: Party.Connection) {
    this.state.participants = this.state.participants.filter((p) => p.id !== conn.id)
    this.room.broadcast(JSON.stringify({ type: 'state', state: this.state }))
  }
}

ScrumPokerServer satisfies Party.Worker
