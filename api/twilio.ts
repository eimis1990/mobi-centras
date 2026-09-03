import { isAuthed, json, loadTwilio, saveTwilio, twilioVerify, unauthorized } from './_lib'

// Credentials are write-only: the browser only ever sees the masked status below.
const status = async () => {
  const c = await loadTwilio()
  return Response.json(c ? { configured: true, sidLast4: c.sid.slice(-4), from: c.from, savedAt: c.savedAt } : { configured: false })
}

export async function GET(req: Request) {
  if (!isAuthed(req)) return unauthorized()
  return status()
}

export async function PUT(req: Request) {
  if (!isAuthed(req)) return unauthorized()
  const { sid, token, from } = await json(req)
  if (typeof sid !== 'string' || !/^AC[0-9a-f]{32}$/i.test(sid)) return new Response('Account SID should start with AC and be 34 characters', { status: 400 })
  if (typeof token !== 'string' || token.length < 32) return new Response('Auth token should be at least 32 characters', { status: 400 })
  if (typeof from !== 'string' || !/^\+\d{8,15}$/.test(from)) return new Response('Phone number must be in international format, e.g. +15551234567', { status: 400 })
  if (!(await twilioVerify(sid, token))) return new Response('Twilio rejected these credentials', { status: 400 })
  await saveTwilio({ sid, token, from })
  return status()
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return unauthorized()
  await saveTwilio(null)
  return status()
}
