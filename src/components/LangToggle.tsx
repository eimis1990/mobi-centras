import type { Lang } from '../lib/i18n'

// Small inline flags so they render the same on every OS (emoji flags don't on Windows).
const FlagLT = () => (
  <svg viewBox="0 0 30 18" className="w-full h-full" aria-hidden="true">
    <rect width="30" height="6" fill="#FDB913" /><rect y="6" width="30" height="6" fill="#006A44" /><rect y="12" width="30" height="6" fill="#C1272D" />
  </svg>
)
const FlagGB = () => (
  <svg viewBox="0 0 60 30" className="w-full h-full" aria-hidden="true">
    <clipPath id="gb-clip"><rect width="60" height="30" /></clipPath>
    <g clipPath="url(#gb-clip)">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0L60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0V30M0 15H60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0V30M0 15H60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
)

const LANGS: { code: Lang; name: string; Flag: () => React.JSX.Element }[] = [
  { code: 'lt', name: 'Lietuvių', Flag: FlagLT },
  { code: 'en', name: 'English', Flag: FlagGB },
]

export function LangToggle({ lang, onChange, label }: { lang: Lang; onChange: (l: Lang) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1 p-1 rounded-md bg-black/5 dark:bg-white/10">
      {LANGS.map(({ code, name, Flag }) => (
        <button key={code} role="radio" aria-checked={lang === code} title={name} onClick={() => onChange(code)}
          className={`h-[18px] w-[26px] rounded-[3px] overflow-hidden transition-opacity ${lang === code ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}>
          <Flag />
        </button>
      ))}
    </div>
  )
}
