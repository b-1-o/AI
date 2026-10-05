import { useEffect, useRef, useState, useCallback } from 'react'
import ParticleMorph from './components/ParticleMorph'
import DecryptedText from './components/DecryptedText'
import AIStack from './components/AIStack'
import TargetCursor from './components/TargetCursor'
import './components/CrystalScroll.css'
import { LogoGitHub, LogoLinkedIn } from './components/Logos'
import b1oImage from '../assets/b1o.jpg'
import ballImage from '../assets/ball.jpg'
import keyboardImage from '../assets/keyboard.jpg'
import crystalImage from '../assets/crystal.jpg'
import squareImage from '../assets/squere.jpeg'
import palatImage from '../assets/palat.jpeg'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const particleImages = [b1oImage, ballImage, keyboardImage, crystalImage]

const CRYSTALS = [
  { id: 'ChatGPT', caption: 'ChatGPT — initial build', leaf: 'gpt-role' },
  { id: 'Grok', caption: 'Grok — perfect finish', leaf: 'grok-role' },
  { id: 'Gemini', caption: 'Gemini — images & effects', leaf: 'gem-role' },
  { id: 'Work', caption: 'Work — selected builds', leaf: null as string | null },
  { id: 'Contact', caption: 'Contact — reach out', leaf: null as string | null },
] as const

const BALL_STOP = 1
const KEYBOARD_STOP = 2
const CRYSTAL_START = 3
const MAX_PROGRESS = CRYSTAL_START + (CRYSTALS.length - 1)
const DESKTOP_SENSITIVITY = 0.00085
const TOUCH_SENSITIVITY = 0.00125
const MORPH_SPEED = 0.85
const SNAP_DELAY = 340

const projects = [
  { name: 'nothing', type: 'Product design experiment', stack: 'React · Visual systems · Interaction', href: 'https://b-1-o.github.io/nothing/' },
  { name: 'b1api', type: 'Developer API experiment', stack: 'TypeScript · APIs · Tooling', href: 'https://b-1-o.github.io/music/' },
  { name: 'coffee', type: 'Homemade coffee & dessert experience', stack: 'React · Motion · Product UI', href: 'https://b-1-o.github.io/coffee/' },
  { name: 'portfolio', type: 'Personal portfolio', stack: 'React · Motion · Design systems', href: 'https://b-1-o.github.io/portfolio/' },
  { name: 'myUI', type: 'Experimental frontend / UI system', stack: 'React · TypeScript · Motion · GitHub Pages', href: 'https://b-1-o.github.io/myUI/' },
  { name: 'heaven', type: 'Developer command center', stack: 'Next.js · TypeScript · PostgreSQL · Vercel', href: 'https://heaven-b1o.vercel.app/' },
]

const contacts = [
  { name: 'GitHub', href: 'https://github.com/b-1-o', desc: 'Code, experiments, open work', Logo: LogoGitHub },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/b1o', desc: 'Profile & professional contact', Logo: LogoLinkedIn },
  { name: 'Fiverr', href: 'https://www.fiverr.com/users/webbio', desc: 'Hire for builds & interfaces', Logo: null as null | typeof LogoGitHub },
]

function morphProgress(p: number) {
  return clamp(p, 0, 3)
}

function crystalIndex(p: number) {
  if (p < CRYSTAL_START) return -1
  return clamp(Math.round(p - CRYSTAL_START), 0, CRYSTALS.length - 1)
}

