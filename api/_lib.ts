// Shared server-side helpers. Files starting with "_" are not routes on Vercel.
import { get, put } from '@vercel/blob'
import fs from 'node:fs'
import path from 'node:path'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const isDev = !process.env.VERCEL && process.env.NODE_ENV !== 'production'
const env = (key: string, devFallback?: string) => {
  const v = process.env[key] ?? (isDev ? devFallback : undefined)
  if (v === undefined) throw new Error(`Missing environment variable ${key}`)
  return v
}
const password = () => env('APP_PASSWORD', 'mobi')
const secret = () => env('SECRET_KEY', 'dev-secret-change-me')

// ---- auth: one shared shop password, one signed cookie -------------------------------
const COOKIE = 'mc_session'
const same = (a: string, b: string) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }
// Derived from the password too, so changing the password signs everyone out.
const sessionToken = () => createHmac('sha256', secret()).update(`session:${password()}`).digest('base64url')
// Trim and NFC-normalise both sides: mobile keyboards add trailing spaces and some produce decomposed accents.
const canon = (s: string) => s.trim().normalize('NFC')
export const checkPassword = (p: string) => same(canon(p), canon(password()))
export const sessionCookie = (clear = false) =>
  `${COOKIE}=${clear ? '' : sessionToken()}; Path=/; HttpOnly; SameSite=Lax; ${isDev ? '' : 'Secure; '}Max-Age=${clear ? 0 : 60 * 60 * 24 * 30}`
export const isAuthed = (req: Request) => {
  const m = req.headers.get('cookie')?.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`))
  return !!m && same(m[1], sessionToken())
}
export const unauthorized = () => new Response('unauthorized', { status: 401 })

// ---- storage: private Vercel Blob in production, .data/ files in dev ------------------
// Two ways Vercel provides Blob access: a fixed token, or a store id resolved with the function's runtime OIDC identity.
const useBlob = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
const requireStorage = () => {
  if (!useBlob && process.env.VERCEL) throw new Error('Blob store is not connected: neither BLOB_STORE_ID nor BLOB_READ_WRITE_TOKEN is set. Attach a Blob store to the Vercel project and redeploy.')
}
const dataDir = path.resolve(process.cwd(), '.data')
const etagOf = (s: string) => createHash('md5').update(s).digest('hex').slice(0, 16)

export async function readFile(name: string): Promise<{ body: string; etag: string } | null> {
  requireStorage()
  if (useBlob) {
    const r = await get(name, { access: 'private', useCache: false })
    return r ? { body: await new Response(r.stream).text(), etag: r.blob.etag } : null
  }
  const f = path.join(dataDir, name)
  if (!fs.existsSync(f)) return null
  const body = fs.readFileSync(f, 'utf8')
  return { body, etag: etagOf(body) }
}

// ponytail: last write wins. Blob's read/write etags did not agree in production, so conditional
// writes rejected every save; for a single shop counter the concurrency risk is not worth it.
export async function writeFile(name: string, body: string): Promise<string> {
  requireStorage()
  if (useBlob) {
    const r = await put(name, body, { access: 'private', allowOverwrite: true, contentType: 'application/json' })
    return r.etag
  }
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, name), body)
  return etagOf(body)
}

// ---- crypto: AES-GCM with a key derived from SECRET_KEY --------------------------------
const aesKey = () => crypto.subtle.importKey('raw', new Uint8Array(createHash('sha256').update(secret()).digest()), 'AES-GCM', false, ['encrypt', 'decrypt'])
export async function encrypt(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(), new TextEncoder().encode(plain))
  return `${Buffer.from(iv).toString('base64')}.${Buffer.from(data).toString('base64')}`
}
export async function decrypt(s: string) {
  const [iv, data] = s.split('.').map(x => new Uint8Array(Buffer.from(x, 'base64')))
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await aesKey(), data))
}

// ---- Twilio ----------------------------------------------------------------------------
export type TwilioConfig = { sid: string; token: string; from: string; savedAt: string }
const TW_FILE = 'twilio.json'

export async function loadTwilio(): Promise<TwilioConfig | null> {
  const f = await readFile(TW_FILE)
  if (!f || f.body === 'null') return null
  return JSON.parse(await decrypt(f.body)) as TwilioConfig
}
export const saveTwilio = async (c: Omit<TwilioConfig, 'savedAt'> | null) =>
  writeFile(TW_FILE, c ? await encrypt(JSON.stringify({ ...c, savedAt: new Date().toISOString() })) : 'null')

const basic = (sid: string, token: string) => `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`

export async function twilioVerify(sid: string, token: string) {
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, { headers: { authorization: basic(sid, token) } })
  return r.ok
}

export async function twilioSend(c: TwilioConfig, from: string, to: string, body: string) {
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.sid}/Messages.json`, {
    method: 'POST',
    headers: { authorization: basic(c.sid, c.token), 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  })
  const j = (await r.json()) as { sid?: string; status?: string; message?: string }
  if (!r.ok) throw new Error(j.message ? `Twilio: ${j.message}` : `Twilio error ${r.status}`)
  return { sid: j.sid ?? '', status: j.status ?? 'queued' }
}

export const json = (req: Request) => req.json().catch(() => ({})) as Promise<Record<string, unknown>>
