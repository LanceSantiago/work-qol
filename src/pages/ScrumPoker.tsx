import { useState, useEffect, useRef, useCallback } from 'react'
import usePartySocket from 'partysocket/react'
import type { RoomState, CardValue, ServerMessage, ReactionEmoji } from '../types/scrumPoker'
import { CARD_VALUES } from '../types/scrumPoker'
import { spawnFlyer, arrangeSeatOrder, getSeatPositions } from '../utils/scrumPokerUtils'
import { PlayerSeat } from '../components/scrumPoker/PlayerSeat'
import { TableCenter } from '../components/scrumPoker/TableCenter'
import { VoteCard } from '../components/scrumPoker/VoteCard'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'
const ROOM = 'main'
const NAME_KEY = 'scrum-poker-name'

// ── Main page ─────────────────────────────────────────────────────────────────

/**
 * Real-time planning poker page. Connects to the PartyKit room, manages the local
 * join/vote/reveal/reset flow, drives the countdown animation, and dispatches emoji
 * reaction flying animations between participant cards.
 */
export default function ScrumPoker() {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [joined, setJoined] = useState(false)
  const [isSpectator, setIsSpectator] = useState(false)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [myVote, setMyVote] = useState<CardValue | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [presenterMode, setPresenterMode] = useState(false)

  const myIdRef = useRef<string | null>(null)
  const prevRevealedRef = useRef(false)
  const cardEls = useRef<Map<string, HTMLElement>>(new Map())
  const lastToVoteNotifiedRef = useRef(false)
  const [showLastToVoteAlert, setShowLastToVoteAlert] = useState(false)

  const setCardRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) cardEls.current.set(id, el)
      else cardEls.current.delete(id)
    },
    []
  )

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: ROOM,
    onOpen() {
      myIdRef.current = socket.id
    },
    onMessage(event: MessageEvent) {
      const msg: ServerMessage = JSON.parse(event.data as string)

      if (msg.type === 'state') {
        setRoomState(msg.state)
        const me = msg.state.participants.find((p) => p.id === myIdRef.current)
        if (me) setMyVote(me.vote)

        if (msg.state.revealed && !prevRevealedRef.current) {
          // Transition to revealed — start countdown
          prevRevealedRef.current = true
          setCardsVisible(false)
          setCountdown(3)
        } else if (!msg.state.revealed && prevRevealedRef.current) {
          // Reset
          prevRevealedRef.current = false
          setCountdown(null)
          setCardsVisible(false)
        }
      }

      if (msg.type === 'reaction') {
        const fromEl = cardEls.current.get(msg.fromId)
        const toEl = cardEls.current.get(msg.toId)
        if (fromEl && toEl) spawnFlyer(msg.emoji, fromEl, toEl)
      }
    },
  })

  useEffect(() => {
    myIdRef.current = socket.id
  }, [socket.id])

  // Notify the last person to vote when everyone else has voted (4+ participants only)
  useEffect(() => {
    if (!roomState || roomState.revealed || isSpectator) return
    const ps = roomState.participants
    if (ps.length < 4) return
    const me = ps.find((p) => p.id === myIdRef.current)
    if (!me || me.hasVoted) {
      lastToVoteNotifiedRef.current = false
      setShowLastToVoteAlert(false)
      return
    }
    const othersAllVoted = ps.filter((p) => p.id !== myIdRef.current).every((p) => p.hasVoted)
    if (othersAllVoted && !lastToVoteNotifiedRef.current) {
      lastToVoteNotifiedRef.current = true
      const timer = setTimeout(() => setShowLastToVoteAlert(true), 15_000)
      return () => clearTimeout(timer)
    }
  }, [roomState, isSpectator])

  // Countdown timer: 3 → 2 → 1 → 0 → show cards
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      setCardsVisible(true)
      setCountdown(null)
      return
    }
    const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  /** Sends a join message to the PartyKit room and transitions to the game screen. */
  const joinRoom = () => {
    if (!name.trim()) return
    localStorage.setItem(NAME_KEY, name.trim())
    socket.send(JSON.stringify({ type: 'join', name: name.trim() }))
    setJoined(true)
  }

  /** Connects to the room as a spectator — receives state but does not join as a participant. */
  const watchOnly = () => {
    setIsSpectator(true)
    setJoined(true)
  }

  /** Optimistically updates the local selected card and broadcasts the vote to the room. */
  const castVote = (card: CardValue) => {
    if (!joined || isSpectator) return
    setMyVote(card)
    socket.send(JSON.stringify({ type: 'vote', card }))
  }

  /** Broadcasts an emoji reaction from the local user to the participant with `targetId`. */
  const sendReaction = (targetId: string, emoji: ReactionEmoji) => {
    socket.send(JSON.stringify({ type: 'react', targetId, emoji }))
  }

  const reveal = () => socket.send(JSON.stringify({ type: 'reveal' }))

  /** Clears local vote state and sends a reset message to start a new voting round. */
  const reset = () => {
    setMyVote(null)
    setCountdown(null)
    setCardsVisible(false)
    socket.send(JSON.stringify({ type: 'reset' }))
  }

  // ── Join screen ─────────────────────────────────────────────────────────────

  if (!joined) {
    return (
      <div className="max-w-sm mx-auto mt-12">
        <h1 className="text-2xl font-bold mb-1">Scrum Poker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Real-time planning poker for sprint estimation.
        </p>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="poker-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Your name
            </label>
            <input
              id="poker-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              placeholder="e.g. Lance"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={joinRoom}
            disabled={!name.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Join Session
          </button>
          <button
            onClick={watchOnly}
            className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Watch only (spectator)
          </button>
        </div>
      </div>
    )
  }

  // ── Game screen ─────────────────────────────────────────────────────────────

  const participants = roomState?.participants ?? []
  const round = roomState?.round ?? 1
  const arranged = arrangeSeatOrder(participants, myIdRef.current)
  const seatPositions = getSeatPositions(arranged.length)

  const cardDeck = !isSpectator ? (
    <section className="shrink-0 pb-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
        {cardsVisible ? 'Change your vote' : 'Your vote'}
      </h2>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {CARD_VALUES.map((card) => (
          <VoteCard
            key={card}
            value={card}
            selected={myVote === card}
            onClick={() => castVote(card)}
          />
        ))}
      </div>
    </section>
  ) : null

  return (
    // Outer: fixed viewport height, scrollable only in presenter mode
    <div
      style={{
        height: 'calc(100dvh - 7.5rem)',
        overflowY: presenterMode ? 'auto' : 'hidden',
      }}
    >
      {showLastToVoteAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-lg animate-[bounce_0.6s_ease-in-out_3]">
          <span>Everyone&apos;s waiting on you — cast your vote!</span>
          <button
            onClick={() => setShowLastToVoteAlert(false)}
            className="text-white/70 hover:text-white text-base leading-none"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      {/* Inner flex layout always has a defined height so flex-1 works correctly */}
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 7.5rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Scrum Poker</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Round {round}</p>
          </div>
          {!isSpectator && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setPresenterMode((m) => !m)}
                title={presenterMode ? 'Exit presenter mode' : 'Enter presenter mode'}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  presenterMode
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500',
                ].join(' ')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                {presenterMode ? 'Presenting' : 'Present'}
              </button>
              {cardsVisible && (
                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium text-right">
                  {presenterMode
                    ? 'Cards revealed — scroll down to vote'
                    : 'Cards revealed — click any card to change your vote'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Table arena */}
        <div className="flex-1 relative min-h-0 mb-4">
          {arranged.map((participant, i) => (
            <PlayerSeat
              key={participant.id}
              participant={participant}
              cardsVisible={cardsVisible}
              isMe={participant.id === myIdRef.current}
              isSpectator={isSpectator}
              presenterMode={presenterMode}
              x={seatPositions[i][0]}
              y={seatPositions[i][1]}
              index={i}
              cardRef={setCardRef(participant.id)}
              onReact={sendReaction}
            />
          ))}

          {/* The table */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-[100px] bg-emerald-800"
            style={{
              width: 'min(360px, 72%)',
              height: '190px',
              border: '6px solid #065f46',
              boxShadow:
                '0 0 0 3px #047857, inset 0 2px 24px rgba(0,0,0,0.35), 0 24px 64px rgba(0,0,0,0.45)',
            }}
          >
            <TableCenter
              participants={participants}
              cardsVisible={cardsVisible}
              countdown={countdown}
              onReveal={reveal}
              onReset={reset}
            />
          </div>
        </div>

        {/* Card deck sits at the bottom of the viewport in normal mode */}
        {!presenterMode && cardDeck}
      </div>

      {/* In presenter mode the deck lives outside the fixed-height flex div,
          so it's naturally below the fold and reachable by scrolling */}
      {presenterMode && cardDeck}
    </div>
  )
}
