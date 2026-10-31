// Walrus Memory relayer client, pure Node.
//
// Replaces the old python3 subprocess bridge. The auth scheme and the SEAL
// session envelope were reverse engineered from the installed Python SDK and
// verified against the live relayer; see ./AUTH-NOTES.md (memory/AUTH-NOTES.md)
// for the contract and the observed status codes.
//
// Everything here is ASCII and depends only on node:crypto.

import crypto from 'node:crypto'

const DEFAULT_SERVER_URL = 'https://relayer.memory.walrus.xyz'
const REQUEST_TIMEOUT_MS = 20000
const SEAL_TTL_MIN = 5
// Rebuild the session a little before the relayer stops honouring it.
const SEAL_SAFETY_MS = 30000
const DEFAULT_RECALL_LIMIT = 10
// The relayer caps recall at 100; anything above is clamped there anyway.
const MAX_RECALL_LIMIT = 100
const ED25519_PKCS8_PREFIX = '302e020100300506032b657004220420'
const ED25519_SCHEME_FLAG = 0x00

// ---------------------------------------------------------------------------
// Error redaction
// ---------------------------------------------------------------------------

// Every string that must never leave this process. Filled once credentials are
// loaded; scrub() is applied to every reason/detail we hand back or log.
const secrets = new Set()

function registerSecret(value) {
  if (typeof value === 'string' && value.length >= 16) {
    secrets.add(value)
    secrets.add(value.toLowerCase())
    secrets.add(value.toUpperCase())
  }
}

function scrub(value) {
  let text = typeof value === 'string' ? value : String(value)
  for (const secret of secrets) {
    if (secret && text.includes(secret)) text = text.split(secret).join('[redacted]')
  }
  return text
}

function reason(code, detail) {
  return detail ? `${code}: ${scrub(detail)}` : code
}

// ---------------------------------------------------------------------------
// BLAKE2b (RFC 7693), pure JS
//
// Node's crypto only exposes blake2b512. Sui addresses and personal-message
// digests need real BLAKE2b-256, which is a different function: truncating the
// 512-bit digest does not match (checked against the known empty-string
// vectors). This is validated against BLAKE2b-256("") =
// 0e5751c0...f3a8 and BLAKE2b-256("abc") = bddd813c...2319.
// ---------------------------------------------------------------------------

const MASK64 = (1n << 64n) - 1n
const IV = [
  0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n, 0x9b05688c2b3e6c1fn, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
]
const SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0]
]

function rotr64(x, n) {
  return ((x >> n) | (x << (64n - n))) & MASK64
}

function blake2bCompress(h, block, counter, last) {
  const v = h.slice()
  for (let i = 0; i < 8; i++) v.push(IV[i])
  v[12] ^= counter & MASK64
  v[13] ^= (counter >> 64n) & MASK64
  if (last) v[14] ^= MASK64

  const m = new Array(16)
  for (let i = 0; i < 16; i++) {
    let word = 0n
    for (let b = 7; b >= 0; b--) word = (word << 8n) | BigInt(block[i * 8 + b])
    m[i] = word
  }

  const g = (a, b, c, d, x, y) => {
    v[a] = (v[a] + v[b] + x) & MASK64
    v[d] = rotr64(v[d] ^ v[a], 32n)
    v[c] = (v[c] + v[d]) & MASK64
    v[b] = rotr64(v[b] ^ v[c], 24n)
    v[a] = (v[a] + v[b] + y) & MASK64
    v[d] = rotr64(v[d] ^ v[a], 16n)
    v[c] = (v[c] + v[d]) & MASK64
    v[b] = rotr64(v[b] ^ v[c], 63n)
  }

  for (let r = 0; r < 12; r++) {
    const s = SIGMA[r % 10]
    g(0, 4, 8, 12, m[s[0]], m[s[1]])
    g(1, 5, 9, 13, m[s[2]], m[s[3]])
    g(2, 6, 10, 14, m[s[4]], m[s[5]])
    g(3, 7, 11, 15, m[s[6]], m[s[7]])
    g(0, 5, 10, 15, m[s[8]], m[s[9]])
    g(1, 6, 11, 12, m[s[10]], m[s[11]])
    g(2, 7, 8, 13, m[s[12]], m[s[13]])
    g(3, 4, 9, 14, m[s[14]], m[s[15]])
  }

  for (let i = 0; i < 8; i++) h[i] = h[i] ^ v[i] ^ v[i + 8]
}

function blake2b(input, outlen) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  const h = IV.slice()
  h[0] ^= 0x01010000n ^ BigInt(outlen)

  let counter = 0n
  let offset = 0
  while (buf.length - offset > 128) {
    counter += 128n
    blake2bCompress(h, buf.subarray(offset, offset + 128), counter, false)
    offset += 128
  }
  const last = Buffer.alloc(128)
  buf.copy(last, 0, offset)
  counter += BigInt(buf.length - offset)
  blake2bCompress(h, last, counter, true)

  const out = Buffer.alloc(outlen)
  for (let i = 0; i < outlen; i++) {
    out[i] = Number((h[i >> 3] >> BigInt(8 * (i & 7))) & 0xffn)
  }
  return out
}

