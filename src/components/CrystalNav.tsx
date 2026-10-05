import './CrystalNav.css'
import { ModelLogo } from './Logos'

export type CrystalId = 'ChatGPT' | 'Grok' | 'Gemini' | 'Work' | 'Contact'

const CRYSTALS: {
  id: CrystalId
  label: string
  hint: string
  hasLogo?: boolean
}[] = [
  { id: 'ChatGPT', label: 'ChatGPT', hint: 'Structure', hasLogo: true },
  { id: 'Grok', label: 'Grok', hint: 'Finish', hasLogo: true },
  { id: 'Gemini', label: 'Gemini', hint: 'Visual', hasLogo: true },
  { id: 'Work', label: 'Work', hint: 'Projects' },
  { id: 'Contact', label: 'Contact', hint: 'Reach out' },
]

type CrystalNavProps = {
  active: CrystalId
  onSelect: (id: CrystalId) => void
}

export default function CrystalNav({ active, onSelect }: CrystalNavProps) {
  return (
    <div className="crystal-nav" role="listbox" aria-label="Sections">
      {CRYSTALS.map((c) => {
        const isActive = c.id === active
        return (
          <button
            key={c.id}
            type="button"
            role="option"
            aria-selected={isActive}
            className={`crystal${isActive ? ' crystal--active' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <span className="crystal-facet crystal-facet--a" aria-hidden="true" />
            <span className="crystal-facet crystal-facet--b" aria-hidden="true" />
            <span className="crystal-facet crystal-facet--c" aria-hidden="true" />
            <span className="crystal-inner">
              {c.hasLogo ? (
                <span className="crystal-logo">
                  <ModelLogo name={c.id} size={26} />
                </span>
              ) : (
                <span className="crystal-glyph">{c.label[0]}</span>
              )}
              <span className="crystal-label">{c.label}</span>
              <span className="crystal-hint">{c.hint}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
