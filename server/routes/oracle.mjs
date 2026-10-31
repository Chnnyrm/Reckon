import express from 'express'
import { Mppx, NodeListener } from 'mppx/server'
import { InMemoryDigestStore, USDC_TESTNET, sui } from '@suimpp/mpp/server'

const router = express.Router()

const RECIPIENT =
  process.env.RECKON_SUI_RECIPIENT ||
  '0x0000000000000000000000000000000000000000000000000000000000000000'

let chargeHandler = null

try {
  const mppx = Mppx.create({
    realm: 'reckon',
    secretKey:
      process.env.MPP_SECRET_KEY ||
      'reckon-sui-mppx-secret-key-32-chars-long-minimum-seed',
    methods: [
      sui({
        currency: USDC_TESTNET,
        recipient: RECIPIENT,
        network: 'testnet',
        store: new InMemoryDigestStore()
      })
    ]
  })

  // The charge handler is nested by method name, then intent: mppx.sui.charge(...)
  chargeHandler = mppx.sui.charge({ amount: '0.01' })(async () => {
    return Response.json({
      verdict: {
        status: 'OPEN',
        confidence: 0.88,
        analysis:
          'High probability convergence on implied consensus based on latest Polymarket liquidity and orderbook volume.',
        evaluatedAt: new Date().toISOString()
      }
    })
  })
} catch (err) {
  console.error('Failed to initialize mppx:', err)
}

router.get('/oracle/verdict', async (req, res) => {
  // If mppx initialized successfully, run charge handler
  if (chargeHandler) {
    try {
      const url = `${req.protocol}://${req.get('host') || 'localhost'}${req.originalUrl}`
      const headers = new Headers()
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined) {
          headers.set(k, Array.isArray(v) ? v.join(', ') : v)
        }
      }

      const request = new Request(url, {
        method: 'GET',
        headers
      })

      const response = await chargeHandler(request)
      await NodeListener.sendResponse(res, response)
      return
    } catch (err) {
      console.error('mppx charge error, falling back to 402 response:', err)
    }
  }

  // Hand-rolled 402 fallback per spec rules
  const digest = req.headers['x-sui-digest'] || req.query.digest
  if (digest) {
    // Verify digest if supplied
    try {
      const verifyRes = await fetch(
        `http://localhost:${process.env.PORT || 3000}/api/verify?digest=${digest}`
      )
      const verifyData = await verifyRes.json()
      if (verifyData.ok) {
        return res.json({
          verdict: {
            status: 'OPEN',
            confidence: 0.88,
            analysis:
              'High probability convergence on implied consensus based on latest Polymarket liquidity and orderbook volume.',
            evaluatedAt: new Date().toISOString()
          }
        })
      } else {
        return res.status(402).json({
          error: 'Payment verification failed',
          reason: verifyData.reason,
          scheme: 'sui',
          network: 'testnet',
          amount: '0.01',
          recipient: RECIPIENT,
          currency: USDC_TESTNET.type
        })
      }
    } catch (err) {
      return res.status(402).json({
        error: 'Payment verification error',
        reason: err.message,
        scheme: 'sui',
        network: 'testnet',
        amount: '0.01',
        recipient: RECIPIENT,
        currency: USDC_TESTNET.type
      })
    }
  }

  res.status(402).json({
    scheme: 'sui',
    network: 'testnet',
    amount: '0.01',
    recipient: RECIPIENT,
    currency: USDC_TESTNET.type
  })
})

export default router
