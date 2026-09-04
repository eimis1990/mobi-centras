import { createContext, useContext, useMemo, useState } from 'react'

export type Lang = 'en' | 'lt'
type Plural = { one: string; few?: string; many?: string; other: string }

// Flat dotted keys. `en` defines the key set; `lt` must cover every key.
const en = {
  'nav.search': 'Search', 'nav.dashboard': 'Dashboard', 'nav.orders': 'Orders', 'nav.customers': 'Customers', 'nav.settings': 'Settings', 'nav.logout': 'Log out',
  'app.saving': 'Saving…', 'app.saved': 'Saved', 'app.saveError': 'Could not save', 'app.conflict': 'Changed elsewhere, reloaded',
  'app.loading': 'Loading…', 'app.loadError': 'Could not load data.', 'app.notFound': 'Not found', 'app.pageNotFound': 'Page not found', 'app.comingNext': 'Coming next.',
  'app.theme': 'Toggle dark mode', 'app.language': 'Language',
  'search.placeholder': 'Search orders, customers, phone numbers…', 'search.hint': 'Type a name, phone or product…',

  'common.today': 'today', 'common.yesterday': 'yesterday', 'common.daysAgo': '{n} d ago', 'common.paid': 'paid', 'common.supplier': 'Supplier {s}',
  'common.product': 'Product', 'common.request': 'Request', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.delete': 'Delete', 'common.edit': 'Edit',
  'common.nothingHere': 'Nothing here.', 'common.noMatches': 'No matches.', 'common.days': 'days', 'common.chars': 'chars',

  'status.ordered': 'Ordered', 'status.arrived': 'Arrived', 'status.notified': 'Notified', 'status.picked_up': 'Picked up', 'status.cancelled': 'Cancelled',
  'status.open': 'Open', 'status.contacted': 'Contacted', 'status.closed': 'Closed',

  'action.markArrived': 'Mark arrived', 'action.notify': 'Notify', 'action.notifyAgain': 'Notify again', 'action.pickedUp': 'Picked up', 'action.cancel': 'Cancel',
  'action.markContacted': 'Mark contacted', 'action.close': 'Close', 'action.openInOrders': 'Open in Orders',

  'dash.title': 'Today', 'dash.things': { one: '{n} thing to do', other: '{n} things to do' } as Plural, 'dash.nothing': 'Nothing waiting on you',
  'dash.toNotify': 'Arrived, not notified', 'dash.toNotifyHint': 'Send the pickup SMS',
  'dash.notPickedUp': 'Notified, not picked up', 'dash.notPickedUpHint': '{n}+ days since the SMS',
  'dash.stale': 'Ordered, still waiting', 'dash.staleHint': '{n}+ days with no arrival',
  'dash.openRequests': 'Requests not contacted', 'dash.openRequestsHint': 'Customer is waiting for a call',
  'dash.arrived': 'arrived', 'dash.notified': 'notified', 'dash.ordered': 'ordered', 'dash.asked': 'asked',
  'dash.more': { one: '+{n} more customer', other: '+{n} more customers' } as Plural, 'dash.onlyOne': 'Only one right now', 'dash.seeAll': 'See all', 'dash.empty': 'Nothing here',

  'orders.title': 'Orders', 'orders.subtitle': "Products ordered for customers and things they're looking for", 'orders.new': 'New order',
  'orders.search': 'Name, phone or product…', 'orders.moreActions': 'More actions',
  'orders.f.active': 'Active', 'orders.f.arrived': 'To notify', 'orders.f.notified': 'Waiting pickup', 'orders.f.ordered': 'Ordered', 'orders.f.requests': 'Requests', 'orders.f.done': 'Completed', 'orders.f.all': 'All',
  'orders.c.customer': 'Customer', 'orders.c.product': 'Product / Request', 'orders.c.price': 'Price', 'orders.c.status': 'Status', 'orders.c.age': 'Age', 'orders.c.actions': 'Actions',

  'od.new': 'New order', 'od.edit': 'Edit order', 'od.productHint': 'Something ordered for a customer', 'od.requestHint': 'Something a customer is looking for',
  'od.customer': 'Customer', 'od.name': 'Name', 'od.phone': 'Phone', 'od.phoneError': 'Enter a full number, e.g. 8 612 34567 or +370 612 34567',
  'od.product': 'Product', 'od.request': 'What are they looking for?', 'od.productPh': 'S23 dėklas permatomas', 'od.requestPh': 'iPhone iki 400 €',
  'od.supplier': 'Supplier', 'od.price': 'Price, €', 'od.paid': 'Already paid', 'od.add': 'Add order', 'od.deleteConfirm': 'Delete this order?',

  'nd.title': 'Notify customer', 'nd.reminder': 'Send a reminder', 'nd.lastSent': 'Last SMS sent {when}.', 'nd.edited': 'Edited by hand', 'nd.template': 'Template: {name}',
  'nd.send': 'Send SMS', 'nd.sending': 'Sending…', 'nd.failed': 'Could not send',
  'tpl.arrived': 'Product arrived', 'tpl.repairReady': 'Repair ready', 'tpl.reminder': 'Reminder',

  'cust.title': 'Customers', 'cust.subtitle': 'Everyone with an order on file, grouped by phone number', 'cust.search': 'Name or phone…', 'cust.none': 'No customers yet.', 'cust.noName': 'No name',
  'cust.c.customer': 'Customer', 'cust.c.phone': 'Phone', 'cust.c.active': 'Active', 'cust.c.orders': 'Orders', 'cust.c.spent': 'Spent', 'cust.c.last': 'Last order',

  'set.title': 'Settings', 'set.subtitle': 'Company details, the pickup SMS, and housekeeping rules', 'set.save': 'Save changes', 'set.saved': 'Saved',
  'set.company': 'Company', 'set.companyHint': 'Used in the SMS text and as the sender name', 'set.companyName': 'Company name', 'set.phone': 'Phone', 'set.address': 'Address',
  'set.sender': 'SMS sender name', 'set.senderHint': 'Up to 11 letters or digits, no spaces. Shown as the sender instead of a phone number.',
  'set.sms': 'SMS templates', 'set.smsHint': 'Staff pick one when pressing Notify and can still edit the text before sending',
  'set.tplArrivedHint': 'Default for the first Notify on an order.', 'set.tplRepairHint': 'For orders that were really a repair job. Staff switch to it in the Notify dialog.',
  'set.tplReminderHint': 'Default for Notify again. {days} is how long the item has been waiting.', 'set.message': 'Message', 'set.preview': 'Preview',
  'set.twilio': 'Twilio account', 'set.twilioHint': 'Credentials are verified, encrypted and stored on the server. They are never shown again.',
  'set.connected': 'Connected · account ending {sid} · number {from}', 'set.savedOn': 'saved {date}', 'set.test': 'Send test SMS', 'set.replace': 'Replace', 'set.remove': 'Remove',
  'set.removeConfirm': 'Remove the stored Twilio credentials? SMS sending will stop until new ones are added.',
  'set.sid': 'Account SID', 'set.sidHint': 'Starts with AC, 34 characters. From the Twilio console home page.', 'set.token': 'Auth token', 'set.tokenHint': 'Next to the SID in the console. Stored encrypted.',
  'set.from': 'Twilio phone number', 'set.fromHint': 'Used as the sender where a name is not allowed.', 'set.verify': 'Verify and save', 'set.verifying': 'Verifying…', 'set.checking': 'Checking…',
  'set.twilioSaved': 'Verified with Twilio and saved.', 'set.testSent': 'Test SMS sent to {to}.', 'set.testBody': 'Test SMS from MobiCentras. Everything works.',
  'set.rules': 'Rules', 'set.rulesHint': 'Thresholds for the dashboard and automatic cleanup',
  'set.followUp': 'Follow up after', 'set.followUpDesc': 'Days since the SMS before an order shows as not picked up',
  'set.stale': 'Order is late after', 'set.staleDesc': 'Days since ordering before it shows as still waiting',
  'set.retention': 'Delete completed orders after', 'set.retentionDesc': "Picked up, closed and cancelled orders are removed, along with the customer's name and phone",
  'set.data': 'Data', 'set.dataHint': 'Everything lives in one file. Keep a copy.', 'set.summary': { one: '{n} order, {done} completed · {kb} KB', other: '{n} orders, {done} completed · {kb} KB' } as Plural,
  'set.export': 'Export', 'set.import': 'Import', 'set.importConfirm': 'Replace the current {cur} orders with {next} from this file?',
  'set.notExport': 'That file is not a MobiCentras export.', 'set.cantRead': 'Could not read that file.',

  'auth.title': 'Sign in', 'auth.subtitle': 'Enter the shop password to open MobiCentras.', 'auth.password': 'Password', 'auth.button': 'Sign in', 'auth.busy': 'Signing in…',
  'auth.wrong': 'Wrong password.', 'auth.failed': 'Could not sign in. Try again.',
}
export type TKey = keyof typeof en

