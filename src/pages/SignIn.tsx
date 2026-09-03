import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { DotPattern } from '../components/DotPattern'
import { Logo } from '../components/Logo'
import { useT } from '../lib/i18n'

export default function SignIn({ onSignIn }: { onSignIn: (password: string) => Promise<string | null> }) {
  const { t } = useT()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const canSubmit = password.length > 0 && !loading

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await onSignIn(password)
    if (err) { setError(err === 'wrong' ? t('auth.wrong') : err.startsWith('failed: ') ? `${t('auth.failed')} (${err.slice(8)})` : t('auth.failed')); setLoading(false) }
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)] dark:fill-neutral-600/60" />

      <div className="absolute left-6 top-6 z-10 flex items-center gap-2.5 text-2xl font-bold text-foreground select-none">
        <Logo className="size-12 rounded-xl text-lg" />
        <span>MobiCentras<span className="text-primary">.</span></span>
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/60 bg-card px-8 py-8 ring-1 ring-foreground/5">
        <div className="mb-6 space-y-1.5">
          <h1 className="text-2xl font-bold">{t('auth.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.subtitle')}</p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</label>
            <input id="password" type="password" autoComplete="current-password" autoFocus required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" disabled={loading}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30 disabled:opacity-50" />
          </div>

          {error && <p role="alert" className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={!canSubmit}
            className="group relative h-12 w-full overflow-hidden rounded-xl bg-[#101213] px-4 text-base font-medium text-white transition hover:bg-[#101213]/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#101213] dark:hover:bg-white/90">
            <span className="mr-9 transition-opacity duration-500 group-hover:opacity-0">{loading ? t('auth.busy') : t('auth.button')}</span>
            <i aria-hidden="true" className="absolute bottom-1 right-1 top-1 z-10 grid w-10 place-items-center rounded-lg bg-white/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95 dark:bg-black/10">
              <ArrowRight className="size-4" strokeWidth={2} />
            </i>
          </button>
        </form>
      </div>
    </main>
  )
}
