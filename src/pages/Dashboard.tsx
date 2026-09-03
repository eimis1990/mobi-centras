import { useState } from 'react'
import { Bell, PackageCheck, Clock, MessageSquare, Phone, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { buckets, daysSince, type Order, type Settings, type Status } from '../lib/orders'

type Tone = 'danger' | 'warning' | 'primary' | 'success'
type Key = 'toNotify' | 'notPickedUp' | 'stale' | 'openRequests'

const tone: Record<Tone, { text: string; bg: string; ring: string; dot: string }> = {
  danger: { text: 'text-danger', bg: 'bg-danger/10', ring: 'ring-danger/30', dot: 'bg-danger' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/30', dot: 'bg-warning' },
  primary: { text: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/30', dot: 'bg-primary' },
  success: { text: 'text-success', bg: 'bg-success/10', ring: 'ring-success/30', dot: 'bg-success' },
}

const rel = (iso: string, verb: string) => { const d = daysSince(iso); return `${verb} ${d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} d ago`}` }

type SectionDef = {
  key: Key; title: string; hint: (s: Settings) => string; icon: React.ElementType; tone: Tone
  action: string; meta: (o: Order) => string
  run: (o: Order, act: (o: Order, s: Status) => void, open: (f: string) => void) => void
}

const SECTIONS: SectionDef[] = [
  { key: 'toNotify', title: 'Arrived, not notified', hint: () => 'Send the pickup SMS', icon: Bell, tone: 'danger', action: 'Notify',
    meta: o => rel(o.arrivedAt ?? o.createdAt, 'arrived'), run: (o, act) => act(o, 'notified') },
  { key: 'notPickedUp', title: 'Notified, not picked up', hint: s => `${s.followUpDays}+ days since the SMS`, icon: PackageCheck, tone: 'warning', action: 'Notify again',
    meta: o => rel(o.notifiedAt!, 'notified'), run: (o, act) => act(o, 'notified') },
  { key: 'stale', title: 'Ordered, still waiting', hint: s => `${s.staleDays}+ days with no arrival`, icon: Clock, tone: 'primary', action: 'Open',
    meta: o => `${rel(o.createdAt, 'ordered')}${o.supplier ? ` · supplier ${o.supplier}` : ''}`, run: (_, __, open) => open('ordered') },
  { key: 'openRequests', title: 'Requests not contacted', hint: () => 'Customer is waiting for a call', icon: MessageSquare, tone: 'success', action: 'Mark contacted',
    meta: o => rel(o.createdAt, 'asked'), run: (o, act) => act(o, 'contacted') },
]

export default function Dashboard({ orders, settings, onAction, onOpenOrders }: {
  orders: Order[]; settings: Settings; onAction: (o: Order, status: Status) => void; onOpenOrders: (filter: string) => void
}) {
  const b = buckets(orders, settings)
  const [filter, setFilter] = useState<Key | null>(null)
  const raw = new Date().toLocaleDateString('lt-LT', { weekday: 'long', day: 'numeric', month: 'long' })
  const today = raw.charAt(0).toUpperCase() + raw.slice(1)
  const total = SECTIONS.reduce((n, s) => n + b[s.key].length, 0)
  const visible = SECTIONS.filter(s => (filter ? s.key === filter : true) && b[s.key].length > 0)

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

      {/* Stat tiles double as filters for the list below. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {SECTIONS.map(s => {
          const n = b[s.key].length
          const active = filter === s.key
          const t = tone[s.tone]
          return (
            <button key={s.key} onClick={() => setFilter(active ? null : s.key)} disabled={n === 0 && !active}
              className={`group text-left rounded-xl border bg-card p-4 transition-all disabled:cursor-default
                ${active ? `border-transparent ring-2 ${t.ring}` : 'border-border/60 hover:border-border enabled:hover:-translate-y-px'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-[18px] h-[18px] ${t.text}`} strokeWidth={1.75} />
                </div>
                <span className={`text-3xl font-semibold tabular-nums leading-none ${n ? t.text : 'text-muted-foreground/30'}`}>{n}</span>
              </div>
              <div className="mt-4 text-[13px] font-medium leading-tight">{s.title}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5 truncate">{s.hint(settings)}</div>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card px-6 py-14 text-center">
          <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[14px] font-medium">All caught up</p>
          <p className="text-[13px] text-muted-foreground mt-1">{filter ? 'Nothing in this group.' : 'Every arrived item is notified and every request has been answered.'}</p>
          {filter && <button onClick={() => setFilter(null)} className="mt-4 text-[13px] text-primary hover:underline">Show everything</button>}
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {visible.map((s, i) => {
            const t = tone[s.tone]
            return (
              <section key={s.key} className={i > 0 ? 'border-t border-border/60' : ''}>
                <header className="flex items-center gap-2.5 px-5 py-2.5 bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                  <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{s.title}</h2>
                  <span className="text-[12px] text-muted-foreground/60 tabular-nums">{b[s.key].length}</span>
                  <button onClick={() => onOpenOrders(s.key === 'openRequests' ? 'requests' : s.key === 'toNotify' ? 'arrived' : s.key === 'notPickedUp' ? 'notified' : 'ordered')}
                    className="ml-auto inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition">
                    View in Orders <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </header>
                <ul className="divide-y divide-border/50">
                  {b[s.key].map(o => (
                    <li key={o.id} className="flex items-center gap-4 px-5 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[13px] font-medium truncate">{o.customer}</span>
                          <span className="text-[12px] text-muted-foreground truncate">{o.product}</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-2 text-[12px] text-muted-foreground/80 mt-0.5 [&>span]:whitespace-nowrap">
                          <Phone className="w-3 h-3" strokeWidth={1.5} />
                          <span className="tabular-nums">{o.phone}</span>
                          <span>·</span>
                          <span>{s.meta(o)}</span>
                          {o.price != null && (<><span>·</span><span className="tabular-nums">{o.price} €{o.paid ? ', paid' : ''}</span></>)}
                        </div>
                      </div>
                      <button onClick={() => s.run(o, onAction, onOpenOrders)}
                        className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-md border border-border/60 bg-background hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        {s.action}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
