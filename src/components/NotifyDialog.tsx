import { useEffect, useRef, useState } from 'react'
import { X, Send, Phone } from 'lucide-react'
import { daysSince, renderSms, TEMPLATE_LABEL, type Order, type Settings, type TemplateKey } from '../lib/orders'

type Props = { order: Order; settings: Settings; onSend: (message: string) => Promise<void>; onClose: () => void }

// GSM-7 messages hold 160 chars per segment; anything outside basic ASCII (Lithuanian letters) forces UCS-2 at 70.
const segments = (text: string) => Math.max(1, Math.ceil(text.length / (/[^\x20-\x7E]/.test(text) ? 70 : 160)))

export function NotifyDialog({ order, settings, onSend, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const isRepeat = order.status === 'notified'
  const [key, setKey] = useState<TemplateKey>(isRepeat ? 'reminder' : 'arrived')
  const [text, setText] = useState(() => renderSms(settings.templates[key], order, settings.company))
  const [edited, setEdited] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const send = async () => {
    setSending(true); setError('')
    try { await onSend(text.trim()) } catch (e) { setError(e instanceof Error ? e.message : 'Could not send'); setSending(false) }
  }

  useEffect(() => { ref.current?.showModal() }, [])
  // Switching template replaces the text unless staff already edited it by hand.
  const pick = (k: TemplateKey) => { setKey(k); if (!edited) setText(renderSms(settings.templates[k], order, settings.company)) }

  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose} onKeyDown={e => e.key === 'Escape' && ref.current?.close()}
      className="m-auto w-full max-w-md rounded-xl border border-border bg-card text-foreground p-0 backdrop:bg-black/40 backdrop:backdrop-blur-[2px]">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold">{isRepeat ? 'Send a reminder' : 'Notify customer'}</h2>
            <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="font-medium text-foreground">{order.customer}</span>
              <Phone className="w-3 h-3" strokeWidth={1.5} /><span className="tabular-nums">{order.phone}</span>
            </p>
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="p-1 -m-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"><X className="w-4 h-4" strokeWidth={1.5} /></button>
        </div>

        {isRepeat && order.notifiedAt && (
          <p className="mb-4 text-[12px] text-warning bg-warning/10 rounded-md px-3 py-2">
            Last SMS sent {daysSince(order.notifiedAt) === 0 ? 'today' : `${daysSince(order.notifiedAt)} days ago`}.
          </p>
        )}

        <div className="grid grid-cols-3 gap-1 p-1 mb-4 rounded-lg bg-black/5 dark:bg-white/5 text-[12px]">
          {(Object.keys(TEMPLATE_LABEL) as TemplateKey[]).map(k => (
            <button key={k} type="button" onClick={() => pick(k)}
              className={`h-8 rounded-md font-medium transition ${key === k ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {TEMPLATE_LABEL[k]}
            </button>
          ))}
        </div>

        <textarea value={text} onChange={e => { setText(e.target.value); setEdited(true) }} rows={5}
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-[13px] leading-relaxed outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition resize-y" />
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums">
          <span>{edited ? 'Edited by hand' : `Template: ${TEMPLATE_LABEL[key]}`}</span>
          <span>{text.length} chars · {segments(text)} SMS</span>
        </div>

        {error && <p className="mt-3 text-[12px] text-danger bg-danger/10 rounded-md px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={() => ref.current?.close()} className="h-9 px-4 rounded-md text-[13px] font-medium border border-border hover:bg-black/5 dark:hover:bg-white/5">Cancel</button>
          <button type="button" disabled={!text.trim() || sending} onClick={send}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
            <Send className="w-3.5 h-3.5" strokeWidth={2} /> {sending ? 'Sending…' : 'Send SMS'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
