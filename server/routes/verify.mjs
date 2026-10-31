import express from 'express'

const router = express.Router()

// GET /api/verify?digest=...
// Returns { ok, sender, reason }
// Verification on Sui transactions
router.get('/verify', async (req, res) => {
  const { digest } = req.query
  if (!digest || typeof digest !== 'string') {
    return res.status(400).json({ ok: false, reason: 'Missing transaction digest' })
  }

  // TODO: route through Tatum Sui gRPC at sui-mainnet-grpc.gateway.tatum.io
  try {
    const response = await fetch('https://graphql.mainnet.sui.io/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TATUM_API_KEY ? { 'x-api-key': process.env.TATUM_API_KEY } : {})
      },
      body: JSON.stringify({
        query: `{ transaction(digest: "${digest}") { digest effects { status } sender { address } } }`
      })
    })

    if (!response.ok) {
      return res.json({ ok: false, reason: `Sui network responded with status ${response.status}` })
    }

    const json = await response.json()
    const tx = json?.data?.transaction
    if (!tx) {
      return res.json({ ok: false, reason: 'Transaction not found on chain' })
    }

    const status = tx?.effects?.status
    const isSuccess = status === 'SUCCESS' || status === 'success'
    const sender = tx?.sender?.address || null

    res.json({
      ok: isSuccess,
      sender,
      reason: isSuccess ? null : `Transaction status is ${status || 'FAILED'}`
    })
  } catch (err) {
    res.json({ ok: false, reason: err.message || 'Verification failed' })
  }
})

export default router
