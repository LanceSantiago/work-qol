import type { CardValue } from '../../types/scrumPoker'

// ── Flip card ─────────────────────────────────────────────────────────────────

/**
 * A single playing card that flips between its face-down and face-up states with a 3-D CSS
 * transition. In presenter mode the local user's own card stays face-down to avoid spoiling
 * the vote on a shared screen.
 */
export function FlipCard({
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
