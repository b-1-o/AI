import { useEffect, useMemo, useRef } from 'react'

type Point = { x: number; y: number; strength: number }

type ParticleMorphProps = {
  images: string[]
  progress: number
  particleDensity?: number
  className?: string
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function smoothstep(x: number) {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

function selectEvenly(points: Point[], count: number): Point[] {
  if (points.length === 0) return []
  if (points.length === count) return points

  if (points.length > count) {
    const result: Point[] = []
    const step = points.length / count

    for (let i = 0; i < count; i += 1) {
      result.push(points[Math.min(points.length - 1, Math.floor(i * step))])
    }

    return result
  }

  return Array.from({ length: count }, (_, i) => {
    const source = points[i % points.length]
    const cycle = Math.floor(i / points.length)
    const angle = cycle * 2.399963
    const radius = 0.00025 * (1 + (cycle % 4))

    return {
      x: source.x + Math.cos(angle) * radius,
      y: source.y + Math.sin(angle) * radius,
      strength: source.strength * (0.72 + ((cycle + i) % 5) * 0.05),
    }
  })
}

function sampleImage(src: string, size = 720): Promise<Point[]> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, size, size)

      // Keep each source's original aspect ratio.
      // The square sampling surface prevents the globe from becoming vertically stretched.
      const scale = Math.min(size / image.width, size / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale

      ctx.drawImage(
        image,
        (size - drawWidth) / 2,
        (size - drawHeight) / 2,
        drawWidth,
        drawHeight,
      )

      const pixels = ctx.getImageData(0, 0, size, size).data
      const candidates: Point[] = []

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const index = (y * size + x) * 4
          const brightness =
            (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (255 * 3)

          if (brightness < 0.27) continue

          const strength = clamp((brightness - 0.27) / 0.73, 0, 1)

          candidates.push({
            x: x / size - 0.5,
            y: y / size - 0.5,
            strength,
          })
        }
      }

      resolve(candidates)
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
  const progressRef = useRef(progress)
  const targetsRef = useRef<Point[][]>([])

  const seed = useMemo(
    () =>
      Array.from({ length: 12000 }, (_, index) => {
        const value = Math.sin(index * 12.9898) * 43758.5453
        return value - Math.floor(value)
      }),
    [],
  )

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

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

    const particleCount = Math.round(
      (window.innerWidth < 760 ? 5000 : 8500) * particleDensity,
    )

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.15 : 1.5)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const render = () => {
      if (disposed || targetsRef.current.length !== images.length) return

      ctx.clearRect(0, 0, width, height)

      const p = clamp(progressRef.current, 0, images.length - 1)
      const segment = Math.min(images.length - 2, Math.floor(p))
      const local = p - segment
      const eased = smoothstep(local)

      const scale = Math.min(width, height) * 1.18
      const time = performance.now() * 0.00035

      const from = targetsRef.current[segment]
      const to = targetsRef.current[segment + 1]

      for (let i = 0; i < particleCount; i += 1) {
        const noise = seed[i % seed.length]
        const a = from[i]
        const b = to[i]

        const fromScale = segment === 1 ? 0.80 : 1
        const toScale = segment === 0 ? 0.80 : 1

        const startX = a.x * fromScale
        const startY = a.y * fromScale
        const endX = b.x * toScale
        const endY = b.y * toScale

        let nx = lerp(startX, endX, eased)
        let ny = lerp(startY, endY, eased)

        const travel = Math.sin(Math.PI * local)
        const angle = noise * Math.PI * 2 + time * (0.3 + noise * 0.7)
        const burst = travel * (0.003 + noise * 0.009)

        nx += Math.cos(angle) * burst
        ny += Math.sin(angle) * burst

        nx += Math.sin(time * 2 + noise * 18) * 0.00045
        ny += Math.cos(time * 1.7 + noise * 15) * 0.00045

        const x = width * 0.5 + nx * scale
        const y = height * 0.5 + ny * scale

        ctx.globalAlpha = 0.62 + Math.min(0.38, (a.strength + b.strength) * 0.22)
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, window.innerWidth < 760 ? 0.82 : 1.02, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      frame = requestAnimationFrame(render)
    }

    const loadTargets = async () => {
      try {
        const candidates = await Promise.all(images.map((src) => sampleImage(src)))
        targetsRef.current = candidates.map((points) => selectEvenly(points, particleCount))

        if (!disposed) {
          render()
        }
      } catch (error) {
        console.error(error)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    void loadTargets()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [images, particleDensity, seed])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
