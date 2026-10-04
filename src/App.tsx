import { useEffect, useMemo, useRef, useState } from 'react'
import ParticleMorph from './components/ParticleMorph'
import AsciiRipple from './components/AsciiRipple'
import RotatingBall from './components/RotatingBall'
import b1oImage from '../assets/b1o.jpg'
import ballImage from '../assets/ball.jpg'
import keyboardImage from '../assets/keyboard.jpg'
import palatImage from '../assets/palat.jpeg'

const projects = [
  { name: 'HEAVEN', type: 'Developer command center', stack: 'Next.js · TypeScript · PostgreSQL · Vercel', href: 'https://heaven-b1o.vercel.app/' },
  { name: 'myUI', type: 'Experimental frontend / UI system', stack: 'React · TypeScript · Motion · GitHub Pages', href: 'https://b-1-o.github.io/myUI/' },
  { name: 'Music', type: 'Modern music web application', stack: 'React · API · Player · Responsive UI', href: 'https://b-1-o.github.io/music/' },
  { name: 'Nothing', type: 'Product design experiment', stack: 'React · Visual systems · Interaction', href: 'https://github.com/b-1-o/nothing' },
  { name: 'Coffee', type: 'Homemade coffee & dessert experience', stack: 'React · Motion · Product UI', href: 'https://b-1-o.github.io/coffee/' },
  { name: 'b1api', type: 'Developer API experiment', stack: 'TypeScript · APIs · Tooling', href: 'https://github.com/b-1-o/b1api' },
]

const tools = [
  ['BUILD', 'React / Next.js / TypeScript / JavaScript'],
  ['DESIGN', 'Figma / UI systems / visual direction'],
  ['MOTION', 'React Bits / MotionSites / scroll choreography'],
  ['BACKEND', 'PostgreSQL / APIs / integrations'],
  ['SHIP', 'Git / GitHub / Vercel'],
  ['AI', 'Research / prompting / debugging / iteration'],
]

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function App() {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const progressRef = useRef(0)
  const lastTouchY = useRef(0)


  const progressRef = useRef(progress)
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const introText = useMemo(() => {
    const globeOpacity = clamp(1 - Math.abs(progress - 1) / 0.34, 0, 1)
    const keyboardOpacity = clamp((progress - 1.62) / 0.28, 0, 1)
    return { globeOpacity, keyboardOpacity }
  }, [progress])

  const setMorphProgress = (value: number) => {
    const next = clamp(value, 0, 2)
    progressRef.current = next
    setProgress(next)
    setIsComplete(next >= 1.999)
  }

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const atTop = window.scrollY <= 2
      const needsIntroControl = !isComplete || (atTop && event.deltaY < 0)
      if (!needsIntroControl) return

      event.preventDefault()
      const sensitivity = window.innerWidth < 760 ? 0.00195 : 0.00135
      setMorphProgress(progressRef.current + event.deltaY * sensitivity)
    }

    const onTouchStart = (event: TouchEvent) => {
      lastTouchY.current = event.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? lastTouchY.current
      const deltaY = lastTouchY.current - currentY
      lastTouchY.current = currentY

      const atTop = window.scrollY <= 2
      const needsIntroControl = !isComplete || (atTop && deltaY < 0)
      if (!needsIntroControl) return

      event.preventDefault()
      setMorphProgress(progressRef.current + deltaY * (window.innerWidth < 760 ? 0.0042 : 0.0024))
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [isComplete])

  useEffect(() => {
    document.body.style.overflow = isComplete ? '' : 'hidden'
    document.body.style.overscrollBehavior = isComplete ? 'auto' : 'none'

    return () => {
      document.body.style.overflow = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [isComplete])

  return (
    <div className="site">
      <section className="intro-stage" aria-label="b1o particle intro">
        <div
          className="intro-image"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(5,5,5,0.05), rgba(5,5,5,0.78) 70%, #050505 100%), url('${palatImage}')`,
            opacity: clamp(1 - progress / 0.92, 0, 1),
            transform: 'scale(' + (1 + progress * 0.018) + ')',
          }}
        />
        <div className="intro-vignette" />

        <ParticleMorph
          images={[b1oImage, ballImage, keyboardImage]}
          progress={progress}
          particleDensity={1}
          className="particle-canvas"
        />

        <RotatingBall
          src={ballImage}
          active={progress > 0.76 && progress < 1.34}
          opacity={clamp(1 - Math.abs(progress - 1) / 0.22, 0, 1)}
        />

        <div className="intro-copy">
          <div
            className="morph-caption morph-caption-globe"
            style={{
              opacity: introText.globeOpacity,
              transform: 'translate3d(0,' + (12 - introText.globeOpacity * 12) + 'px,0)',
            }}
          >
            <span>AI is not enemy, it's tool</span>
          </div>

          <div
            className="morph-caption morph-caption-keyboard"
            style={{
              opacity: introText.keyboardOpacity,
              transform: 'translate3d(0,' + (20 - introText.keyboardOpacity * 20) + 'px,0)',
            }}
          >
            <span>I use AI as tool, and here's how I do it...</span>
          </div>
        </div>

        <div className="intro-ui">
          <span className="intro-index">01 / 03</span>
          <span className="intro-hint">{isComplete ? 'SCROLL TO ENTER' : 'SCROLL TO MORPH'}</span>
        </div>

        <div className="intro-progress">
          <span style={{ transform: 'scaleX(' + progress / 2 + ')' }} />
        </div>

      </section>

      <main className="content">
        <section className="statement section-pad">
          <div className="eyebrow">01 — PRINCIPLE</div>
          <h1>
            AI is not the product.
            <br />
            <span>It&apos;s part of the process.</span>
          </h1>
          <p>
            I use AI as a tool for research, prototyping, implementation, debugging and iteration.
            The decisions, taste and direction still come from me.
          </p>
        </section>

        <section className="workflow section-pad">
          <div className="ascii-wrap">
            <AsciiRipple />
            <div className="ascii-content">
              <div className="eyebrow">02 — WORKFLOW</div>
              <h2>How I use AI.</h2>
              <div className="workflow-line">
                {['IDEA', 'RESEARCH', 'AI', 'PROTOTYPE', 'CODE', 'DEBUG', 'REFINE', 'DEPLOY'].map((item, index) => (
                  <div className="workflow-node" key={item}>
                    <span>0{index + 1}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="tools section-pad">
          <div className="eyebrow">03 — TOOLKIT</div>
          <div className="tools-grid">
            {tools.map(([label, value]) => (
              <div className="tool-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="projects section-pad">
          <div className="eyebrow">04 — WORK</div>
          <div className="projects-head">
            <h2>Built, tested, shipped.</h2>
            <p>Real experiments and products built around interfaces, motion and systems.</p>
          </div>
          <div className="project-list">
            {projects.map((project, index) => (
              <a className="project" href={project.href} target="_blank" rel="noreferrer" key={project.name}>
                <div className="project-number">0{index + 1}</div>
                <div className="project-main">
                  <h3>{project.name}</h3>
                  <p>{project.type}</p>
                </div>
                <div className="project-stack">{project.stack}</div>
                <span className="project-arrow">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section className="contact section-pad">
          <div className="eyebrow">05 — CONTACT</div>
          <h2>Let&apos;s build something worth remembering.</h2>
          <div className="contact-row">
            <a href="https://github.com/b-1-o" target="_blank" rel="noreferrer">GitHub ↗</a>
            <a href="https://www.linkedin.com/in/b1o" target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a href="https://www.fiverr.com/users/webbio" target="_blank" rel="noreferrer">Fiverr ↗</a>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
