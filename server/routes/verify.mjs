import express from 'express'
import { verifyDigest } from '../lib/verify-digest.mjs'

const router = express.Router()

// GET /api/verify?digest=...
// Returns { ok, sender, reason }
router.get('/verify', async (req, res) => {
  const { digest } = req.query
  if (!digest || typeof digest !== 'string') {
    return res.status(400).json({ ok: false, reason: 'Missing transaction digest' })
  }
  res.json(await verifyDigest(digest))
})

export default router
