import { createPortal } from 'react-dom'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

// ── Emoji modal ───────────────────────────────────────────────────────────────

/** Full-screen emoji picker modal rendered via a portal. Closes when the backdrop or Escape key is pressed. */
export function EmojiModal({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void
  onClose: () => void
}) {
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
