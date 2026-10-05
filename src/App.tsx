import { useEffect, useRef, useState, useCallback } from 'react'
import ParticleMorph from './components/ParticleMorph'
import DecryptedText from './components/DecryptedText'
import MenuHub from './components/MenuHub'
import b1oImage from '../assets/b1o.jpg'
import ballImage from '../assets/ball.jpg'
import keyboardImage from '../assets/keyboard.jpg'
import palatImage from '../assets/palat.jpeg'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const particleImages = [b1oImage, ballImage, keyboardImage]

const BALL_STOP = 1
const KEYBOARD_END = 2
const DESKTOP_SENSITIVITY = 0.00105
const TOUCH_SENSITIVITY = 0.00155
const MORPH_SPEED = 1.3
const SNAP_DELAY = 280
const EXIT_SCROLL_THRESHOLD = 180
const EXIT_DURATION_MS = 900

type Phase = 'intro' | 'exiting' | 'hub'

function App() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [globeActive, setGlobeActive] = useState(false)
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [exitT, setExitT] = useState(0)

  const targetProgressRef = useRef(0)
  const renderedProgressRef = useRef(0)
  const lastTouchY = useRef(0)
  const lastDirectionRef = useRef(0)
  const snapTimerRef = useRef<number | null>(null)
  const wakeAnimationRef = useRef<(() => void) | null>(null)
  const globeActiveRef = useRef(false)
  const keyboardActiveRef = useRef(false)
  const exitAccumRef = useRef(0)
  const returnAccumRef = useRef(0)
  const exitStartRef = useRef(0)
  const exitRafRef = useRef<number | null>(null)
  const phaseRef = useRef<Phase>('intro')

  const introStageRef = useRef<HTMLElement | null>(null)
  const introImageRef = useRef<HTMLDivElement | null>(null)
  const globeCaptionRef = useRef<HTMLDivElement | null>(null)
  const keyboardCaptionRef = useRef<HTMLDivElement | null>(null)

  phaseRef.current = phase

  const scheduleDirectionalSnap = (direction: number) => {
    lastDirectionRef.current = direction
    if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current)
    snapTimerRef.current = window.setTimeout(() => {
      if (phaseRef.current !== 'intro') return
      const current = targetProgressRef.current
      const dir = lastDirectionRef.current
      if (dir > 0) targetProgressRef.current = current < BALL_STOP ? BALL_STOP : KEYBOARD_END
      else if (dir < 0) targetProgressRef.current = current > BALL_STOP ? BALL_STOP : 0
      snapTimerRef.current = null
      wakeAnimationRef.current?.()
    }, SNAP_DELAY)
  }

  const beginExit = useCallback(() => {
    if (phaseRef.current !== 'intro') return
    phaseRef.current = 'exiting'
    setPhase('exiting')
    exitStartRef.current = performance.now()
    const tick = (now: number) => {
      const t = clamp((now - exitStartRef.current) / EXIT_DURATION_MS, 0, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setExitT(eased)
      if (introStageRef.current) introStageRef.current.style.opacity = String(1 - eased)
      if (t < 1) exitRafRef.current = requestAnimationFrame(tick)
      else {
        exitRafRef.current = null
        phaseRef.current = 'hub'
        setPhase('hub')
        setExitT(1)
      }
    }
    exitRafRef.current = requestAnimationFrame(tick)
  }, [])

  const beginReturn = useCallback(() => {
    if (phaseRef.current !== 'hub') return
    if (exitRafRef.current) cancelAnimationFrame(exitRafRef.current)
    targetProgressRef.current = KEYBOARD_END
    renderedProgressRef.current = KEYBOARD_END
    exitAccumRef.current = 0
    returnAccumRef.current = 0
    setExitT(0)
    setGlobeActive(false)
    setKeyboardActive(true)
    globeActiveRef.current = false
    keyboardActiveRef.current = true
    phaseRef.current = 'intro'
    setPhase('intro')
    window.scrollTo(0, 0)
    requestAnimationFrame(() => {
      if (introStageRef.current) introStageRef.current.style.opacity = '1'
      wakeAnimationRef.current?.()
    })
  }, [])

  const setTargetProgress = (delta: number, sensitivity: number) => {
    if (phaseRef.current !== 'intro') return
    const direction = Math.sign(delta)
    if (!direction) return
    const atKeyboard = renderedProgressRef.current >= 1.92
    if (atKeyboard && direction > 0) {
      exitAccumRef.current += Math.abs(delta)
      if (exitAccumRef.current >= EXIT_SCROLL_THRESHOLD) {
        beginExit()
        return
      }
      targetProgressRef.current = KEYBOARD_END
      scheduleDirectionalSnap(direction)
      wakeAnimationRef.current?.()
      return
    }
    if (direction < 0) exitAccumRef.current = 0
    targetProgressRef.current = clamp(targetProgressRef.current + delta * sensitivity, 0, KEYBOARD_END)
    scheduleDirectionalSnap(direction)
    wakeAnimationRef.current?.()
  }

  useEffect(() => {
    let frame = 0
    let previousTime = performance.now()
    const animate = (time: number) => {
      const current = renderedProgressRef.current
      const target = targetProgressRef.current
      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.05)
      previousTime = time
      const maxStep = MORPH_SPEED * deltaSeconds
      const distance = target - current
      const next = Math.abs(distance) <= maxStep ? target : current + Math.sign(distance) * maxStep
      renderedProgressRef.current = next
      const progress = renderedProgressRef.current
      if (introImageRef.current) {
        introImageRef.current.style.opacity = String(clamp(1 - progress / 0.92, 0, 1))
        introImageRef.current.style.transform = 'scale(' + (1 + progress * 0.018) + ')'
      }
      const globeOpacity = clamp(1 - Math.abs(progress - 1) / 0.32, 0, 1)
      const keyboardOpacity = clamp((progress - 1.58) / 0.3, 0, 1)
      if (globeCaptionRef.current) {
        globeCaptionRef.current.style.opacity = String(globeOpacity)
        globeCaptionRef.current.style.transform = 'translate3d(0,' + (12 - globeOpacity * 12) + 'px,0)'
      }
      if (keyboardCaptionRef.current) {
        keyboardCaptionRef.current.style.opacity = String(keyboardOpacity)
        keyboardCaptionRef.current.style.transform = 'translate3d(0,' + (20 - keyboardOpacity * 20) + 'px,0)'
      }
      const nextGlobe = globeOpacity > 0.35
      if (nextGlobe !== globeActiveRef.current) {
        globeActiveRef.current = nextGlobe
        setGlobeActive(nextGlobe)
      }
      const nextKeyboard = keyboardOpacity > 0.35
      if (nextKeyboard !== keyboardActiveRef.current) {
        keyboardActiveRef.current = nextKeyboard
        setKeyboardActive(nextKeyboard)
      }
      const settled = Math.abs(target - next) < 0.0001
      if (!settled) frame = requestAnimationFrame(animate)
      else frame = 0
    }
    wakeAnimationRef.current = () => {
      if (frame === 0) frame = requestAnimationFrame(animate)
    }
    wakeAnimationRef.current()
    return () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      wakeAnimationRef.current = null
    }
  }, [])

  useEffect(() => {
    if (phase !== 'intro') return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const normalized =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * window.innerHeight
            : event.deltaY
      setTargetProgress(normalized, DESKTOP_SENSITIVITY)
    }
    const onTouchStart = (event: TouchEvent) => {
      lastTouchY.current = event.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? lastTouchY.current
      const delta = lastTouchY.current - currentY
      lastTouchY.current = currentY
      event.preventDefault()
      setTargetProgress(delta, TOUCH_SENSITIVITY)
    }
    const onTouchEnd = () => {
      if (lastDirectionRef.current !== 0 && phaseRef.current === 'intro') scheduleDirectionalSnap(lastDirectionRef.current)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current)
    }
  }, [phase, beginExit])

  useEffect(() => {
    if (phase !== 'hub') return
    const onWheel = (event: WheelEvent) => {
      const atTop = window.scrollY <= 4
      if (!atTop || event.deltaY >= 0) {
        if (event.deltaY > 0) returnAccumRef.current = 0
        return
      }
      event.preventDefault()
      const normalized =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * window.innerHeight
            : event.deltaY
      returnAccumRef.current += Math.abs(normalized)
      if (returnAccumRef.current >= EXIT_SCROLL_THRESHOLD) beginReturn()
    }
    let lastY = 0
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? lastY
      const delta = lastY - y
      lastY = y
      const atTop = window.scrollY <= 4
      if (!atTop || delta >= 0) {
        if (delta > 0) returnAccumRef.current = 0
        return
      }
      e.preventDefault()
      returnAccumRef.current += Math.abs(delta)
      if (returnAccumRef.current >= EXIT_SCROLL_THRESHOLD * 0.7) beginReturn()
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [phase, beginReturn])

  useEffect(() => {
    document.body.style.overflow = phase === 'hub' ? '' : 'hidden'
    document.body.style.overscrollBehavior = phase === 'hub' ? 'auto' : 'none'
    return () => {
      document.body.style.overflow = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [phase])

  useEffect(() => () => {
    if (exitRafRef.current) cancelAnimationFrame(exitRafRef.current)
  }, [])

  const showIntro = phase === 'intro' || phase === 'exiting'

  return (
    <div className="site">
      {showIntro && (
        <section
          ref={introStageRef}
          className="intro-stage"
          aria-label="b1o particle intro"
          style={{
            opacity: phase === 'exiting' ? 1 - exitT : 1,
            pointerEvents: phase === 'exiting' ? 'none' : undefined,
          }}
        >
          <div
            ref={introImageRef}
            className="intro-image"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(5,5,5,0.05), rgba(5,5,5,0.78) 70%, #050505 100%), url('${palatImage}')`,
            }}
          />
          <div className="intro-vignette" />
          <ParticleMorph images={particleImages} progressRef={renderedProgressRef} particleDensity={1} className="particle-canvas" />
          <div className="intro-copy">
            <div ref={globeCaptionRef} className="morph-caption morph-caption-globe" style={{ opacity: 0 }}>
              <DecryptedText text="AI is not enemy, it's tool" animateOn="active" active={globeActive} sequential speed={28} revealDirection="start" parentClassName="decrypted-caption" encryptedClassName="decrypted-encrypted" />
            </div>
            <div ref={keyboardCaptionRef} className="morph-caption morph-caption-keyboard" style={{ opacity: 0 }}>
              <DecryptedText text="I use AI as tool, and here's how I do it..." animateOn="active" active={keyboardActive} sequential speed={26} revealDirection="start" parentClassName="decrypted-caption" encryptedClassName="decrypted-encrypted" />
            </div>
          </div>
          <div className="intro-ui">
            <span className="intro-index">01 / 03</span>
            <span className="intro-hint">{phase === 'exiting' ? 'ENTERING' : keyboardActive ? 'SCROLL TO CONTINUE' : 'SCROLL TO MORPH'}</span>
          </div>
        </section>
      )}
      {phase === 'hub' && (
        <div className="hub-enter">
          <MenuHub onBackToIntro={beginReturn} />
        </div>
      )}
    </div>
  )
}

export default App
