import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Building2, MessageSquareText, SlidersHorizontal, Database, KeyRound, CheckCircle2 } from 'lucide-react'
import { isDone, normalizeSettings, renderSms, SMS_PLACEHOLDERS, TEMPLATE_LABEL, type Settings as SettingsT, type Store, type TemplateKey } from '../lib/orders'

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
    if (r.ok) { setStatus(await r.json()); setSid(''); setToken(''); setFrom(''); setEditing(false); setMsg({ ok: true, text: 'Verified with Twilio and saved.' }) }
    else setMsg({ ok: false, text: await r.text() })
    setBusy(null)
  }
  const remove = async () => {
    if (!confirm('Remove the stored Twilio credentials? SMS sending will stop until new ones are added.')) return
    setBusy('remove'); setMsg(null)
    const r = await fetch('/api/twilio', { method: 'DELETE' })
    if (r.ok) setStatus(await r.json())
    setBusy(null)
  }
  const test = async () => {
    setBusy('test'); setMsg(null)
    const r = await fetch('/api/sms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: testTo, message: `Test SMS from MobiCentras. Everything works.`, sender }) })
    setMsg(r.ok ? { ok: true, text: `Test SMS sent to ${testTo}.` } : { ok: false, text: await r.text() })
    setBusy(null)
  }

  return (
    <Card icon={KeyRound} title="Twilio account" hint="Credentials are verified, encrypted and stored on the server. They are never shown again.">
      {status?.configured && !editing && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[13px]">
            <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} />
            <span>Connected · account ending <span className="font-mono">{status.sidLast4}</span> · number <span className="tabular-nums">{status.from}</span></span>
            {status.savedAt && <span className="text-muted-foreground">· saved {new Date(status.savedAt).toLocaleDateString('lt-LT')}</span>}
          </p>
          <div className="flex gap-2">
            <button onClick={test} disabled={!!busy} className="h-8 px-3 rounded-md border border-border text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50">{busy === 'test' ? 'Sending…' : 'Send test SMS'}</button>
            <button onClick={() => setEditing(true)} className="h-8 px-3 rounded-md border border-border text-[12px] font-medium hover:bg-black/5 dark:hover:bg-white/5">Replace</button>
            <button onClick={remove} disabled={!!busy} className="h-8 px-3 rounded-md text-[12px] font-medium text-danger hover:bg-danger/10 disabled:opacity-50">Remove</button>
          </div>
        </div>
      )}
      {showForm && status && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Account SID</label>
              <input className={`${field} font-mono`} value={sid} onChange={e => setSid(e.target.value)} placeholder="AC…" autoComplete="off" />
              <p className="text-[11px] text-muted-foreground mt-1">Starts with AC, 34 characters. From the Twilio console home page.</p>
            </div>
            <div>
              <label className={label}>Auth token</label>
              <input className={`${field} font-mono`} type="password" value={token} onChange={e => setToken(e.target.value)} autoComplete="new-password" />
              <p className="text-[11px] text-muted-foreground mt-1">Next to the SID in the console. Stored encrypted.</p>
            </div>
            <div>
              <label className={label}>Twilio phone number</label>
              <input className={field} value={from} onChange={e => setFrom(e.target.value)} placeholder="+15551234567" inputMode="tel" />
              <p className="text-[11px] text-muted-foreground mt-1">Used as the sender where a name is not allowed.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={!!busy || !sid || !token || !from} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 disabled:opacity-40">{busy === 'save' ? 'Verifying…' : 'Verify and save'}</button>
            {editing && <button onClick={() => { setEditing(false); setMsg(null) }} className="h-9 px-4 rounded-md border border-border text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5">Cancel</button>}
          </div>
        </div>
      )}
      {!status && <p className="text-[13px] text-muted-foreground">Checking…</p>}
      {msg && <p className={`text-[12px] rounded-md px-3 py-2 ${msg.ok ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>{msg.text}</p>}
    </Card>
  )
}

export default function Settings({ store, onSave, onImport }: Props) {
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
      if (!confirm(`Replace the current ${store.orders.length} orders with ${data.orders.length} from this file?`)) return
      onImport({ version: 1, settings: normalizeSettings(data.settings), orders: data.orders })
    } catch (e) {
      setImportError(e instanceof Error && e.message === 'not an orders file' ? 'That file is not a MobiCentras export.' : 'Could not read that file.')
    }
  }

  const done = store.orders.filter(isDone).length
  const sizeKb = Math.round(JSON.stringify(store).length / 1024)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Company details, the pickup SMS, and housekeeping rules</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!dirty && savedAt > 0 && Date.now() - savedAt < 3000 && <span className="text-[12px] text-muted-foreground">Saved</span>}
          <button disabled={!dirty} onClick={() => { onSave(s); setSavedAt(Date.now()) }}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition">Save changes</button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card icon={Building2} title="Company" hint="Used in the SMS text and as the sender name">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={label}>Company name</label><input className={field} value={s.company.name} onChange={e => setCompany('name', e.target.value)} /></div>
            <div><label className={label}>Phone</label><input className={field} value={s.company.phone} onChange={e => setCompany('phone', e.target.value)} inputMode="tel" /></div>
            <div><label className={label}>Address</label><input className={field} value={s.company.address} onChange={e => setCompany('address', e.target.value)} /></div>
            <div>
              <label className={label}>SMS sender name</label>
              <input className={field} value={s.company.smsSender} maxLength={11} onChange={e => setCompany('smsSender', e.target.value.replace(/[^A-Za-z0-9]/g, ''))} />
              <p className="text-[11px] text-muted-foreground mt-1">Up to 11 letters or digits, no spaces. Shown as the sender instead of a phone number.</p>
            </div>
          </div>
        </Card>

        <Card icon={MessageSquareText} title="SMS templates" hint="Staff pick one when pressing Notify and can still edit the text before sending">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5 text-[12px]">
            {(Object.keys(TEMPLATE_LABEL) as TemplateKey[]).map(k => (
              <button key={k} type="button" onClick={() => setTpl(k)}
                className={`h-8 rounded-md font-medium transition ${tpl === k ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{TEMPLATE_LABEL[k]}</button>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground -mt-1">
            {tpl === 'arrived' && 'Default for the first Notify on an order.'}
            {tpl === 'repairReady' && 'For orders that were really a repair job. Staff switch to it in the Notify dialog.'}
            {tpl === 'reminder' && 'Default for Notify again. {days} is how long the item has been waiting.'}
          </p>
          <div>
            <label className={label}>Message</label>
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
              <span className="text-[12px] font-medium text-muted-foreground">Preview</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{preview.length} chars · {smsSegments(preview)} SMS</span>
            </div>
            <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-border/50 px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap">{preview}</div>
          </div>
        </Card>

        <TwilioCard sender={store.settings.company.smsSender} testTo={store.settings.company.phone} />

        <Card icon={SlidersHorizontal} title="Rules" hint="Thresholds for the dashboard and automatic cleanup">
          <div className="flex flex-col divide-y divide-border/50 -my-2">
            <div className="flex items-center justify-between gap-4 py-3">
              <div><div className="text-[13px] font-medium">Follow up after</div><div className="text-[12px] text-muted-foreground">Days since the SMS before an order shows as not picked up</div></div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Num value={s.followUpDays} onChange={n => set('followUpDays', n)} max={365} /> days</div>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <div><div className="text-[13px] font-medium">Order is late after</div><div className="text-[12px] text-muted-foreground">Days since ordering before it shows as still waiting</div></div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Num value={s.staleDays} onChange={n => set('staleDays', n)} max={365} /> days</div>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <div><div className="text-[13px] font-medium">Delete completed orders after</div><div className="text-[12px] text-muted-foreground">Picked up, closed and cancelled orders are removed, along with the customer's name and phone</div></div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground"><Num value={s.retentionDays} onChange={n => set('retentionDays', n)} /> days</div>
            </div>
          </div>
        </Card>

        <Card icon={Database} title="Data" hint="Everything lives in one file. Keep a copy.">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[13px] text-muted-foreground tabular-nums">{store.orders.length} orders, {done} completed · {sizeKb} KB</p>
            <div className="flex gap-2">
              <button onClick={exportJson} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"><Download className="w-4 h-4" strokeWidth={1.5} /> Export</button>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-border text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"><Upload className="w-4 h-4" strokeWidth={1.5} /> Import</button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
            </div>
          </div>
          {importError && <p className="text-[12px] text-danger">{importError}</p>}
        </Card>
      </div>
    </div>
  )
}
