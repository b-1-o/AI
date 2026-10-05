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
  { id: 'Work', label: 'Work', sub: 'Selected builds & experiments', seed: 4 },
  { id: 'Contact', label: 'Contact', sub: 'GitHub · LinkedIn · reach out', seed: 5 },
]

const AI_DEFAULT: Record<string, string> = {
  ChatGPT: 'chatgpt-build',
  Grok: 'grok-finish',
  Gemini: 'gemini-images',
}

type MenuHubProps = {
  onBackToIntro?: () => void
  skipFirst?: CrystalId
  embedModel?: CrystalId
}

function useInView(threshold = 0.45) {
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold, rootMargin: '-10% 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, inView }
}

function CrystalSection({
  s,
  i,
  onOpen,
}: {
  s: (typeof SECTIONS)[0]
  i: number
  onOpen: (id: CrystalId) => void
}) {
  const { ref, inView } = useInView(0.4)
  const p = inView ? 0.55 : 0.2

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`crystal-section${inView ? ' crystal-section--in' : ''}`}
      id={`crystal-${s.id}`}
    >
      <button
        type="button"
        className="crystal-stage"
        onClick={() => onOpen(s.id)}
        aria-label={`Open ${s.label}`}
      >
        <DotCrystal
          progress={p}
          spin={0.55}
          active={inView}
          seed={1}
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
        {String(i + 1).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')}
      </div>
    </section>
  )
}

export default function MenuHub({ onBackToIntro, skipFirst, embedModel }: MenuHubProps) {
  const [open, setOpen] = useState<CrystalId | null>(null)
  const sections = skipFirst ? SECTIONS.filter((s) => s.id !== skipFirst) : SECTIONS

  const onOpen = useCallback((id: CrystalId) => setOpen(id), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // hooks above any early return
  if (embedModel) {
    const embedIsAI = embedModel === 'ChatGPT' || embedModel === 'Grok' || embedModel === 'Gemini'
    return (
      <div className="menu-hub menu-hub--embed">
        <div className="menu-hub-top">
          <div className="menu-hub-top-inner">
            <span className="menu-hub-eyebrow">Crystal open</span>
            <h1 className="menu-hub-title">
              {embedModel}
            </h1>
            <p className="menu-hub-hint">
              {SECTIONS.find((x) => x.id === embedModel)?.sub}
            </p>
            {embedIsAI && (
              <AIStack key={embedModel} focusModel={embedModel} defaultLeaf={AI_DEFAULT[embedModel]} />
            )}
            {embedModel === 'Work' && (
              <div className="menu-hub-card">
                <p>Selected builds & experiments — more soon.</p>
              </div>
            )}
            {embedModel === 'Contact' && (
              <div className="menu-hub-card menu-hub-card--links">
                <a href="https://github.com/b-1-o" target="_blank" rel="noreferrer">
                  <LogoGitHub size={20} /> GitHub
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                  <LogoLinkedIn size={20} /> LinkedIn
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-hub">
      <div className="menu-hub-top">
        <div className="menu-hub-top-inner">
          <span className="menu-hub-eyebrow">Scroll · crystals · click</span>
          <ScrollFloat containerClassName="menu-hub-float" textClassName="menu-hub-float-text">
            AI stack
          </ScrollFloat>
          <p className="menu-hub-hint">
            One crystal at a time. Same form for every model — click to open.
          </p>
          {onBackToIntro && (
            <button type="button" className="menu-hub-back" onClick={onBackToIntro}>
              ← Intro
            </button>
          )}
        </div>
      </div>

      <div className="crystal-scroll">
        {sections.map((s, i) => (
          <CrystalSection key={s.id} s={s} i={i} onOpen={onOpen} />
        ))}
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
              {(open === 'ChatGPT' || open === 'Grok' || open === 'Gemini') && (
                <AIStack focusModel={open} defaultLeaf={AI_DEFAULT[open]} />
              )}
              {open === 'Work' && <p className="menu-hub-card">Selected builds & experiments — more soon.</p>}
              {open === 'Contact' && (
                <div className="menu-hub-card menu-hub-card--links">
                  <a href="https://github.com/b-1-o" target="_blank" rel="noreferrer">
                    <LogoGitHub size={20} /> GitHub
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                    <LogoLinkedIn size={20} /> LinkedIn
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
