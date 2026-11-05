// Verification guards: the Tatum path, the GraphQL fallback, and the promise
// that a payment which cannot be checked is never called invalid.
//
// No test here opens a socket. The Tatum calls go through the real client
// module with a fake service client, and the GraphQL helper runs against a
// stubbed global fetch, so the suite is deterministic and needs no key.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { verifyDigest, verifyViaSuiGraphQL } from '../server/lib/verify-digest.mjs'
import {
  fetchTransactionViaTatum,
  mapTatumTransaction,
  TatumSuiError,
} from '../server/lib/tatum-sui-grpc.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

const SUCCESS_DIGEST = 'J224qh3qkiFtSnQJLeNeErPyaCWDkVXwxSZTi8enCH9T'
const FAILED_DIGEST = 'By5CRYBYAu3gJaMiivdDsrAsKyYM6V2J52e6N7Xk3QSY'
const SENDER = '0x34c77d361f9b09cfd3a8ef86c30bd39ff193fcf071a57c6374eef0ec8acdc33d'
const KEY = 'sk_test_never_print_me_0123456789abcdef'

const successResponse = {
  transaction: {
    digest: SUCCESS_DIGEST,
    transaction: { sender: SENDER },
    effects: { status: { success: true } },
  },
}

const failedResponse = {
  transaction: {
    digest: FAILED_DIGEST,
    transaction: { sender: SENDER },
    effects: {
      status: {
        success: false,
        error: { description: 'MoveAbort in 2nd command, abort code: 101' },
      },
    },
  },
}

function fakeClient(response) {
  return {
    ledgerService: {
      getTransaction: async () => ({ response }),
    },
  }
}

function withEnvKey(fn) {
  return async () => {
    const previous = process.env.TATUM_API_KEY
    process.env.TATUM_API_KEY = KEY
    try {
      await fn()
    } finally {
      if (previous === undefined) delete process.env.TATUM_API_KEY
      else process.env.TATUM_API_KEY = previous
    }
  }
}

test('a successful transaction verifies through Tatum', async () => {
  const calls = []
  const client = {
    ledgerService: {
      getTransaction: async (request, options) => {
        calls.push({ request, options })
        return { response: successResponse }
      },
    },
  }

  const result = await verifyDigest(SUCCESS_DIGEST, {
    tatum: (digest) => fetchTransactionViaTatum(digest, { client }),
  })

  assert.deepEqual(result, { ok: true, sender: SENDER, reason: null, source: 'tatum' })
  assert.equal(calls.length, 1, 'Tatum must be asked once')
  assert.equal(calls[0].request.digest, SUCCESS_DIGEST)
  assert.deepEqual(calls[0].request.readMask.paths, [
    'digest',
    'effects.status',
    'transaction.sender',
  ])
  assert.ok(calls[0].options.timeout > 0, 'the gRPC call must carry a deadline')
})

test('a failed transaction returns ok false with the sender, through Tatum', async () => {
  const result = await verifyDigest(FAILED_DIGEST, {
    tatum: (digest) =>
      fetchTransactionViaTatum(digest, { client: fakeClient(failedResponse) }),
  })

  assert.equal(result.ok, false)
  assert.equal(result.sender, SENDER)
  assert.equal(result.source, 'tatum')
  assert.match(result.reason, /^Transaction failed on chain: MoveAbort/)
})

test('a transaction missing the effects it asked for is not reported as success', () => {
  // A read mask that the gateway ignores must not turn into a pass.
  const mapped = mapTatumTransaction(
    { transaction: { digest: SUCCESS_DIGEST, transaction: { sender: SENDER } } },
    SUCCESS_DIGEST
  )
  assert.equal(mapped.success, false)
  assert.equal(mapped.sender, SENDER)
})

