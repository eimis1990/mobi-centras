import { Conflict, isAuthed, readFile, unauthorized, writeFile } from './_lib.js'

const FILE = 'orders.json'

const fail = (e: unknown) => new Response(e instanceof Error ? e.message : 'storage error', { status: 500 })

export async function GET(req: Request) {
  if (!isAuthed(req)) return unauthorized()
  try {
    const f = await readFile(FILE)
    return new Response(f?.body ?? 'null', { headers: { 'content-type': 'application/json', etag: f?.etag ?? '' } })
  } catch (e) { return fail(e) }
}

export async function PUT(req: Request) {
  if (!isAuthed(req)) return unauthorized()
  const body = await req.text()
  try { JSON.parse(body) } catch { return new Response('invalid json', { status: 400 }) }
  try {
    const etag = await writeFile(FILE, body, req.headers.get('if-match') || undefined)
    return new Response(null, { status: 204, headers: { etag } })
  } catch (e) {
    if (e instanceof Conflict) return new Response('conflict', { status: 412 })
    return fail(e)
  }
}
