import { isAuthed, json, loadTwilio, twilioSend, unauthorized } from './_lib'

// Sends one SMS. The browser sends the final text staff approved; credentials never leave the server.
export async function POST(req: Request) {
  if (!isAuthed(req)) return unauthorized()
  const { to, message, sender } = await json(req)
  if (typeof to !== 'string' || !/^\+\d{8,15}$/.test(to)) return new Response('Invalid phone number', { status: 400 })
  if (typeof message !== 'string' || !message.trim()) return new Response('Empty message', { status: 400 })
  const cfg = await loadTwilio()
  if (!cfg) return new Response('SMS is not configured. Add Twilio details in Settings.', { status: 400 })
  const from = typeof sender === 'string' && /^[A-Za-z0-9]{1,11}$/.test(sender) ? sender : cfg.from
  try {
    return Response.json(await twilioSend(cfg, from, to, message.trim()))
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'SMS failed', { status: 502 })
  }
}
