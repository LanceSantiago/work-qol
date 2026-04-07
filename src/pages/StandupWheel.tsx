import { useState, useRef, useEffect, useCallback } from 'react'
import { randomPick } from '../utils/random'

const STORAGE_KEY = 'standup-wheel-names'
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

function drawWheel(ctx: CanvasRenderingContext2D, names: string[], rotation: number, size: number) {
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2 - 4
  const slice = (2 * Math.PI) / names.length

  ctx.clearRect(0, 0, size, size)

  names.forEach((name, i) => {
    const start = rotation + i * slice
    const end = start + slice

    // Slice fill
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, start, end)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
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

  // Center cap
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  ctx.stroke()

  // Pointer triangle (right side)
  const px = size - 6
  ctx.beginPath()
  ctx.moveTo(px, cy - 12)
  ctx.lineTo(px, cy + 12)
  ctx.lineTo(px - 22, cy)
  ctx.closePath()
  ctx.fillStyle = '#1f2937'
  ctx.fill()
}

// Easing: deceleration curve
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export default function StandupWheel() {
  const [names, setNames] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [winner, setWinner] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)

  const CANVAS_SIZE = 340

  // Persist names to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
  }, [names])

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

  // Redraw when names change
  useEffect(() => {
    if (names.length > 0) redraw(rotationRef.current)
    else {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    }
  }, [names, redraw])

  const spin = () => {
    if (spinning || names.length < 2) return

    setWinner(null)
    setSpinning(true)

    const picked = randomPick(names)
    const pickedIndex = names.indexOf(picked)
    const slice = (2 * Math.PI) / names.length

    // Calculate the target rotation so the pointer (right side, angle 0)
    // lands in the middle of the picked slice
    const targetSliceAngle = -(pickedIndex * slice + slice / 2)
    // Add multiple full rotations for the spin effect (5–8 full turns)
    const extraSpins = (5 + Math.random() * 3) * 2 * Math.PI
    const totalRotation = extraSpins + targetSliceAngle - (rotationRef.current % (2 * Math.PI))

    const duration = 4000 + Math.random() * 1000
    const start = performance.now()
    const startRotation = rotationRef.current

    const animate = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const easedT = easeOut(t)
      rotationRef.current = startRotation + totalRotation * easedT
      redraw(rotationRef.current)

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setWinner(picked)
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const addName = () => {
    const trimmed = input.trim()
    if (!trimmed || names.includes(trimmed)) return
    setNames((prev) => [...prev, trimmed])
    setInput('')
    setWinner(null)
  }

  const removeName = (name: string) => {
    setNames((prev) => prev.filter((n) => n !== name))
    setWinner(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Standup Wheel</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Spin to pick who runs standup today.
      </p>

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
            <div className="text-center animate-bounce">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Running standup today
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{winner}</p>
            </div>
          )}
        </div>

        {/* Name list */}
        <div className="flex-1 w-full max-w-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Team members
          </h2>

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
              disabled={!input.trim()}
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
    </div>
  )
}
