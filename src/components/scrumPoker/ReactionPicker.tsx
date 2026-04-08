import { useState, useRef } from 'react'
import type { ReactionEmoji } from '../../types/scrumPoker'
import { getTopEmojis, recordUsage } from '../../utils/emojiUsage'
import { EmojiModal } from './EmojiModal'

// ── Reaction picker ───────────────────────────────────────────────────────────

/**
 * Floating emoji quick-pick bar that appears on hover above another player's seat.
 * Shows the user's most-recently-used emojis and a "+" button to open the full picker modal.
 */
export function ReactionPicker({
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