// ---------------------------------------------------------------------------
// Sui signing helpers (bech32, address, personal message)
// ---------------------------------------------------------------------------

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const BECH32_GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

function bech32Polymod(values) {
  let chk = 1
  for (const value of values) {
    const top = chk >>> 25
    chk = ((chk & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) {
      if ((top >>> i) & 1) chk ^= BECH32_GENERATOR[i]
    }
  }
  return chk >>> 0
}

function bech32HrpExpand(hrp) {
  const out = []
  for (const ch of hrp) out.push(ch.charCodeAt(0) >>> 5)
  out.push(0)
  for (const ch of hrp) out.push(ch.charCodeAt(0) & 31)
  return out
}

function bech32Checksum(hrp, data) {
  const values = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0]
  const mod = bech32Polymod(values) ^ 1
  const out = []
  for (let i = 0; i < 6; i++) out.push((mod >>> (5 * (5 - i))) & 31)
  return out
}

function convertBits(bytes, from, to) {
  let acc = 0
  let bits = 0
  const out = []
  const maxv = (1 << to) - 1
  for (const byte of bytes) {
    acc = (acc << from) | byte
    bits += from
    while (bits >= to) {
      bits -= to
      out.push((acc >>> bits) & maxv)
    }
  }
  if (bits > 0) out.push((acc << (to - bits)) & maxv)
  return out
}

function encodeSuiPrivateKey(seed) {
  const payload = Buffer.concat([Buffer.from([ED25519_SCHEME_FLAG]), seed])
  const data = convertBits(payload, 8, 5)
  const combined = [...data, ...bech32Checksum('suiprivkey', data)]
  return 'suiprivkey1' + combined.map((d) => BECH32_CHARSET[d]).join('')
}

function uleb128(value) {
  const out = []
  let v = value
  for (;;) {
    const byte = v & 0x7f
    v >>>= 7
    if (v) out.push(byte | 0x80)
    else {
      out.push(byte)
      return Buffer.from(out)
    }
  }
}

function privateKeyFromSeed(seed) {
  if (!Buffer.isBuffer(seed) || seed.length !== 32) {
    throw new Error('Ed25519 seed must be exactly 32 bytes')
  }
  return crypto.createPrivateKey({
    key: Buffer.concat([Buffer.from(ED25519_PKCS8_PREFIX, 'hex'), seed]),
    format: 'der',
    type: 'pkcs8'
  })
}

function rawPublicKey(privateKey) {
  const jwk = crypto.createPublicKey(privateKey).export({ format: 'jwk' })
  return Buffer.from(jwk.x, 'base64url')
}

function suiAddress(publicKeyRaw) {
  const digest = blake2b(Buffer.concat([Buffer.from([ED25519_SCHEME_FLAG]), publicKeyRaw]), 32)
  return '0x' + digest.toString('hex')
}

function sealPersonalMessage(packageId, ttlMin, creationMs, sessionPublicKey) {
  const utc = new Date(creationMs).toISOString().slice(0, 19).replace('T', ' ') + ' UTC'
  return (
    `Accessing keys of package ${packageId} for ${ttlMin} mins from ${utc}, ` +
    `session key ${sessionPublicKey.toString('base64')}`
  )
}

function signSuiPersonalMessage(message, privateKey) {
  const messageBytes = Buffer.from(message, 'utf8')
  const intent = Buffer.concat([
    Buffer.from([0x03, 0x00, 0x00]),
    uleb128(messageBytes.length),
    messageBytes
  ])
  const digest = blake2b(intent, 32)
  const signature = crypto.sign(null, digest, privateKey)
  const publicKey = rawPublicKey(privateKey)
  return Buffer.concat([Buffer.from([ED25519_SCHEME_FLAG]), signature, publicKey]).toString('base64')
}

// ---------------------------------------------------------------------------
// Credentials and shared state
// ---------------------------------------------------------------------------

let credentials = null
let credentialsLoaded = false
let serverConfig = null
let sealCache = null

