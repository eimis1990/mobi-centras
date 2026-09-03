import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, AlertTriangle } from 'lucide-react'
import { SidebarNav } from './components/SidebarNav'
import { SearchOverlay } from './components/SearchOverlay'
import { NotifyDialog } from './components/NotifyDialog'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Settings from './pages/Settings'
import SignIn from './pages/SignIn'
import { Placeholder } from './pages/Placeholder'
import { useStore } from './lib/store'
import { buckets, transition, type Order, type Settings as SettingsT, type Status, type Store } from './lib/orders'

const titles: Record<string, string> = { dashboard: 'Dashboard', orders: 'Orders', customers: 'Customers', settings: 'Settings' }
const saveLabel = { idle: '', saving: 'Saving…', saved: 'Saved', error: 'Could not save', conflict: 'Changed elsewhere, reloaded' }

export default function App() {
  const [isOpen, setIsOpen] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [notifying, setNotifying] = useState<Order | null>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeId = pathname.slice(1) || 'dashboard'
  const { store, authed, saveState, update, signIn, signOut } = useStore()
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
  }

  const saveOrder = (o: Order) => update(s => ({ ...s, orders: s.orders.some(x => x.id === o.id) ? s.orders.map(x => (x.id === o.id ? o : x)) : [o, ...s.orders] }))
  const deleteOrder = (id: string) => update(s => ({ ...s, orders: s.orders.filter(x => x.id !== id) }))
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

  if (authed === false) return <SignIn onSignIn={signIn} />

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-card">
      <div className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-card/50 border-r border-border/50 ${isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'}`}>
        <SidebarNav className="w-[260px] border-none bg-transparent" activeId={activeId} onSelect={handleSelect} company="MobiCentras" subtitle="Alytus" ordersBadge={toNotify} />
      </div>

      <div className="flex-1 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col min-w-0">
        <div className="h-14 border-b border-border/50 flex items-center px-4 gap-3 bg-card shrink-0">
          <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors" aria-label="Toggle sidebar">
            {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>MobiCentras</span><span>/</span>
            <span className="font-medium text-foreground">{titles[activeId] ?? 'Not found'}</span>
          </div>
          <span className={`ml-auto flex items-center gap-1.5 text-[12px] transition-opacity ${saveState === 'idle' ? 'opacity-0' : 'opacity-100'} ${saveState === 'error' || saveState === 'conflict' ? 'text-danger' : 'text-muted-foreground'}`}>
            {(saveState === 'error' || saveState === 'conflict') && <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />}
            {saveLabel[saveState]}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {!store ? (
            <p className="text-[13px] text-muted-foreground">{saveState === 'error' ? 'Could not load data.' : 'Loading…'}</p>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard orders={orders} settings={store.settings} onAction={act} onOpenOrders={f => navigate(`/orders?filter=${f}`)} />} />
              <Route path="/orders" element={<Orders orders={orders} onSave={saveOrder} onDelete={deleteOrder} onAction={act} />} />
              <Route path="/customers" element={<Customers orders={orders} />} />
              <Route path="/settings" element={<Settings store={store} onSave={saveSettings} onImport={importStore} />} />
              <Route path="*" element={<Placeholder title="Page not found" />} />
            </Routes>
          )}
        </div>
      </div>

      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
      {notifying && store && <NotifyDialog key={notifying.id} order={notifying} settings={store.settings} onSend={m => sendSms(notifying, m)} onClose={() => setNotifying(null)} />}
    </div>
  )
}