const lt: Record<TKey, string | Plural> = {
  'nav.search': 'Paieška', 'nav.dashboard': 'Pradžia', 'nav.orders': 'Užsakymai', 'nav.customers': 'Klientai', 'nav.settings': 'Nustatymai', 'nav.logout': 'Atsijungti',
  'app.saving': 'Saugoma…', 'app.saved': 'Išsaugota', 'app.saveError': 'Nepavyko išsaugoti', 'app.conflict': 'Pakeista kitur, perkrauta',
  'app.loading': 'Kraunama…', 'app.loadError': 'Nepavyko įkelti duomenų.', 'app.notFound': 'Nerasta', 'app.pageNotFound': 'Puslapis nerastas', 'app.comingNext': 'Netrukus.',
  'app.theme': 'Perjungti tamsų režimą', 'app.language': 'Kalba',
  'search.placeholder': 'Ieškoti užsakymų, klientų, telefonų…', 'search.hint': 'Įveskite vardą, telefoną ar prekę…',

  'common.today': 'šiandien', 'common.yesterday': 'vakar', 'common.daysAgo': 'prieš {n} d.', 'common.paid': 'apmokėta', 'common.supplier': 'Tiekėjas {s}',
  'common.product': 'Prekė', 'common.request': 'Užklausa', 'common.cancel': 'Atšaukti', 'common.save': 'Išsaugoti', 'common.delete': 'Ištrinti', 'common.edit': 'Redaguoti',
  'common.nothingHere': 'Nieko nėra.', 'common.noMatches': 'Nieko nerasta.', 'common.days': 'd.', 'common.chars': 'simb.',

  'status.ordered': 'Užsakyta', 'status.arrived': 'Atvyko', 'status.notified': 'Informuota', 'status.picked_up': 'Atsiimta', 'status.cancelled': 'Atšaukta',
  'status.open': 'Nauja', 'status.contacted': 'Susisiekta', 'status.closed': 'Uždaryta',

  'action.markArrived': 'Atvyko', 'action.notify': 'Informuoti', 'action.notifyAgain': 'Priminti', 'action.pickedUp': 'Atsiimta', 'action.cancel': 'Atšaukti',
  'action.markContacted': 'Susisiekta', 'action.close': 'Uždaryti', 'action.openInOrders': 'Atidaryti užsakymuose',

  'dash.title': 'Šiandien', 'dash.things': { one: '{n} darbas', few: '{n} darbai', many: '{n} darbų', other: '{n} darbo' }, 'dash.nothing': 'Nieko nelaukia',
  'dash.toNotify': 'Atvyko, klientas neinformuotas', 'dash.toNotifyHint': 'Išsiųskite SMS apie atsiėmimą',
  'dash.notPickedUp': 'Informuota, neatsiimta', 'dash.notPickedUpHint': '{n}+ d. po SMS',
  'dash.stale': 'Užsakyta, dar laukiama', 'dash.staleHint': '{n}+ d. be pristatymo',
  'dash.openRequests': 'Užklausos be atsakymo', 'dash.openRequestsHint': 'Klientas laukia skambučio',
  'dash.arrived': 'atvyko', 'dash.notified': 'informuota', 'dash.ordered': 'užsakyta', 'dash.asked': 'kreipėsi',
  'dash.more': { one: '+{n} kitas klientas', few: '+{n} kiti klientai', many: '+{n} kitų klientų', other: '+{n} kitų klientų' }, 'dash.onlyOne': 'Šiuo metu tik vienas', 'dash.seeAll': 'Žiūrėti visus', 'dash.empty': 'Nieko nėra',

  'orders.title': 'Užsakymai', 'orders.subtitle': 'Klientams užsakytos prekės ir jų ieškomi daiktai', 'orders.new': 'Naujas užsakymas',
  'orders.search': 'Vardas, telefonas ar prekė…', 'orders.moreActions': 'Daugiau veiksmų',
  'orders.f.active': 'Aktyvūs', 'orders.f.arrived': 'Informuoti', 'orders.f.notified': 'Laukia atsiėmimo', 'orders.f.ordered': 'Užsakyta', 'orders.f.requests': 'Užklausos', 'orders.f.done': 'Užbaigti', 'orders.f.all': 'Visi',
  'orders.c.customer': 'Klientas', 'orders.c.product': 'Prekė / Užklausa', 'orders.c.price': 'Kaina', 'orders.c.status': 'Būsena', 'orders.c.age': 'Sukurta', 'orders.c.actions': 'Veiksmai',

  'od.new': 'Naujas užsakymas', 'od.edit': 'Redaguoti užsakymą', 'od.productHint': 'Klientui užsakyta prekė', 'od.requestHint': 'Ko klientas ieško',
  'od.customer': 'Klientas', 'od.name': 'Vardas', 'od.phone': 'Telefonas', 'od.phoneError': 'Įveskite pilną numerį, pvz. 8 612 34567 arba +370 612 34567',
  'od.product': 'Prekė', 'od.request': 'Ko ieško?', 'od.productPh': 'S23 dėklas permatomas', 'od.requestPh': 'iPhone iki 400 €',
  'od.supplier': 'Tiekėjas', 'od.price': 'Kaina, €', 'od.paid': 'Jau apmokėta', 'od.add': 'Pridėti', 'od.deleteConfirm': 'Ištrinti šį užsakymą?',

  'nd.title': 'Informuoti klientą', 'nd.reminder': 'Siųsti priminimą', 'nd.lastSent': 'Paskutinė SMS išsiųsta {when}.', 'nd.edited': 'Redaguota ranka', 'nd.template': 'Šablonas: {name}',
  'nd.send': 'Siųsti SMS', 'nd.sending': 'Siunčiama…', 'nd.failed': 'Nepavyko išsiųsti',
  'tpl.arrived': 'Prekė atvyko', 'tpl.repairReady': 'Remontas atliktas', 'tpl.reminder': 'Priminimas',

  'cust.title': 'Klientai', 'cust.subtitle': 'Visi, turintys užsakymų, sugrupuoti pagal telefono numerį', 'cust.search': 'Vardas arba telefonas…', 'cust.none': 'Klientų dar nėra.', 'cust.noName': 'Be vardo',
  'cust.c.customer': 'Klientas', 'cust.c.phone': 'Telefonas', 'cust.c.active': 'Aktyvūs', 'cust.c.orders': 'Užsakymai', 'cust.c.spent': 'Išleista', 'cust.c.last': 'Paskutinis užsakymas',

  'set.title': 'Nustatymai', 'set.subtitle': 'Įmonės duomenys, SMS šablonai ir tvarkymo taisyklės', 'set.save': 'Išsaugoti pakeitimus', 'set.saved': 'Išsaugota',
  'set.company': 'Įmonė', 'set.companyHint': 'Naudojama SMS tekste ir kaip siuntėjo vardas', 'set.companyName': 'Įmonės pavadinimas', 'set.phone': 'Telefonas', 'set.address': 'Adresas',
  'set.sender': 'SMS siuntėjo vardas', 'set.senderHint': 'Iki 11 raidžių ar skaitmenų, be tarpų. Rodomas vietoj telefono numerio.',
  'set.sms': 'SMS šablonai', 'set.smsHint': 'Darbuotojas pasirenka šabloną spausdamas „Informuoti“ ir gali pakoreguoti tekstą prieš siųsdamas',
  'set.tplArrivedHint': 'Numatytasis pirmam pranešimui.', 'set.tplRepairHint': 'Užsakymams, kurie iš tiesų yra remontas. Pasirenkamas pranešimo lange.',
  'set.tplReminderHint': 'Numatytasis priminimui. {days} – kiek dienų prekė laukia.', 'set.message': 'Žinutė', 'set.preview': 'Peržiūra',
  'set.twilio': 'Twilio paskyra', 'set.twilioHint': 'Duomenys patikrinami, užšifruojami ir saugomi serveryje. Jie daugiau nerodomi.',
  'set.connected': 'Prijungta · paskyra, kurios pabaiga {sid} · numeris {from}', 'set.savedOn': 'išsaugota {date}', 'set.test': 'Siųsti bandomąją SMS', 'set.replace': 'Pakeisti', 'set.remove': 'Pašalinti',
  'set.removeConfirm': 'Pašalinti išsaugotus Twilio duomenis? SMS siuntimas neveiks, kol neįvesite naujų.',
  'set.sid': 'Account SID', 'set.sidHint': 'Prasideda AC, 34 simboliai. Iš Twilio valdymo pulto.', 'set.token': 'Auth token', 'set.tokenHint': 'Šalia SID valdymo pulte. Saugomas užšifruotas.',
  'set.from': 'Twilio telefono numeris', 'set.fromHint': 'Naudojamas kaip siuntėjas, kur vardas neleidžiamas.', 'set.verify': 'Patikrinti ir išsaugoti', 'set.verifying': 'Tikrinama…', 'set.checking': 'Tikrinama…',
  'set.twilioSaved': 'Patikrinta su Twilio ir išsaugota.', 'set.testSent': 'Bandomoji SMS išsiųsta į {to}.', 'set.testBody': 'Bandomoji MobiCentras SMS. Viskas veikia.',
  'set.rules': 'Taisyklės', 'set.rulesHint': 'Pradžios puslapio ribos ir automatinis valymas',
  'set.followUp': 'Priminti po', 'set.followUpDesc': 'Dienos po SMS, kol užsakymas rodomas kaip neatsiimtas',
  'set.stale': 'Užsakymas vėluoja po', 'set.staleDesc': 'Dienos po užsakymo, kol jis rodomas kaip laukiantis',
  'set.retention': 'Ištrinti užbaigtus užsakymus po', 'set.retentionDesc': 'Atsiimti, uždaryti ir atšaukti užsakymai pašalinami kartu su kliento vardu ir telefonu',
  'set.data': 'Duomenys', 'set.dataHint': 'Viskas saugoma viename faile. Turėkite kopiją.',
  'set.summary': { one: '{n} užsakymas, {done} užbaigtų · {kb} KB', few: '{n} užsakymai, {done} užbaigtų · {kb} KB', many: '{n} užsakymų, {done} užbaigtų · {kb} KB', other: '{n} užsakymo, {done} užbaigtų · {kb} KB' },
  'set.export': 'Eksportuoti', 'set.import': 'Importuoti', 'set.importConfirm': 'Pakeisti esamus {cur} užsakymus {next} iš šio failo?',
  'set.notExport': 'Šis failas nėra MobiCentras eksportas.', 'set.cantRead': 'Nepavyko nuskaityti failo.',

  'auth.title': 'Prisijungti', 'auth.subtitle': 'Įveskite parduotuvės slaptažodį.', 'auth.password': 'Slaptažodis', 'auth.button': 'Prisijungti', 'auth.busy': 'Jungiamasi…',
  'auth.wrong': 'Neteisingas slaptažodis.', 'auth.failed': 'Nepavyko prisijungti. Bandykite dar kartą.',
}

