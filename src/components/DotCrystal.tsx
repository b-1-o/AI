import { useEffect, useRef } from 'react'
import { getCrystalPoints, type CrystalPt } from './crystalGeometry'

type DotCrystalProps = {
  progress?: number
  spin?: number
  active?: boolean
  className?: string
  seed?: number
}

export default function DotCrystal({
  progress = 0.5,
  spin = 0.55,
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
    const points: CrystalPt[] = getCrystalPoints(5200)
    let rotY = seed * 0.7
    let last = performance.now()
    let inView = true

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries.some((e) => e.isIntersecting)
            },
            { rootMargin: '60px', threshold: 0.01 },
          )
        : null
    if (io) io.observe(canvas)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const rect = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.floor(rect.width * dpr))
      const h = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      return dpr
    }

    const draw = (now: number) => {
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      if (!inView) {
        raf = requestAnimationFrame(draw)
        return
      }

      const dpr = resize()
      const w = canvas.width
      const h = canvas.height
      const cx = w * 0.5
      const cy = h * 0.52
      const scale = Math.min(w, h) * 1.05

      const p = progressRef.current
      rotY += spin * dt
      const scrollSpin = (p - 0.5) * Math.PI * 1.4
      const angle = rotY + scrollSpin
      const cosY = Math.cos(angle)
      const sinY = Math.sin(angle)
      const tilt = 0.28
      const cosX = Math.cos(tilt)
      const sinX = Math.sin(tilt)

      ctx.clearRect(0, 0, w, h)

      type Proj = { x: number; y: number; z: number; s: number }
      const projected: Proj[] = new Array(points.length)

      for (let i = 0; i < points.length; i++) {
        const pt = points[i]
        let x = pt.x * cosY - pt.z * sinY
        let z = pt.x * sinY + pt.z * cosY
        let y = pt.y
        const y2 = y * cosX - z * sinX
        const z2 = y * sinX + z * cosX
        projected[i] = { x, y: y2, z: z2, s: pt.s }
      }

      projected.sort((a, b) => a.z - b.z)

      const FOCAL = 1.55
      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i]
        const persp = FOCAL / (FOCAL + pt.z)
        const sx = cx + pt.x * scale * persp
        const sy = cy - pt.y * scale * persp
        const depth = (pt.z + 0.55) / 1.1
        const alpha = Math.min(1, 0.22 + depth * 0.7) * (0.5 + pt.s * 0.5)
        const size = Math.max(
          0.4 * dpr,
          (0.55 + depth * 1.4) * (0.55 + pt.s * 0.55) * dpr * (activeRef.current ? 1.15 : 1),
        )

        ctx.beginPath()
        ctx.arc(sx, sy, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(244,244,242,${alpha.toFixed(3)})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      if (io) io.disconnect()
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
