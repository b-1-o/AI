import { useState } from 'react'
import BranchedMenu, { type BranchedMenuItem } from './BranchedMenu'
import { ServiceLogo, ModelLogo } from './Logos'

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons = {
  build: <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  github: <Icon d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />,
  image: <Icon d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  rocket: <Icon d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />,
  spark: <Icon d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />,
  check: <Icon d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />,
  link: <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
  cloud: <Icon d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
}

type Detail = {
  title: string
  tag: string
  body: string
  connects: string[]
  role: string
}

const DETAILS: Record<string, Detail> = {
  'gpt-role': {
    title: 'ChatGPT — initial build',
    tag: 'STRUCTURE',
    role: 'Starting point',
    body: 'I use ChatGPT for the first assembly of a site: structure, sections, content skeleton and a clear map of what to add next. It helps me think through the product before polishing.',
    connects: ['GitHub', 'Unsplash', 'Vercel'],
  },
  'gpt-github': {
    title: 'ChatGPT → GitHub',
    tag: 'CODE',
    role: 'Connected',
    body: 'GitHub is linked so drafts, snippets and early repo structure can move straight into version control while the first build is still forming.',
    connects: ['GitHub'],
  },
  'gpt-unsplash': {
    title: 'ChatGPT → Unsplash',
    tag: 'ASSETS',
    role: 'Connected',
    body: 'Unsplash feeds early visual placeholders — real photography instead of empty boxes, so layout decisions are made against actual images.',
    connects: ['Unsplash'],
  },
  'gpt-vercel': {
    title: 'ChatGPT → Vercel',
    tag: 'SHIP',
    role: 'Connected',
    body: 'Vercel is connected for fast previews of the initial build — so the first version is already live while Grok and Gemini refine the rest.',
    connects: ['Vercel'],
  },
  'grok-role': {
    title: 'Grok — perfect finish',
    tag: 'QUALITY',
    role: 'Finisher',
    body: 'Grok is where the site becomes ideal. It does what other models miss: deep review, hard edge cases, motion, performance and the final pass until everything is solid and ships clean.',
    connects: ['GitHub'],
  },
  'grok-github': {
    title: 'Grok → GitHub',
    tag: 'CODE',
    role: 'Connected',
    body: 'GitHub stays in the loop so Grok can read real files, propose precise diffs and close the process only when the repo state matches a finished product.',
    connects: ['GitHub'],
  },
  'grok-qa': {
    title: 'Grok — verify & close',
    tag: 'QA',
    role: 'Process end',
    body: 'When the stack is assembled, Grok stress-tests UI, logic and feel. The process ends only when the build works as intended — not when it is “good enough”.',
    connects: ['GitHub'],
  },
  'gem-role': {
    title: 'Gemini — visual layer',
    tag: 'VISUAL',
    role: 'Imagery',
    body: 'Gemini generates the images the site needs: hero art, product frames, mood pieces and supporting visuals that match the direction of the build.',
    connects: [],
  },
  'gem-fx': {
    title: 'Gemini — effects & particles',
    tag: 'MOTION',
    role: 'Atmosphere',
    body: 'Beyond still frames, Gemini helps shape visual effects language — particle systems, light, texture cues and the small details that make an interface feel alive.',
    connects: [],
  },
  'gem-style': {
    title: 'Gemini — style lock',
    tag: 'DIRECTION',
    role: 'Consistency',
    body: 'Once a visual direction is chosen, Gemini keeps assets coherent across pages so the site does not feel like a collage of unrelated images.',
    connects: [],
  },
}

const MENU: BranchedMenuItem[] = [
  {
    label: 'ChatGPT',
    children: [
      { value: 'gpt-role', label: 'Initial build', icon: icons.build },
      { value: 'gpt-github', label: 'GitHub', icon: icons.github },
      { value: 'gpt-unsplash', label: 'Unsplash', icon: icons.image },
      { value: 'gpt-vercel', label: 'Vercel', icon: icons.cloud },
    ],
  },
  {
    label: 'Grok',
    children: [
      { value: 'grok-role', label: 'Perfect finish', icon: icons.spark },
      { value: 'grok-github', label: 'GitHub', icon: icons.github },
      { value: 'grok-qa', label: 'Verify & close', icon: icons.check },
    ],
  },
  {
    label: 'Gemini',
    children: [
      { value: 'gem-role', label: 'Image generation', icon: icons.image },
      { value: 'gem-fx', label: 'Effects & particles', icon: icons.spark },
      { value: 'gem-style', label: 'Style lock', icon: icons.rocket },
    ],
  },
]

type AIStackProps = {
  focusModel?: string
  defaultLeaf?: string
}

export default function AIStack({ focusModel, defaultLeaf }: AIStackProps) {
  const items = focusModel
    ? MENU.filter((m) => m.label === focusModel)
    : MENU

  const initial =
    defaultLeaf ??
    items[0]?.children?.[0]?.value ??
    'gpt-role'

  const [active, setActive] = useState(initial)
  const detail = DETAILS[active] ?? DETAILS[initial] ?? DETAILS['gpt-role']

  return (
    <div className="ai-stack">
      <div className="ai-stack-nav">
        <BranchedMenu
          items={items}
          defaultOpen={[0]}
          defaultActive={initial}
          onSelect={(value) => setActive(value)}
          color="#f4f4f2"
          accentColor="#f4f4f2"
          lineColor="rgba(244,244,242,0.18)"
          width={280}
          rowHeight={38}
          indent={44}
          trunk={14}
          radius={10}
          lineWidth={1.4}
          fontSize={14}
          drawDuration={420}
          foldDuration={320}
        />
      </div>

      <div className="ai-stack-panel" key={active}>
        <div className="ai-stack-panel-shine" aria-hidden="true" />
        <div className="ai-stack-meta">
          <span className="ai-stack-tag">{detail.tag}</span>
          <span className="ai-stack-role">{detail.role}</span>
        </div>
        <h3 className="ai-stack-title">{detail.title}</h3>
        <p className="ai-stack-body">{detail.body}</p>
        <div className="ai-stack-connects">
          <span className="ai-stack-connects-label">
            {detail.connects.length > 0 ? 'Connected' : 'Focus'}
          </span>
          <div className="ai-stack-chips">
            {detail.connects.length > 0
              ? detail.connects.map((c) => (
                  <span key={c} className="ai-stack-chip ai-stack-chip--logo">
                    <ServiceLogo name={c} size={14} />
                    {c}
                  </span>
                ))
              : (
                  <span className="ai-stack-chip ai-stack-chip--logo">
                    <ModelLogo name="Gemini" size={14} />
                    Visual generation
                  </span>
                )}
          </div>
        </div>
      </div>
    </div>
  )
}
