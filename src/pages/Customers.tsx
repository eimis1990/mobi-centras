import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, ChevronRight } from 'lucide-react'
import { customers, daysSince, type Order } from '../lib/orders'
import { tableCls, thCls, tdCls } from '../components/table'
import { SearchInput } from '../components/SearchInput'
import { useT } from '../lib/i18n'

export const relativeAge = (locale: string, iso: string) => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const d = daysSince(iso)
  if (d < 7) return rtf.format(-d, 'day')
  if (d < 30) return rtf.format(-Math.floor(d / 7), 'week')
  return rtf.format(-Math.floor(d / 30), 'month')
}

export default function Customers({ orders }: { orders: Order[] }) {
  const { t, locale } = useT()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const all = useMemo(() => customers(orders), [orders])
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    return all.filter(c => !q || c.name.toLowerCase().includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
  }, [all, query])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t('cust.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('cust.subtitle')}</p>
      </div>

      <SearchInput className="max-w-sm mb-4" value={query} onChange={setQuery} placeholder={t('cust.search')} />

      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-[13px] text-muted-foreground/60 text-center">{query ? t('common.noMatches') : t('cust.none')}</p>
        ) : (
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>{t('cust.c.customer')}</th>
                <th className={thCls}>{t('cust.c.phone')}</th>
                <th className={`${thCls} text-right`}>{t('cust.c.active')}</th>
                <th className={`${thCls} text-right`}>{t('cust.c.orders')}</th>
                <th className={`${thCls} text-right`}>{t('cust.c.spent')}</th>
                <th className={`${thCls} text-right`}>{t('cust.c.last')}</th>
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.phone} onClick={() => navigate(`/orders?q=${encodeURIComponent(c.phone)}&filter=all`)}
                  className="cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className={`${tdCls} font-medium`}>{c.name || <span className="text-muted-foreground/50">{t('cust.noName')}</span>}</td>
                  <td className={`${tdCls} tabular-nums text-muted-foreground`}><span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3" strokeWidth={1.5} />{c.phone}</span></td>
                  <td className={`${tdCls} text-right tabular-nums`}>{c.active ? c.active : <span className="text-muted-foreground/40">0</span>}</td>
                  <td className={`${tdCls} text-right tabular-nums text-muted-foreground`}>{c.total}</td>
                  <td className={`${tdCls} text-right tabular-nums text-muted-foreground whitespace-nowrap`}>{c.spent ? `${c.spent} €` : <span className="text-muted-foreground/40">–</span>}</td>
                  <td className={`${tdCls} text-right text-muted-foreground whitespace-nowrap`} title={new Date(c.lastAt).toLocaleString(locale)}>{relativeAge(locale, c.lastAt)}</td>
                  <td className={`${tdCls} w-10 text-muted-foreground/40`}><ChevronRight className="w-4 h-4 ml-auto" strokeWidth={1.5} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
