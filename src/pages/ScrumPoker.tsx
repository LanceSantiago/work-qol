import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import usePartySocket from 'partysocket/react'
import type {
  RoomState,
  CardValue,
  ServerMessage,
  ReactionEmoji,
  Participant,
} from '../types/scrumPoker'
import { CARD_VALUES, REACTION_EMOJIS } from '../types/scrumPoker'

// ── Emoji usage tracking ──────────────────────────────────────────────────────

const USAGE_KEY = 'scrum-poker-emoji-usage'
const BAR_SIZE = 8

function getUsage(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(USAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function recordUsage(emoji: string) {
  const usage = getUsage()
  usage[emoji] = Date.now()
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
}

function getTopEmojis(): string[] {
  const usage = getUsage()
  const sorted = Object.entries(usage)
    .sort(([, a], [, b]) => b - a)
    .map(([e]) => e)
  const result = [...sorted]
  for (const e of REACTION_EMOJIS) {
    if (result.length >= BAR_SIZE) break
    if (!result.includes(e)) result.push(e)
  }
  return result.slice(0, BAR_SIZE)
}

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'
const ROOM = 'main'
const NAME_KEY = 'scrum-poker-name'

// ── Seat positioning ──────────────────────────────────────────────────────────

const RX = 44 // horizontal radius %
const RY = 38 // vertical radius %

function getSeatPositions(n: number): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return [50 + RX * Math.cos(angle), 50 + RY * Math.sin(angle)] as [number, number]
  })
}

// Rotate participants array so 'me' ends up at the bottom-centre seat
function arrangeSeatOrder(participants: Participant[], myId: string | null): Participant[] {
  if (!myId || participants.length === 0) return participants
  const myIndex = participants.findIndex((p) => p.id === myId)
  if (myIndex === -1) return participants
  const n = participants.length
  const targetIndex = Math.floor(n / 2)
  const startIndex = (((myIndex - targetIndex) % n) + n) % n
  return [...participants.slice(startIndex), ...participants.slice(0, startIndex)]
}

// ── Vote tallying ─────────────────────────────────────────────────────────────

function getMajority(participants: Participant[]): string | null {
  const votes = participants.filter((p) => p.vote !== null).map((p) => p.vote!)
  if (votes.length === 0) return null
  const tally = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})
  const max = Math.max(...Object.values(tally))
  const winners = Object.entries(tally)
    .filter(([, c]) => c === max)
    .map(([v]) => v)
  return winners.join(' / ')
}

function getAverage(participants: Participant[]): string | null {
  const nums = participants
    .filter((p) => p.vote !== null)
    .map((p) => Number(p.vote))
    .filter((n) => !isNaN(n))
  if (nums.length === 0) return null
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
}

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
  ].join(';')

  document.body.appendChild(el)

  const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)
  const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)
  const midX = dx * 0.5
  const midY = dy * 0.5 - 60

  // Bounce direction: opposite of travel, biased upward
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const bounceX = -(dx / len) * 28
  const bounceY = -(dy / len) * 28 - 18

  const TOTAL = 1050
  const IMPACT = 0.58 // fraction when emoji reaches the card

  el.animate(
    [
      { offset: 0, transform: 'translate(0,0) scale(1)', opacity: 1, easing: 'ease-in' },
      {
        offset: 0.35,
        transform: `translate(${midX}px,${midY}px) scale(1.6)`,
        opacity: 1,
        easing: 'ease-in',
      },
      {
        offset: IMPACT,
        transform: `translate(${dx}px,${dy}px) scale(1.1)`,
        opacity: 1,
        easing: 'ease-out',
      },
      {
        offset: IMPACT + 0.08,
        transform: `translate(${dx}px,${dy}px) scale(1.7,0.45)`,
        opacity: 1,
        easing: 'ease-out',
      },
      {
        offset: IMPACT + 0.14,
        transform: `translate(${dx}px,${dy}px) scale(0.7,1.4)`,
        opacity: 1,
        easing: 'ease-in-out',
      },
      {
        offset: 0.86,
        transform: `translate(${dx + bounceX}px,${dy + bounceY}px) scale(0.95)`,
        opacity: 0.75,
        easing: 'ease-in',
      },
      {
        offset: 1,
        transform: `translate(${dx + bounceX * 1.6}px,${dy + bounceY * 1.8}px) scale(0.4)`,
        opacity: 0,
      },
    ],
    { duration: TOTAL, fill: 'forwards' }
  ).onfinish = () => el.remove()

  // Card shake — starts at impact
  toEl.animate(
    [
      { transform: 'translate(0,0) rotate(0deg)', easing: 'ease-out' },
      {
        transform: `translate(${-bounceX * 0.4}px,${-bounceY * 0.3}px) rotate(-5deg)`,
        easing: 'ease-in-out',
      },
      {
        transform: `translate(${bounceX * 0.25}px,${bounceY * 0.15}px) rotate(3deg)`,
        easing: 'ease-in-out',
      },
      { transform: 'translate(-2px,1px) rotate(-1deg)', easing: 'ease-out' },
      { transform: 'translate(0,0) rotate(0deg)' },
    ],
    { duration: 380, delay: Math.round(TOTAL * IMPACT), easing: 'linear' }
  )
}

