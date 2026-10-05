import { useCallback, useEffect, useRef, useState } from 'react'
import AIStack from './AIStack'
import DotCrystal from './DotCrystal'
import ScrollFloat from './ScrollFloat'
import { ModelLogo, LogoGitHub, LogoLinkedIn } from './Logos'
import './CrystalScroll.css'

type CrystalId = 'ChatGPT' | 'Grok' | 'Gemini' | 'Work' | 'Contact'

const SECTIONS: {
  id: CrystalId
  label: string
  sub: string
  seed: number
}[] = [
  { id: 'ChatGPT', label: 'ChatGPT', sub: 'Initial build · structure · what comes next', seed: 1 },
  { id: 'Grok', label: 'Grok', sub: 'Perfect finish · review · close when ideal', seed: 2 },
  { id: 'Gemini', label: 'Gemini', sub: 'Images · effects · visual consistency', seed: 3 },
  { id: 'Work', label: 'Work', sub: 'Built, tested, shipped', seed: 4 },
  { id: 'Contact', label: 'Contact', sub: "Let's build something worth remembering", seed: 5 },
]

const AI_DEFAULT: Record<string, string> = {
  ChatGPT: 'gpt-role',
  Grok: 'grok-role',
  Gemini: 'gem-role',
}

const projects = [
  { name: 'HEAVEN', type: 'Developer command center', stack: 'Next.js · TypeScript · PostgreSQL · Vercel', href: 'https://heaven-b1o.vercel.app/' },
  { name: 'myUI', type: 'Experimental frontend / UI system', stack: 'React · TypeScript · Motion · GitHub Pages', href: 'https://b-1-o.github.io/myUI/' },
  { name: 'Music', type: 'Modern music web application', stack: 'React · API · Player · Responsive UI', href: 'https://b-1-o.github.io/music/' },
  { name: 'Nothing', type: 'Product design experiment', stack: 'React · Visual systems · Interaction', href: 'https://github.com/b-1-o/nothing' },
  { name: 'Coffee', type: 'Homemade coffee & dessert experience', stack: 'React · Motion · Product UI', href: 'https://b-1-o.github.io/coffee/' },
  { name: 'b1api', type: 'Developer API experiment', stack: 'TypeScript · APIs · Tooling', href: 'https://github.com/b-1-o/b1api' },
]

const contacts = [
  { name: 'GitHub', href: 'https://github.com/b-1-o', desc: 'Code, experiments, open work', Logo: LogoGitHub },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/b1o', desc: 'Profile & professional contact', Logo: LogoLinkedIn },
  { name: 'Fiverr', href: 'https://www.fiverr.com/users/webbio', desc: 'Hire for builds & interfaces', Logo: null as null | typeof LogoGitHub },
]

type MenuHubProps = {
  onBackToIntro?: () => void
  skipFirst?: CrystalId
  embedModel?: CrystalId
}

function useSectionProgress(count: number) {
  const [progress, setProgress] = useState<number[]>(() => Array(count).fill(0))
  const refs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight || 1
      const next = refs.current.map((el) => {
        if (!el) return 0
        const r = el.getBoundingClientRect()
        const p = 1 - r.bottom / (vh + r.height)
        return Math.min(1, Math.max(0, p))
      })
      setProgress(next)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [count])

  const setRef = useCallback((i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el
  }, [])

  return { progress, setRef }
}

