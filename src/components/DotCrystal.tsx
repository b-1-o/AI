import { useEffect, useRef } from 'react'

type DotCrystalProps = {
  progress?: number
  spin?: number
  active?: boolean
  className?: string
  seed?: number
}

type Pt = { x: number; y: number; z: number; r: number }

const rand = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Single hexagonal crystal shaft with pointed tip (amethyst-like) */
function addCrystalShaft(
  pts: Pt[],
  ox: number,
  oz: number,
  height: number,
  radius: number,
  leanX: number,
  leanZ: number,
  seed: number,
  baseI: number,
) {
  const sides = 6
  const rings = Math.max(8, Math.floor(height * 28))
  const tipStart = 0.72

  for (let ri = 0; ri <= rings; ri++) {
    const t = ri / rings
    const y = -0.55 + t * height

    let rMul = 1
    if (t > tipStart) {
      rMul = 1 - (t - tipStart) / (1 - tipStart)
      rMul = Math.max(0.02, rMul * rMul)
    } else {
      rMul = 0.92 + 0.08 * (t / tipStart)
    }

    const rr = radius * rMul
    const lx = leanX * t
    const lz = leanZ * t
    const density = t > tipStart ? sides * 2 : sides

    for (let s = 0; s < density; s++) {
      const a = (s / density) * Math.PI * 2 + ri * 0.08
      const hex = 0.88 + 0.12 * Math.cos(a * 3)
      const px = ox + lx + Math.cos(a) * rr * hex
      const pz = oz + lz + Math.sin(a) * rr * hex
      const jitter = (rand(baseI + ri * 20 + s, seed) - 0.5) * 0.012
      pts.push({
        x: px + jitter,
        y: y + jitter * 0.5,
        z: pz + jitter,
        r: t > tipStart ? 0.55 + rand(baseI + s, seed) * 0.5 : 0.75 + rand(baseI + s + 3, seed) * 0.9,
      })
    }

    if (ri % 2 === 0 && rr > 0.04) {
      for (let k = 0; k < 3; k++) {
        const a = rand(baseI + ri * 11 + k, seed) * Math.PI * 2
        const rad = rr * (0.15 + rand(baseI + k + 9, seed) * 0.55)
        pts.push({
          x: ox + lx + Math.cos(a) * rad,
          y,
          z: oz + lz + Math.sin(a) * rad,
          r: 0.45 + rand(baseI + k, seed) * 0.4,
        })
      }
    }
  }

  pts.push({
    x: ox + leanX,
    y: -0.55 + height + 0.01,
    z: oz + leanZ,
    r: 1.2,
  })
}

/** Amethyst-style cluster: several shafts from a base */
function buildCluster(seed: number): Pt[] {
  const pts: Pt[] = []

  for (let i = 0; i < 90; i++) {
    const a = rand(i, seed) * Math.PI * 2
    const rad = Math.sqrt(rand(i + 50, seed)) * 0.55
    const y = -0.62 + rand(i + 90, seed) * 0.18
    pts.push({
      x: Math.cos(a) * rad,
      y,
      z: Math.sin(a) * rad * 0.9,
      r: 0.5 + rand(i + 7, seed) * 0.8,
    })
  }

  addCrystalShaft(pts, 0.02, 0.0, 1.55, 0.22, 0.04, -0.02, seed, 100)

  const satellites = [
    { x: 0.28, z: 0.12, h: 1.05, r: 0.14, lx: 0.12, lz: 0.06 },
    { x: -0.24, z: 0.18, h: 0.95, r: 0.13, lx: -0.1, lz: 0.08 },
    { x: 0.18, z: -0.26, h: 0.88, r: 0.12, lx: 0.08, lz: -0.12 },
    { x: -0.2, z: -0.2, h: 0.72, r: 0.1, lx: -0.08, lz: -0.08 },
    { x: 0.36, z: -0.08, h: 0.62, r: 0.09, lx: 0.14, lz: -0.02 },
    { x: -0.32, z: 0.02, h: 0.58, r: 0.085, lx: -0.12, lz: 0.02 },
    { x: 0.08, z: 0.32, h: 0.5, r: 0.08, lx: 0.02, lz: 0.14 },
  ]

  satellites.forEach((s, idx) => {
    const jx = (rand(idx * 3, seed) - 0.5) * 0.06
    const jz = (rand(idx * 3 + 1, seed) - 0.5) * 0.06
    const jh = 0.9 + rand(idx * 3 + 2, seed) * 0.2
    addCrystalShaft(
      pts,
      s.x + jx,
      s.z + jz,
      s.h * jh,
      s.r,
      s.lx,
      s.lz,
      seed + idx,
      200 + idx * 80,
    )
  })

  return pts
}

export default function DotCrystal({
  progress = 0.5,
  spin = 0.45,
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
    const points = buildCluster(seed)
    let rotY = seed * 0.7
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
      const cy = h * 0.58
      const scale = Math.min(w, h) * 0.42

      const p = progressRef.current
      rotY += spin * dt
      const scrollRot = p * Math.PI * 2
      const displayY = rotY + scrollRot
      const rotX = 0.35

      const cosY = Math.cos(displayY)
      const sinY = Math.sin(displayY)
      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)

      ctx.clearRect(0, 0, w, h)

      ctx.beginPath()
      ctx.ellipse(cx, cy + scale * 0.72, scale * 0.42, scale * 0.1, 0, 0, Math.PI * 2)
      ctx.fillStyle = activeRef.current ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)'
      ctx.fill()

      const g = ctx.createRadialGradient(cx, cy - scale * 0.1, 0, cx, cy, scale * 1.3)
      g.addColorStop(0, activeRef.current ? 'rgba(244,244,242,0.06)' : 'rgba(244,244,242,0.025)')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      type Proj = { x: number; y: number; z: number; r: number }
      const projected: Proj[] = new Array(points.length)

      for (let i = 0; i < points.length; i++) {
        const pt = points[i]
        let x = pt.x * cosY - pt.z * sinY
        let z = pt.x * sinY + pt.z * cosY
        let y = pt.y
        const y2 = y * cosX - z * sinX
        const z2 = y * sinX + z * cosX
        projected[i] = { x, y: y2, z: z2, r: pt.r }
      }

      projected.sort((a, b) => a.z - b.z)

      for (const pt of projected) {
        const depth = (pt.z + 1.4) / 2.8
        const alpha = 0.12 + depth * 0.82
        const size =
          (0.55 + depth * 1.7) * pt.r * dpr * (activeRef.current ? 1.12 : 0.95)
        const sx = cx + pt.x * scale
        const sy = cy + pt.y * scale

        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(0.4 * dpr, size), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(244,244,242,${Math.min(1, alpha).toFixed(3)})`
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
