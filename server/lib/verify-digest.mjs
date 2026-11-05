/**
 * Verify a Sui transaction digest.
 *
 * Extracted so routes can call it directly. The oracle route previously fetched
 * http://localhost:PORT/api/verify, which works only when a server listens on a
 * local port and fails in a serverless runtime where nothing does.
 *
 * Verification runs through Tatum's Sui gRPC gateway first. If Tatum cannot
 * answer — bad key, timeout, outage, a digest Tatum does not know — the public
 * Sui GraphQL endpoint is asked instead, and `source` says which path answered.
 * When neither path answers, the result is "could not be checked", never
 * "payment invalid".
 */
import { fetchTransactionViaTatum } from './tatum-sui-grpc.mjs'

const SUI_GRAPHQL_URL = 'https://graphql.mainnet.sui.io/graphql'
const GRAPHQL_TIMEOUT_MS = 8000

// Sui digests are base58 of a 32-byte hash (43 or 44 characters). The check
// keeps a malformed or hostile value out of the GraphQL query string; base58
// has no quotes or backslashes, so an accepted digest cannot alter the query.
const BASE58_DIGEST = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/

/**
 * Verify a digest.
 *
 * @param {string} digest
 * @param {{ tatum?: (digest: string) => Promise<{sender: string|null, success: boolean, error: string|null}>, graphql?: (digest: string) => Promise<{ok: boolean, sender: string|null, reason: string|null}> }} [deps]
 *   Test seams. Production callers pass nothing.
 * @returns {Promise<{ok: boolean, sender: string|null, reason: string|null, source: 'tatum'|'sui-graphql'|null}>}
 *   `ok` is true only for a transaction the chain executed successfully.
 *   `source` is the path that answered, null when nothing could be checked.
 */
export async function verifyDigest(digest, deps = {}) {
  if (!digest || typeof digest !== 'string') {
    return { ok: false, sender: null, reason: 'Missing transaction digest', source: null }
  }
  if (!BASE58_DIGEST.test(digest)) {
    return { ok: false, sender: null, reason: 'Invalid transaction digest', source: null }
  }

  const viaTatum = deps.tatum ?? fetchTransactionViaTatum
  const viaGraphQL = deps.graphql ?? verifyViaSuiGraphQL

  let tatumError = null
  try {
    const transaction = await viaTatum(digest)
    const succeeded = transaction?.success === true
    return {
      ok: succeeded,
      sender: transaction?.sender ?? null,
      reason: succeeded ? null : tatumFailureReason(transaction),
      source: 'tatum',
    }
  } catch (err) {
    tatumError = err
  }

  try {
    const result = await viaGraphQL(digest)
    return { ...result, source: 'sui-graphql' }
  } catch (graphqlError) {
    const tatumDetail = detailOf(tatumError)
    const graphqlDetail = detailOf(graphqlError)
    return {
      ok: false,
      sender: null,
      reason: `Verification could not be performed: Tatum Sui gRPC (${tatumDetail}); Sui GraphQL (${graphqlDetail})`,
      source: null,
    }
  }
}

// Plain words for a transaction the chain ran and rejected.
function tatumFailureReason(transaction) {
  const description = scrub(transaction?.error)
  if (!description) return 'Transaction failed on chain'
  return `Transaction failed on chain: ${description}`
}

/**
 * Ask the public Sui GraphQL endpoint about a digest.
 *
 * Kept exactly as verification behaved before Tatum: the same query, the same
 * reasons. It throws when the endpoint cannot answer, so the caller can say
 * "could not be performed" instead of pretending the chain rejected a payment.
 * The Tatum key is deliberately not sent to Sui.
 */
export async function verifyViaSuiGraphQL(digest) {
  let response
  try {
    response = await fetch(SUI_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ transaction(digest: "${digest}") { digest effects { status } sender { address } } }`,
      }),
      signal: AbortSignal.timeout(GRAPHQL_TIMEOUT_MS),
    })
  } catch (err) {
    throw graphQLError(`request did not complete: ${scrub(err?.message) || 'unknown error'}`)
  }

  if (!response.ok) {
    throw graphQLError(`responded with HTTP ${response.status}`)
  }

  let json
  try {
    json = await response.json()
  } catch {
    throw graphQLError('returned a response that is not JSON')
  }

  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    const message = scrub(json.errors[0]?.message) || 'unknown error'
    throw graphQLError(`returned an error: ${message}`)
  }

  const transaction = json?.data?.transaction
  if (!transaction) {
    return { ok: false, sender: null, reason: 'Transaction not found on chain' }
  }

  const status = transaction?.effects?.status
  const succeeded = status === 'SUCCESS' || status === 'success'
  return {
    ok: succeeded,
    sender: transaction?.sender?.address || null,
    reason: succeeded ? null : `Transaction status is ${status || 'FAILED'}`,
  }
}

function graphQLError(detail) {
  const err = new Error(`Sui GraphQL request failed: ${detail}`)
  err.name = 'SuiGraphQLError'
  err.detail = detail
  return err
}

// Prefer the short detail the thrower attached; fall back to its message.
function detailOf(err) {
  const detail = scrub(err?.detail || err?.message)
  return detail || 'unknown error'
}

// The Tatum key must never appear in a response body, an error or a log line.
function scrub(value) {
  if (typeof value !== 'string' || !value) return ''
  let text = value
  const key = process.env.TATUM_API_KEY
  if (key) text = text.split(key).join('[redacted]')
  text = text.replace(/(x-api-key\s*[:=]\s*)\S+/gi, '$1[redacted]')
  return text.replace(/\s+/g, ' ').trim()
}
