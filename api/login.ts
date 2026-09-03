import { checkPassword, isAuthed, json, sessionCookie } from './_lib'

export async function GET(req: Request) {
  return Response.json({ authed: isAuthed(req) })
}

export async function POST(req: Request) {
  const { password } = await json(req)
  if (typeof password !== 'string' || !checkPassword(password)) return new Response('wrong password', { status: 401 })
  return new Response(null, { status: 204, headers: { 'set-cookie': sessionCookie() } })
}

export async function DELETE() {
  return new Response(null, { status: 204, headers: { 'set-cookie': sessionCookie(true) } })
}
