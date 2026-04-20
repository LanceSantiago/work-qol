import { useState, useRef, useEffect, useCallback } from 'react'
import { randomPick } from '../utils/random'
import { WinnerModal } from '../components/standup/WinnerModal'
import { SentryDutyModal } from '../components/standup/SentryDutyModal'
import { NameList } from '../components/standup/NameList'
import { getSentryOnCall } from '../utils/sentry'

const TEAM_PRESET = [
  'Lance',
  'Josh',
  'Happi',
  'Patrik',
  'Craig',
  'Kana',
  'Barry',
  'Michael',
  'Demi',
]
const POLL_INTERVAL = 5000

/** Shape of the standup state persisted in Cloudflare KV and returned by the `/api/standup` endpoint. */
interface StandupState {
  names: string[]
  winner: string | null
  spunAt: string | null
}

/**
 * Draws the full spinning wheel onto `ctx`. Each name gets a coloured slice,
 * with the label rendered inside it. Also draws the centre hub and the triangular pointer.
 * `rotation` is the current rotation offset in radians.
 */
function drawWheel(ctx: CanvasRenderingContext2D, names: string[], rotation: number, size: number) {
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

/** Quartic ease-out curve — maps a linear progress value `t` in [0, 1] to a decelerated value. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Interactive spinning wheel page for choosing who runs standup.
 * Syncs the team name list and the latest spin result with the Cloudflare KV-backed API,
 * polling every 5 seconds so all open browsers see the same winner in real-time.
 * Falls back to local-only mode when the KV namespace is not configured.
 */
export default function StandupWheel() {
  const [names, setNames] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [winner, setWinner] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [sentryDutyPerson, setSentryDutyPerson] = useState<string | null>(null)
  // Track the last spunAt we've seen so we don't re-trigger our own spin
  const lastSpunAtRef = useRef<string | null>(null)
  const initializedRef = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)
  const idleAnimRef = useRef<number | null>(null)

  const CANVAS_SIZE = 340

  // ── API helpers ──────────────────────────────────────────────────────────────

  /** Fetches the latest standup state from the API and triggers a spin animation if a new winner was set by another client. */
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/standup')
      if (res.status === 503) {
        setConfigured(false)
        return
      }
      const state: StandupState = await res.json()
      setNames(state.names)

      // On first load, record the current spunAt so we don't replay a past spin
      if (!initializedRef.current) {
        initializedRef.current = true
        lastSpunAtRef.current = state.spunAt
        return
      }

      // If a new spin came in from someone else, show the winner modal
      if (state.winner && state.spunAt && state.spunAt !== lastSpunAtRef.current && !spinning) {
        lastSpunAtRef.current = state.spunAt
        triggerSpin(state.names, state.winner)
      }
    } catch {
      // network error — silently ignore, keep current state
    }
  }, [spinning]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Persists the updated name list to the API. */
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

  /** Redraws the wheel canvas at the given rotation angle. No-op when there are no names. */
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

  // Idle slow rotation
  useEffect(() => {
    if (spinning || names.length === 0) {
      if (idleAnimRef.current !== null) {
        cancelAnimationFrame(idleAnimRef.current)
        idleAnimRef.current = null
      }
      return
    }

    const tick = () => {
      rotationRef.current += 0.001
      redraw(rotationRef.current)
      idleAnimRef.current = requestAnimationFrame(tick)
    }
    idleAnimRef.current = requestAnimationFrame(tick)

    return () => {
      if (idleAnimRef.current !== null) {
        cancelAnimationFrame(idleAnimRef.current)
        idleAnimRef.current = null
      }
    }
  }, [spinning, names.length, redraw])

  // ── Spin animation ───────────────────────────────────────────────────────────

  /**
   * Runs the spin animation, rotating the wheel to land precisely on `picked`
   * using a quartic ease-out curve over a randomised duration.
   */
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
          setSentryDutyPerson(getSentryOnCall())
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
    },
    [spinning, redraw]
  )

  /**
   * Picks a random name, persists the winner to the API so other clients see the result,
   * then starts the local spin animation. Spins locally if the API call fails.
   */
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

  /** Adds the current input value to the name list and persists the change, if the name is non-empty and not a duplicate. */
  const addName = () => {
    const trimmed = input.trim()
    if (!trimmed || names.includes(trimmed)) return
    const next = [...names, trimmed]
    setNames(next)
    setInput('')
    setWinner(null)
    saveNames(next)
  }

  /** Removes `name` from the list and persists the change. */
  const removeName = (name: string) => {
    const next = names.filter((n) => n !== name)
    setNames(next)
    setWinner(null)
    saveNames(next)
  }

  /** Replaces the current name list with the hardcoded team preset and persists it. */
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

        <NameList
          names={names}
          input={input}
          saving={saving}
          onInputChange={setInput}
          onAdd={addName}
          onRemove={removeName}
          onLoadPreset={loadPreset}
        />
      </div>

      {/* Winner modal */}
      {winner && !spinning && (
        <WinnerModal winner={winner} onDismiss={() => setWinner(null)} onRemove={removeName} />
      )}

      {/* Sentry duty modal — shown after winner modal is dismissed */}
      {!winner && sentryDutyPerson && (
        <SentryDutyModal person={sentryDutyPerson} onDismiss={() => setSentryDutyPerson(null)} />
      )}
    </div>
  )
}
