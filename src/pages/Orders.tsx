import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Phone, MoreHorizontal, Check } from 'lucide-react'
import { actions, daysSince, isDone, STATUS_LABEL, type Order, type Status } from '../lib/orders'
import { OrderDialog } from '../components/OrderDialog'
import { tableCls, thCls, tdCls } from '../components/table'
import { SearchInput } from '../components/SearchInput'

type Props = { orders: Order[]; onSave: (o: Order) => void; onDelete: (id: string) => void; onAction: (o: Order, status: Status) => void }

const FILTERS: Record<string, { label: string; fn: (o: Order) => boolean }> = {
  active: { label: 'Active', fn: o => !isDone(o) },
  arrived: { label: 'To notify', fn: o => o.status === 'arrived' },
  notified: { label: 'Waiting pickup', fn: o => o.status === 'notified' },
  ordered: { label: 'Ordered', fn: o => o.status === 'ordered' },
  requests: { label: 'Requests', fn: o => o.type === 'request' && !isDone(o) },
  done: { label: 'Completed', fn: isDone },
  all: { label: 'All', fn: () => true },
}

const PILL: Record<Status, string> = {
  ordered: 'bg-black/5 dark:bg-white/10 text-muted-foreground',
  arrived: 'bg-danger/10 text-danger',
  notified: 'bg-warning/15 text-warning',
  picked_up: 'bg-success/10 text-success',
  cancelled: 'bg-black/5 dark:bg-white/10 text-muted-foreground',
  open: 'bg-success/10 text-success',
  contacted: 'bg-primary/10 text-primary',
  closed: 'bg-black/5 dark:bg-white/10 text-muted-foreground',
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const ago = (iso: string) => {
  const d = daysSince(iso)
  if (d < 7) return rtf.format(-d, 'day')
  if (d < 30) return rtf.format(-Math.floor(d / 7), 'week')
  return rtf.format(-Math.floor(d / 30), 'month')
}
const short = (iso: string) => { const d = daysSince(iso); return d === 0 ? 'today' : `${d} d` }

export default function Orders({ orders, onSave, onDelete, onAction }: Props) {
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') && FILTERS[params.get('filter')!] ? params.get('filter')! : 'active'
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [editing, setEditing] = useState<Order | null | 'new'>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  useEffect(() => {
    if (!menuFor) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuFor(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuFor])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    return orders
      .filter(FILTERS[filter].fn)
      .filter(o => !q || o.customer.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) || (digits.length >= 3 && o.phone.replace(/\D/g, '').includes(digits)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, filter, query])

  const counts = useMemo(() => Object.fromEntries(Object.entries(FILTERS).map(([k, f]) => [k, orders.filter(f.fn).length])), [orders])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">Products ordered for customers and things they're looking for</p>
        </div>
        <button onClick={() => setEditing('new')} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition shrink-0">
          <Plus className="w-4 h-4" strokeWidth={2} /> New order
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <SearchInput className="flex-1 max-w-sm" value={query} placeholder="Name, phone or product…"
          onChange={v => { setQuery(v); if (!v && params.has('q')) { params.delete('q'); setParams(params) } }} />
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {Object.entries(FILTERS).map(([k, f]) => (
            <button key={k} onClick={() => setParams(k === 'active' ? {} : { filter: k })}
              className={`h-8 px-3 rounded-md text-[12px] font-medium whitespace-nowrap transition ${filter === k ? 'bg-black/8 dark:bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'}`}>
              {f.label} <span className="opacity-50 tabular-nums ml-0.5">{counts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-[13px] text-muted-foreground/60 text-center">{query ? 'No matches.' : 'Nothing here.'}</p>
        ) : (
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Customer</th>
                <th className={thCls}>Product / Request</th>
                <th className={`${thCls} text-right`}>Price</th>
                <th className={thCls}>Status</th>
                <th className={`${thCls} text-right`}>Age</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => {
                const acts = actions(o)
                const primary = acts.find(a => a.primary)
                return (
                  <tr key={o.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className={tdCls}>
                      <div className="font-medium">{o.customer}</div>
                      <div className="flex items-center gap-1 text-[12px] text-muted-foreground tabular-nums"><Phone className="w-3 h-3" strokeWidth={1.5} />{o.phone}</div>
                    </td>
                    <td className={`${tdCls} max-w-sm`}>
                      <div className="truncate">{o.product}</div>
                      {o.type === 'request'
                        ? <span className="inline-flex mt-0.5 h-[18px] px-1.5 items-center rounded border border-border text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Request</span>
                        : <div className="text-[12px] text-muted-foreground">{o.supplier ? `Supplier ${o.supplier}` : 'Product'}</div>}
                    </td>
                    <td className={`${tdCls} text-right tabular-nums whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-1">
                        {o.price != null ? `${o.price} €` : <span className="text-muted-foreground/50">–</span>}
                        {o.paid && <Check className="w-3.5 h-3.5 text-success" strokeWidth={2.5} aria-label="Paid" />}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex h-6 px-2 items-center gap-1.5 rounded-full text-[11px] font-medium whitespace-nowrap ${PILL[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                        {o.status === 'notified' && o.notifiedAt && <span className="opacity-60 font-normal">{short(o.notifiedAt)}</span>}
                      </span>
                    </td>
                    <td className={`${tdCls} text-right text-muted-foreground whitespace-nowrap`} title={new Date(o.createdAt).toLocaleString('lt-LT')}>{ago(o.createdAt)}</td>
                    <td className={tdCls}>
                      <div className="flex items-center justify-end gap-1.5">
                        {primary && (
                          <button onClick={() => onAction(o, primary.status)} className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-border/60 bg-background hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap">{primary.label}</button>
                        )}
                        <div className="relative">
                            <button onClick={() => setMenuFor(menuFor === o.id ? null : o.id)} aria-label="More actions"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition">
                              <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                            {menuFor === o.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuFor(null)} />
                                <div className="absolute right-0 top-8 z-50 min-w-36 py-1 rounded-lg border border-border bg-card">
                                  {acts.filter(a => !a.primary).map(a => (
                                    <button key={a.label} onClick={() => { setMenuFor(null); onAction(o, a.status) }}
                                      className={`block w-full text-left px-3 py-1.5 text-[13px] hover:bg-black/5 dark:hover:bg-white/5 ${a.status === 'cancelled' ? 'text-danger' : ''}`}>{a.label}</button>
                                  ))}
                                  {acts.some(a => !a.primary) && <div className="h-px bg-border/60 my-1" />}
                                  <button onClick={() => { setMenuFor(null); setEditing(o) }} className="block w-full text-left px-3 py-1.5 text-[13px] hover:bg-black/5 dark:hover:bg-white/5">Edit</button>
                                </div>
                              </>
                            )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <OrderDialog key={editing === 'new' ? 'new' : editing.id} order={editing === 'new' ? null : editing}
          onSave={o => { onSave(o); setEditing(null) }} onDelete={id => { onDelete(id); setEditing(null) }} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
