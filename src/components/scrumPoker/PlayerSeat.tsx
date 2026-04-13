import { useState, useRef } from 'react'
import type { Participant, ReactionEmoji } from '../../types/scrumPoker'
import { FlipCard } from './FlipCard'
import { ReactionPicker } from './ReactionPicker'

// ── Player seat ───────────────────────────────────────────────────────────────

/**
 * Renders a single participant's seat at the poker table, including their flip card,
 * reaction picker (on hover, for other players), name label, and an "was X" badge when
 * they changed their vote after reveal.
 */
export function PlayerSeat({
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
          visible={cardsVisible}
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
