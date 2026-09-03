import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Building2, MessageSquareText, SlidersHorizontal, Database, KeyRound, CheckCircle2 } from 'lucide-react'
import { isDone, normalizeSettings, renderSms, SMS_PLACEHOLDERS, TEMPLATE_KEYS, type Settings as SettingsT, type Store, type TemplateKey } from '../lib/orders'
import { useT, type TKey } from '../lib/i18n'

type Props = { store: Store; onSave: (s: SettingsT) => void; onImport: (s: Store) => void }

const field = 'w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition'
const label = 'block text-[12px] font-medium text-muted-foreground mb-1.5'

function Card({ icon: Icon, title, hint, children }: { icon: React.ElementType; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-xl border border-border/60">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" strokeWidth={1.75} /></div>
        <div><h2 className="text-[14px] font-medium leading-tight">{title}</h2><p className="text-[12px] text-muted-foreground">{hint}</p></div>
      </header>
      <div className="p-5 flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Num({ value, onChange, min = 1, max = 3650 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return <input type="number" min={min} max={max} value={value} onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || min)))} className={`${field} w-24 text-right tabular-nums`} />
}

// GSM-7 messages hold 160 chars per segment; anything outside basic ASCII (Lithuanian letters) forces UCS-2 at 70.
const smsSegments = (text: string) => Math.max(1, Math.ceil(text.length / (/[^\x20-\x7E]/.test(text) ? 70 : 160)))

type TwilioStatus = { configured: boolean; sidLast4?: string; from?: string; savedAt?: string }

function TwilioCard({ sender, testTo }: { sender: string; testTo: string }) {
  const { t, locale } = useT()
  const [status, setStatus] = useState<TwilioStatus | null>(null)
  const [sid, setSid] = useState('')
  const [token, setToken] = useState('')
  const [from, setFrom] = useState('')
  const [busy, setBusy] = useState<'save' | 'test' | 'remove' | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => { fetch('/api/twilio').then(r => r.json()).then(setStatus).catch(() => setStatus({ configured: false })) }, [])
  const showForm = !status?.configured || editing

  const save = async () => {
    setBusy('save'); setMsg(null)
    const r = await fetch('/api/twilio', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sid: sid.trim(), token: token.trim(), from: from.trim() }) })
    if (r.ok) { setStatus(await r.json()); setSid(''); setToken(''); setFrom(''); setEditing(false); setMsg({ ok: true, text: t('set.twilioSaved') }) }
    else setMsg({ ok: false, text: await r.text() })
    setBusy(null)
  }
  const remove = async () => {
    if (!confirm(t('set.removeConfirm'))) return
    setBusy('remove'); setMsg(null)
    const r = await fetch('/api/twilio', { method: 'DELETE' })
    if (r.ok) setStatus(await r.json())
    setBusy(null)
  }
  const test = async () => {
    setBusy('test'); setMsg(null)
    const r = await fetch('/api/sms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: testTo, message: t('set.testBody'), sender }) })
    setMsg(r.ok ? { ok: true, text: t('set.testSent', { to: testTo }) } : { ok: false, text: await r.text() })
    setBusy(null)
  }

  const btn = 'h-8 px-3 rounded-md border border-border text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50'
  return (
    <Card icon={KeyRound} title={t('set.twilio')} hint={t('set.twilioHint')}>
      {status?.configured && !editing && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[13px]">
            <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} />
            <span>{t('set.connected', { sid: status.sidLast4 ?? '', from: status.from ?? '' })}</span>
            {status.savedAt && <span className="text-muted-foreground">· {t('set.savedOn', { date: new Date(status.savedAt).toLocaleDateString(locale) })}</span>}
          </p>
          <div className="flex gap-2">
            <button onClick={test} disabled={!!busy} className={btn}>{busy === 'test' ? t('nd.sending') : t('set.test')}</button>
            <button onClick={() => setEditing(true)} className={btn}>{t('set.replace')}</button>
            <button onClick={remove} disabled={!!busy} className="h-8 px-3 rounded-md text-[12px] font-medium text-danger hover:bg-danger/10 disabled:opacity-50">{t('set.remove')}</button>
          </div>
        </div>
      )}
      {showForm && status && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>{t('set.sid')}</label>
              <input className={`${field} font-mono`} value={sid} onChange={e => setSid(e.target.value)} placeholder="AC…" autoComplete="off" />
              <p className="text-[11px] text-muted-foreground mt-1">{t('set.sidHint')}</p>
            </div>
            <div>
              <label className={label}>{t('set.token')}</label>
              <input className={`${field} font-mono`} type="password" value={token} onChange={e => setToken(e.target.value)} autoComplete="new-password" />
              <p className="text-[11px] text-muted-foreground mt-1">{t('set.tokenHint')}</p>
            </div>
            <div>
              <label className={label}>{t('set.from')}</label>
              <input className={field} value={from} onChange={e => setFrom(e.target.value)} placeholder="+15551234567" inputMode="tel" />
              <p className="text-[11px] text-muted-foreground mt-1">{t('set.fromHint')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={!!busy || !sid || !token || !from} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 disabled:opacity-40">{busy === 'save' ? t('set.verifying') : t('set.verify')}</button>
            {editing && <button onClick={() => { setEditing(false); setMsg(null) }} className="h-9 px-4 rounded-md border border-border text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5">{t('common.cancel')}</button>}
          </div>
        </div>
      )}
      {!status && <p className="text-[13px] text-muted-foreground">{t('set.checking')}</p>}
      {msg && <p className={`text-[12px] rounded-md px-3 py-2 ${msg.ok ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>{msg.text}</p>}
    </Card>
  )
}

const TPL_HINT: Record<TemplateKey, TKey> = { arrived: 'set.tplArrivedHint', repairReady: 'set.tplRepairHint', reminder: 'set.tplReminderHint' }

export default function Settings({ store, onSave, onImport }: Props) {
  const { t } = useT()
  const [s, setS] = useState<SettingsT>(store.settings)
  const [savedAt, setSavedAt] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState('')
  useEffect(() => setS(store.settings), [store.settings])
  const dirty = JSON.stringify(s) !== JSON.stringify(store.settings)

  const set = <K extends keyof SettingsT>(k: K, v: SettingsT[K]) => setS(p => ({ ...p, [k]: v }))
  const setCompany = (k: keyof SettingsT['company'], v: string) => setS(p => ({ ...p, company: { ...p.company, [k]: v } }))

  const [tpl, setTpl] = useState<TemplateKey>('arrived')
  const sample = store.orders.find(o => o.status === 'arrived') ?? { customer: 'Ona', product: 'S23 dėklas', price: 12, arrivedAt: new Date(Date.now() - 5 * 86_400_000).toISOString() }
  const preview = renderSms(s.templates[tpl], sample, s.company)
  const setTemplate = (v: string) => setS(p => ({ ...p, templates: { ...p.templates, [tpl]: v } }))

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `mobicentras-${new Date().toISOString().slice(0, 10)}.json` })
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = async (file: File) => {
    setImportError('')
    try {
      const data = JSON.parse(await file.text()) as Partial<Store>
      if (!Array.isArray(data.orders) || data.orders.some(o => !o.id || !o.phone || !o.status)) throw new Error('not an orders file')
      if (!confirm(t('set.importConfirm', { cur: store.orders.length, next: data.orders.length }))) return
      onImport({ version: 1, settings: normalizeSettings(data.settings), orders: data.orders })
    } catch (e) {
      setImportError(e instanceof Error && e.message === 'not an orders file' ? t('set.notExport') : t('set.cantRead'))
    }
  }

  const done = store.orders.filter(isDone).length
  const sizeKb = Math.round(JSON.stringify(store).length / 1024)
  const rule = (title: TKey, desc: TKey, value: number, onChange: (n: number) => void, max?: number) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><div className="text-[13px] font-medium">{t(title)}</div><div className="text-[12px] text-muted-foreground">{t(desc)}</div></div>
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Num value={value} onChange={onChange} max={max} /> {t('common.days')}</div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('set.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('set.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!dirty && savedAt > 0 && Date.now() - savedAt < 3000 && <span className="text-[12px] text-muted-foreground">{t('set.saved')}</span>}
          <button disabled={!dirty} onClick={() => { onSave(s); setSavedAt(Date.now()) }}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition">{t('set.save')}</button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card icon={Building2} title={t('set.company')} hint={t('set.companyHint')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={label}>{t('set.companyName')}</label><input className={field} value={s.company.name} onChange={e => setCompany('name', e.target.value)} /></div>
            <div><label className={label}>{t('set.phone')}</label><input className={field} value={s.company.phone} onChange={e => setCompany('phone', e.target.value)} inputMode="tel" /></div>
            <div><label className={label}>{t('set.address')}</label><input className={field} value={s.company.address} onChange={e => setCompany('address', e.target.value)} /></div>
            <div>
              <label className={label}>{t('set.sender')}</label>
              <input className={field} value={s.company.smsSender} maxLength={11} onChange={e => setCompany('smsSender', e.target.value.replace(/[^A-Za-z0-9]/g, ''))} />
              <p className="text-[11px] text-muted-foreground mt-1">{t('set.senderHint')}</p>
            </div>
          </div>
        </Card>

        <Card icon={MessageSquareText} title={t('set.sms')} hint={t('set.smsHint')}>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5 text-[12px]">
            {TEMPLATE_KEYS.map(k => (
              <button key={k} type="button" onClick={() => setTpl(k)}
                className={`h-8 rounded-md font-medium transition ${tpl === k ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{t(`tpl.${k}`)}</button>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground -mt-1">{t(TPL_HINT[tpl])}</p>
          <div>
            <label className={label}>{t('set.message')}</label>
            <textarea className={`${field} h-24 py-2 resize-y`} value={s.templates[tpl]} onChange={e => setTemplate(e.target.value)} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SMS_PLACEHOLDERS.map(p => (
                <button key={p} type="button" onClick={() => setTemplate(`${s.templates[tpl]} {${p}}`)}
                  className="h-6 px-2 rounded-md border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition">{`{${p}}`}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-muted-foreground">{t('set.preview')}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{preview.length} {t('common.chars')} · {smsSegments(preview)} SMS</span>
            </div>
            <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-border/50 px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap">{preview}</div>
          </div>
        </Card>

        <TwilioCard sender={store.settings.company.smsSender} testTo={store.settings.company.phone} />

        <Card icon={SlidersHorizontal} title={t('set.rules')} hint={t('set.rulesHint')}>
          <div className="flex flex-col divide-y divide-border/50 -my-2">
            {rule('set.followUp', 'set.followUpDesc', s.followUpDays, n => set('followUpDays', n), 365)}
            {rule('set.stale', 'set.staleDesc', s.staleDays, n => set('staleDays', n), 365)}
            {rule('set.retention', 'set.retentionDesc', s.retentionDays, n => set('retentionDays', n))}
          </div>
        </Card>

        <Card icon={Database} title={t('set.data')} hint={t('set.dataHint')}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-muted-foreground tabular-nums">{t('set.summary', { n: store.orders.length, done, kb: sizeKb })}</p>
            <div className="flex gap-2">
              <button onClick={exportJson} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"><Download className="w-4 h-4" strokeWidth={1.5} /> {t('set.export')}</button>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"><Upload className="w-4 h-4" strokeWidth={1.5} /> {t('set.import')}</button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
            </div>
          </div>
          {importError && <p className="text-[12px] text-danger">{importError}</p>}
        </Card>
      </div>
    </div>
  )
}
