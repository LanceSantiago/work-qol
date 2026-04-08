import type { Participant } from '../types/scrumPoker'

// ── Seat positioning ──────────────────────────────────────────────────────────

export const RX = 44 // horizontal radius %
export const RY = 38 // vertical radius %

/**
 * Computes evenly-spaced seat positions arranged in an ellipse for `n` participants.
 * Returns `[x, y]` pairs as percentages of the container dimensions.
 */
export function getSeatPositions(n: number): Array<[number, number]> {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return [50 + RX * Math.cos(angle), 50 + RY * Math.sin(angle)] as [number, number]
  })
}

/**
 * Rotates the participants array so that the local user always occupies the
 * bottom-centre seat position, improving the sense of "sitting at the table".
 */
export function arrangeSeatOrder(participants: Participant[], myId: string | null): Participant[] {
  if (!myId || participants.length === 0) return participants
  const myIndex = participants.findIndex((p) => p.id === myId)
  if (myIndex === -1) return participants
  const n = participants.length
  const targetIndex = Math.floor(n / 2)
  const startIndex = (((myIndex - targetIndex) % n) + n) % n
  return [...participants.slice(startIndex), ...participants.slice(0, startIndex)]
}

// ── Vote tallying ─────────────────────────────────────────────────────────────

/**
 * Returns the vote value(s) that received the most votes, joined by " / " if tied.
 * Returns `null` when no votes have been cast.
 */
export function getMajority(participants: Participant[]): string | null {
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

/**
 * Computes the arithmetic mean of all numeric votes, formatted to one decimal place.
 * Non-numeric votes (e.g. "?", "☕") are excluded. Returns `null` if no numeric votes exist.
 */
export function getAverage(participants: Participant[]): string | null {
  const nums = participants
    .filter((p) => p.vote !== null)
    .map((p) => Number(p.vote))
    .filter((n) => !isNaN(n))
  if (nums.length === 0) return null
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
}

// ── Flying emoji animation ────────────────────────────────────────────────────

/**
 * Imperatively animates an emoji flying from `fromEl` to `toEl` using the Web Animations API,
 * then removes the element. Also plays a bounce/shake animation on the target card at impact.
 */
export function spawnFlyer(emoji: string, fromEl: HTMLElement, toEl: HTMLElement) {
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