test('a Tatum failure falls back to Sui GraphQL and says so', async () => {
  const result = await verifyDigest(SUCCESS_DIGEST, {
    tatum: async () => {
      throw new TatumSuiError(
        'Tatum Sui gRPC request failed (UNAVAILABLE: no connection)',
        'UNAVAILABLE',
        'UNAVAILABLE: no connection'
      )
    },
    graphql: async () => ({ ok: true, sender: SENDER, reason: null }),
  })

  assert.deepEqual(result, { ok: true, sender: SENDER, reason: null, source: 'sui-graphql' })
})

test('a digest Tatum does not know also falls back to GraphQL', async () => {
  const result = await verifyDigest(SUCCESS_DIGEST, {
    tatum: async () => {
      throw new TatumSuiError(
        `Tatum Sui gRPC request failed (NOT_FOUND: transaction ${SUCCESS_DIGEST} not found)`,
        'NOT_FOUND',
        `NOT_FOUND: transaction ${SUCCESS_DIGEST} not found`
      )
    },
    graphql: async () => ({ ok: false, sender: null, reason: 'Transaction not found on chain' }),
  })

  assert.equal(result.ok, false)
  assert.equal(result.source, 'sui-graphql')
  assert.equal(result.reason, 'Transaction not found on chain')
})