const dicts: Record<Lang, Record<TKey, string | Plural>> = { en, lt }
export const LOCALE: Record<Lang, string> = { en: 'en-GB', lt: 'lt-LT' }

type Vars = Record<string, string | number>
export type T = (key: TKey, vars?: Vars) => string

const makeT = (lang: Lang): T => {
  const rules = new Intl.PluralRules(LOCALE[lang])
  return (key, vars = {}) => {
    const entry = dicts[lang][key] ?? en[key]
    let s: string
    if (typeof entry === 'string') s = entry
    else {
      const cat = rules.select(Number(vars.n ?? 0)) as keyof Plural
      s = entry[cat] ?? entry.other
    }
    return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
  }
}

const KEY = 'mc_lang'
const initial = (): Lang => {
  try { const v = localStorage.getItem(KEY); if (v === 'en' || v === 'lt') return v } catch { /* private mode */ }
  return navigator.language.toLowerCase().startsWith('lt') ? 'lt' : 'en'
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: T; locale: string }>({ lang: 'en', setLang: () => {}, t: makeT('en'), locale: 'en-GB' })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  const value = useMemo(() => ({
    lang,
    locale: LOCALE[lang],
    t: makeT(lang),
    setLang: (l: Lang) => { setLangState(l); try { localStorage.setItem(KEY, l) } catch { /* ignore */ } },
  }), [lang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useT = () => useContext(Ctx)

// Shared relative-day wording: "arrived today", "notified 3 d ago".
export const relDays = (t: T, days: number) => (days === 0 ? t('common.today') : days === 1 ? t('common.yesterday') : t('common.daysAgo', { n: days }))
