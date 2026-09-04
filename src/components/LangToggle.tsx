import { useEffect, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
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

const Flag = ({ F }: { F: () => React.JSX.Element }) => <span className="inline-block w-[20px] h-[14px] rounded-[2px] overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/10"><F /></span>

export function LangToggle({ lang, onChange, label }: { lang: Lang; onChange: (l: Lang) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const current = LANGS.find(l => l.code === lang) ?? LANGS[0]
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label={label} aria-haspopup="listbox" aria-expanded={open}
        className="h-8 pl-3.5 pr-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition">
        <Flag F={current.Flag} />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul role="listbox" className="absolute right-0 top-10 z-50 min-w-40 py-1 rounded-xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,.12)]">
            {LANGS.map(({ code, name, Flag: F }) => (
              <li key={code}>
                <button role="option" aria-selected={lang === code} onClick={() => { onChange(code); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <Flag F={F} />
                  <span className="flex-1">{name}</span>
                  {lang === code && <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