function App() {
  const [globeActive, setGlobeActive] = useState(false)
  const [keyboardActive, setKeyboardActive] = useState(false)
  const [crystalActive, setCrystalActive] = useState(false)
  const [activeCrystal, setActiveCrystal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [panelReady, setPanelReady] = useState(false)
  const [particleVisible, setParticleVisible] = useState(true)
  const modalOpenRef = useRef(false)

  const targetProgressRef = useRef(0)
  const renderedProgressRef = useRef(0)
  const morphProgressRef = useRef(0)
  const dissolveRef = useRef(0)
  const panelRef = useRef(0)
  const panelAnimRef = useRef<number | null>(null)
  const dissolveAnimRef = useRef<number | null>(null)
  const lastTouchY = useRef(0)
  const lastDirectionRef = useRef(0)
  const snapTimerRef = useRef<number | null>(null)
  const crystalExitTimerRef = useRef<number | null>(null)
  const crystalExitAnimatingRef = useRef(false)
  const wakeAnimationRef = useRef<(() => void) | null>(null)
  const applyProgressRef = useRef<(n: number) => void>(() => {})
  const globeActiveRef = useRef(false)
  const keyboardActiveRef = useRef(false)
  const crystalActiveRef = useRef(false)
  const activeCrystalRef = useRef(0)

  const introImageRef = useRef<HTMLDivElement | null>(null)
  const globeCaptionRef = useRef<HTMLDivElement | null>(null)
  const keyboardCaptionRef = useRef<HTMLDivElement | null>(null)
  const crystalCaptionRef = useRef<HTMLDivElement | null>(null)

  const scheduleDirectionalSnap = useCallback((direction: number) => {
    lastDirectionRef.current = direction
    if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current)
    snapTimerRef.current = window.setTimeout(() => {
      const current = targetProgressRef.current
      const dir = lastDirectionRef.current
      const stops: number[] = [0, BALL_STOP, KEYBOARD_STOP]
      for (let i = 0; i < CRYSTALS.length; i++) stops.push(CRYSTAL_START + i)
      let target = current
      if (dir > 0) {
        target = stops.find((s) => s > current + 0.08) ?? current
      } else if (dir < 0) {
        target = [...stops].reverse().find((s) => s < current - 0.08) ?? current
      }
      targetProgressRef.current = clamp(target, 0, MAX_PROGRESS)
      wakeAnimationRef.current?.()
    }, SNAP_DELAY)
  }, [])

  const applyProgress = useCallback((raw: number) => {
    const next = clamp(raw, 0, MAX_PROGRESS)
    morphProgressRef.current = morphProgress(next)

    if (introImageRef.current) {
      const fade = clamp(1 - next / 0.92, 0, 1)
      introImageRef.current.style.opacity = String(fade)
      introImageRef.current.style.transform = 'scale(' + (1 + next * 0.018) + ')'
    }

    const globeOpacity = clamp(1 - Math.abs(next - 1) / 0.32, 0, 1)
    const keyboardOpacity = clamp(1 - Math.abs(next - 2) / 0.32, 0, 1)
    const crystalOpacity = clamp((next - 2.45) / 0.4, 0, 1)

    if (globeCaptionRef.current) {
      globeCaptionRef.current.style.opacity = String(
        globeOpacity * (1 - keyboardOpacity) * (1 - crystalOpacity),
      )
    }
    if (keyboardCaptionRef.current) {
      keyboardCaptionRef.current.style.opacity = String(keyboardOpacity * (1 - crystalOpacity))
    }
    if (crystalCaptionRef.current) {
      crystalCaptionRef.current.style.opacity = String(crystalOpacity)
      crystalCaptionRef.current.style.transform =
        'translate3d(0,' + (16 - crystalOpacity * 16) + 'px,0)'
    }

    const nextGlobe = globeOpacity > 0.35 && keyboardOpacity < 0.4 && crystalOpacity < 0.35
    if (nextGlobe !== globeActiveRef.current) {
      globeActiveRef.current = nextGlobe
      setGlobeActive(nextGlobe)
    }
    const nextKeyboard = keyboardOpacity > 0.35 && crystalOpacity < 0.4
    if (nextKeyboard !== keyboardActiveRef.current) {
      keyboardActiveRef.current = nextKeyboard
      setKeyboardActive(nextKeyboard)
    }
    const nextCrystal = crystalOpacity > 0.4
    if (nextCrystal !== crystalActiveRef.current) {
      crystalActiveRef.current = nextCrystal
      setCrystalActive(nextCrystal)
    }

    const idx = crystalIndex(next)
    if (idx >= 0 && idx !== activeCrystalRef.current) {
      const prev = activeCrystalRef.current
      activeCrystalRef.current = idx
      setActiveCrystal(idx)
      if (prev >= 0 && crystalActiveRef.current) {
        if (dissolveAnimRef.current) cancelAnimationFrame(dissolveAnimRef.current)
        const start = performance.now()
        const DUR = 900
        const run = (now: number) => {
          const u = Math.min(1, (now - start) / DUR)
          if (u < 0.45) dissolveRef.current = u / 0.45
          else dissolveRef.current = 1 - (u - 0.45) / 0.55
          if (u < 1) dissolveAnimRef.current = requestAnimationFrame(run)
          else {
            dissolveRef.current = 0
            dissolveAnimRef.current = null
          }
        }
        dissolveAnimRef.current = requestAnimationFrame(run)
      }
    }
  }, [])

  useEffect(() => {
    applyProgressRef.current = applyProgress
  }, [applyProgress])

  const exitCrystalToHome = useCallback(() => {
    if (crystalExitAnimatingRef.current) return
    crystalExitAnimatingRef.current = true

    if (snapTimerRef.current !== null) {
      window.clearTimeout(snapTimerRef.current)
      snapTimerRef.current = null
    }
    if (panelAnimRef.current !== null) {
      cancelAnimationFrame(panelAnimRef.current)
      panelAnimRef.current = null
    }
    if (dissolveAnimRef.current !== null) {
      cancelAnimationFrame(dissolveAnimRef.current)
      dissolveAnimRef.current = null
    }

    panelRef.current = 0
    dissolveRef.current = 0
    modalOpenRef.current = false

    // Reset the navigation state completely before revealing the home scene.
    // This is the same particle buffer; no WebGL context or geometry is rebuilt.
    targetProgressRef.current = 0
    renderedProgressRef.current = 0
    morphProgressRef.current = 0
    activeCrystalRef.current = 0
    globeActiveRef.current = false
    keyboardActiveRef.current = false
    crystalActiveRef.current = false

    setPanelReady(false)
    setModalOpen(false)
    setActiveCrystal(0)
    setGlobeActive(false)
    setKeyboardActive(false)
    setCrystalActive(false)

    // First hide the current crystal, then switch the existing buffer to b1o
    // while hidden, and only then reveal it again.
    setParticleVisible(false)

    if (crystalExitTimerRef.current !== null) {
      window.clearTimeout(crystalExitTimerRef.current)
    }
    crystalExitTimerRef.current = window.setTimeout(() => {
      applyProgressRef.current(0)

      // Give the browser a frame to paint the reset b1o buffer before fading it in.
      requestAnimationFrame(() => {
        crystalExitTimerRef.current = null
        setParticleVisible(true)

        requestAnimationFrame(() => {
          crystalExitAnimatingRef.current = false
          wakeAnimationRef.current?.()
        })
      })
    }, 280)
  }, [])

  useEffect(() => {
    let raf = 0
    let running = true
    const tick = () => {
      if (!running) return
      const target = targetProgressRef.current
      const current = renderedProgressRef.current
      const delta = target - current
      if (Math.abs(delta) > 0.00008) {
        renderedProgressRef.current = current + delta * Math.min(1, MORPH_SPEED * 0.055)
        applyProgress(renderedProgressRef.current)
        raf = requestAnimationFrame(tick)
      } else {
        renderedProgressRef.current = target
        applyProgress(target)
        raf = 0
      }
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    wakeAnimationRef.current = wake

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()

      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0
      if (dir === 0) return

      // Only leave the crystal timeline from Contact, and only when scrolling down.
      // Wheel down = deltaY > 0.
      if (
        dir > 0 &&
        targetProgressRef.current >= CRYSTAL_START &&
        activeCrystalRef.current === CRYSTALS.length - 1
      ) {
        exitCrystalToHome()
        return
      }

      if (modalOpenRef.current) {
        if (dir < 0 && activeCrystalRef.current > 0) {
          closePanel()
        } else {
          return
        }
      }

      targetProgressRef.current = clamp(
        targetProgressRef.current + e.deltaY * DESKTOP_SENSITIVITY,
        0,
        MAX_PROGRESS,
      )
      scheduleDirectionalSnap(dir)
      wake()
    }
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY.current = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? lastTouchY.current
      const dy = lastTouchY.current - y
      lastTouchY.current = y
      const dir = dy > 0 ? 1 : dy < 0 ? -1 : 0
      if (dir === 0) return

      // Only leave the crystal timeline from Contact, and only when swiping down.
      // Finger moving down => dy < 0.
      if (
        dir < 0 &&
        targetProgressRef.current >= CRYSTAL_START &&
        activeCrystalRef.current === CRYSTALS.length - 1
      ) {
        exitCrystalToHome()
        return
      }

      if (modalOpenRef.current) {
        if (dir > 0 && activeCrystalRef.current > 0) {
          closePanel()
        } else {
          return
        }
      }

      targetProgressRef.current = clamp(
        targetProgressRef.current + dy * TOUCH_SENSITIVITY,
        0,
        MAX_PROGRESS,
      )
      scheduleDirectionalSnap(dir)
      wake()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    applyProgress(0)
    wake()
    return () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current)
      if (dissolveAnimRef.current) cancelAnimationFrame(dissolveAnimRef.current)
      if (panelAnimRef.current) cancelAnimationFrame(panelAnimRef.current)
      if (crystalExitTimerRef.current !== null) window.clearTimeout(crystalExitTimerRef.current)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [applyProgress, scheduleDirectionalSnap])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [])

  const animatePanel = useCallback((to: number, onDone?: () => void) => {
    if (panelAnimRef.current) cancelAnimationFrame(panelAnimRef.current)
    const from = panelRef.current
    const start = performance.now()
    const DUR = 780
    const run = (now: number) => {
      const u = Math.min(1, (now - start) / DUR)
      const s = u * u * (3 - 2 * u)
      panelRef.current = from + (to - from) * s
      if (u < 1) panelAnimRef.current = requestAnimationFrame(run)
      else {
        panelRef.current = to
        panelAnimRef.current = null
        onDone?.()
      }
    }
    panelAnimRef.current = requestAnimationFrame(run)
  }, [])

  const openPanel = useCallback(() => {
    modalOpenRef.current = true
    setModalOpen(true)
    setPanelReady(false)
    panelRef.current = 0
    animatePanel(1, () => setPanelReady(true))
  }, [animatePanel])

  const closePanel = useCallback(() => {
    setPanelReady(false)
    animatePanel(0, () => {
      modalOpenRef.current = false
      setModalOpen(false)
    })
  }, [animatePanel])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, closePanel])

  const crystal = CRYSTALS[activeCrystal]
  const hint = crystalActive ? 'Click crystal · scroll for next' : 'Scroll'

  return (
    <div className="app-shell">
      <section className="intro-stage" aria-label="Intro morph">
        <div ref={introImageRef} className="intro-image" style={{ opacity: 1 }}>
          <img src={palatImage} alt="" draggable={false} />
        </div>
        <div className="intro-vignette" aria-hidden="true" />
        <ParticleMorph
          images={particleImages}
          squareSrc={squareImage}
          progressRef={morphProgressRef}
          dissolveRef={dissolveRef}
          panelRef={panelRef}
          particleDensity={1}
          className={particleVisible ? 'particle-canvas' : 'particle-canvas particle-canvas--fade-out'}
        />
        {crystalActive && !modalOpen && (
          <button
            type="button"
            className="crystal-hit"
            aria-label={`Open ${crystal.id}`}
            onClick={() => openPanel()}
          />
        )}
        <div className="intro-copy">
          <div ref={globeCaptionRef} className="morph-caption morph-caption-globe" style={{ opacity: 0 }}>
            <DecryptedText
              text="AI is not enemy, it's tool"
              animateOn="active"
              active={globeActive}
              sequential
              speed={28}
              revealDirection="start"
              parentClassName="decrypted-caption"
              encryptedClassName="decrypted-encrypted"
            />
          </div>
          <div ref={keyboardCaptionRef} className="morph-caption morph-caption-keyboard" style={{ opacity: 0 }}>
            <DecryptedText
              text="I use AI as tool, and here's how I do it..."
              animateOn="active"
              active={keyboardActive}
              sequential
              speed={26}
              revealDirection="start"
              parentClassName="decrypted-caption"
              encryptedClassName="decrypted-encrypted"
            />
          </div>
          <div ref={crystalCaptionRef} className="morph-caption morph-caption-crystal" style={{ opacity: 0 }}>
            <DecryptedText
              key={crystal.id}
              text={crystal.caption}
              animateOn="active"
              active={crystalActive}
              sequential
              speed={26}
              revealDirection="start"
              parentClassName="decrypted-caption"
              encryptedClassName="decrypted-encrypted"
            />
          </div>
        </div>
        <div className="intro-ui">
          <span className="intro-hint">{hint}</span>
        </div>
      </section>

      {modalOpen && (crystal.id === 'Work' || crystal.id === 'Contact') && (
        <TargetCursor
          spinDuration={5}
          hideDefaultCursor
          parallaxOn
          hoverDuration={0.8}
          cursorColor="#ffffff"
          cursorColorOnTarget="#ffffff"
        />
      )}
      {modalOpen && (
        <div className="crystal-inline" role="dialog" aria-modal="true" aria-label={crystal.id}>
          <button type="button" className="crystal-inline-dismiss" aria-label="Close" onClick={closePanel} />
          <button type="button" className="crystal-inline-mobile-close" aria-label={`Close ${crystal.id}`} onClick={closePanel}>
            <span aria-hidden="true">×</span>
          </button>
          <div className={`crystal-inline-content${panelReady ? ' crystal-inline-content--in' : ''}`}>
              {(crystal.id === 'ChatGPT' || crystal.id === 'Grok' || crystal.id === 'Gemini') && crystal.leaf && (
                <AIStack focusModel={crystal.id} defaultLeaf={crystal.leaf} />
              )}
              {crystal.id === 'Work' && (
                <div className="menu-hub-work">
                  <p className="menu-hub-lead">Real products and experiments — interfaces, motion, systems.</p>
                  <div className="hub-project-grid">
                    {projects.map((project, index) => (
                      <a className="hub-project cursor-target" href={project.href} target="_blank" rel="noreferrer" key={project.name}>
                        <div className="hub-project-top">
                          <span className="hub-project-num">0{index + 1}</span>
                          <span className="hub-project-arrow" aria-hidden="true">↗</span>
                        </div>
                        <h3>{project.name}</h3>
                        <p>{project.type}</p>
                        <span className="hub-project-stack">{project.stack}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {crystal.id === 'Contact' && (
                <div className="menu-hub-contact">
                  <p className="menu-hub-lead">Open a channel — code, hire, or just say hi.</p>
                  <div className="hub-contact-grid">
                    {contacts.map((c) => (
                      <a className="hub-contact-card cursor-target" href={c.href} target="_blank" rel="noreferrer" key={c.name}>
                        <span className="hub-contact-icon">
                          {c.Logo ? <c.Logo size={22} /> : <span className="hub-contact-letter">F</span>}
                        </span>
                        <span className="hub-contact-name">{c.name}</span>
                        <span className="hub-contact-desc">{c.desc}</span>
                        <span className="hub-contact-go">Open ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
