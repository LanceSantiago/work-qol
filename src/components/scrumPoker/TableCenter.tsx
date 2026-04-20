import type { Participant } from '../../types/scrumPoker'
import { getMajority, getAverage } from '../../utils/scrumPokerUtils'

// ── Table centre content ──────────────────────────────────────────────────────

/**
 * Content rendered in the centre of the poker table. Adapts to the current game phase:
 * countdown numbers during reveal, majority/average results after reveal, a "Reveal Cards"
 * button when at least one player has voted, or a waiting prompt otherwise.
 * The reveal button pulses when all players have voted; it's muted when only some have voted.
 * Spectators see results and the vote counter, but not the reveal/reset controls.
 */
export function TableCenter({
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
  const canReveal = participants.length >= 2 && votedCount >= 1
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

  // At least one voted — show reveal button (pulsing when all voted, muted otherwise)
  if (canReveal) {
    return (
      <div className="flex flex-col items-center gap-2">
        {allVoted && <p className="text-xs text-emerald-300 font-medium">All votes in!</p>}
        <button
          onClick={onReveal}
          className={[
            'px-5 py-2 rounded-xl font-bold text-sm transition-colors shadow-lg',
            allVoted
              ? 'bg-white text-emerald-900 hover:bg-emerald-50'
              : 'bg-white/20 text-white hover:bg-white/30 border border-white/20',
          ].join(' ')}
          style={
            allVoted ? { animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' } : undefined
          }
        >
          Reveal Cards
        </button>
        {!allVoted && (
          <p className="text-xs text-emerald-300/70">
            {votedCount} / {participants.length} voted
          </p>
        )}
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
