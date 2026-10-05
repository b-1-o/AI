import { useState } from 'react'
import OptionWheel from './OptionWheel'
import AIStack from './AIStack'

const HUB_ITEMS = ['ChatGPT', 'Grok', 'Gemini', 'Work', 'Contact'] as const
type HubItem = (typeof HUB_ITEMS)[number]

const projects = [
  { name: 'HEAVEN', type: 'Developer command center', stack: 'Next.js · TypeScript · PostgreSQL · Vercel', href: 'https://heaven-b1o.vercel.app/' },
  { name: 'myUI', type: 'Experimental frontend / UI system', stack: 'React · TypeScript · Motion · GitHub Pages', href: 'https://b-1-o.github.io/myUI/' },
  { name: 'Music', type: 'Modern music web application', stack: 'React · API · Player · Responsive UI', href: 'https://b-1-o.github.io/music/' },
  { name: 'Nothing', type: 'Product design experiment', stack: 'React · Visual systems · Interaction', href: 'https://github.com/b-1-o/nothing' },
  { name: 'Coffee', type: 'Homemade coffee & dessert experience', stack: 'React · Motion · Product UI', href: 'https://b-1-o.github.io/coffee/' },
  { name: 'b1api', type: 'Developer API experiment', stack: 'TypeScript · APIs · Tooling', href: 'https://github.com/b-1-o/b1api' },
]

const AI_DEFAULT: Record<string, string> = {
  ChatGPT: 'gpt-role',
  Grok: 'grok-role',
  Gemini: 'gem-role',
}

type MenuHubProps = {
  onBackToIntro?: () => void
}

export default function MenuHub({ onBackToIntro }: MenuHubProps) {
  const [hubIndex, setHubIndex] = useState(0)
  const active = HUB_ITEMS[hubIndex] as HubItem
  const isAI = active === 'ChatGPT' || active === 'Grok' || active === 'Gemini'

  return (
    <div className="menu-hub">
      <header className="menu-hub-top">
        <span className="menu-hub-eyebrow">NAVIGATE</span>
        {onBackToIntro ? (
          <button type="button" className="menu-hub-back" onClick={onBackToIntro}>
            ← Intro
          </button>
        ) : (
          <span className="menu-hub-eyebrow">b1o</span>
        )}
      </header>

      <div className="menu-hub-grid">
        <div className="menu-hub-wheel-wrap">
          <OptionWheel
            items={[...HUB_ITEMS]}
            defaultSelected={0}
            onChange={(i) => setHubIndex(i)}
            textColor="rgba(244,244,242,0.38)"
            activeColor="#f4f4f2"
            side="left"
            fontSize={2.35}
            spacing={1.4}
            curve={0.95}
            tilt={5.2}
            blur={1.6}
            fade={0.3}
            minOpacity={0.1}
            smoothing={170}
            inset={28}
            draggable
          />
        </div>

        <div className="menu-hub-stage" key={active}>
          {isAI && (
            <div className="menu-hub-ai">
              <p className="menu-hub-hint">Wheel = model · tree = what I connect & how I use it</p>
              <AIStack
                key={active}
                focusModel={active}
                defaultLeaf={AI_DEFAULT[active]}
              />
            </div>
          )}

          {active === 'Work' && (
            <div className="menu-hub-work">
              <div className="eyebrow">WORK</div>
              <h2 className="menu-hub-title">Built, tested, shipped.</h2>
              <div className="project-list menu-hub-projects">
                {projects.map((project, index) => (
                  <a
                    className="project"
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    key={project.name}
                  >
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
            </div>
          )}

          {active === 'Contact' && (
            <div className="menu-hub-contact">
              <div className="eyebrow">CONTACT</div>
              <h2 className="menu-hub-title">Let&apos;s build something worth remembering.</h2>
              <div className="contact-row menu-hub-links">
                <a href="https://github.com/b-1-o" target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
                <a href="https://www.linkedin.com/in/b1o" target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
                <a href="https://www.fiverr.com/users/webbio" target="_blank" rel="noreferrer">
                  Fiverr ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