function loadCredentials() {
  if (credentialsLoaded) return credentials
  credentialsLoaded = true

  const accountId = process.env.MEMWAL_ACCOUNT_ID
  const rawKey = (process.env.MEMWAL_PRIVATE_KEY || '').replace(/^0x/i, '').trim()
  if (!accountId || !rawKey) return null

  // Never put the key itself into a message: only its shape.
  if (!/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    console.error('[memory] MEMWAL_PRIVATE_KEY is not a 32-byte hex Ed25519 seed')
    return null
  }

  try {
    const privateKey = privateKeyFromSeed(Buffer.from(rawKey, 'hex'))
    const publicKey = rawPublicKey(privateKey)
    registerSecret(rawKey)
    credentials = {
      accountId,
      privateKey,
      publicKeyHex: publicKey.toString('hex')
    }
  } catch (err) {
    console.error('[memory] could not load MEMWAL_PRIVATE_KEY:', scrub(err.message))
    credentials = null
  }
  return credentials
}

function serverUrl() {
  return (process.env.MEMWAL_SERVER_URL || DEFAULT_SERVER_URL).replace(/\/+$/, '')
}

function namespacePrefix() {
  return process.env.MEMWAL_NAMESPACE_PREFIX || 'default'
}

export function isConfigured() {
  return loadCredentials() !== null
}

export function memoryNamespace(suffix = 'reckon') {
  return `${namespacePrefix()}-${suffix}`
}

export function memoryStatus() {
  return {
    namespace: memoryNamespace(),
    configured: isConfigured(),
    server: serverUrl()
  }
}

// ---------------------------------------------------------------------------
// SEAL session
//
// The relayer needs this for server-side SEAL decrypt on recall. Without it a
// recall still answers 200, but every row it cannot decrypt is dropped, so the
// result looks like an empty namespace. That is why the session is mandatory
// here even though the auth layer treats the header as optional.
// ---------------------------------------------------------------------------

async function fetchServerConfig() {
  if (serverConfig && Date.now() < serverConfig.fetchedAt + 3600_000) return serverConfig

  const res = await fetch(`${serverUrl()}/config`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
  if (!res.ok) throw new Error(`relayer GET /config returned ${res.status}`)
  const body = await res.json()
  if (!body || typeof body.packageId !== 'string' || !body.packageId) {
    throw new Error('relayer GET /config returned no packageId')
  }
  serverConfig = { packageId: body.packageId, fetchedAt: Date.now() }
  return serverConfig
}

async function buildSealSession(ctx) {
  const config = await fetchServerConfig()
  const sessionSeed = crypto.randomBytes(32)
  const sessionPrivateKey = privateKeyFromSeed(sessionSeed)
  const sessionPublicKey = rawPublicKey(sessionPrivateKey)
  const creationMs = Date.now()

  const message = sealPersonalMessage(config.packageId, SEAL_TTL_MIN, creationMs, sessionPublicKey)
  const envelope = {
    address: suiAddress(rawPublicKey(ctx.privateKey)),
    packageId: config.packageId,
    mvrName: null,
    creationTimeMs: creationMs,
    ttlMin: SEAL_TTL_MIN,
    personalMessageSignature: signSuiPersonalMessage(message, ctx.privateKey),
    sessionKey: encodeSuiPrivateKey(sessionSeed)
  }
  registerSecret(envelope.sessionKey)

  const value = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64')
  return {
    value,
    expiresAt: creationMs + SEAL_TTL_MIN * 60_000 - SEAL_SAFETY_MS
  }
}

async function sealSession(ctx, { refresh = false } = {}) {
  if (!refresh && sealCache && Date.now() < sealCache.expiresAt) return sealCache.value
  sealCache = await buildSealSession(ctx)
  return sealCache.value
}

// ---------------------------------------------------------------------------
// Signed request
// ---------------------------------------------------------------------------

async function signedRequest(method, path, body, { refreshSeal = false } = {}) {
  const ctx = loadCredentials()
  if (!ctx) {
    return { ok: false, status: 0, reason: reason('not_configured', 'MEMWAL_ACCOUNT_ID / MEMWAL_PRIVATE_KEY are not set') }
  }

  const upper = method.toUpperCase()
  // GET carries no body, and the relayer hashes the empty string for it.
  const bodyStr = upper === 'GET' ? '' : JSON.stringify(body)
  const bodyHash = crypto.createHash('sha256').update(bodyStr, 'utf8').digest('hex')
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonce = crypto.randomUUID()
  const message = `${timestamp}.${upper}.${path}.${bodyHash}.${nonce}.${ctx.accountId}`
  const signature = crypto.sign(null, Buffer.from(message, 'utf8'), ctx.privateKey).toString('hex')

  let seal
  try {
    seal = await sealSession(ctx, { refresh: refreshSeal })
  } catch (err) {
    return { ok: false, status: 0, reason: reason('seal_session_failed', err.message) }
  }

  let res
  try {
    res = await fetch(`${serverUrl()}${path}`, {
      method: upper,
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': ctx.publicKeyHex,
        'x-signature': signature,
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-account-id': ctx.accountId,
        'x-seal-session': seal
      },
      body: upper === 'GET' ? undefined : bodyStr,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError')
    return {
      ok: false,
      status: 0,
      reason: reason(timedOut ? 'timeout' : 'network_error', err && err.message)
    }
  }

  const text = await res.text()
  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = null
  }

  if (!res.ok) {
    const authError = res.headers.get('x-auth-error')
    return {
      ok: false,
      status: res.status,
      authError: authError || undefined,
      reason: reason(`http_${res.status}`, scrub(text).slice(0, 300))
    }
  }

  return { ok: true, status: res.status, body: parsed }
}

// ---------------------------------------------------------------------------
// Public API: remember / recall
// ---------------------------------------------------------------------------

/**
 * Store one memory sentence.
 * Resolves { ok, jobId, status } or { ok: false, status, reason }.
 * Never throws.
 */
export async function remember(text, namespace, { idempotencyKey } = {}) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, status: 0, reason: 'empty_text' }
  }
  const targetNamespace = namespace || memoryNamespace()

  // A SEAL session is not needed to write: the relayer queues the upload and
  // commits the blob in the background. It is attached anyway when available so
  // one code path serves both calls.
  const result = await signedRequest('POST', '/api/remember', {
    text,
    namespace: targetNamespace,
    idempotency_key: idempotencyKey || crypto.randomUUID()
  })

  if (!result.ok) return result

  const jobId = result.body && result.body.job_id
  if (!jobId) {
    return { ok: false, status: result.status, reason: reason('missing_job_id', JSON.stringify(result.body || {}).slice(0, 200)) }
  }
  return { ok: true, status: result.status, jobId, jobStatus: result.body.status || 'pending' }
}

