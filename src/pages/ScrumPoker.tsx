import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import usePartySocket from 'partysocket/react'
import type { RoomState, CardValue, ServerMessage, ReactionEmoji } from '../types/scrumPoker'
import { CARD_VALUES, REACTION_EMOJIS } from '../types/scrumPoker'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'
const NAME_KEY = 'scrum-poker-name'

// ── Flying emoji animation ────────────────────────────────────────────────────

function spawnFlyer(emoji: string, fromEl: HTMLElement, toEl: HTMLElement) {
  const fromRect = fromEl.getBoundingClientRect()
  const toRect = toEl.getBoundingClientRect()

  const el = document.createElement('div')
  el.textContent = emoji
  el.style.cssText = [
    'position:fixed',
    `left:${fromRect.left + fromRect.width / 2 - 16}px`,
    `top:${fromRect.top + fromRect.height / 2 - 16}px`,
    'font-size:28px',
    'width:32px',
    'height:32px',
    'line-height:32px',
    'text-align:center',
    'pointer-events:none',
    'z-index:9999',
    'will-change:transform,opacity',
  ].join(';')

  document.body.appendChild(el)

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)

  // Arc path: go up a bit in the middle via two keyframes
  const midX = dx * 0.5
  const midY = dy * 0.5 - 60 // arc upward

  el.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${midX}px,${midY}px) scale(1.6)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(0.8)`, opacity: 0 },
    ],
    { duration: 700, easing: 'ease-in-out', fill: 'forwards' }
  ).onfinish = () => el.remove()
}

// ── Reaction picker (shown on hover over a participant card) ──────────────────

function ReactionPicker({ onPick }: { onPick: (emoji: ReactionEmoji) => void }) {
  return (
    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation()
            onPick(emoji)
          }}
          className="text-base hover:scale-125 transition-transform leading-none"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ── Card component ────────────────────────────────────────────────────────────

function VoteCard({
  value,
  selected,
  disabled,
  onClick,
}: {
  value: CardValue
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-12 h-18 sm:w-14 sm:h-20 rounded-xl border-2 text-base sm:text-lg font-bold transition-all duration-150 select-none',
        selected
          ? 'border-blue-500 bg-blue-600 text-white shadow-lg scale-105'
          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-blue-400 hover:scale-105',
        disabled && !selected ? 'opacity-50 cursor-not-allowed hover:scale-100' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ minHeight: '5rem' }}
    >
      {value}
    </button>
  )
}

// ── Participant card ──────────────────────────────────────────────────────────

function ParticipantCard({
  id,
  name,
  hasVoted,
  vote,
  revealed,
  isMe,
  cardRef,
  onReact,
}: {
  id: string
  name: string
  hasVoted: boolean
  vote: CardValue | null
  revealed: boolean
  isMe: boolean
  cardRef: (el: HTMLElement | null) => void
  onReact: (targetId: string, emoji: ReactionEmoji) => void
}) {
  const showVote = revealed && vote !== null

  return (
    <div className="relative group flex flex-col items-center gap-2">
      {/* Vote card */}
      <div
        ref={cardRef}
        className={[
          'w-14 h-20 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all duration-500',
          showVote
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : hasVoted
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
        ].join(' ')}
      >
        {showVote ? vote : hasVoted ? '✓' : '…'}
      </div>

      {/* Reaction picker — only show on other people's cards */}
      {!isMe && <ReactionPicker onPick={(emoji) => onReact(id, emoji)} />}

      {/* Name */}
      <span
        className={[
          'text-xs font-medium truncate max-w-[4.5rem] text-center',
          isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400',
        ].join(' ')}
        title={name}
      >
        {isMe ? `${name} (you)` : name}
      </span>
    </div>
  )
}

// ── Results summary ───────────────────────────────────────────────────────────

function ResultsSummary({ participants }: { participants: RoomState['participants'] }) {
  const votes = participants.map((p) => p.vote).filter((v): v is CardValue => v !== null)
  const numericVotes = votes.map((v) => Number(v)).filter((v) => !isNaN(v))

  if (votes.length === 0) return null

  const avg =
    numericVotes.length > 0
      ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(1)
      : null

  const tally = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})

  const consensus = votes.length > 1 && Object.keys(tally).length === 1

  return (
    <div className="mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex flex-wrap gap-4 items-center">
        {avg && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Average
            </p>
            <p className="text-2xl font-bold">{avg}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Votes</p>
          <div className="flex gap-2 flex-wrap mt-1">
            {Object.entries(tally).map(([val, count]) => (
              <span
                key={val}
                className="px-2 py-0.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                {val} × {count}
              </span>
            ))}
          </div>
        </div>
        {consensus && (
          <div className="ml-auto text-green-600 dark:text-green-400 font-semibold text-sm">
            ✓ Consensus!
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ScrumPoker() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [joined, setJoined] = useState(false)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [myVote, setMyVote] = useState<CardValue | null>(null)
  const myIdRef = useRef<string | null>(null)

  // Map of participantId → card DOM element (for reaction animations)
  const cardEls = useRef<Map<string, HTMLElement>>(new Map())

  const setCardRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) cardEls.current.set(id, el)
      else cardEls.current.delete(id)
    },
    []
  )

  const roomCode = searchParams.get('room') ?? ''

  const generateRoom = () => {
    const code = Math.random().toString(36).slice(2, 8)
    setSearchParams({ room: code })
  }

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomCode || '__lobby__',
    onOpen() {
      myIdRef.current = socket.id
    },
    onMessage(event: MessageEvent) {
      const msg: ServerMessage = JSON.parse(event.data as string)

      if (msg.type === 'state') {
        setRoomState(msg.state)
        const me = msg.state.participants.find((p) => p.id === myIdRef.current)
        if (me) setMyVote(me.vote)
        if (!msg.state.revealed && msg.state.participants.every((p) => !p.hasVoted)) {
          setMyVote(null)
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

  const joinRoom = () => {
    if (!name.trim() || !roomCode) return
    localStorage.setItem(NAME_KEY, name.trim())
    socket.send(JSON.stringify({ type: 'join', name: name.trim() }))
    setJoined(true)
  }

  const castVote = (card: CardValue) => {
    if (!joined || roomState?.revealed) return
    setMyVote(card)
    socket.send(JSON.stringify({ type: 'vote', card }))
  }

  const sendReaction = (targetId: string, emoji: ReactionEmoji) => {
    socket.send(JSON.stringify({ type: 'react', targetId, emoji }))
  }

  const reveal = () => socket.send(JSON.stringify({ type: 'reveal' }))
  const reset = () => {
    setMyVote(null)
    socket.send(JSON.stringify({ type: 'reset' }))
  }

  const copyLink = () => navigator.clipboard.writeText(window.location.href)

  // ── Join screen ─────────────────────────────────────────────────────────────

  if (!joined || !roomCode) {
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
              placeholder="e.g. Alice"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="poker-room"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Room code
            </label>
            <div className="flex gap-2">
              <input
                id="poker-room"
                type="text"
                value={roomCode}
                onChange={(e) => setSearchParams({ room: e.target.value })}
                placeholder="e.g. sprint-42"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generateRoom}
                title="Generate random room"
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                🎲
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Share the URL with your team — same room code = same session.
            </p>
          </div>

          <button
            onClick={joinRoom}
            disabled={!name.trim() || !roomCode}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Join Room
          </button>
        </div>
      </div>
    )
  }

  // ── Game screen ─────────────────────────────────────────────────────────────

  const revealed = roomState?.revealed ?? false
  const participants = roomState?.participants ?? []
  const round = roomState?.round ?? 1
  const pendingCount = participants.filter((p) => !p.hasVoted).length
  const allVoted = participants.length > 1 && pendingCount === 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Scrum Poker</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Room{' '}
              <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                {roomCode}
              </span>{' '}
              · Round {round}
            </span>
            <button
              onClick={copyLink}
              className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              Copy link
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {!revealed && (
            <button
              onClick={reveal}
              disabled={participants.length < 2}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
            >
              Reveal Cards
            </button>
          )}
          {revealed && (
            <button
              onClick={reset}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold transition-colors"
            >
              New Round
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      {!revealed && (
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {allVoted
            ? '✅ Everyone has voted — ready to reveal!'
            : participants.length < 2
              ? '⏳ Waiting for others to join…'
              : `⏳ Waiting for ${pendingCount} more vote${pendingCount === 1 ? '' : 's'}…`}
        </div>
      )}

      {/* Participants — flex-wrap handles any count from 2–15+ */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Participants ({participants.length})
          {!revealed && (
            <span className="ml-2 font-normal normal-case text-gray-400 dark:text-gray-500">
              · hover a card to send a reaction
            </span>
          )}
        </h2>

        {participants.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Waiting for others to join…</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {participants.map((p) => (
              <ParticipantCard
                key={p.id}
                id={p.id}
                name={p.name}
                hasVoted={p.hasVoted}
                vote={p.vote}
                revealed={revealed}
                isMe={p.id === myIdRef.current}
                cardRef={setCardRef(p.id)}
                onReact={sendReaction}
              />
            ))}
          </div>
        )}

        {revealed && <ResultsSummary participants={participants} />}
      </section>

      {/* Card deck */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          {revealed ? 'Voting locked — start a new round to vote again' : 'Your vote'}
        </h2>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {CARD_VALUES.map((card) => (
            <VoteCard
              key={card}
              value={card}
              selected={myVote === card}
              disabled={revealed}
              onClick={() => castVote(card)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
