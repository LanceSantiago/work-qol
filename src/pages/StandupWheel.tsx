import { useState, useRef, useEffect, useCallback } from 'react'
import { randomPick } from '../utils/random'

const TEAM_PRESET = ['Lance', 'Josh', 'Happi', 'Patrik', 'Craig', 'Kana', 'Barry', 'Michael']
const POLL_INTERVAL = 5000

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#10b981',
  '#06b6d4',
  '#f59e0b',
  '#ef4444',
]

interface StandupState {
  names: string[]
  winner: string | null
  spunAt: string | null
}

function drawWheel(ctx: CanvasRenderingContext2D, names: string[], rotation: number, size: number) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 4
  const slice = (2 * Math.PI) / names.length

  ctx.clearRect(0, 0, size, size)

  names.forEach((name, i) => {
    const start = rotation + i * slice
    const end = start + slice

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, end)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(start + slice / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = 'white'
    ctx.font = `bold ${Math.min(14, Math.floor(radius / names.length + 8))}px sans-serif`
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 4
    ctx.fillText(name.length > 14 ? name.slice(0, 13) + '…' : name, radius - 12, 5)
    ctx.restore()
  })

  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  ctx.stroke()

  const px = size - 6
  ctx.beginPath()
  ctx.moveTo(px, cy - 12)
  ctx.lineTo(px, cy + 12)
  ctx.lineTo(px - 22, cy)
  ctx.closePath()
  ctx.fillStyle = '#1f2937'
  ctx.fill()
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export default function StandupWheel() {
  const [names, setNames] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [winner, setWinner] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [configured, setConfigured] = useState(true)

  // Track the last spunAt we've seen so we don't re-trigger our own spin
  const lastSpunAtRef = useRef<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)

  const CANVAS_SIZE = 340

  // ── API helpers ──────────────────────────────────────────────────────────────

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/standup')
      if (res.status === 503) {
        setConfigured(false)
        return
      }
      const state: StandupState = await res.json()
      setNames(state.names)

      // If a new spin came in from someone else, show the winner modal
      if (state.winner && state.spunAt && state.spunAt !== lastSpunAtRef.current && !spinning) {
        lastSpunAtRef.current = state.spunAt
        triggerSpin(state.names, state.winner)
      }
    } catch {
      // network error — silently ignore, keep current state
    }
  }, [spinning]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveNames = async (next: string[]) => {
    setSaving(true)
    try {
      await fetch('/api/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: next }),
      })
    } finally {
      setSaving(false)
    }
  }

  // ── Polling ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchState()
    const id = setInterval(fetchState, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchState])

  // ── Canvas ───────────────────────────────────────────────────────────────────

  const redraw = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current
      if (!canvas || names.length === 0) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      drawWheel(ctx, names, rotation, CANVAS_SIZE)
    },
    [names]
  )

  useEffect(() => {
    if (names.length > 0) redraw(rotationRef.current)
    else {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }
  }, [names, redraw])

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // ── Spin animation ───────────────────────────────────────────────────────────

  const triggerSpin = useCallback(
    (currentNames: string[], picked: string) => {
      if (spinning || currentNames.length < 2) return
      setWinner(null)
      setSpinning(true)

      const pickedIndex = currentNames.indexOf(picked)
      const slice = (2 * Math.PI) / currentNames.length

      // Angle where the pointer (right side, angle 0) lands on the middle of the picked slice
      const targetAngle =
        (((-pickedIndex * slice - slice / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

      // Current wheel angle normalised to [0, 2π)
      const currentAngle = ((rotationRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)

      // Shortest positive arc to target (never zero — always spin at least a little)
      let delta = targetAngle - currentAngle
      if (delta <= 0) delta += 2 * Math.PI

      // Add whole-number extra rotations so the fractional offset stays exact
      const extraSpins = (5 + Math.floor(Math.random() * 4)) * 2 * Math.PI
      const totalRotation = extraSpins + delta

      const duration = 4000 + Math.random() * 1000
      const start = performance.now()
      const startRotation = rotationRef.current

      const animate = (now: number) => {
        const elapsed = now - start
        const t = Math.min(elapsed / duration, 1)
        rotationRef.current = startRotation + totalRotation * easeOut(t)
        redraw(rotationRef.current)

        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          setSpinning(false)
          setWinner(picked)
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
    },
    [spinning, redraw]
  )

  const spin = async () => {
    if (spinning || names.length < 2) return
    const picked = randomPick(names)
    // Best-effort save to KV — if not configured, spin locally anyway
    try {
      const res = await fetch('/api/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner: picked }),
      })
      if (res.ok) {
        const next: StandupState = await res.json()
        lastSpunAtRef.current = next.spunAt
      }
    } catch {
      // network error — spin locally
    }
    triggerSpin(names, picked)
  }

  // ── Name management ──────────────────────────────────────────────────────────

  const addName = () => {
    const trimmed = input.trim()
    if (!trimmed || names.includes(trimmed)) return
    const next = [...names, trimmed]
    setNames(next)
    setInput('')
    setWinner(null)
    saveNames(next)
  }

  const removeName = (name: string) => {
    const next = names.filter((n) => n !== name)
    setNames(next)
    setWinner(null)
    saveNames(next)
  }

  const loadPreset = () => {
    setNames(TEAM_PRESET)
    setWinner(null)
    saveNames(TEAM_PRESET)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Standup Wheel</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Spin to pick who runs standup today. Synced across your team in real-time.
      </p>

      {!configured && (
        <div className="mb-6 rounded-xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          ⚠️ STANDUP KV namespace not configured — running in local-only mode.
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Wheel */}
        <div className="flex flex-col items-center gap-4">
          {names.length > 0 ? (
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="rounded-full shadow-lg"
            />
          ) : (
            <div
              className="rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm"
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            >
              Add names to get started
            </div>
          )}

          <button
            onClick={spin}
            disabled={spinning || names.length < 2}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors shadow-md"
          >
            {spinning ? 'Spinning…' : 'Spin!'}
          </button>

          {winner && !spinning && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last picked:{' '}
              <span className="font-semibold text-gray-800 dark:text-gray-200">{winner}</span>
            </p>
          )}
        </div>

        {/* Name list */}
        <div className="flex-1 w-full max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Team members</h2>
            <button
              onClick={loadPreset}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              Load team preset
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addName()}
              placeholder="Add a name…"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addName}
              disabled={!input.trim() || saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {names.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No names yet.</p>
          ) : (
            <ul className="space-y-2">
              {names.map((name, i) => (
                <li
                  key={name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm">{name}</span>
                  </div>
                  <button
                    onClick={() => removeName(name)}
                    aria-label={`Remove ${name}`}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {names.length === 1 && (
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Add at least one more name to spin.
            </p>
          )}
        </div>
      </div>

      {/* Winner modal */}
      {winner && !spinning && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setWinner(null)}
          onKeyDown={(e) => e.key === 'Escape' && setWinner(null)}
        >
          <div
            role="presentation"
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center gap-3 animate-[winner-pop_0.35s_ease-out]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <p className="text-5xl">🎉</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Running standup today
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{winner}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setWinner(null)}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  removeName(winner)
                  setWinner(null)
                }}
                className="px-6 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/70 text-red-600 dark:text-red-400 font-medium transition-colors"
              >
                Remove from wheel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