// ── Flip card ─────────────────────────────────────────────────────────────────

function FlipCard({
  hasVoted,
  vote,
  visible,
  isMe,
  presenterMode = false,
  delay = 0,
  cardRef,
}: {
  hasVoted: boolean
  vote: CardValue | null
  visible: boolean
  isMe: boolean
  presenterMode?: boolean
  delay?: number
  cardRef?: (el: HTMLElement | null) => void
}) {
  const showFront = visible && !(isMe && presenterMode)
  return (
    <div ref={cardRef} style={{ perspective: '600px' }} className="w-12 h-[4.5rem]">
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: `transform 0.55s ease-in-out ${delay}ms`,
          transform: showFront ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Card back — face down */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className={[
            'absolute inset-0 rounded-lg border-2 flex items-center justify-center',
            hasVoted
              ? 'bg-blue-600 border-blue-400 shadow-md shadow-blue-900/40'
              : 'bg-slate-600 border-slate-500',
          ].join(' ')}
        >
          {hasVoted && <span className="text-white text-lg">✓</span>}
        </div>
        {/* Card front — face up */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className={[
            'absolute inset-0 rounded-lg border-2 flex items-center justify-center',
            isMe
              ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-gray-100 border-gray-200 text-gray-900',
          ].join(' ')}
        >
          <span className="text-lg font-bold">{vote ?? '?'}</span>
        </div>
      </div>
    </div>
  )
}

// ── Reaction picker ───────────────────────────────────────────────────────────

function EmojiModal({ onPick, onClose }: { onPick: (emoji: string) => void; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Picker
          data={data}
          onEmojiSelect={(e: { native: string }) => {
            onPick(e.native)
            onClose()
          }}
          theme="auto"
          previewPosition="none"
          skinTonePosition="search"
        />
      </div>
    </div>,
    document.body
  )
}

function ReactionPicker({
  visible,
  onPick,
}: {
  visible: boolean
  onPick: (emoji: ReactionEmoji) => void
}) {
  const [barEmojis, setBarEmojis] = useState(() => getTopEmojis())
  const [showModal, setShowModal] = useState(false)
  const reshuffleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePick = (emoji: string) => {
    recordUsage(emoji)
    if (reshuffleTimer.current) clearTimeout(reshuffleTimer.current)
    reshuffleTimer.current = setTimeout(() => setBarEmojis(getTopEmojis()), 800)
    onPick(emoji)
  }

  return (
    <>
      <div
        className={[
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[60] flex items-center gap-1',
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1 shadow-lg',
          'transition-opacity duration-150',
          visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        {barEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation()
              handlePick(emoji)
            }}
            className="text-base hover:scale-125 transition-transform leading-none"
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowModal(true)
          }}
          className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:scale-125 transition-transform leading-none px-0.5"
        >
          +
        </button>
      </div>
      {showModal && <EmojiModal onPick={handlePick} onClose={() => setShowModal(false)} />}
    </>
  )
}

// ── Player seat ───────────────────────────────────────────────────────────────

function PlayerSeat({
  participant,
  cardsVisible,
  isMe,
  presenterMode,
  x,
  y,
  index,
  cardRef,
  onReact,
}: {
  participant: Participant
  cardsVisible: boolean
  isMe: boolean
  presenterMode: boolean
  x: number
  y: number
  index: number
  cardRef: (el: HTMLElement | null) => void
  onReact: (targetId: string, emoji: ReactionEmoji) => void
}) {
  const [pickerVisible, setPickerVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setPickerVisible(true)
  }

  const handleMouseLeave = () => {
    hideTimer.current = setTimeout(() => setPickerVisible(false), 600)
  }

  const originalDiffers =
    cardsVisible &&
    participant.originalVote !== null &&
    participant.originalVote !== participant.vote

  return (
    <div
      className="absolute flex flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        <FlipCard
          hasVoted={participant.hasVoted}
          vote={participant.vote}
          visible={cardsVisible && participant.hasVoted}
          isMe={isMe}
          presenterMode={presenterMode}
          delay={index * 80}
          cardRef={cardRef}
        />
        {!isMe && (
          <ReactionPicker
            visible={pickerVisible}
            onPick={(emoji) => onReact(participant.id, emoji)}
          />
        )}
      </div>

      {originalDiffers && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 whitespace-nowrap">
          was {participant.originalVote}
        </span>
      )}

      <span
        className={[
          'text-[11px] font-medium whitespace-nowrap max-w-[80px] truncate text-center',
          isMe ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400',
        ].join(' ')}
      >
        {isMe ? `${participant.name} (you)` : participant.name}
      </span>
    </div>
  )
}

