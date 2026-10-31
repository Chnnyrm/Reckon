// Self-check for server/memory-client.mjs.
//
//   node scripts/check-memory-client.mjs          # offline: hash + envelope
//   node scripts/check-memory-client.mjs --live   # also one write + one read
//
// The expected envelope values were produced by the reference SDK for fixed
// inputs, so a regression in BLAKE2b, bech32, the Sui personal-message intent
// or the address derivation fails here instead of silently breaking recall.

import crypto from 'node:crypto'
import process from 'node:process'
import { __internals, isConfigured, memoryNamespace, remember, recall, waitForRememberJob } from '../server/memory-client.mjs'

const { blake2b, suiAddress, encodeSuiPrivateKey, sealPersonalMessage, signSuiPersonalMessage } = __internals

let failures = 0
function check(name, got, expected) {
  const ok = got === expected
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (!ok) console.log(`  got      ${got}\n  expected ${expected}`)
}

function keyFromSeed(seed) {
  return crypto.createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
    format: 'der',
    type: 'pkcs8'
  })
}

function rawPublic(privateKey) {
  return Buffer.from(crypto.createPublicKey(privateKey).export({ format: 'jwk' }).x, 'base64url')
}

// --- BLAKE2b vectors (RFC 7693 / known digests) ----------------------------
check(
  'blake2b-256("")',
  blake2b(Buffer.from(''), 32).toString('hex'),
  '0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8'
)
check(
  'blake2b-256("abc")',
  blake2b(Buffer.from('abc'), 32).toString('hex'),
  'bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319'
)
check(
  'blake2b-512("")',
  blake2b(Buffer.from(''), 64).toString('hex'),
  '786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419' +
    'd25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce'
)
check(
  'blake2b-256("a" * 200) spans blocks',
  blake2b(Buffer.from('a'.repeat(200)), 32).toString('hex'),
  '6b6e59aaf00eb730cf93de53560846722184bbd92f8368c21ffa95380c2f9fe6'
)

// --- SEAL envelope, fixed inputs ------------------------------------------
const delegate = keyFromSeed(Buffer.from('11'.repeat(32), 'hex'))
const sessionSeed = Buffer.from([...Array(32).keys()])
const sessionPublic = rawPublic(keyFromSeed(sessionSeed))
const packageId = '0xe7c16fbea0560e7057e2bf7422feaa4fb313749fc69c9e9092fac7a33b81d7f5'
const creationMs = 1761000000000

check(
  'sui address from delegate key',
  suiAddress(rawPublic(delegate)),
  '0x0881c07520943bbf13989b92892093c1b50672156fa5f873c22892701cb2e207'
)
check(
  'sui privkey bech32',
  encodeSuiPrivateKey(sessionSeed),
  'suiprivkey1qqqqzqsrqszsvpcgpy9qkrqdpc83qygjzv2p29shrqv35xcur50p74yefn7'
)
const message = sealPersonalMessage(packageId, 5, creationMs, sessionPublic)
check(
  'seal personal message',
  message,
  'Accessing keys of package ' + packageId +
    ' for 5 mins from 2025-10-20 22:40:00 UTC, session key ' + sessionPublic.toString('base64')
)
check(
  'sui personal message signature',
  signSuiPersonalMessage(message, delegate),
  'ADSeUu/8vgmkp5cPRts87e5E+e18aJA1G9XTdqysBxk1Vmje8d9Tr4bhybUwywiT1DnCgGE1J5khUcErqWPw9wbQSrIydCu0qzoTaL1GFeTm0CJKtxoBa6+FIKMyyXeHNw=='
)

// --- Optional live round-trip ---------------------------------------------
if (process.argv.includes('--live')) {
  if (!isConfigured()) {
    console.log('SKIP live check: MEMWAL_ACCOUNT_ID / MEMWAL_PRIVATE_KEY are not set')
  } else {
    const namespace = memoryNamespace('check')
    const token = `check-${Date.now()}`
    const written = await remember(`Self check ${token} opened Yes on check market at 0.5.`, namespace)
    console.log('live remember:', JSON.stringify(written))
    if (!written.ok) {
      failures++
    } else {
      const job = await waitForRememberJob(written.jobId, { timeoutMs: 90000, intervalMs: 3000 })
      console.log('live commit:', JSON.stringify(job))
      if (!job.ok) failures++
      const found = await recall('self check position', namespace, 5)
      const hit = found.ok && found.memories.some((m) => m.text.includes(token))
      console.log('live recall:', found.ok ? `ok, ${found.memories.length} rows, token present: ${hit}` : found.reason)
      if (!hit) failures++
    }
  }
}

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
