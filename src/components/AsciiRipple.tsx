import { useEffect, useRef } from 'react'

const TEXT = 'AI CODE REACT NEXT.JS TYPESCRIPT GITHUB VERCEL REACT BITS MOTION API UI UX DESIGN SYSTEMS EXPERIMENTS '

export default function AsciiRipple() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ripples = useRef<Array<{ x: number; y: number; strength: number }>>([])
  const pointer = useRef({ down: false })
  const visible = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let frame = 0
    let charPositions: Array<{ x: number; y: number; char: string }> = []
    let hasActivity = false
    let idleFrames = 0

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight

      const dpr = Math.min(window.devicePixelRatio || 1, 1.1)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'

      // Sparser grid — still looks dense, ~2.5× fewer glyphs
      const stepX = width < 600 ? 14 : 13
      const stepY = width < 600 ? 20 : 18
      const next: Array<{ x: number; y: number; char: string }> = []
      let cursor = 0

      for (let y = 10; y < height; y += stepY) {
        for (let x = 0; x < width; x += stepX) {
          next.push({ x, y, char: TEXT[cursor % TEXT.length] })
          cursor += 1
        }
      }

      charPositions = next
    }

    const addRipple = (x: number, y: number, strength: number) => {
      ripples.current.push({ x, y, strength })
      if (ripples.current.length > 8) ripples.current.shift()
      hasActivity = true
      idleFrames = 0
      if (visible.current && frame === 0) {
        frame = requestAnimationFrame(draw)
      }
    }

    const pointerMove = (event: PointerEvent) => {
      if (!pointer.current.down) return
      const rect = canvas.getBoundingClientRect()
      addRipple(event.clientX - rect.left, event.clientY - rect.top, 0.32)
    }

    const pointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      addRipple(event.clientX - rect.left, event.clientY - rect.top, 1.25)
      pointer.current.down = true
    }

    const pointerUp = () => {
      pointer.current.down = false
    }

    const draw = (time: number) => {
      if (!visible.current) {
        frame = 0
        return
      }

      const rippleList = ripples.current
      const len = rippleList.length

      // When completely idle, draw once more then sleep
      if (len === 0 && !hasActivity) {
        idleFrames += 1
        if (idleFrames > 3) {
          frame = 0
          return
        }
      } else {
        idleFrames = 0
      }

      ctx.clearRect(0, 0, width, height)

      const positions = charPositions
      const posLen = positions.length

      // Pre-compute ripple data once per frame
      for (let pi = 0; pi < posLen; pi++) {
        const point = positions[pi]
        let wave = 0

        for (let ri = 0; ri < len; ri++) {
          const ripple = rippleList[ri]
          const dx = point.x - ripple.x
          const dy = point.y - ripple.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          wave +=
            Math.sin(distance * 0.075 - time * 0.004) *
            Math.exp(-distance / 125) *
            ripple.strength
        }

        const intensity = Math.min(1, Math.abs(wave))
        ctx.globalAlpha = 0.04 + intensity * 0.12
        ctx.fillText(point.char, point.x, point.y + Math.sin(wave) * 2)

        if (intensity > 0.5) {
          ctx.globalAlpha = 0.15
          ctx.fillText('@', point.x, point.y)
        }
      }

      let stillAlive = false
      for (let i = len - 1; i >= 0; i -= 1) {
        const ripple = rippleList[i]
        ripple.strength *= 0.965
        if (ripple.strength <= 0.02) {
          rippleList.splice(i, 1)
        } else {
          stillAlive = true
        }
      }

      hasActivity = stillAlive || pointer.current.down
      ctx.globalAlpha = 1

      if (hasActivity || idleFrames <= 3) {
        frame = requestAnimationFrame(draw)
      } else {
        frame = 0
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = Boolean(entry?.isIntersecting)

        if (visible.current && frame === 0) {
          // Always paint at least one frame when entering viewport
          hasActivity = true
          idleFrames = 0
          frame = requestAnimationFrame(draw)
        } else if (!visible.current && frame !== 0) {
          cancelAnimationFrame(frame)
          frame = 0
        }
      },
      { rootMargin: '200px 0px' },
    )

    resize()
    observer.observe(canvas)

    window.addEventListener('resize', resize, { passive: true })
    // Only listen while canvas is in view — cheaper
    const onPointerMove = (e: PointerEvent) => {
      if (!visible.current) return
      pointerMove(e)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!visible.current) return
      pointerDown(e)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', pointerUp, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', pointerUp)
    }
  }, [])

  return <canvas ref={canvasRef} className="ascii-ripple" aria-hidden="true" />
}
