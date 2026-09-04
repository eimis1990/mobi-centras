import { Bell, PackageCheck, Clock, MessageSquare, Phone, CheckCircle2, ArrowRight } from 'lucide-react'
import { buckets, daysSince, type Order, type Settings, type Status } from '../lib/orders'
import { relDays, useT, type T, type TKey } from '../lib/i18n'

type Tone = 'danger' | 'warning' | 'primary' | 'success'
type Key = 'toNotify' | 'notPickedUp' | 'stale' | 'openRequests'

// Card background carries the status colour; tiles inside stay neutral so text stays readable.
const tone: Record<Tone, { card: string; text: string; solid: string; soft: string }> = {
  danger: { card: 'bg-danger/10 border-danger/20', text: 'text-danger', solid: 'bg-danger text-white', soft: 'bg-danger/15 hover:bg-danger/25' },
  warning: { card: 'bg-warning/10 border-warning/25', text: 'text-warning', solid: 'bg-warning text-white', soft: 'bg-warning/15 hover:bg-warning/25' },
  primary: { card: 'bg-primary/10 border-primary/20', text: 'text-primary', solid: 'bg-primary text-primary-foreground', soft: 'bg-primary/15 hover:bg-primary/25' },
  success: { card: 'bg-success/10 border-success/20', text: 'text-success', solid: 'bg-success text-white', soft: 'bg-success/15 hover:bg-success/25' },
}

type SectionDef = {
  key: Key; title: TKey; hint: TKey; hintVar: (s: Settings) => number | undefined; icon: React.ElementType; tone: Tone; filter: string
  action: TKey; verb: TKey; when: (o: Order) => string; extra?: (o: Order, t: T) => string
  run: (o: Order, act: (o: Order, s: Status) => void, open: (f: string) => void) => void
}

const SECTIONS: SectionDef[] = [
  { key: 'toNotify', title: 'dash.toNotify', hint: 'dash.toNotifyHint', hintVar: () => undefined, icon: Bell, tone: 'danger', filter: 'arrived', action: 'action.notify',
    verb: 'dash.arrived', when: o => o.arrivedAt ?? o.createdAt, run: (o, act) => act(o, 'notified') },
  { key: 'notPickedUp', title: 'dash.notPickedUp', hint: 'dash.notPickedUpHint', hintVar: s => s.followUpDays, icon: PackageCheck, tone: 'warning', filter: 'notified', action: 'action.notifyAgain',
    verb: 'dash.notified', when: o => o.notifiedAt!, run: (o, act) => act(o, 'notified') },
  { key: 'stale', title: 'dash.stale', hint: 'dash.staleHint', hintVar: s => s.staleDays, icon: Clock, tone: 'primary', filter: 'ordered', action: 'action.openInOrders',
    verb: 'dash.ordered', when: o => o.createdAt, extra: (o, t) => (o.supplier ? ` · ${t('common.supplier', { s: o.supplier }).replace(/^\S+/, w => w.toLowerCase())}` : ''), run: (_, __, open) => open('ordered') },
  { key: 'openRequests', title: 'dash.openRequests', hint: 'dash.openRequestsHint', hintVar: () => undefined, icon: MessageSquare, tone: 'success', filter: 'requests', action: 'action.markContacted',
    verb: 'dash.asked', when: o => o.createdAt, run: (o, act) => act(o, 'contacted') },
]

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

function StatusCard({ s, items, settings, onAction, onOpenOrders }: {
  s: SectionDef; items: Order[]; settings: Settings; onAction: (o: Order, status: Status) => void; onOpenOrders: (f: string) => void
}) {
  const { t } = useT()
  const c = tone[s.tone]
  const latest = [...items].sort((a, b) => s.when(b).localeCompare(s.when(a)))[0]
  const more = items.length - 1

  return (
    <section className={`rounded-2xl border p-4 ${items.length ? c.card : 'bg-card border-border/60'}`}>
      <header className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${items.length ? c.solid : 'bg-black/5 dark:bg-white/10 text-muted-foreground'}`}>
          <s.icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight">{t(s.title)}</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{t(s.hint, { n: s.hintVar(settings) ?? '' })}</p>
        </div>
        <span className={`text-2xl font-semibold tabular-nums leading-none ${items.length ? c.text : 'text-muted-foreground/30'}`}>{items.length}</span>
      </header>

      {!latest ? (
        <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-4 text-center text-[13px] text-muted-foreground flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} /> {t('dash.empty')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-card border border-black/5 dark:border-white/5 p-3 flex items-center gap-3 min-w-0">
            <span className={`w-9 h-9 rounded-full ${c.solid} flex items-center justify-center text-[12px] font-semibold shrink-0`}>{initials(latest.customer)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[13px] font-semibold truncate">{latest.customer || '—'}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline-flex items-center gap-1"><Phone className="w-3 h-3" strokeWidth={1.5} />{latest.phone}</span>
              </div>
              <div className="text-[13px] truncate">{latest.product}</div>
              <div className="text-[12px] text-muted-foreground truncate">
                {t(s.verb)} {relDays(t, daysSince(s.when(latest)))}{s.extra?.(latest, t)}
                {latest.price != null && <> · {latest.price} €{latest.paid ? `, ${t('common.paid')}` : ''}</>}
              </div>
            </div>
            <button onClick={() => s.run(latest, onAction, onOpenOrders)} className={`shrink-0 h-8 px-3 rounded-lg text-[12px] font-medium transition ${c.solid} hover:opacity-90`}>
              {t(s.action)}
            </button>
          </div>
          <button onClick={() => onOpenOrders(s.filter)} className={`group h-9 px-3 rounded-lg ${c.soft} transition flex items-center justify-between text-[13px]`}>
            <span className={`font-medium tabular-nums ${c.text}`}>{more > 0 ? t('dash.more', { n: more }) : t('dash.onlyOne')}</span>
            <span className={`inline-flex items-center gap-1 ${c.text}`}>
              {t('dash.seeAll')} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </span>
          </button>
        </div>
      )}
    </section>
  )
}

export default function Dashboard({ orders, settings, onAction, onOpenOrders }: {
  orders: Order[]; settings: Settings; onAction: (o: Order, status: Status) => void; onOpenOrders: (filter: string) => void
}) {
  const { t, locale } = useT()
  const b = buckets(orders, settings)
  const raw = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const today = raw.charAt(0).toUpperCase() + raw.slice(1)
  const total = SECTIONS.reduce((n, s) => n + b[s.key].length, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('dash.title')}</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">{total === 0 ? t('dash.nothing') : t('dash.things', { n: total })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map(s => <StatusCard key={s.key} s={s} items={b[s.key]} settings={settings} onAction={onAction} onOpenOrders={onOpenOrders} />)}
      </div>
    </div>
  )
}