/**
 * Recall memories for a query.
 * Resolves { ok, memories: [{ text, blobId, distance, createdAt }], droppedCount }
 * or { ok: false, status, reason }. Never throws.
 *
 * A 200 response with results and dropped rows is a *decrypt failure*, not an
 * empty namespace; that case is reported as not-ok so callers never present it
 * as "nothing stored".
 */
export async function recall(query, namespace, limit = DEFAULT_RECALL_LIMIT) {
  if (typeof query !== 'string' || query.trim() === '') {
    return { ok: false, status: 0, reason: 'empty_query' }
  }
  const targetNamespace = namespace || memoryNamespace()
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_RECALL_LIMIT, 1), MAX_RECALL_LIMIT)
  const body = { query, limit: safeLimit, namespace: targetNamespace }

  let result = await signedRequest('POST', '/api/recall', body)

  // A stale or rejected session shows up as a 401 or as everything dropped.
  // Rebuild once and retry before reporting failure.
  const dropped = result.ok ? Number(result.body && result.body.dropped_count) || 0 : 0
  const emptyButDropped = result.ok && dropped > 0 && !(result.body.results || []).length
  if ((!result.ok && (result.status === 401 || result.authError)) || emptyButDropped) {
    result = await signedRequest('POST', '/api/recall', body, { refreshSeal: true })
  }

  if (!result.ok) return result

  const rows = Array.isArray(result.body && result.body.results) ? result.body.results : []
  const droppedCount = Number(result.body && result.body.dropped_count) || 0

  if (rows.length === 0 && droppedCount > 0) {
    return {
      ok: false,
      status: result.status,
      droppedCount,
      memories: [],
      reason: reason('decrypt_failed', `${droppedCount} matching memories could not be decrypted`)
    }
  }

  const memories = rows
    .map((row) => ({
      text: typeof row.text === 'string' ? row.text : '',
      blobId: row.blob_id || null,
      distance: typeof row.distance === 'number' ? row.distance : null,
      createdAt: row.created_at || null
    }))
    .filter((m) => m.text !== '')

  return {
    ok: true,
    status: result.status,
    memories,
    droppedCount,
    total: Number(result.body.total) || memories.length
  }
}

/**
 * Poll a remember job until it leaves the queue. Used by tests and the
 * startup probe; the app itself does not block on commits.
 * Resolves { ok, status, blobId } or { ok: false, reason }.
 */
export async function waitForRememberJob(jobId, { timeoutMs = 60000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastStatus = 'unknown'
  while (Date.now() < deadline) {
    const result = await signedRequest('GET', `/api/remember/${encodeURIComponent(jobId)}`, {})
    if (!result.ok) return result
    const body = result.body || {}
    lastStatus = body.status || 'unknown'
    if (lastStatus === 'done') return { ok: true, status: lastStatus, blobId: body.blob_id || null }
    if (lastStatus === 'failed' || lastStatus === 'error') {
      return { ok: false, status: lastStatus, reason: reason('remember_job_failed', body.error || '') }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return { ok: false, status: lastStatus, reason: 'remember_job_timeout' }
}

// Exported for the unit checks in scripts/check-memory-client.mjs.
export const __internals = { blake2b, suiAddress, encodeSuiPrivateKey, sealPersonalMessage, signSuiPersonalMessage }
