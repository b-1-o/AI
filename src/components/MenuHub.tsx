import { useState } from 'react'
import AIStack from './AIStack'
import CrystalNav, { type CrystalId } from './CrystalNav'
import ScrollFloat from './ScrollFloat'
import { LogoGitHub, LogoLinkedIn } from './Logos'

const projects = [
  {
    name: 'HEAVEN',
    type: 'Developer command center',
    stack: 'Next.js · TypeScript · PostgreSQL · Vercel',
    href: 'https://heaven-b1o.vercel.app/',
  },
  {
    name: 'myUI',
    type: 'Experimental frontend / UI system',
    stack: 'React · TypeScript · Motion · GitHub Pages',
    href: 'https://b-1-o.github.io/myUI/',
  },
  {
    name: 'Music',
    type: 'Modern music web application',
    stack: 'React · API · Player · Responsive UI',
    href: 'https://b-1-o.github.io/music/',
  },
  {
    name: 'Nothing',
    type: 'Product design experiment',
    stack: 'React · Visual systems · Interaction',
    href: 'https://github.com/b-1-o/nothing',
  },
  {
    name: 'Coffee',
    type: 'Homemade coffee & dessert experience',
    stack: 'React · Motion · Product UI',
    href: 'https://b-1-o.github.io/coffee/',
  },
  {
    name: 'b1api',
    type: 'Developer API experiment',
    stack: 'TypeScript · APIs · Tooling',
    href: 'https://github.com/b-1-o/b1api',
  },
]

const AI_DEFAULT: Record<string, string> = {
  ChatGPT: 'gpt-role',
  Grok: 'grok-role',
  Gemini: 'gem-role',
}

const contacts = [
  {
    name: 'GitHub',
    href: 'https://github.com/b-1-o',
    desc: 'Code, experiments, open work',
    Logo: LogoGitHub,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/b1o',
    desc: 'Profile & professional contact',
    Logo: LogoLinkedIn,
  },
  {
    name: 'Fiverr',
    href: 'https://www.fiverr.com/users/webbio',
    desc: 'Hire for builds & interfaces',
    Logo: null as null | typeof LogoGitHub,
  },
]

type MenuHubProps = {
  onBackToIntro?: () => void
}

export default function MenuHub({ onBackToIntro }: MenuHubProps) {
  const [active, setActive] = useState<CrystalId>('ChatGPT')
  const isAI = active === 'ChatGPT' || active === 'Grok' || active === 'Gemini'

  return (
    <div className="menu-hub">
      <div className="menu-hub-glow" aria-hidden="true" />
      <div className="menu-hub-noise" aria-hidden="true" />

      <header className="menu-hub-top">
        <div className="menu-hub-brand">
          <span className="menu-hub-mark">b1o</span>
          <span className="menu-hub-eyebrow">Scroll up · return</span>
        </div>
        {onBackToIntro ? (
          <button type="button" className="menu-hub-back menu-hub-back--ghost" onClick={onBackToIntro}>
            Intro
          </button>
        ) : null}
      </header>

      <div className="menu-hub-crystals">
        <CrystalNav active={active} onSelect={setActive} />
      </div>

      <div className="menu-hub-stage menu-hub-stage--full" key={active}>
        {isAI && (
          <div className="menu-hub-ai">
            <ScrollFloat playOnMount animationDuration={0.85} stagger={0.028} ease="power3.out">
              {active}
            </ScrollFloat>
            <p className="menu-hub-model-sub menu-hub-model-sub--below">
              {active === 'ChatGPT' && 'Initial build · structure · what comes next'}
              {active === 'Grok' && 'Perfect finish · review · close when ideal'}
              {active === 'Gemini' && 'Images · effects · visual consistency'}
            </p>
            <AIStack key={active} focusModel={active} defaultLeaf={AI_DEFAULT[active]} />
          </div>
        )}

        {active === 'Work' && (
          <div className="menu-hub-work">
            <ScrollFloat playOnMount animationDuration={0.85} stagger={0.025} ease="power3.out">
              Work
            </ScrollFloat>
            <p className="menu-hub-lead">Real products and experiments — interfaces, motion, systems.</p>
            <div className="hub-project-grid">
              {projects.map((project, index) => (
                <a
                  className="hub-project"
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
            <ScrollFloat playOnMount animationDuration={0.85} stagger={0.03} ease="power3.out">
              Contact
            </ScrollFloat>
            <p className="menu-hub-lead">Open a channel — code, hire, or just say hi.</p>
            <div className="hub-contact-grid">
              {contacts.map((c) => (
                <a
                  className="hub-contact-card"
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  key={c.name}
                >
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
  )
}
