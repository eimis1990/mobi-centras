import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, AlertTriangle } from 'lucide-react'
import { SidebarNav } from './components/SidebarNav'
import { SearchOverlay } from './components/SearchOverlay'
import { NotifyDialog } from './components/NotifyDialog'
import { ThemeSwitch, useTheme } from './components/ThemeSwitch'
import { LangToggle } from './components/LangToggle'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Settings from './pages/Settings'
import SignIn from './pages/SignIn'
import { Placeholder } from './pages/Placeholder'
import { useStore } from './lib/store'
import { useT, type TKey } from './lib/i18n'
import { buckets, transition, type Order, type Settings as SettingsT, type Status, type Store } from './lib/orders'

const titleKey: Record<string, TKey> = { dashboard: 'nav.dashboard', orders: 'nav.orders', customers: 'nav.customers', settings: 'nav.settings' }
const saveKey = { idle: null, saving: 'app.saving', saved: 'app.saved', error: 'app.saveError', conflict: 'app.conflict' } as const

export default function App() {
  const { t, lang, setLang } = useT()
  const { theme, setTheme } = useTheme()
  const isDesktop = () => window.matchMedia('(min-width: 768px)').matches
  const [isOpen, setIsOpen] = useState(isDesktop)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifying, setNotifying] = useState<Order | null>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeId = pathname.slice(1) || 'dashboard'
  const { store, authed, saveState, saveError, update, signIn, signOut } = useStore()
  const orders = store?.orders ?? []
  const toNotify = buckets(orders, store?.settings).toNotify.length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true) }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); navigate('/settings') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const handleSelect = (id: string) => {
    if (id === 'search') return setIsSearchOpen(true)
    if (id === 'logout') return void signOut()
    navigate(id === 'dashboard' ? '/' : `/${id}`)
    if (!isDesktop()) setIsOpen(false)
  }
  const pickSearch = (o: Order) => { setIsSearchOpen(false); navigate(`/orders?q=${encodeURIComponent(o.phone)}&filter=all`) }

  const saveOrder = (o: Order) => update(s => ({ ...s, orders: s.orders.some(x => x.id === o.id) ? s.orders.map(x => (x.id === o.id ? o : x)) : [o, ...s.orders] }))
  const deleteOrder = (id: string) => update(s => ({ ...s, orders: s.orders.filter(x => x.id !== id) }))
  const deleteOrders = (ids: string[]) => { const set = new Set(ids); update(s => ({ ...s, orders: s.orders.filter(x => !set.has(x.id)) })) }
  // Notify opens a dialog; everything else transitions straight away.
  const act = (o: Order, status: Status) => (status === 'notified' ? setNotifying(o) : saveOrder(transition(o, status)))
  const sendSms = async (o: Order, message: string) => {
    const r = await fetch('/api/sms', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: o.phone, message, sender: store?.settings.company.smsSender }) })
    if (!r.ok) throw new Error(await r.text())
    saveOrder(transition(o, 'notified'))
    setNotifying(null)
  }
  const saveSettings = (settings: SettingsT) => update(s => ({ ...s, settings }))
  const importStore = (next: Store) => update(() => next)

  const controls = (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <LangToggle lang={lang} onChange={setLang} label={t('app.language')} />
      <ThemeSwitch theme={theme} onChange={setTheme} label={t('app.theme')} />
    </div>
  )

  if (authed === false) {
    return (
      <>
        <div className="fixed right-6 top-6 z-20">{controls}</div>
        <SignIn onSignIn={signIn} />
      </>
    )
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-card">
      {isOpen && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setIsOpen(false)} />}
      <div className={`fixed md:static inset-y-0 left-0 z-40 h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-card md:bg-card/50 border-r border-border/50
        ${isOpen ? 'w-[260px] translate-x-0 opacity-100' : 'w-[260px] -translate-x-full opacity-0 md:w-0 md:translate-x-0 md:border-none'}`}>
        <SidebarNav className="w-[260px] border-none bg-transparent" activeId={activeId} onSelect={handleSelect} company="MobiCentras" subtitle="Alytus" ordersBadge={toNotify} t={t} />
      </div>

      <div className="flex-1 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col min-w-0">
        <div className="h-14 border-b border-border/50 flex items-center px-4 gap-3 bg-card shrink-0">
          <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors" aria-label="Toggle sidebar">
            {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <span className="hidden sm:inline">MobiCentras</span><span className="hidden sm:inline">/</span>
            <span className="font-medium text-foreground truncate">{titleKey[activeId] ? t(titleKey[activeId]) : t('app.notFound')}</span>
          </div>
          <span title={saveError || undefined} className={`ml-auto flex items-center gap-1.5 text-[12px] min-w-0 transition-opacity ${saveState === 'idle' ? 'opacity-0' : 'opacity-100'} ${saveState === 'error' || saveState === 'conflict' ? 'text-danger' : 'text-muted-foreground'}`}>
            {(saveState === 'error' || saveState === 'conflict') && <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />}
            <span className="truncate">{saveKey[saveState] ? t(saveKey[saveState]) : ''}{saveState === 'error' && saveError ? `: ${saveError}` : ''}</span>
          </span>
          {controls}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {!store ? (
            <p className="text-[13px] text-muted-foreground">{saveState === 'error' ? `${t('app.loadError')} ${saveError}` : t('app.loading')}</p>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard orders={orders} settings={store.settings} onAction={act} onOpenOrders={f => navigate(`/orders?filter=${f}`)} />} />
              <Route path="/orders" element={<Orders orders={orders} onSave={saveOrder} onDelete={deleteOrder} onDeleteMany={deleteOrders} onAction={act} />} />
              <Route path="/customers" element={<Customers orders={orders} />} />
              <Route path="/settings" element={<Settings store={store} onSave={saveSettings} onImport={importStore} />} />
              <Route path="*" element={<Placeholder title={t('app.pageNotFound')} />} />
            </Routes>
          )}
        </div>
      </div>

      {isSearchOpen && <SearchOverlay orders={orders} onPick={pickSearch} onClose={() => setIsSearchOpen(false)} />}
      {notifying && store && <NotifyDialog key={notifying.id} order={notifying} settings={store.settings} onSend={m => sendSms(notifying, m)} onClose={() => setNotifying(null)} />}
    </div>
  )
}
