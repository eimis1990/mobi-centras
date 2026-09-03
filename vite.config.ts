import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Runs the real api/*.ts handlers under the Vite dev server, so dev and Vercel share one code path.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server: ViteDevServer) {
      Object.assign(process.env, loadEnv(server.config.mode, server.config.root, ''))
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const name = req.url.slice(5).split('?')[0].replace(/[^a-z-]/g, '')
        try {
          const mod = (await server.ssrLoadModule(`/api/${name}.ts`)) as Record<string, (r: Request) => Promise<Response>>
          const handler = mod[req.method ?? 'GET']
          if (!handler) { res.statusCode = 405; res.end(); return }
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v)
          const hasBody = !['GET', 'HEAD'].includes(req.method ?? 'GET')
          const request = new Request(`http://localhost${req.url}`, { method: req.method, headers, body: hasBody ? new Uint8Array(Buffer.concat(chunks)) : undefined })
          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
          server.ssrFixStacktrace(e as Error)
          console.error(e)
          res.statusCode = 500
          res.end(String(e))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
})
