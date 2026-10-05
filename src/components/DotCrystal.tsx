import { useEffect, useRef } from 'react'
import crystalSrc from '../../assets/crystal.jpg'

type DotCrystalProps = {
  progress?: number
  spin?: number
  active?: boolean
  className?: string
  seed?: number
}

type Pt = { x: number; y: number; z: number; s: number }

let sharedPoints: Pt[] | null = null
let sharedPromise: Promise<Pt[]> | null = null

function sampleCrystal(size = 480): Promise<Pt[]> {
  if (sharedPoints) return Promise.resolve(sharedPoints)
  if (sharedPromise) return sharedPromise

  sharedPromise = new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('2d unavailable'))
        return
      }
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, size, size)
      const scale = Math.min(size / image.width, size / image.height) * 0.92
      const dw = image.width * scale
      const dh = image.height * scale
      ctx.drawImage(image, (size - dw) / 2, (size - dh) / 2, dw, dh)
      const data = ctx.getImageData(0, 0, size, size).data
      const raw: { x: number; y: number; s: number }[] = []

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const i = (y * size + x) * 4
          const b = (data[i] + data[i + 1] + data[i + 2]) / (255 * 3)
          if (b < 0.22) continue
          raw.push({
            x: x / size - 0.5,
            y: 0.5 - y / size,
            s: Math.min(1, (b - 0.22) / 0.78),
          })
        }
      }

      let sx = 0
      let sy = 0
      for (const p of raw) {
        sx += p.x
        sy += p.y
      }
      const n = Math.max(1, raw.length)
      const cx = sx / n
      const cy = sy / n

      let maxR = 0.01
      for (const p of raw) {
        maxR = Math.max(maxR, Math.abs(p.x - cx))
      }

      const pts: Pt[] = raw.map((p) => {
        const nx = (p.x - cx) / maxR
        const z = Math.sqrt(Math.max(0, 1 - nx * nx)) * (0.22 + p.s * 0.28)
        const side = Math.sin(p.x * 90.1 + p.y * 40.3) > 0 ? 1 : -1
        return {
          x: p.x - cx,
          y: p.y - cy,
          z: z * side,
          s: p.s,
        }
      })

      const MAX = 5500
      let final = pts
      if (pts.length > MAX) {
        const step = pts.length / MAX
        final = Array.from({ length: MAX }, (_, i) => pts[Math.min(pts.length - 1, Math.floor(i * step))])
      }

      sharedPoints = final
      resolve(final)
    }
    image.onerror = () => reject(new Error('crystal load failed'))
    image.src = crystalSrc
  })

  return sharedPromise
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
    let points: Pt[] = []
    let rotY = seed * 1.1
    let last = performance.now()
    let inView = true

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries.some((e) => e.isIntersecting)
            },
            { rootMargin: '80px', threshold: 0.01 },
          )
        : null
    if (io) io.observe(canvas)

    sampleCrystal()
      .then((pts) => {
        if (!running) return
        points = pts
      })
      .catch(() => {})

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

      if (!inView || points.length === 0) {
        raf = requestAnimationFrame(draw)
        return
      }

      const dpr = resize()
      const w = canvas.width
      const h = canvas.height
      const cx = w * 0.5
      const cy = h * 0.55
      const scale = Math.min(w, h) * 0.95

      const p = progressRef.current
      rotY += spin * dt
      const scrollSpin = (p - 0.5) * Math.PI * 1.6
      const angle = rotY + scrollSpin
      const cosY = Math.cos(angle)
      const sinY = Math.sin(angle)
      const tilt = 0.42
      const cosX = Math.cos(tilt)
      const sinX = Math.sin(tilt)

      ctx.clearRect(0, 0, w, h)

      if (activeRef.current) {
        ctx.beginPath()
        ctx.ellipse(cx, cy + scale * 0.48, scale * 0.28, scale * 0.06, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fill()
      }

      type Proj = { x: number; y: number; z: number; s: number }
      const projected: Proj[] = []

      for (let i = 0; i < points.length; i++) {
        const pt = points[i]
        let x = pt.x * cosY - pt.z * sinY
        let z = pt.x * sinY + pt.z * cosY
        let y = pt.y
        const y2 = y * cosX - z * sinX
        const z2 = y * sinX + z * cosX
        projected.push({ x, y: y2, z: z2, s: pt.s })
      }

      projected.sort((a, b) => a.z - b.z)

      const FOCAL = 1.35
      for (const pt of projected) {
        const persp = FOCAL / (FOCAL + pt.z)
        const sx = cx + pt.x * scale * persp
        const sy = cy + pt.y * scale * persp
        const depth = (pt.z + 0.55) / 1.1
        const alpha = Math.min(1, 0.18 + depth * 0.75) * (0.55 + pt.s * 0.45)
        const size = Math.max(
          0.35 * dpr,
          (0.7 + depth * 1.6) * (0.6 + pt.s) * dpr * (activeRef.current ? 1.1 : 0.95),
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
