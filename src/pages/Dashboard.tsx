import { Bell, PackageCheck, Clock, MessageSquare, Phone, CheckCircle2, ArrowRight } from 'lucide-react'
import { buckets, daysSince, type Order, type Settings, type Status } from '../lib/orders'

type Tone = 'danger' | 'warning' | 'primary' | 'success'
type Key = 'toNotify' | 'notPickedUp' | 'stale' | 'openRequests'

// Card background carries the status colour; tiles inside stay neutral so text stays readable.
const tone: Record<Tone, { card: string; text: string; solid: string; soft: string }> = {
  danger: { card: 'bg-danger/10 border-danger/20', text: 'text-danger', solid: 'bg-danger text-white', soft: 'bg-danger/15 hover:bg-danger/25' },
  warning: { card: 'bg-warning/10 border-warning/25', text: 'text-warning', solid: 'bg-warning text-white', soft: 'bg-warning/15 hover:bg-warning/25' },
  primary: { card: 'bg-primary/10 border-primary/20', text: 'text-primary', solid: 'bg-primary text-primary-foreground', soft: 'bg-primary/15 hover:bg-primary/25' },
  success: { card: 'bg-success/10 border-success/20', text: 'text-success', solid: 'bg-success text-white', soft: 'bg-success/15 hover:bg-success/25' },
}

const rel = (iso: string, verb: string) => { const d = daysSince(iso); return `${verb} ${d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} d ago`}` }

type SectionDef = {
  key: Key; title: string; hint: (s: Settings) => string; icon: React.ElementType; tone: Tone; filter: string
  action: string; meta: (o: Order) => string; recent: (o: Order) => string
  run: (o: Order, act: (o: Order, s: Status) => void, open: (f: string) => void) => void
}

const SECTIONS: SectionDef[] = [
  { key: 'toNotify', title: 'Arrived, not notified', hint: () => 'Send the pickup SMS', icon: Bell, tone: 'danger', filter: 'arrived', action: 'Notify',
    meta: o => rel(o.arrivedAt ?? o.createdAt, 'arrived'), recent: o => o.arrivedAt ?? o.createdAt, run: (o, act) => act(o, 'notified') },
  { key: 'notPickedUp', title: 'Notified, not picked up', hint: s => `${s.followUpDays}+ days since the SMS`, icon: PackageCheck, tone: 'warning', filter: 'notified', action: 'Notify again',
    meta: o => rel(o.notifiedAt!, 'notified'), recent: o => o.notifiedAt!, run: (o, act) => act(o, 'notified') },
  { key: 'stale', title: 'Ordered, still waiting', hint: s => `${s.staleDays}+ days with no arrival`, icon: Clock, tone: 'primary', filter: 'ordered', action: 'Open in Orders',
    meta: o => `${rel(o.createdAt, 'ordered')}${o.supplier ? ` · supplier ${o.supplier}` : ''}`, recent: o => o.createdAt, run: (_, __, open) => open('ordered') },
  { key: 'openRequests', title: 'Requests not contacted', hint: () => 'Customer is waiting for a call', icon: MessageSquare, tone: 'success', filter: 'requests', action: 'Mark contacted',
    meta: o => rel(o.createdAt, 'asked'), recent: o => o.createdAt, run: (o, act) => act(o, 'contacted') },
]

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

function StatusCard({ s, items, settings, onAction, onOpenOrders }: {
  s: SectionDef; items: Order[]; settings: Settings; onAction: (o: Order, status: Status) => void; onOpenOrders: (f: string) => void
}) {
  const t = tone[s.tone]
  const latest = [...items].sort((a, b) => s.recent(b).localeCompare(s.recent(a)))[0]
  const more = items.length - 1
  const open = () => onOpenOrders(s.filter)

  return (
    <section className={`rounded-2xl border p-5 ${items.length ? t.card : 'bg-card border-border/60'}`}>
      <header className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${items.length ? t.solid : 'bg-black/5 dark:bg-white/10 text-muted-foreground'}`}>
          <s.icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight">{s.title}</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">{s.hint(settings)}</p>
        </div>
        <span className={`text-3xl font-semibold tabular-nums leading-none ${items.length ? t.text : 'text-muted-foreground/30'}`}>{items.length}</span>
      </header>

      {!latest ? (
        <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] px-4 py-6 text-center text-[13px] text-muted-foreground flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={2} /> Nothing here
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Most recent customer */}
          <div className="aspect-square rounded-xl bg-card border border-black/5 dark:border-white/5 p-4 flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-9 h-9 rounded-full ${t.solid} flex items-center justify-center text-[12px] font-semibold shrink-0`}>{initials(latest.customer)}</span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold truncate leading-tight">{latest.customer}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1"><Phone className="w-3 h-3" strokeWidth={1.5} />{latest.phone}</div>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-snug line-clamp-2">{latest.product}</p>
            <p className="text-[12px] text-muted-foreground mt-1 truncate">
              {s.meta(latest)}{latest.price != null && <> · {latest.price} €{latest.paid ? ', paid' : ''}</>}
            </p>
            <button onClick={() => s.run(latest, onAction, onOpenOrders)}
              className={`mt-auto h-9 w-full rounded-lg text-[13px] font-medium transition ${t.solid} hover:opacity-90`}>
              {s.action}
            </button>
          </div>

          {/* See all */}
          <button onClick={open} className={`group aspect-square rounded-xl ${t.soft} transition flex flex-col items-center justify-center gap-1 p-4 text-center`}>
            {more > 0 ? (
              <>
                <span className={`text-5xl font-semibold tabular-nums leading-none ${t.text}`}>+{more}</span>
                <span className="text-[13px] text-muted-foreground mt-2">{more === 1 ? 'more customer' : 'more customers'}</span>
              </>
            ) : (
              <span className="text-[13px] text-muted-foreground">Only one right now</span>
            )}
            <span className={`inline-flex items-center gap-1 text-[13px] font-medium mt-1 ${t.text}`}>
              See all <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
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
  const b = buckets(orders, settings)
  const raw = new Date().toLocaleDateString('lt-LT', { weekday: 'long', day: 'numeric', month: 'long' })
  const today = raw.charAt(0).toUpperCase() + raw.slice(1)
  const total = SECTIONS.reduce((n, s) => n + b[s.key].length, 0)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {total === 0 ? 'Nothing waiting on you' : <><span className="font-medium text-foreground">{total}</span> {total === 1 ? 'thing' : 'things'} to do</>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {SECTIONS.map(s => <StatusCard key={s.key} s={s} items={b[s.key]} settings={settings} onAction={onAction} onOpenOrders={onOpenOrders} />)}
      </div>
    </div>
  )
}
