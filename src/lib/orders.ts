export type OrderStatus = 'ordered' | 'arrived' | 'notified' | 'picked_up' | 'cancelled'
export type RequestStatus = 'open' | 'contacted' | 'closed'
export type Status = OrderStatus | RequestStatus

export type Order = {
  id: string
  type: 'product' | 'request'
  customer: string
  phone: string
  product: string
  price?: number
  paid: boolean
  supplier?: string
  status: Status
  createdAt: string
  arrivedAt?: string
  notifiedAt?: string
  completedAt?: string
}

export type TemplateKey = 'arrived' | 'repairReady' | 'reminder'
export type Settings = {
  company: { name: string; phone: string; address: string; smsSender: string }
  templates: Record<TemplateKey, string>
  retentionDays: number
  followUpDays: number
  staleDays: number
}
export const TEMPLATE_LABEL: Record<TemplateKey, string> = { arrived: 'Product arrived', repairReady: 'Repair ready', reminder: 'Reminder' }
export const defaultSettings: Settings = {
  company: { name: 'MobiCentras', phone: '+37067566544', address: 'Naujoji g. 3, Alytus', smsSender: 'MobiCentras' },
  templates: {
    arrived: 'Sveiki, {customer}! Jūsų užsakyta prekė ({product}) jau gauta. Kviečiame atsiimti: {address}. {company}',
    repairReady: 'Sveiki, {customer}! Jūsų remontas ({product}) atliktas, kaina {price}. Kviečiame atsiimti: {address}. {company}',
    reminder: 'Sveiki, {customer}! Primename, kad jūsų užsakymas ({product}) laukia jūsų jau {days} d. Kviečiame atsiimti: {address}. {company}',
  },
  retentionDays: 90,
  followUpDays: 7,
  staleDays: 30,
}
// Tolerates older/partial files: anything missing falls back to defaults.
export const normalizeSettings = (s?: (Partial<Settings> & { smsTemplate?: string }) | null): Settings => ({
  ...defaultSettings,
  ...s,
  company: { ...defaultSettings.company, ...(s?.company ?? {}) },
  templates: { ...defaultSettings.templates, ...(s?.smsTemplate ? { arrived: s.smsTemplate } : {}), ...(s?.templates ?? {}) },
})
export type Store = { version: 1; settings: Settings; orders: Order[] }
export const emptyStore = (): Store => ({ version: 1, settings: defaultSettings, orders: [] })

export const SMS_PLACEHOLDERS = ['customer', 'product', 'price', 'days', 'company', 'phone', 'address'] as const
export const renderSms = (template: string, o: Pick<Order, 'customer' | 'product' | 'price'> & { arrivedAt?: string; notifiedAt?: string }, c: Settings['company'], now = Date.now()) => {
  const since = o.arrivedAt ?? o.notifiedAt
  const values: Record<string, string> = {
    customer: o.customer, product: o.product, price: o.price != null ? `${o.price} €` : '',
    days: since ? String(daysSince(since, now)) : '', company: c.name, phone: c.phone, address: c.address,
  }
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m)).replace(/ {2,}/g, ' ').trim()
}

const DAY = 86_400_000
export const daysSince = (iso: string, now = Date.now()) => Math.floor((now - Date.parse(iso)) / DAY)

const DONE: Status[] = ['picked_up', 'cancelled', 'closed']
export const isDone = (o: Order) => DONE.includes(o.status)

export const STATUS_LABEL: Record<Status, string> = {
  ordered: 'Ordered', arrived: 'Arrived', notified: 'Notified', picked_up: 'Picked up', cancelled: 'Cancelled',
  open: 'Open', contacted: 'Contacted', closed: 'Closed',
}

export type Action = { label: string; status: Status; primary?: boolean }
export const actions = (o: Order): Action[] => {
  switch (o.status) {
    case 'ordered': return [{ label: 'Mark arrived', status: 'arrived', primary: true }, { label: 'Cancel', status: 'cancelled' }]
    case 'arrived': return [{ label: 'Notify', status: 'notified', primary: true }, { label: 'Cancel', status: 'cancelled' }]
    case 'notified': return [{ label: 'Picked up', status: 'picked_up', primary: true }, { label: 'Notify again', status: 'notified' }, { label: 'Cancel', status: 'cancelled' }]
    case 'open': return [{ label: 'Mark contacted', status: 'contacted', primary: true }, { label: 'Close', status: 'closed' }]
    case 'contacted': return [{ label: 'Close', status: 'closed', primary: true }]
    default: return []
  }
}

export const transition = (o: Order, status: Status, now = new Date().toISOString()): Order => {
  const next: Order = { ...o, status }
  if (status === 'arrived') next.arrivedAt = now
  if (status === 'notified') next.notifiedAt = now
  if (DONE.includes(status)) next.completedAt = now
  return next
}

// Drop completed orders older than the retention window. Runs on every save; no cron needed.
export const purge = (orders: Order[], retentionDays: number, now = Date.now()) =>
  orders.filter(o => !(isDone(o) && o.completedAt && daysSince(o.completedAt, now) >= retentionDays))

// Accepts what staff actually type: "8 612 34567", "0612 34567", "37061234567", "+37061234567", or any full international number.
export const normalizePhone = (raw: string): string | null => {
  let d = raw.replace(/[\s\-().]/g, '')
  if (/^[08]\d{8}$/.test(d)) d = '+370' + d.slice(1)
  else if (/^370\d{8}$/.test(d)) d = '+' + d
  else if (/^00\d+$/.test(d)) d = '+' + d.slice(2)
  return /^\+\d{8,15}$/.test(d) ? d : null
}

// The four buckets the dashboard answers "what do I do today" with.
export const buckets = (orders: Order[], { followUpDays, staleDays }: Pick<Settings, 'followUpDays' | 'staleDays'> = defaultSettings, now = Date.now()) => ({
  toNotify: orders.filter(o => o.status === 'arrived'),
  notPickedUp: orders.filter(o => o.status === 'notified' && o.notifiedAt && daysSince(o.notifiedAt, now) >= followUpDays),
  stale: orders.filter(o => o.status === 'ordered' && daysSince(o.createdAt, now) >= staleDays),
  openRequests: orders.filter(o => o.type === 'request' && o.status === 'open'),
})

export type Customer = { phone: string; name: string; total: number; active: number; spent: number; lastAt: string }

// Customers are derived from orders, keyed by phone. The most recent order wins the name.
export const customers = (orders: Order[]): Customer[] => {
  const map = new Map<string, Customer>()
  for (const o of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const c = map.get(o.phone) ?? { phone: o.phone, name: o.customer, total: 0, active: 0, spent: 0, lastAt: o.createdAt }
    c.name = o.customer || c.name
    c.total++
    if (!isDone(o)) c.active++
    if (o.status === 'picked_up' && o.price) c.spent += o.price
    c.lastAt = o.createdAt
    map.set(o.phone, c)
  }
  return [...map.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt))
}