test('a total failure says verification could not be performed', async () => {
  const result = await verifyDigest(SUCCESS_DIGEST, {
    tatum: async () => {
      throw new TatumSuiError(
        'Tatum Sui gRPC request failed (UNAVAILABLE: no connection)',
        'UNAVAILABLE',
        'UNAVAILABLE: no connection'
      )
    },
    graphql: async () => {
      throw new Error('Sui GraphQL request failed: responded with HTTP 503')
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.sender, null)
  assert.equal(result.source, null)
  assert.match(result.reason, /Verification could not be performed/)
  // The words that would blame the payment are the ones that must not appear.
  assert.doesNotMatch(result.reason, /invalid|not valid|payment failed|payment is invalid/i)
})

test('a missing or malformed digest never reaches a network path', async () => {
  let called = false
  const deps = {
    tatum: async () => {
      called = true
      throw new Error('should not run')
    },
    graphql: async () => {
      called = true
      throw new Error('should not run')
    },
  }

  assert.deepEqual(await verifyDigest('', deps), {
    ok: false,
    sender: null,
    reason: 'Missing transaction digest',
    source: null,
  })
  assert.deepEqual(await verifyDigest('not-a-digest"; drop', deps), {
    ok: false,
    sender: null,
    reason: 'Invalid transaction digest',
    source: null,
  })
  assert.equal(called, false)
})

test(
  'the API key never appears in a returned object or a thrown message',
  withEnvKey(async () => {
    const result = await verifyDigest(SUCCESS_DIGEST, {
      tatum: async () => {
        const err = new Error(`gateway rejected x-api-key: ${KEY}`)
        err.detail = `x-api-key: ${KEY}`
        throw err
      },
      graphql: async () => {
        throw new Error(`also leaked ${KEY}`)
      },
    })

    assert.equal(result.source, null)
    assert.equal(JSON.stringify(result).includes(KEY), false, 'the key is in the result object')
    assert.equal(result.reason.includes(KEY), false, 'the key is in the reason')
    assert.match(result.reason, /\[redacted\]/)

    // The client module scrubs a leaky library error before it throws.
    const leaky = {
      ledgerService: {
        getTransaction: async () => {
          throw new Error(`rpc failed: ${KEY}`)
        },
      },
    }
    await assert.rejects(
      () => fetchTransactionViaTatum(SUCCESS_DIGEST, { client: leaky }),
      (err) => {
        assert.equal(err.message.includes(KEY), false, 'the key is in the thrown message')
        assert.equal(String(err.detail).includes(KEY), false, 'the key is in the thrown detail')
        assert.equal(String(err.stack).includes(KEY), false, 'the key is in the thrown stack')
        assert.equal(err.name, 'TatumSuiError')
        return true
      }
    )
  })
)

test(
  'the GraphQL fallback never sends the Tatum key to Sui',
  withEnvKey(async () => {
    const originalFetch = globalThis.fetch
    let seen = null
    globalThis.fetch = async (_url, init) => {
      seen = init
      return {
        ok: true,
        json: async () => ({
          data: {
            transaction: { digest: SUCCESS_DIGEST, effects: { status: 'SUCCESS' }, sender: { address: SENDER } },
          },
        }),
      }
    }

    try {
      const result = await verifyViaSuiGraphQL(SUCCESS_DIGEST)
      assert.deepEqual(result, { ok: true, sender: SENDER, reason: null })
      assert.equal(seen.method, 'POST')
      assert.equal(JSON.stringify(seen.headers).includes(KEY), false, 'the key was sent to Sui')
      assert.equal(seen.headers['x-api-key'], undefined)
      assert.match(seen.body, new RegExp(SUCCESS_DIGEST))
      assert.ok(seen.signal, 'the GraphQL call must carry a timeout signal')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
)

test('the GraphQL fallback maps not-found and failed statuses as before', async () => {
  const originalFetch = globalThis.fetch
  const responses = [
    { data: { transaction: null } },
    { data: { transaction: { digest: FAILED_DIGEST, effects: { status: 'FAILURE' }, sender: { address: SENDER } } } },
    { errors: [{ message: 'bad query' }] },
    { data: {} },
  ]
  let index = 0
  globalThis.fetch = async () => {
    const body = responses[index++]
    return { ok: true, json: async () => body }
  }

  try {
    const notFound = await verifyViaSuiGraphQL(SUCCESS_DIGEST)
    assert.deepEqual(notFound, { ok: false, sender: null, reason: 'Transaction not found on chain' })

    const failed = await verifyViaSuiGraphQL(FAILED_DIGEST)
    assert.deepEqual(failed, { ok: false, sender: SENDER, reason: 'Transaction status is FAILURE' })

    await assert.rejects(() => verifyViaSuiGraphQL(SUCCESS_DIGEST), /returned an error: bad query/)

    globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) })
    await assert.rejects(() => verifyViaSuiGraphQL(SUCCESS_DIGEST), /HTTP 503/)

    globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: {} }) })
    const empty = await verifyViaSuiGraphQL(SUCCESS_DIGEST)
    assert.deepEqual(empty, { ok: false, sender: null, reason: 'Transaction not found on chain' })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('the Tatum client points at the gateway, sends the key as metadata, and logs nothing', () => {
  // Source-level invariants, in the style of the judges guards: a refactor that
  // drops the key header, downgrades to the gRPC-Web default transport, or adds
  // a log line should fail here.
  const source = readFileSync(join(root, 'server', 'lib', 'tatum-sui-grpc.mjs'), 'utf8')
  assert.match(source, /sui-mainnet-grpc\.gateway\.tatum\.io:443/, 'wrong gateway host')
  assert.match(source, /'x-api-key': key/, 'the key is not sent as gRPC metadata')
  assert.match(source, /credentials\.createSsl\(\)/, 'the channel is not TLS')
  assert.match(source, /new SuiGrpcClient\(\{ network: 'mainnet', transport \}\)/)
  assert.match(source, /process\.env\.TATUM_API_KEY/, 'the key is not read from the environment')
  assert.match(source, /TIMEOUT_MS/, 'there is no timeout')
  assert.doesNotMatch(source, /console\.(log|info|warn|error|debug)/, 'the client logs')

  const verify = readFileSync(join(root, 'server', 'lib', 'verify-digest.mjs'), 'utf8')
  // The GraphQL request carries one header and no key: the old code sent
  // TATUM_API_KEY to Sui's public endpoint, which is a leak, not a feature.
  assert.match(verify, /headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\}/)
  assert.doesNotMatch(verify, /TODO/, 'the TODO survived the move to Tatum')
})
