import { useEffect, useState } from 'react'
import './ThemeSwitch.css'

type Theme = 'light' | 'dark'
const KEY = 'mc_theme'
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches
const stored = (): Theme | null => { try { const v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null } catch { return null } }

// index.html applies the stored theme before first paint; this hook keeps it in sync afterwards.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? (systemDark() ? 'dark' : 'light'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])
  const set = (t: Theme) => { setTheme(t); try { localStorage.setItem(KEY, t) } catch { /* ignore */ } }
  return { theme, setTheme: set }
}

export function ThemeSwitch({ theme, onChange, label }: { theme: Theme; onChange: (t: Theme) => void; label: string }) {
  return (
    <label className="theme-switch" title={label}>
      <input type="checkbox" className="theme-switch__checkbox" checked={theme === 'dark'} onChange={e => onChange(e.target.checked ? 'dark' : 'light')} aria-label={label} />
      <div className="theme-switch__container">
        <div className="theme-switch__clouds" />
        <svg className="theme-switch__stars-container" viewBox="0 0 144 55" fill="currentColor" aria-hidden="true">
          <path d="M135.8 11.5 137.7 15.6 142 16.2 138.9 19.1 139.6 23.4 135.8 21.3 132 23.4 132.7 19.1 129.6 16.2 133.9 15.6Z" />
          <path d="M101 4 102.5 7.2 106 7.7 103.5 10.1 104.1 13.5 101 11.9 97.9 13.5 98.5 10.1 96 7.7 99.5 7.2Z" />
          <path d="M62 15 63.2 17.6 66 18 64 20 64.4 22.8 62 21.5 59.6 22.8 60 20 58 18 60.8 17.6Z" />
          <path d="M88 35 89.5 38.2 93 38.7 90.5 41.1 91.1 44.5 88 42.9 84.9 44.5 85.5 41.1 83 38.7 86.5 38.2Z" />
          <path d="M120 40 121.2 42.6 124 43 122 45 122.4 47.8 120 46.5 117.6 47.8 118 45 116 43 118.8 42.6Z" />
          <path d="M40 38 40.9 40 43 40.3 41.5 41.8 41.8 43.9 40 42.9 38.2 43.9 38.5 41.8 37 40.3 39.1 40Z" />
          <circle cx="75" cy="6" r="1.2" /><circle cx="24" cy="12" r="1.5" /><circle cx="110" cy="26" r="1" /><circle cx="52" cy="48" r="1.2" /><circle cx="140" cy="46" r="1" />
        </svg>
        <div className="theme-switch__circle-container">
          <div className="theme-switch__sun-moon-container">
            <div className="theme-switch__moon">
              <div className="theme-switch__spot" />
              <div className="theme-switch__spot" />
              <div className="theme-switch__spot" />
            </div>
          </div>
        </div>
      </div>
    </label>
  )
}
