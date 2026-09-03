import type { Order } from './orders'
// ponytail: fake data used to seed an empty dev store. Phones are not real customers.
const ago = (d: number, h = 10) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, 0, 0, 0); return t.toISOString() }

export const mockOrders: Order[] = [
  { id: '1', type: 'product', customer: 'Alma', phone: '+37060000001', product: 'S23 dėklas permatomas', supplier: 'T', price: 12, paid: true, status: 'arrived', createdAt: ago(4), arrivedAt: ago(0, 9) },
  { id: '2', type: 'product', customer: 'Raimonda', phone: '+37060000002', product: 'Redmi 14C apsauginis stiklas', supplier: 'T', price: 12, paid: false, status: 'arrived', createdAt: ago(6), arrivedAt: ago(1) },
  { id: '3', type: 'product', customer: 'Rūta', phone: '+37060000003', product: 'S21 Ultra baterijos keitimas', supplier: 'D', price: 75, paid: false, status: 'arrived', createdAt: ago(9), arrivedAt: ago(1) },
  { id: '4', type: 'product', customer: 'Agnė', phone: '+37060000004', product: 'S23 dėklas užverčiamas', supplier: 'R', price: 15, paid: false, status: 'notified', createdAt: ago(20), arrivedAt: ago(13), notifiedAt: ago(12) },
  { id: '5', type: 'product', customer: 'Jorinda', phone: '+37060000005', product: 'A57 dėklas permatomas', supplier: 'R', price: 8, paid: false, status: 'notified', createdAt: ago(18), arrivedAt: ago(10), notifiedAt: ago(9) },
  { id: '6', type: 'product', customer: 'Lukas', phone: '+37060000006', product: 'Xiaomi 13T krovimo lizdas', supplier: 'T', price: 60, paid: false, status: 'notified', createdAt: ago(5), arrivedAt: ago(3), notifiedAt: ago(2) },
  { id: '7', type: 'product', customer: 'Egidijus', phone: '+37060000007', product: 'A13 apsauginis stiklas', supplier: 'T', price: 12, paid: false, status: 'ordered', createdAt: ago(49) },
  { id: '8', type: 'product', customer: 'Erika', phone: '+37060000008', product: 'A55 krovimo lizdas', supplier: 'T', price: 55, paid: false, status: 'ordered', createdAt: ago(58) },
  { id: '9', type: 'product', customer: 'Povilas', phone: '+37060000009', product: 'S25 dėklas ir stiklas', supplier: 'T', price: 22, paid: true, status: 'ordered', createdAt: ago(3) },
  { id: '10', type: 'request', customer: 'Sandra', phone: '+37060000010', product: 'iPhone iki 300–400 €, didesnė atmintis', paid: false, status: 'open', createdAt: ago(0, 14) },
  { id: '11', type: 'request', customer: 'Donatas', phone: '+37060000011', product: 'iPhone iki 350 €', paid: false, status: 'open', createdAt: ago(0, 13) },
  { id: '12', type: 'request', customer: 'Laura', phone: '+37060000012', product: 'Telefonas iki 500–600 €', paid: false, status: 'contacted', createdAt: ago(40) },
  { id: '13', type: 'product', customer: 'Tomas', phone: '+37060000013', product: 'S21 FE dėklas juodas', supplier: 'R', price: 12, paid: false, status: 'picked_up', createdAt: ago(30), completedAt: ago(20) },
]
