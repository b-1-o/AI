import { useEffect, useRef } from 'react'

type DotCrystalProps = {
  progress?: number
  spin?: number
  active?: boolean
  className?: string
  seed?: number
}

function buildCrystalPoints(count: number, seed = 1) {
  const pts: { x: number; y: number; z: number; r: number }[] = []
  const rand = (i: number) => {
    const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
    return x - Math.floor(x)
  }

  for (let i = 0; i < count; i++) {
    const t = i / count
    const band = Math.floor(t * 5)
    const u = (t * 5) % 1
    const angle = i * 2.399963 + band * 0.4
    const bandY = 1 - (band / 4) * 2
    const radius = (1 - Math.abs(bandY) * 0.72) * (0.85 + rand(i) * 0.2)
    const y = bandY * 0.95 + (rand(i + 3) - 0.5) * 0.04
    const x = Math.cos(angle + u) * radius
    const z = Math.sin(angle + u) * radius
    pts.push({ x, y, z, r: 0.7 + rand(i + 7) * 1.4 })
  }

  for (let i = 0; i < count * 0.35; i++) {
    const angle = i * 0.55 + seed
    const radius = 0.7 + rand(i + 20) * 0.25
    pts.push({
      x: Math.cos(angle) * radius,
      y: (rand(i + 40) - 0.5) * 0.15,
      z: Math.sin(angle) * radius,
      r: 0.6 + rand(i + 50) * 1.1,
    })
  }

  return pts
}

export default function DotCrystal({
  progress = 0.5,
  spin = 0.35,
  active = false,
  className = '',
  seed = 1,
}: DotCrystalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const progressRef = useRef(progress)
  const activeRef = useRef(active)
  progressRef.current = progress
  activeRef.current = active

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let raf = 0
    let running = true
    const points = buildCrystalPoints(220, seed)
    let rotY = 0
    let rotX = 0.25
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width * dpr))
      const h = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const draw = (now: number) => {
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      resize()

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2
      const scale = Math.min(w, h) * 0.38

      const p = progressRef.current
      const targetExtra = (p - 0.5) * Math.PI * 2.2
      rotY += spin * dt
      const displayY = rotY + targetExtra
      rotX = 0.22 + (p - 0.5) * 0.35

      const cosY = Math.cos(displayY)
      const sinY = Math.sin(displayY)
      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)

      ctx.clearRect(0, 0, w, h)

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.4)
      g.addColorStop(0, activeRef.current ? 'rgba(244,244,242,0.07)' : 'rgba(244,244,242,0.03)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      type Proj = { x: number; y: number; z: number; r: number }
      const projected: Proj[] = []

      for (const pt of points) {
        let x = pt.x * cosY - pt.z * sinY
        let z = pt.x * sinY + pt.z * cosY
        let y = pt.y
        const y2 = y * cosX - z * sinX
        const z2 = y * sinX + z * cosX
        y = y2
        z = z2
        projected.push({ x, y, z, r: pt.r })
      }

      projected.sort((a, b) => a.z - b.z)

      for (const pt of projected) {
        const depth = (pt.z + 1.2) / 2.4
        const alpha = 0.15 + depth * 0.75
        const size = (0.6 + depth * 1.8) * pt.r * dpr * (activeRef.current ? 1.15 : 1)
        const sx = cx + pt.x * scale
        const sy = cy + pt.y * scale
        ctx.beginPath()
        ctx.arc(sx, sy, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(244,244,242,${alpha.toFixed(3)})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [seed, spin])

  return (
    <canvas
      ref={canvasRef}
      className={`dot-crystal ${className}`.trim()}
      aria-hidden="true"
    />
  )
}
