// The Express application: every API route, and nothing else.
//
// This module only *builds* the app. It never listens and it never mounts a
// static file server or Vite middleware, so the same instance can run behind
// the local listener in ./index.mjs and as a serverless handler in
// ../api/index.mjs.
//
// Must stay first — ESM runs every import before the body, so a setGlobalDispatcher()
// call further down lands after ./routes/* have made their module-scope calls.
import './proxy-bootstrap.mjs'
// Second, before any ./routes/* read the key at module load: this applies
// /creds/creds.json onto process.env, so `process.env.TATUM_API_KEY` is set on
// the controller path (which delivers the key as a file, not an env var) and
// stays live across the rotation push. A no-op where the key is already in env.
import './credentials-store.mjs'
import express from 'express'
import tatumRoutes from './routes/tatum.mjs'
import reckonRoutes from './routes/reckon.mjs'
import verifyRoutes from './routes/verify.mjs'
import oracleRoutes from './routes/oracle.mjs'
import { credentialGuard } from './credential-guard.mjs'

const app = express()
app.use(express.json())

// Redact the Tatum API key from every response before it leaves the process.
app.use(credentialGuard)

app.use('/api/tatum', tatumRoutes)
app.use('/api', reckonRoutes)
app.use('/api', verifyRoutes)
app.use('/api', oracleRoutes)

export default app
