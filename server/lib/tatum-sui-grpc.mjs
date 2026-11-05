/**
 * Read a Sui transaction through Tatum's gRPC gateway.
 *
 * Tatum's Sui host speaks native gRPC over HTTP/2, not gRPC-Web: a gRPC-Web
 * request comes back as "unexpected response content type: application/grpc",
 * and a plain JSON POST comes back as HTTP 415. The official @mysten/sui client
 * defaults to a gRPC-Web fetch transport, so it is given the native protobuf-ts
 * transport over @grpc/grpc-js instead, which is the pairing Mysten documents
 * for server-side Node:
 * https://sdk.mystenlabs.com/sui/clients/grpc#native-grpc-transport
 *
 * Tatum documents the same endpoint, the x-api-key metadata and these client
 * packages: https://docs.tatum.io/docs/sui-migration-guide-from-json-rpc-to-grpc
 *
 * The key is read per call, not at import: credentials-store.mjs rewrites
 * process.env when the controller pushes a rotated key. Nothing in this module
 * logs, and errors are scrubbed before they leave it.
 */
import { SuiGrpcClient } from '@mysten/sui/grpc'
import { GrpcTransport } from '@protobuf-ts/grpc-transport'
import { credentials } from '@grpc/grpc-js'
import { MissingApiKeyError } from '../tatum-client.mjs'

// Tatum's Sui mainnet gateway. grpc-js wants host:port; the public URL is
// https://sui-mainnet-grpc.gateway.tatum.io, TLS on 443.
const TATUM_SUI_GRPC_HOST = 'sui-mainnet-grpc.gateway.tatum.io:443'

// A verification that waits longer than this is treated as unavailable and the
// caller falls back. The gRPC deadline and the abort signal both point here.
const TIMEOUT_MS = 8000

// Ask for the three fields verification reads and nothing else. gRPC responses
// are opt-in: a field not named here comes back unset.
const READ_MASK = { paths: ['digest', 'effects.status', 'transaction.sender'] }

/**
 * A Tatum gRPC call that did not answer. `code` is the gRPC status name when
 * there was one (UNAVAILABLE, UNAUTHENTICATED, NOT_FOUND, DEADLINE_EXCEEDED…).
 */
export class TatumSuiError extends Error {
  constructor(message, code, detail) {
    super(message)
    this.name = 'TatumSuiError'
    this.code = code
    // The short, scrubbed reason without the wrapper sentence, so a caller can
    // build its own message without nesting two "failed" sentences.
    this.detail = detail
  }
}

// One channel per key. A rotated key replaces the channel instead of sending
// the old key forever.
let cached = null

/**
 * The shared client. Throws MissingApiKeyError when the environment has no
 * key, rather than opening a channel that can only fail.
 */
export function tatumSuiClient() {
  const key = process.env.TATUM_API_KEY
  if (!key) throw new MissingApiKeyError()
  if (cached?.key === key) return cached.client

  if (cached) closeTransport(cached.transport)
  const transport = new GrpcTransport({
    host: TATUM_SUI_GRPC_HOST,
    channelCredentials: credentials.createSsl(),
    // Every call carries the key as gRPC metadata; the default timeout keeps
    // one from hanging when the gateway stops answering.
    meta: { 'x-api-key': key },
    timeout: TIMEOUT_MS,
  })
  const client = new SuiGrpcClient({ network: 'mainnet', transport })
  cached = { key, client, transport }
  return client
}

/**
 * Close the channel. Only scripts need this: the server keeps the channel for
 * the life of the process, and a script would otherwise wait for it to idle.
 */
export function closeTatumSuiClient() {
  if (!cached) return
  closeTransport(cached.transport)
  cached = null
}

function closeTransport(transport) {
  try {
    transport.close()
  } catch {
    // Already closed, or grpc-js tore it down on its own. Nothing to do.
  }
}

// The key must never reach a log line, an error, or a response body. gRPC
// status messages are Tatum's own text and do not echo metadata, but a
// library-level message could, so scrub defensively and keep it short.
function sanitize(value) {
  let text = typeof value === 'string' ? value : ''
  const key = process.env.TATUM_API_KEY
  if (key) text = text.split(key).join('[redacted]')
  text = text.replace(/(x-api-key\s*[:=]\s*)\S+/gi, '$1[redacted]')
  text = text.replace(/\s+/g, ' ').trim()
  return text.length > 200 ? `${text.slice(0, 200)}...` : text
}

function tatumError(err) {
  const code =
    typeof err?.code === 'string'
      ? err.code
      : typeof err?.code === 'number'
        ? String(err.code)
        : 'UNKNOWN'
  const detail = sanitize(err?.message)
  const reason = detail ? `${code}: ${detail}` : code
  return new TatumSuiError(`Tatum Sui gRPC request failed (${reason})`, code, reason)
}

/**
 * Map a protobuf GetTransactionResponse to the three facts verification needs.
 * Exported so tests can feed it a recorded response without a socket.
 */
export function mapTatumTransaction(response, digest) {
  const transaction = response?.transaction
  if (!transaction) {
    const reason = `NOT_FOUND: transaction ${digest} not found`
    throw new TatumSuiError(`Tatum Sui gRPC request failed (${reason})`, 'NOT_FOUND', reason)
  }
  const status = transaction.effects?.status
  const success = status?.success === true
  const description = status?.error?.description
  return {
    digest: transaction.digest || digest,
    sender: transaction.transaction?.sender ?? null,
    success,
    error:
      success || typeof description !== 'string' || !description.trim()
        ? null
        : description,
  }
}

/**
 * Fetch one transaction by digest through Tatum.
 *
 * Returns { digest, sender, success, error } when the chain answered, and
 * throws TatumSuiError when it did not (including NOT_FOUND: the caller decides
 * whether another source should answer instead).
 *
 * `options.client` exists for tests; production passes nothing and uses the
 * shared channel.
 */
export async function fetchTransactionViaTatum(digest, options = {}) {
  const client = options.client ?? tatumSuiClient()
  let response
  try {
    ;({ response } = await client.ledgerService.getTransaction(
      { digest, readMask: READ_MASK },
      { timeout: TIMEOUT_MS, abort: AbortSignal.timeout(TIMEOUT_MS + 1000) }
    ))
  } catch (err) {
    // MissingApiKeyError already says what is wrong and carries no secret.
    if (err instanceof MissingApiKeyError) throw err
    throw tatumError(err)
  }
  return mapTatumTransaction(response, digest)
}
