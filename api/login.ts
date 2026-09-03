import { checkPassword, isAuthed, json, sessionCookie } from './_lib.js'

export async function GET(req: Request) {
  return Response.json({ authed: isAuthed(req) })
}

export async function POST(req: Request) {
  const { password } = await json(req)
  try {
    if (typeof password !== 'string' || !checkPassword(password)) return new Response('wrong password', { status: 401 })
    return new Response(null, { status: 204, headers: { 'set-cookie': sessionCookie() } })
  } catch (e) {
    // Most likely APP_PASSWORD or SECRET_KEY is not set for this deployment.
    return new Response(e instanceof Error ? e.message : 'server error', { status: 500 })
  }
}

export async function DELETE() {
  return new Response(null, { status: 204, headers: { 'set-cookie': sessionCookie(true) } })
}
