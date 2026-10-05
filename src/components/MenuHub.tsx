import { useState } from 'react'
import OptionWheel from './OptionWheel'
import AIStack from './AIStack'

const HUB_ITEMS = ['ChatGPT', 'Grok', 'Gemini', 'Work', 'Contact'] as const
type HubItem = (typeof HUB_ITEMS)[number]

const projects = [
  {
    name: 'HEAVEN',
    type: 'Developer command center',
    stack: 'Next.js · TypeScript · PostgreSQL · Vercel',
    href: 'https://heaven-b1o.vercel.app/',
    tone: 'ops',
  },
  {
    name: 'myUI',
    type: 'Experimental frontend / UI system',
    stack: 'React · TypeScript · Motion · GitHub Pages',
    href: 'https://b-1-o.github.io/myUI/',
    tone: 'ui',
  },
  {
    name: 'Music',
    type: 'Modern music web application',
    stack: 'React · API · Player · Responsive UI',
    href: 'https://b-1-o.github.io/music/',
    tone: 'media',
  },
  {
    name: 'Nothing',
    type: 'Product design experiment',
    stack: 'React · Visual systems · Interaction',
    href: 'https://github.com/b-1-o/nothing',
    tone: 'exp',
  },
  {
    name: 'Coffee',
    type: 'Homemade coffee & dessert experience',
    stack: 'React · Motion · Product UI',
    href: 'https://b-1-o.github.io/coffee/',
    tone: 'product',
  },
  {
    name: 'b1api',
    type: 'Developer API experiment',
    stack: 'TypeScript · APIs · Tooling',
    href: 'https://github.com/b-1-o/b1api',
    tone: 'api',
  },
]

const AI_DEFAULT: Record<string, string> = {
  ChatGPT: 'gpt-role',
  Grok: 'grok-role',
  Gemini: 'gem-role',
}

const MODEL_META: Record<
  string,
  { label: string; accent: string; blurb: string; step: string }
> = {
  ChatGPT: {
    label: 'STRUCTURE',
    accent: 'gpt',
    blurb: 'First assembly — skeleton, sections, what to build next.',
    step: '01',
  },
  Grok: {
    label: 'FINISH',
    accent: 'grok',
    blurb: 'Hard pass — polish, QA, ship only when it is ideal.',
    step: '02',
  },
  Gemini: {
    label: 'VISUAL',
    accent: 'gem',
    blurb: 'Images, atmosphere, particles — the look of the product.',
    step: '03',
  },
}

const contacts = [
  {
    name: 'GitHub',
    href: 'https://github.com/b-1-o',
    desc: 'Code, experiments, open work',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/b1o',
    desc: 'Profile & professional contact',
  },
  {
    name: 'Fiverr',
    href: 'https://www.fiverr.com/users/webbio',
    desc: 'Hire for builds & interfaces',
  },
]

type MenuHubProps = {
  onBackToIntro?: () => void
}

export default function MenuHub({ onBackToIntro }: MenuHubProps) {
  const [hubIndex, setHubIndex] = useState(0)
  const active = HUB_ITEMS[hubIndex] as HubItem
  const isAI = active === 'ChatGPT' || active === 'Grok' || active === 'Gemini'
  const meta = isAI ? MODEL_META[active] : null

  return (
    <div className={`menu-hub menu-hub--${isAI ? meta?.accent : active.toLowerCase()}`}>
      <div className="menu-hub-glow" aria-hidden="true" />
      <div className="menu-hub-noise" aria-hidden="true" />

      <header className="menu-hub-top">
        <div className="menu-hub-brand">
          <span className="menu-hub-mark">b1o</span>
          <span className="menu-hub-eyebrow">Navigate</span>
        </div>
        {onBackToIntro ? (
          <button type="button" className="menu-hub-back" onClick={onBackToIntro}>
            <span className="menu-hub-back-ico" aria-hidden="true">
              ←
            </span>
            Intro
          </button>
        ) : null}
      </header>

      <div className="menu-hub-grid">
        <aside className="menu-hub-rail">
          <p className="menu-hub-rail-label">Sections</p>
          <div className="menu-hub-wheel-wrap">
            <OptionWheel
              items={[...HUB_ITEMS]}
              defaultSelected={0}
              onChange={(i) => setHubIndex(i)}
              textColor="rgba(244,244,242,0.34)"
              activeColor="#f4f4f2"
              side="left"
              fontSize={2.2}
              spacing={1.38}
              curve={0.9}
              tilt={5}
              blur={1.4}
              fade={0.28}
              minOpacity={0.12}
              smoothing={160}
              inset={20}
              draggable
            />
          </div>
          <div className="menu-hub-rail-foot">
            <span>Scroll or drag</span>
            <span className="menu-hub-dot" />
            <span>{String(hubIndex + 1).padStart(2, '0')} / 05</span>
          </div>
        </aside>

        <div className="menu-hub-stage" key={active}>
          {isAI && meta && (
            <div className={`menu-hub-ai menu-hub-ai--${meta.accent}`}>
              <div className="menu-hub-ai-head">
                <div className="menu-hub-ai-step">{meta.step}</div>
                <div>
                  <div className="menu-hub-ai-badges">
                    <span className={`menu-hub-pill menu-hub-pill--${meta.accent}`}>{meta.label}</span>
                    <span className="menu-hub-pill menu-hub-pill--ghost">{active}</span>
                  </div>
                  <h2 className="menu-hub-ai-title">{active}</h2>
                  <p className="menu-hub-ai-blurb">{meta.blurb}</p>
                </div>
              </div>

              <AIStack key={active} focusModel={active} defaultLeaf={AI_DEFAULT[active]} />
            </div>
          )}

          {active === 'Work' && (
            <div className="menu-hub-work">
              <div className="menu-hub-section-head">
                <span className="menu-hub-pill menu-hub-pill--ghost">04 — Work</span>
                <h2 className="menu-hub-title">Built, tested, shipped.</h2>
                <p className="menu-hub-lead">
                  Real products and experiments — interfaces, motion, systems.
                </p>
              </div>
              <div className="hub-project-grid">
                {projects.map((project, index) => (
                  <a
                    className={`hub-project hub-project--${project.tone}`}
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    key={project.name}
                  >
                    <div className="hub-project-top">
                      <span className="hub-project-num">0{index + 1}</span>
                      <span className="hub-project-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </div>
                    <h3>{project.name}</h3>
                    <p>{project.type}</p>
                    <span className="hub-project-stack">{project.stack}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {active === 'Contact' && (
            <div className="menu-hub-contact">
              <div className="menu-hub-section-head">
                <span className="menu-hub-pill menu-hub-pill--ghost">05 — Contact</span>
                <h2 className="menu-hub-title">Let&apos;s build something worth remembering.</h2>
                <p className="menu-hub-lead">Open a channel — code, hire, or just say hi.</p>
              </div>
              <div className="hub-contact-grid">
                {contacts.map((c) => (
                  <a
                    className="hub-contact-card"
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    key={c.name}
                  >
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
  )
}