// ── Table centre content ──────────────────────────────────────────────────────

function TableCenter({
  participants,
  cardsVisible,
  countdown,
  onReveal,
  onReset,
}: {
  participants: Participant[]
  cardsVisible: boolean
  countdown: number | null
  onReveal: () => void
  onReset: () => void
}) {
  const allVoted = participants.length >= 2 && participants.every((p) => p.hasVoted)
  const votedCount = participants.filter((p) => p.hasVoted).length
  const majority = getMajority(participants)
  const avg = getAverage(participants)

  // Countdown numbers
  if (countdown !== null) {
    return (
      <span
        key={countdown}
        className="text-7xl font-black text-white animate-[countdown-pop_0.9s_ease-in-out_forwards] select-none"
      >
        {countdown}
      </span>
    )
  }

  // Results
  if (cardsVisible) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
          Majority
        </p>
        <p className="text-5xl font-black text-white leading-none">{majority ?? '—'}</p>
        {avg && <p className="text-[11px] text-emerald-300/80">avg {avg}</p>}
        <button
          onClick={onReset}
          className="mt-2 px-4 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors border border-white/20"
        >
          Start new vote
        </button>
      </div>
    )
  }

  // All voted — show reveal button
  if (allVoted) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-emerald-300 font-medium">All votes in!</p>
        <button
          onClick={onReveal}
          className="px-5 py-2 rounded-xl bg-white text-emerald-900 font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg"
          style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
        >
          Reveal Cards
        </button>
      </div>
    )
  }

  // Waiting
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-sm font-medium text-white/80">Pick your cards!</p>
      {participants.length >= 2 ? (
        <p className="text-xs text-emerald-300/70">
          {votedCount} / {participants.length} voted
        </p>
      ) : (
        <p className="text-xs text-emerald-300/50">Waiting for players…</p>
      )}
    </div>
  )
}

// ── Vote card (deck) ──────────────────────────────────────────────────────────

function VoteCard({
  value,
  selected,
  onClick,
}: {
  value: CardValue
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-12 h-[4.5rem] rounded-xl border-2 text-base font-bold transition-all duration-150 select-none',
        selected
          ? 'border-blue-500 bg-blue-600 text-white shadow-lg scale-105'
          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-blue-400 hover:scale-105',
      ].join(' ')}
    >
      {value}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ScrumPoker() {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [joined, setJoined] = useState(false)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [myVote, setMyVote] = useState<CardValue | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [presenterMode, setPresenterMode] = useState(false)

  const myIdRef = useRef<string | null>(null)
  const prevRevealedRef = useRef(false)
  const cardEls = useRef<Map<string, HTMLElement>>(new Map())

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

  const joinRoom = () => {
    if (!name.trim()) return
    localStorage.setItem(NAME_KEY, name.trim())
    socket.send(JSON.stringify({ type: 'join', name: name.trim() }))
    setJoined(true)
  }

  const castVote = (card: CardValue) => {
    if (!joined) return
    setMyVote(card)
    socket.send(JSON.stringify({ type: 'vote', card }))
  }

  const sendReaction = (targetId: string, emoji: ReactionEmoji) => {
    socket.send(JSON.stringify({ type: 'react', targetId, emoji }))
  }

  const reveal = () => socket.send(JSON.stringify({ type: 'reveal' }))

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
        </div>
      </div>
    )
  }

  // ── Game screen ─────────────────────────────────────────────────────────────

  const participants = roomState?.participants ?? []
  const round = roomState?.round ?? 1
  const arranged = arrangeSeatOrder(participants, myIdRef.current)
  const seatPositions = getSeatPositions(arranged.length)

  const cardDeck = (
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
  )

  return (
    // Outer: fixed viewport height, scrollable only in presenter mode
    <div
      style={{
        height: 'calc(100dvh - 7.5rem)',
        overflowY: presenterMode ? 'auto' : 'hidden',
      }}
    >
      {/* Inner flex layout always has a defined height so flex-1 works correctly */}
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 7.5rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Scrum Poker</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Round {round}</p>
          </div>
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
        </div>

        {/* Table arena */}
        <div className="flex-1 relative min-h-0 mb-4">
          {arranged.map((participant, i) => (
            <PlayerSeat
              key={participant.id}
              participant={participant}
              cardsVisible={cardsVisible}
              isMe={participant.id === myIdRef.current}
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
