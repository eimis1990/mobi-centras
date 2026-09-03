import { useEffect, useMemo, useState } from 'react'
import { Search, X, Phone, ArrowRight } from 'lucide-react'
import { useT } from '../lib/i18n'
import type { Order } from '../lib/orders'

type Props = { orders: Order[]; onPick: (o: Order) => void; onClose: () => void }

export const matchesQuery = (o: Order, q: string) => {
  const s = q.trim().toLowerCase()
  if (!s) return false
  const digits = s.replace(/\D/g, '')
  return o.customer.toLowerCase().includes(s) || o.product.toLowerCase().includes(s) || (digits.length >= 3 && o.phone.replace(/\D/g, '').includes(digits))
}

export function SearchOverlay({ orders, onPick, onClose }: Props) {
  const { t } = useT()
  const [q, setQ] = useState('')
  const [index, setIndex] = useState(0)
  const results = useMemo(() => orders.filter(o => matchesQuery(o, q)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8), [orders, q])
  useEffect(() => setIndex(0), [q])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[index]) onPick(results[index])
  }

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] bg-background/40 backdrop-blur-sm px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-border/50">
          <Search className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" strokeWidth={1.5} />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
            className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50" placeholder={t('search.placeholder')} />
          <kbd onClick={onClose} className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-[4px] cursor-pointer">ESC</kbd>
          <button onClick={onClose} className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors"><X className="w-[18px] h-[18px]" strokeWidth={1.5} /></button>
        </div>
        {!q.trim() ? (
          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">{t('search.hint')}</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">{t('common.noMatches')}</p>
        ) : (
          <ul className="py-1 max-h-[60vh] overflow-y-auto">
            {results.map((o, i) => (
              <li key={o.id}>
                <button onClick={() => onPick(o)} onMouseEnter={() => setIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === index ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-[13px] font-medium truncate">{o.customer}</span>
                      <span className="text-[12px] text-muted-foreground truncate">{o.product}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground tabular-nums"><Phone className="w-3 h-3" strokeWidth={1.5} />{o.phone}</div>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{t(`status.${o.status}`)}</span>
                  <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground/50 ${i === index ? 'opacity-100' : 'opacity-0'}`} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
