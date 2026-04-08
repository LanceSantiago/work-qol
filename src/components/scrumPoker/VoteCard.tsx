import type { CardValue } from '../../types/scrumPoker'

// ── Vote card (deck) ──────────────────────────────────────────────────────────

/** A single selectable card in the voting deck. Highlights with a blue border and scale when selected. */
export function VoteCard({
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
