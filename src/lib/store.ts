import { useEffect, useRef, useState } from 'react'
import { emptyStore, normalizeSettings, purge, type Store } from './orders'
import { mockOrders } from './mock'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'conflict'

// One JSON file behind /api/orders. Whole-file read on load, whole-file write on every change.
// ponytail: fine up to a few thousand orders; if the file ever gets slow, split by year.
export function useStore() {
  const [store, setStore] = useState<Store | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const ref = useRef<Store | null>(null)
  const etag = useRef<string>('')
  const queue = useRef(Promise.resolve())

  const load = async () => {
    const r = await fetch('/api/orders', { cache: 'no-store' })
    if (r.status === 401) { setAuthed(false); setStore(null); ref.current = null; return }
    if (!r.ok) throw new Error(`load failed: ${r.status}`)
    etag.current = r.headers.get('etag') ?? ''
    const data = (await r.json()) as Store | null
    const next = data ?? (import.meta.env.DEV ? { ...emptyStore(), orders: mockOrders } : emptyStore())
    next.settings = normalizeSettings(next.settings)
    ref.current = next
    setStore(next)
    setAuthed(true)
  }
  useEffect(() => { load().catch(() => setSaveState('error')) }, [])

  const signIn = async (password: string): Promise<string | null> => {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) })
    if (r.status === 401) return 'wrong'
    if (!r.ok) return 'failed'
    await load()
    return null
  }
  const signOut = async () => {
    await fetch('/api/login', { method: 'DELETE' })
    setAuthed(false); setStore(null); ref.current = null
  }

  const save = (next: Store) => {
    queue.current = queue.current.then(async () => {
      setSaveState('saving')
      try {
        const headers: Record<string, string> = { 'content-type': 'application/json' }
        if (etag.current) headers['if-match'] = etag.current
        const r = await fetch('/api/orders', { method: 'PUT', headers, body: JSON.stringify(next) })
        if (r.status === 401) { setAuthed(false); return }
        if (r.status === 412) { setSaveState('conflict'); await load(); return }
        if (!r.ok) throw new Error(String(r.status))
        etag.current = r.headers.get('etag') ?? etag.current
        setSaveState('saved')
        setTimeout(() => setSaveState(s => (s === 'saved' ? 'idle' : s)), 1500)
      } catch {
        setSaveState('error')
      }
    })
  }

  const update = (fn: (s: Store) => Store) => {
    if (!ref.current) return
    const next = fn(ref.current)
    next.orders = purge(next.orders, next.settings.retentionDays)
    ref.current = next
    setStore(next)
    save(next)
  }

  return { store, authed, saveState, update, reload: load, signIn, signOut }
}
