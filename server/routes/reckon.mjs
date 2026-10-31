import express from 'express'
import fs from 'fs'
import path from 'path'
import { rememberPosition, recallPositions } from '../../memory/bridge.js'

const router = express.Router()

// Storage location:
// Platform note: /data/project is mounted read-only in the preview container.
// We use /tmp/positions.json so runtime writes succeed, falling back to in-memory if needed.
const POSITIONS_FILE = '/tmp/reckon-positions.json'

// Seed three LIVE positions
const SEED_POSITIONS = [
  {
    id: 'seed-1',
    marketId: '0x4e4f77e7dbf4cab666e9a1943674d7ae66348e862df03ea6f44b11eb95731928',
    question: 'Will the Republican Party control the House after the 2026 Midterm elections?',
    side: 'Yes',
    entryPrice: 0.52,
    openedAt: '2025-05-10T12:00:00Z',
    source: 'LIVE'
  },
  {
    id: 'seed-2',
    marketId: '0x4548c2670e90c5fae09e3a6503c2fa53664d9f182c163458b66804a80d468131',
    question: 'Fed decreases interest rates by 25+ bps at next FOMC?',
    side: 'Yes',
    entryPrice: 0.76,
    openedAt: '2025-05-12T14:30:00Z',
    source: 'LIVE'
  },
  {
    id: 'seed-3',
    marketId: '0x9482934a1b023948cde934857b28495819385739182394857182938475819283',
    question: 'Ethereum Layer 2 total value locked exceeds $50B before Q3?',
    side: 'No',
    entryPrice: 0.42,
    openedAt: '2025-05-15T09:00:00Z',
    source: 'LIVE'
  }
]

let inMemoryPositions = [...SEED_POSITIONS]

function loadPositions() {
  try {
    if (fs.existsSync(POSITIONS_FILE)) {
      const data = fs.readFileSync(POSITIONS_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Error reading positions file:', err)
  }
  return inMemoryPositions
}

function savePositions(positions) {
  inMemoryPositions = positions
  try {
    fs.writeFileSync(POSITIONS_FILE, JSON.stringify(positions, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Error writing positions file:', err)
    return false
  }
}

// Helper to safely parse JSON strings
function safeJsonParse(val, fallback) {
  if (!val) return fallback
  if (Array.isArray(val)) return val
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}

// Normalize raw market object to exact spec fields
function normalizeMarket(m) {
  if (!m) return null
  const outcomesRaw = safeJsonParse(m.outcomes, [])
  const outcomePricesRaw = safeJsonParse(m.outcomePrices, [])

  const outcomes = Array.isArray(outcomesRaw) ? outcomesRaw.map(String) : []
  const outcomePrices = Array.isArray(outcomePricesRaw)
    ? outcomePricesRaw.map((p) => {
        const num = parseFloat(p)
        return isNaN(num) ? null : num
      })
    : []

  return {
    question: m.question || m.title || '',
    slug: m.slug || '',
    conditionId: m.conditionId || m.id || '',
    outcomes,
    outcomePrices,
    volume24hr: typeof m.volume24hr === 'number' ? m.volume24hr : parseFloat(m.volume24hr) || 0,
    endDate: m.endDate || '',
    image: m.image || ''
  }
}

// GET /api/markets?tab=all|sports
router.get('/markets', async (req, res) => {
  const { tab } = req.query
  try {
    let url = 'https://gamma-api.polymarket.com/markets?closed=false&limit=40&order=volume24hr&ascending=false'
    let isEvents = false

    if (tab === 'sports') {
      url = 'https://gamma-api.polymarket.com/events?closed=false&limit=40&tag_slug=sports'
      isEvents = true
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Polymarket returned status ${response.status}`)
    }

    const data = await response.json()
    let rawMarkets = []

    if (isEvents) {
      // Flatten event.markets into the same shape
      if (Array.isArray(data)) {
        for (const evt of data) {
          if (Array.isArray(evt.markets)) {
            for (const m of evt.markets) {
              rawMarkets.push({
                ...m,
                question: m.question || evt.title || evt.slug
              })
            }
          }
        }
      }
    } else {
      rawMarkets = Array.isArray(data) ? data : []
    }

    const normalized = rawMarkets
      .map(normalizeMarket)
      .filter((m) => m && m.conditionId && m.question)

    res.json({ markets: normalized })
  } catch (error) {
    console.error('Failed to fetch Polymarket markets:', error)
    res.status(502).json({
      error: 'Could not load markets. The market data service did not respond.'
    })
  }
})

// GET /api/positions
// Returns all positions with current mark to market performance
router.get('/positions', async (req, res) => {
  const stored = loadPositions()

  // Try to grade each position by fetching latest prices
  try {
    const graded = await Promise.all(
      stored.map(async (pos) => {
        try {
          // Fetch condition info from Polymarket
          const url = `https://gamma-api.polymarket.com/markets?conditionId=${pos.marketId}`
          const r = await fetch(url)
          if (r.ok) {
            const data = await r.json()
            if (Array.isArray(data) && data[0]) {
              const m = normalizeMarket(data[0])
              const sideIdx = m.outcomes.indexOf(pos.side)
              if (sideIdx !== -1 && m.outcomePrices[sideIdx] !== null && m.outcomePrices[sideIdx] !== undefined) {
                const currentPrice = m.outcomePrices[sideIdx]
                const changePct = Number((((currentPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(1))
                return {
                  ...pos,
                  currentPrice,
                  changePct
                }
              }
            }
          }
        } catch (e) {
          // Fall through to null grading
        }
        return {
          ...pos,
          currentPrice: null,
          changePct: null
        }
      })
    )

    res.json({ positions: graded })
  } catch (err) {
    res.json({
      positions: stored.map((p) => ({ ...p, currentPrice: null, changePct: null }))
    })
  }
})

// POST /api/positions
router.post('/positions', async (req, res) => {
  const { marketId, question, side, entryPrice, source = 'LIVE' } = req.body

  if (!marketId || !question || !side || typeof entryPrice !== 'number') {
    return res.status(400).json({
      error: 'That position could not be saved. Required parameters were missing.'
    })
  }

  const openedAt = new Date().toISOString()

  // Attempt to write to Walrus Memory
  let walrusResult = { ok: false, reason: 'unattempted' }
  try {
    walrusResult = await rememberPosition({
      question,
      side,
      entryPrice,
      openedAt
    })
  } catch (err) {
    walrusResult = { ok: false, reason: err.message }
  }

  const positions = loadPositions()
  const newPos = {
    id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    marketId,
    question,
    side,
    entryPrice,
    openedAt,
    source,
    onWalrus: Boolean(walrusResult && walrusResult.ok)
  }

  positions.unshift(newPos)
  const saved = savePositions(positions)

  if (!saved) {
    return res.status(500).json({
      error: 'That position could not be saved. The record file is not writable. Try again.'
    })
  }

  res.status(201).json({
    position: newPos,
    walrus: walrusResult
  })
})

// GET /api/memory/status
router.get('/memory/status', (req, res) => {
  const prefix = process.env.MEMWAL_NAMESPACE_PREFIX || 'default'
  const namespace = `${prefix}-reckon`
  res.json({
    namespace,
    configured: Boolean(process.env.MEMWAL_ACCOUNT_ID && process.env.MEMWAL_PRIVATE_KEY)
  })
})

export default router
