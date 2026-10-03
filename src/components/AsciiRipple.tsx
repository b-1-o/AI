import { useEffect, useRef } from 'react'

const TEXT = 'AI CODE REACT NEXT.JS TYPESCRIPT GITHUB VERCEL REACT BITS MOTION API UI UX DESIGN SYSTEMS EXPERIMENTS '

export default function AsciiRipple() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ripples = useRef<Array<{ x: number; y: number; strength: number }>>([])
  const pointer = useRef({ down: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let width = 0
    let height = 0
    let frame = 0

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const addRipple = (x: number, y: number, strength: number) => {
      ripples.current.push({ x, y, strength })
      if (ripples.current.length > 12) ripples.current.shift()
    }

    const pointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (pointer.current.down) addRipple(event.clientX - rect.left, event.clientY - rect.top, 0.32)
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
      ctx.clearRect(0, 0, width, height)
      ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.textBaseline = 'middle'
      let cursor = 0

      for (let y = 10; y < height; y += 17) {
        for (let x = 0; x < width; x += 12) {
          let wave = 0
          for (const ripple of ripples.current) {
            const distance = Math.hypot(x - ripple.x, y - ripple.y)
            wave += Math.sin(distance * 0.075 - time * 0.004) * Math.exp(-distance / 125) * ripple.strength
          }
          const intensity = Math.min(1, Math.abs(wave))
          const glyphs = ' .,:;+=*#%@'
          const glyph = glyphs[Math.min(glyphs.length - 1, Math.floor(intensity * glyphs.length))]
          ctx.globalAlpha = 0.04 + intensity * 0.12
          ctx.fillStyle = '#ffffff'
          ctx.fillText(TEXT[cursor % TEXT.length], x, y + Math.sin(wave) * 2)
          if (intensity > 0.5) {
            ctx.globalAlpha = 0.15
            ctx.fillText(glyph, x, y)
          }
          cursor += 1
        }
      }

      ripples.current = ripples.current
        .map((ripple) => ({ ...ripple, strength: ripple.strength * 0.965 }))
        .filter((ripple) => ripple.strength > 0.02)

      ctx.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointerup', pointerUp)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerdown', pointerDown)
      window.removeEventListener('pointerup', pointerUp)
    }
  }, [])

  return <canvas ref={canvasRef} className="ascii-ripple" aria-hidden="true" />
}
