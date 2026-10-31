// Local entry point. The Express app (every API route) lives in ./app.mjs so
// the same instance can be exported as a serverless handler; this file adds
// what only a long-running process needs — a listener, and either Vite in
// middleware mode (development) or the built SPA (production).
import app from './app.mjs'
import express from 'express'
import { createServer as createHttpServer } from 'http'
import { createServer as createViteServer } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

// Run from the project root. The preview-sidecar starts this server with CWD=/,
// but tooling that resolves paths from the CWD — notably Tailwind's `content`
// globs — must see the project files, or it silently generates no utilities
// (unstyled preview). `vite build` already runs from here; this makes dev match.
process.chdir(root)

const server = createHttpServer(app)

// All Vite config is inline — no vite.config.js needed, no temp files written.
// cacheDir points to /tmp so dep pre-bundling works on read-only node_modules mounts.
const vite = await createViteServer({
  root,
  configFile: false,
  cacheDir: '/tmp/vite',
  plugins: [react()],
  server: {
    middlewareMode: true,
    hmr: { server },
    // Allow any Host — the preview is served on a per-project subdomain this file
    // cannot know. Must be the boolean `true` or an array; the string 'all' is
    // iterated per-character and silently blocks everything (no warning, no error).
    // NB: Vite's 403 body says to add the host to vite.config.js — that does not apply
    // here, `configFile: false` means any vite.config.js is silently ignored.
    allowedHosts: true,
  },
  appType: 'spa',
})
if (process.env.NODE_ENV === 'production') {
  // Serve the built SPA. Vite middleware is a development server and must not
  // run in production, where it would serve source files instead of the build.
  const { default: path } = await import('node:path')
  const { default: fs } = await import('node:fs')
  const distDir = path.resolve(process.cwd(), 'dist')
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('[reckon] dist/index.html missing; run npm run build first')
    process.exit(1)
  }
  app.use(express.static(distDir, { index: false }))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
} else {
  app.use(vite.middlewares)
}

const port = process.env.PORT ?? 3000
server.listen(port, () => {
  console.log(`preview-sidecar listening on :${port}`)
})
