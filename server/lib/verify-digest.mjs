/**
 * Verify a Sui transaction digest.
 *
 * Extracted so routes can call it directly. The oracle route previously fetched
 * http://localhost:PORT/api/verify, which works only when a server listens on a
 * local port and fails in a serverless runtime where nothing does.
 *
 * TODO: route this through Tatum Sui gRPC at sui-mainnet-grpc.gateway.tatum.io
 */
export async function verifyDigest(digest) {
  if (!digest || typeof digest !== 'string') {
    return { ok: false, sender: null, reason: 'Missing transaction digest' }
  }
  try {
    const response = await fetch('https://graphql.mainnet.sui.io/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TATUM_API_KEY ? { 'x-api-key': process.env.TATUM_API_KEY } : {}),
      },
      body: JSON.stringify({
        query: `{ transaction(digest: "${digest}") { digest effects { status } sender { address } } }`,
      }),
    })
    if (!response.ok) {
      return { ok: false, sender: null, reason: `Sui network responded with status ${response.status}` }
    }
    const json = await response.json()
    const tx = json?.data?.transaction
    if (!tx) return { ok: false, sender: null, reason: 'Transaction not found on chain' }
    const status = tx?.effects?.status
    const isSuccess = status === 'SUCCESS' || status === 'success'
    return {
      ok: isSuccess,
      sender: tx?.sender?.address || null,
      reason: isSuccess ? null : `Transaction status is ${status || 'FAILED'}`,
    }
  } catch (err) {
    return { ok: false, sender: null, reason: err?.message || 'Verification failed' }
  }
}
