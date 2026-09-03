import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buckets, customers, defaultSettings, normalizePhone, normalizeSettings, purge, renderSms, transition, type Order } from './orders.ts'

const now = Date.parse('2026-09-03T12:00:00Z')
const ago = (d: number) => new Date(now - d * 86_400_000).toISOString()
const base = { type: 'product', customer: 'x', phone: '+37060000000', product: 'p', paid: false } as const

test('buckets', () => {
  const orders: Order[] = [
    { ...base, id: '1', status: 'arrived', createdAt: ago(1) },
    { ...base, id: '2', status: 'notified', createdAt: ago(10), notifiedAt: ago(8) },
    { ...base, id: '3', status: 'notified', createdAt: ago(10), notifiedAt: ago(2) },
    { ...base, id: '4', status: 'ordered', createdAt: ago(31) },
    { ...base, id: '5', status: 'ordered', createdAt: ago(5) },
    { ...base, id: '6', type: 'request', status: 'open', createdAt: ago(1) },
    { ...base, id: '7', type: 'request', status: 'contacted', createdAt: ago(1) },
  ]
  const b = buckets(orders, defaultSettings, now)
  assert.deepEqual(b.toNotify.map(o => o.id), ['1'])
  assert.deepEqual(b.notPickedUp.map(o => o.id), ['2'])
  assert.deepEqual(b.stale.map(o => o.id), ['4'])
  assert.deepEqual(b.openRequests.map(o => o.id), ['6'])
})

test('transition stamps dates', () => {
  const o: Order = { ...base, id: '1', status: 'ordered', createdAt: ago(1) }
  const t = new Date(now).toISOString()
  assert.equal(transition(o, 'arrived', t).arrivedAt, t)
  assert.equal(transition(o, 'notified', t).notifiedAt, t)
  assert.equal(transition(o, 'picked_up', t).completedAt, t)
  assert.equal(transition(o, 'arrived', t).completedAt, undefined)
})

test('purge keeps active and recent, drops old completed', () => {
  const orders: Order[] = [
    { ...base, id: 'active', status: 'ordered', createdAt: ago(400) },
    { ...base, id: 'recent', status: 'picked_up', createdAt: ago(100), completedAt: ago(89) },
    { ...base, id: 'old', status: 'picked_up', createdAt: ago(100), completedAt: ago(90) },
    { ...base, id: 'legacy', status: 'cancelled', createdAt: ago(400) }, // no completedAt: keep, never guess
  ]
  assert.deepEqual(purge(orders, 90, now).map(o => o.id), ['active', 'recent', 'legacy'])
})

test('normalizePhone', () => {
  assert.equal(normalizePhone('8 612 34567'), '+37061234567')
  assert.equal(normalizePhone('061234567'), '+37061234567')
  assert.equal(normalizePhone('37061234567'), '+37061234567')
  assert.equal(normalizePhone('+370 612 34567'), '+37061234567')
  assert.equal(normalizePhone('+447915217194'), '+447915217194')
  assert.equal(normalizePhone('0044 7915 217194'), '+447915217194')
  assert.equal(normalizePhone('+3706'), null)
  assert.equal(normalizePhone('abc'), null)
})

test('customers group by phone, latest name wins', () => {
  const orders: Order[] = [
    { ...base, id: '1', customer: 'Kristina', phone: '+37060000001', status: 'picked_up', price: 10, createdAt: ago(30) },
    { ...base, id: '2', customer: 'Kristina B.', phone: '+37060000001', status: 'ordered', price: 12, createdAt: ago(2) },
    { ...base, id: '3', customer: 'Tomas', phone: '+37060000002', status: 'cancelled', price: 99, createdAt: ago(5) },
  ]
  const c = customers(orders)
  assert.deepEqual(c.map(x => x.phone), ['+37060000001', '+37060000002'])
  assert.equal(c[0].name, 'Kristina B.')
  assert.equal(c[0].total, 2)
  assert.equal(c[0].active, 1)
  assert.equal(c[0].spent, 10)
  assert.equal(c[1].spent, 0)
})

test('renderSms fills placeholders, leaves unknown ones', () => {
  const c = { name: 'Shop', phone: '+37060000000', address: 'Gatvė 1', smsSender: 'Shop' }
  assert.equal(renderSms('Hi {customer}, {product} for {price} at {address}. {company} {nope}', { customer: 'Ona', product: 'dėklas', price: 12 }, c),
    'Hi Ona, dėklas for 12 € at Gatvė 1. Shop {nope}')
  assert.equal(renderSms('{product} {price}', { customer: 'x', product: 'p' }, c), 'p')
  assert.equal(renderSms('{days} d', { customer: 'x', product: 'p', arrivedAt: ago(12) }, c, now), '12 d')
})

test('normalizeSettings fills gaps from defaults', () => {
  const s = normalizeSettings({ retentionDays: 30, company: { name: 'X' } as never, smsTemplate: 'old {customer}' })
  assert.equal(s.retentionDays, 30)
  assert.equal(s.templates.arrived, 'old {customer}')
  assert.equal(s.templates.reminder, defaultSettings.templates.reminder)
  assert.equal(s.company.name, 'X')
  assert.equal(s.company.address, defaultSettings.company.address)
  assert.equal(s.followUpDays, 7)
})
