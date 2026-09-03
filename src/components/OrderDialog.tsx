import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { normalizePhone, type Order } from '../lib/orders'
import { useT } from '../lib/i18n'

type Props = { order: Order | null; onSave: (o: Order) => void; onDelete?: (id: string) => void; onClose: () => void }

const field = 'w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition'
const label = 'block text-[12px] font-medium text-muted-foreground mb-1.5'

export function OrderDialog({ order, onSave, onDelete, onClose }: Props) {
  const { t } = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const isNew = !order?.id
  const [type, setType] = useState<Order['type']>(order?.type ?? 'product')
  const [customer, setCustomer] = useState(order?.customer ?? '')
  const [phone, setPhone] = useState(order?.phone ?? '')
  const [product, setProduct] = useState(order?.product ?? '')
  const [supplier, setSupplier] = useState(order?.supplier ?? '')
  const [price, setPrice] = useState(order?.price?.toString() ?? '')
  const [paid, setPaid] = useState(order?.paid ?? false)
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => { ref.current?.showModal(); ref.current?.querySelector<HTMLInputElement>('input')?.focus() }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizePhone(phone)
    if (!normalized) return setPhoneError(t('od.phoneError'))
    const priceNum = price.trim() === '' ? undefined : Number(price.replace(',', '.'))
    if (priceNum !== undefined && Number.isNaN(priceNum)) return
    onSave({
      id: order?.id || crypto.randomUUID(),
      type,
      customer: customer.trim(),
      phone: normalized,
      product: product.trim(),
      supplier: type === 'product' && supplier.trim() ? supplier.trim() : undefined,
      price: priceNum,
      paid: type === 'product' ? paid : false,
      status: order?.status ?? (type === 'product' ? 'ordered' : 'open'),
      createdAt: order?.createdAt ?? new Date().toISOString(),
      arrivedAt: order?.arrivedAt, notifiedAt: order?.notifiedAt, completedAt: order?.completedAt,
    })
  }

  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose} onKeyDown={e => e.key === 'Escape' && ref.current?.close()}
      className="m-auto w-full max-w-md rounded-xl border border-border bg-card text-foreground p-0 backdrop:bg-black/40 backdrop:backdrop-blur-[2px]">
      <form onSubmit={submit} className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold">{isNew ? t('od.new') : t('od.edit')}</h2>
            <p className="text-[12px] text-muted-foreground">{type === 'product' ? t('od.productHint') : t('od.requestHint')}</p>
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="p-1 -m-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"><X className="w-4 h-4" strokeWidth={1.5} /></button>
        </div>

        {isNew && (
          <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-lg bg-black/5 dark:bg-white/5 text-[13px]">
            {(['product', 'request'] as const).map(k => (
              <button key={k} type="button" onClick={() => setType(k)}
                className={`h-8 rounded-md font-medium transition ${type === k ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-muted-foreground hover:text-foreground'}`}>
                {k === 'product' ? t('common.product') : t('common.request')}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t('od.customer')}</label>
              <input className={field} value={customer} onChange={e => setCustomer(e.target.value)} required placeholder={t('od.name')} />
            </div>
            <div>
              <label className={label}>{t('od.phone')}</label>
              <input className={`${field} ${phoneError ? 'border-danger' : ''}`} value={phone} onChange={e => { setPhone(e.target.value); setPhoneError('') }} required inputMode="tel" placeholder="8 612 34567" />
              {phoneError && <p className="text-[11px] text-danger mt-1">{phoneError}</p>}
            </div>
          </div>
          <div>
            <label className={label}>{type === 'product' ? t('od.product') : t('od.request')}</label>
            <input className={field} value={product} onChange={e => setProduct(e.target.value)} required placeholder={type === 'product' ? t('od.productPh') : t('od.requestPh')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {type === 'product' && (
              <div>
                <label className={label}>{t('od.supplier')}</label>
                <input className={field} value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="T" />
              </div>
            )}
            <div>
              <label className={label}>{t('od.price')}</label>
              <input className={field} value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" placeholder="12" />
            </div>
          </div>
          {type === 'product' && (
            <label className="flex items-center gap-2 text-[13px] select-none cursor-pointer">
              <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} className="accent-primary w-4 h-4" />
              {t('od.paid')}
            </label>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          {!isNew && onDelete ? (
            <button type="button" onClick={() => { if (confirm(t('od.deleteConfirm'))) onDelete(order!.id) }} className="text-[13px] text-danger hover:underline">{t('common.delete')}</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={() => ref.current?.close()} className="h-9 px-4 rounded-md text-[13px] font-medium border border-border hover:bg-black/5 dark:hover:bg-white/5">{t('common.cancel')}</button>
            <button type="submit" className="h-9 px-4 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90">{isNew ? t('od.add') : t('common.save')}</button>
          </div>
        </div>
      </form>
    </dialog>
  )
}
