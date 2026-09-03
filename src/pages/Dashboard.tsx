import { Bell, PackageCheck, Clock, MessageSquare, Phone } from 'lucide-react'
import { buckets, daysSince, type Order, type Settings, type Status } from '../lib/orders'

type Tone = 'danger' | 'warning' | 'primary' | 'success'
const toneText: Record<Tone, string> = { danger: 'text-danger', warning: 'text-warning', primary: 'text-primary', success: 'text-success' }
const toneBg: Record<Tone, string> = { danger: 'bg-danger/10', warning: 'bg-warning/10', primary: 'bg-primary/10', success: 'bg-success/10' }

function Section({ title, hint, count, icon: Icon, tone, action, onAction, orders, meta }: {
  title: string; hint: string; count: number; icon: React.ElementType; tone: Tone; action: string; onAction: (o: Order) => void; orders: Order[]; meta: (o: Order) => string
}) {
  return (
    <section className="bg-card rounded-xl border border-border/60 flex flex-col">
      <header className="flex items-center gap-3 p-5 pb-4">
        <div className={`w-9 h-9 rounded-lg ${toneBg[tone]} flex items-center justify-center shrink-0`}>
          <Icon className={`w-[18px] h-[18px] ${toneText[tone]}`} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-medium leading-tight">{title}</h2>
          <p className="text-[12px] text-muted-foreground truncate">{hint}</p>
        </div>
        <span className={`text-2xl font-semibold tabular-nums ${count ? toneText[tone] : 'text-muted-foreground/40'}`}>{count}</span>
      </header>
      <div className="border-t border-border/50">
        {orders.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-muted-foreground/60 text-center">Nothing here. Good.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {orders.map(o => (
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
                    <span>{meta(o)}</span>
                    {o.price != null && (<><span>·</span><span className="tabular-nums">{o.price} €{o.paid ? ', paid' : ''}</span></>)}
                  </div>
                </div>
                <button onClick={() => onAction(o)} className="shrink-0 text-[12px] font-medium px-3 py-1.5 rounded-md border border-border/60 bg-background hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {action}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

const rel = (iso: string, verb: string) => { const d = daysSince(iso); return `${verb} ${d === 0 ? 'today' : `${d} d ago`}` }

export default function Dashboard({ orders, settings, onAction, onOpenOrders }: { orders: Order[]; settings: Settings; onAction: (o: Order, status: Status) => void; onOpenOrders: (filter: string) => void }) {
  const b = buckets(orders, settings)
  const raw = new Date().toLocaleDateString('lt-LT', { weekday: 'long', day: 'numeric', month: 'long' })
  const today = raw.charAt(0).toUpperCase() + raw.slice(1)
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Section title="Arrived, customer not notified" hint="Send the pickup SMS" count={b.toNotify.length} icon={Bell} tone="danger"
          action="Notify" onAction={o => onAction(o, 'notified')} orders={b.toNotify} meta={o => rel(o.arrivedAt ?? o.createdAt, 'arrived')} />
        <Section title="Notified, not picked up" hint={`${settings.followUpDays}+ days since the SMS`} count={b.notPickedUp.length} icon={PackageCheck} tone="warning"
          action="Notify again" onAction={o => onAction(o, 'notified')} orders={b.notPickedUp} meta={o => rel(o.notifiedAt!, 'notified')} />
        <Section title="Ordered, still waiting" hint={`${settings.staleDays}+ days with no arrival`} count={b.stale.length} icon={Clock} tone="primary"
          action="Open" onAction={() => onOpenOrders('ordered')} orders={b.stale} meta={o => `${rel(o.createdAt, 'ordered')}${o.supplier ? ` · supplier ${o.supplier}` : ''}`} />
        <Section title="Requests not contacted" hint="Customer is waiting for a call" count={b.openRequests.length} icon={MessageSquare} tone="success"
          action="Mark contacted" onAction={o => onAction(o, 'contacted')} orders={b.openRequests} meta={o => rel(o.createdAt, 'asked')} />
      </div>
    </div>
  )
}
