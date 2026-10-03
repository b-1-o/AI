import { useEffect, useMemo, useRef } from 'react'

type Point = { x: number; y: number }

type ParticleMorphProps = {
  images: string[]
  progress: number
  particleDensity?: number
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function sampleImage(src: string, sampleWidth = 260, sampleHeight = 160): Promise<Point[]> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = sampleWidth
      canvas.height = sampleHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }

      ctx.clearRect(0, 0, sampleWidth, sampleHeight)
      const scale = Math.min(sampleWidth / image.width, sampleHeight / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      ctx.drawImage(
        image,
        (sampleWidth - drawWidth) / 2,
        (sampleHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
      )

      const pixels = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data
      const points: Point[] = []

      for (let y = 0; y < sampleHeight; y += 2) {
        for (let x = 0; x < sampleWidth; x += 2) {
          const i = (y * sampleWidth + x) * 4
          const alpha = pixels[i + 3] / 255
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / (255 * 3)

          if (alpha > 0.28 && brightness > 0.22) {
            points.push({ x: x / sampleWidth - 0.5, y: y / sampleHeight - 0.5 })
          }
        }
      }

      resolve(points)
    }

    image.onerror = () => reject(new Error('Failed to load particle source: ' + src))
    image.src = src
  })
}

export default function ParticleMorph({
  images,
  progress,
  particleDensity = 1,
  className = '',
}: ParticleMorphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointer = useRef({ x: 0, y: 0, active: false })

  const seed = useMemo(
    () =>
      Array.from({ length: 9000 }, (_, index) => {
        const value = Math.sin(index * 12.9898) * 43758.5453
        return value - Math.floor(value)
      }),
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let disposed = false
    let frame = 0
    let width = 0
    let height = 0
    let dpr = 1
    const targets: Point[][] = []
    const particleCount = Math.round((window.innerWidth < 760 ? 2200 : 4800) * particleDensity)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.25 : 1.55)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY, active: true }
    }

    const onPointerLeave = () => {
      pointer.current.active = false
    }

    const render = () => {
      if (disposed || targets.length < images.length) return

      ctx.clearRect(0, 0, width, height)

      const p = clamp(progress, 0, images.length - 1)
      const segment = Math.min(images.length - 2, Math.floor(p))
      const local = p - segment
      const t = smoothstep(0, 1, local)
      const scale = Math.min(width, height) * 1.16
      const idleTime = performance.now() * 0.0004
      const pointerRadius = Math.max(95, Math.min(width, height) * 0.12)

      for (let i = 0; i < particleCount; i += 1) {
        const noise = seed[i % seed.length]
        const a = targets[segment][i % targets[segment].length]
        const b = targets[segment + 1][i % targets[segment + 1].length]

        let nx = lerp(a.x, b.x, t)
        let ny = lerp(a.y, b.y, t)

        const travel = Math.sin(Math.PI * local)
        const orbit = noise * Math.PI * 2 + idleTime * (0.3 + noise * 0.7)
        const radius = travel * (8 + noise * 26)

        nx += Math.cos(orbit) * radius / scale
        ny += Math.sin(orbit) * radius / scale

        nx += Math.sin(noise * 21 + idleTime * 1.5) * 0.0018
        ny += Math.cos(noise * 17 + idleTime * 1.1) * 0.0018

        let x = width * 0.5 + nx * scale
        let y = height * 0.5 + ny * scale

        if (p > 0.72 && p < 1.28) {
          const angle = Math.sin((p - 0.72) * 4.2) * 0.08
          const dx = x - width * 0.5
          const dy = y - height * 0.5
          x = width * 0.5 + dx * Math.cos(angle) - dy * Math.sin(angle)
          y = height * 0.5 + dx * Math.sin(angle) + dy * Math.cos(angle)
        }

        if (pointer.current.active) {
          const dx = x - pointer.current.x
          const dy = y - pointer.current.y
          const distance = Math.hypot(dx, dy)

          if (distance < pointerRadius && distance > 0.001) {
            const strength = Math.pow(1 - distance / pointerRadius, 2) * 18
            x += (dx / distance) * strength
            y += (dy / distance) * strength
          }
        }

        ctx.globalAlpha = 0.34 + 0.5 * (0.5 + 0.5 * Math.sin(noise * 25 + idleTime * 2.8))
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, window.innerWidth < 760 ? 1.0 : 1.25, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      frame = requestAnimationFrame(render)
    }

    const loadTargets = async () => {
      try {
        const loaded = await Promise.all(images.map((src) => sampleImage(src)))
        if (!disposed) {
          targets.push(...loaded)
          render()
        }
      } catch (error) {
        console.error(error)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerleave', onPointerLeave)
    void loadTargets()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [images, particleDensity, progress, seed])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