export default function MenuHub({ onBackToIntro, skipFirst, embedModel }: MenuHubProps) {
  const [open, setOpen] = useState<CrystalId | null>(null)
  const sections = skipFirst ? SECTIONS.filter((s) => s.id !== skipFirst) : SECTIONS
  const { progress, setRef } = useSectionProgress(sections.length)
  const isAI = open === 'ChatGPT' || open === 'Grok' || open === 'Gemini'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  if (embedModel) {
    const embedIsAI = embedModel === 'ChatGPT' || embedModel === 'Grok' || embedModel === 'Gemini'
    return (
      <div className="menu-hub-embed">
        {embedIsAI && (
          <div className="menu-hub-ai">
            <ScrollFloat playOnMount animationDuration={0.75} stagger={0.025} ease="power3.out">
              {embedModel}
            </ScrollFloat>
            <p className="menu-hub-model-sub menu-hub-model-sub--below">
              {SECTIONS.find((x) => x.id === embedModel)?.sub}
            </p>
            <AIStack key={embedModel} focusModel={embedModel} defaultLeaf={AI_DEFAULT[embedModel]} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="menu-hub menu-hub--scroll">
      <div className="menu-hub-glow" aria-hidden="true" />
      <div className="menu-hub-noise" aria-hidden="true" />

      <header className="menu-hub-top menu-hub-top--sticky">
        <div className="menu-hub-brand">
          <span className="menu-hub-mark">b1o</span>
          <span className="menu-hub-eyebrow">Scroll · crystals · click</span>
        </div>
        {onBackToIntro ? (
          <button type="button" className="menu-hub-back menu-hub-back--ghost" onClick={onBackToIntro}>
            Intro
          </button>
        ) : null}
      </header>

      <div className="crystal-scroll">
        {sections.map((s, i) => {
          const p = progress[i] ?? 0
          const inView = p > 0.22 && p < 0.78
          return (
            <section
              key={s.id}
              ref={setRef(i)}
              className={`crystal-section${inView ? ' crystal-section--in' : ''}`}
              aria-label={s.label}
            >
              <button
                type="button"
                className="crystal-stage"
                onClick={() => setOpen(s.id)}
                aria-label={`Open ${s.label}`}
              >
                <DotCrystal
                  progress={p}
                  spin={0.55 + i * 0.06}
                  active={inView}
                  seed={s.seed}
                  className="crystal-stage-canvas"
                />
                <div className="crystal-stage-meta">
                  <span className="crystal-stage-logo">
                    {s.id === 'ChatGPT' || s.id === 'Grok' || s.id === 'Gemini' ? (
                      <ModelLogo name={s.id} size={28} />
                    ) : (
                      <span className="crystal-stage-letter">{s.label[0]}</span>
                    )}
                  </span>
                  <h2 className="crystal-stage-title">{s.label}</h2>
                  <p className="crystal-stage-sub">{s.sub}</p>
                  <span className="crystal-stage-cta">Click to open</span>
                </div>
              </button>
              <div className="crystal-section-index">
                {String(i + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}
              </div>
            </section>
          )
        })}
      </div>

      {open && (
        <div className="crystal-modal" role="dialog" aria-modal="true" aria-label={open}>
          <button type="button" className="crystal-modal-backdrop" aria-label="Close" onClick={() => setOpen(null)} />
          <div className="crystal-modal-panel">
            <div className="crystal-modal-bar">
              <span className="crystal-modal-name">{open}</span>
              <button type="button" className="crystal-modal-close" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
            <div className="crystal-modal-body">
              {isAI && open && (
                <div className="menu-hub-ai">
                  <ScrollFloat playOnMount animationDuration={0.75} stagger={0.025} ease="power3.out">
                    {open}
                  </ScrollFloat>
                  <p className="menu-hub-model-sub menu-hub-model-sub--below">
                    {SECTIONS.find((x) => x.id === open)?.sub}
                  </p>
                  <AIStack key={open} focusModel={open} defaultLeaf={AI_DEFAULT[open]} />
                </div>
              )}
              {open === 'Work' && (
                <div className="menu-hub-work">
                  <ScrollFloat playOnMount animationDuration={0.75} stagger={0.025} ease="power3.out">
                    Work
                  </ScrollFloat>
                  <p className="menu-hub-lead">Real products and experiments — interfaces, motion, systems.</p>
                  <div className="hub-project-grid">
                    {projects.map((project, index) => (
                      <a className="hub-project" href={project.href} target="_blank" rel="noreferrer" key={project.name}>
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
              {open === 'Contact' && (
                <div className="menu-hub-contact">
                  <ScrollFloat playOnMount animationDuration={0.75} stagger={0.03} ease="power3.out">
                    Contact
                  </ScrollFloat>
                  <p className="menu-hub-lead">Open a channel — code, hire, or just say hi.</p>
                  <div className="hub-contact-grid">
                    {contacts.map((c) => (
                      <a className="hub-contact-card" href={c.href} target="_blank" rel="noreferrer" key={c.name}>
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
        </div>
      )}
    </div>
  )
}
