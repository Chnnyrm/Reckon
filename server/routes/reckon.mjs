import express from 'express'
import fs from 'fs'
import {
  rememberPosition,
  recallPositions,
  parsePosition,
  positionsNamespace
} from '../../memory/bridge.js'
import { memoryStatus } from '../memory-client.mjs'

const router = express.Router()

// Storage: Walrus Memory is the source of truth for positions.
// Platform note: /data/project is mounted read-only in the preview container.
// /tmp is wiped on every deploy and is not shared between serverless
// instances, so the local file is only a cache: it backs the API when a recall
// fails, and it holds writes whose Walrus commit has not landed yet.
const POSITIONS_FILE = '/tmp/reckon-positions.json'
// How long a locally written position is still shown while its blob commits.
const PENDING_WINDOW_MS = 15 * 60 * 1000
// A recall that hangs must not hold the HTTP request open behind it. Each
// relayer call already times out at 20s, but a cold recall also fetches
// /config and may rebuild a stale SEAL session and retry, so the pathological
// worst case is ~60s. Cap the wait well inside the function limit: past the
// deadline the read degrades to the cache with memoryAvailable: false instead
// of stalling the request.
const RECALL_DEADLINE_MS = 15000
// The startup recall, so a cold instance answers from Walrus rather than from
// whatever /tmp happened to keep.
let startupRecall = null

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

let inMemoryPositions = SEED_POSITIONS.map((p) => ({ ...p }))

// The cache file may legitimately hold an empty list: that is what "everything
// was forgotten" looks like, and it must not resurrect the seeds.
function readCacheFile() {
  try {
    if (!fs.existsSync(POSITIONS_FILE)) return null
    const parsed = JSON.parse(fs.readFileSync(POSITIONS_FILE, 'utf-8'))
    if (Array.isArray(parsed)) return parsed
  } catch (err) {
    console.error('Error reading positions cache:', err.message)
  }
  return null
}

function writeCacheFile(positions) {
  inMemoryPositions = positions
  try {
    // Write-then-rename. Vercel gives each function instance its own /tmp, but
    // one Fluid instance can run several invocations at once; rename is atomic,
    // so a concurrent reader sees either the old file or the new one, never a
    // half-written JSON that readCacheFile would discard.
    const tmp = `${POSITIONS_FILE}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(positions, null, 2), 'utf-8')
    fs.renameSync(tmp, POSITIONS_FILE)
    return true
  } catch (err) {
    // A read-only or full /tmp must not lose the write: memory still has it,
    // and Walrus is the durable copy.
    console.error('Error writing positions cache:', err.message)
    return false
  }
}

// Turn recalled sentences back into position records. Only text written by
// encodePosition carries the machine-readable tail; anything else is ignored.
function parseRecalledPositions(memories) {
  const byId = new Map()
  for (const memory of memories || []) {
    const record = parsePosition(memory && memory.text)
    if (!record) continue
    const existing = byId.get(record.id)
    if (!existing || (record.openedAt || '') > (existing.openedAt || '')) {
      byId.set(record.id, {
        ...record,
        source: 'LIVE',
        onWalrus: true,
        memorySource: 'walrus',
        blobId: (memory && memory.blobId) || null
      })
    }
  }
  return [...byId.values()].sort((a, b) => (b.openedAt || '').localeCompare(a.openedAt || ''))
}

// Resolve with `fallback` if `work` has not settled within `ms`. The work
// itself is left to finish (or to hit its own network timeout); it is only
// detached from this request, which is the point — the caller gets an answer.
function withDeadline(work, ms, fallback) {
  let timer
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms)
  })
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer))
}

// Rebuild the list from Walrus. The cached file is a fallback, never the
// authority: when recall succeeds, whatever is not on Walrus and not a recent
// local write is dropped, so deleted positions cannot live on in /tmp.
async function loadPositions() {
  const cached = readCacheFile() ?? inMemoryPositions
  const recall = await withDeadline(recallPositions(), RECALL_DEADLINE_MS, {
    ok: false,
    memories: [],
    reason: 'recall_timeout'
  })

  if (!recall.ok) {
    // Nothing can be confirmed to be on Walrus right now, so nothing is
    // presented as if it were, even though the cache remembers older flags.
    return {
      positions: cached.map((p) => ({ ...p, onWalrus: false, memorySource: 'cache' })),
      memoryAvailable: false,
      memorySource: 'cache',
      memoryReason: recall.reason || 'recall_failed'
    }
  }

  const remote = parseRecalledPositions(recall.memories)
  const remoteIds = new Set(remote.map((p) => p.id))
  const now = Date.now()
  const pending = cached
    .filter((p) => {
      if (!p || remoteIds.has(p.id)) return false
      // Seeds and legacy rows have no savedAt: they were never written here.
      if (typeof p.savedAt !== 'number') return false
      return now - p.savedAt < PENDING_WINDOW_MS
    })
    .map((p) => ({ ...p, onWalrus: false, memorySource: 'pending' }))

  const positions = [...pending, ...remote]
  writeCacheFile(positions)

  return {
    positions,
    memoryAvailable: true,
    // Never claim Walrus holds positions when recall returned none.
    memorySource: remote.length > 0 ? 'walrus' : pending.length > 0 ? 'pending' : 'empty',
    recalledCount: remote.length,
    droppedCount: recall.droppedCount || 0
  }
}

// Kick off the startup recall without blocking module load.
startupRecall = loadPositions().catch((err) => {
  console.error('Startup recall failed:', err && err.message ? err.message : err)
  return null
})

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

// Mark each position to market from the latest Polymarket price.
async function gradePositions(positions) {
  return Promise.all(
    positions.map(async (pos) => {
      try {
        // Fetch condition info from Polymarket.
        // The parameter is condition_ids, plural. conditionId singular is silently
        // IGNORED by this API, which returned an unrelated market and produced
        // grades computed against the wrong contract.
        const url = `https://gamma-api.polymarket.com/markets?condition_ids=${encodeURIComponent(pos.marketId)}`
        const r = await fetch(url)
        if (r.ok) {
          const data = await r.json()
          // Only grade from a market that is actually the one we hold.
          const match = Array.isArray(data)
            ? data.find((x) => String(x.conditionId).toLowerCase() === String(pos.marketId).toLowerCase())
            : null
          if (match) {
            const m = normalizeMarket(match)
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
}

// GET /api/positions
// Rebuilt from Walrus Memory on every read. memoryAvailable:false means the
// list came from the local cache because recall failed, and the client must
// not describe it as Walrus-held.
router.get('/positions', async (req, res) => {
  let state
  try {
    state = await loadPositions()
  } catch (err) {
    state = {
      positions: readCacheFile() ?? inMemoryPositions,
      memoryAvailable: false,
      memorySource: 'cache',
      memoryReason: err && err.message ? err.message : 'recall_failed'
    }
  }

  let graded
  try {
    graded = await gradePositions(state.positions)
  } catch (err) {
    graded = state.positions.map((p) => ({ ...p, currentPrice: null, changePct: null }))
  }

  res.json({
    positions: graded,
    memoryAvailable: state.memoryAvailable,
    memorySource: state.memorySource,
    ...(state.memoryReason ? { memoryReason: state.memoryReason } : {}),
    ...(state.droppedCount > 0 ? { memoryDropped: state.droppedCount } : {})
  })
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
  const id = `pos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

  // Write to Walrus first, so the id embedded in the sentence is the id the
  // app keeps. rememberPosition never throws and resolves { ok, reason }.
  let walrusResult = { ok: false, reason: 'unattempted' }
  try {
    walrusResult = await rememberPosition({
      id,
      marketId,
      question,
      side,
      entryPrice,
      openedAt
    })
  } catch (err) {
    walrusResult = { ok: false, reason: err && err.message ? err.message : 'unknown' }
  }

  const acceptedByWalrus = Boolean(walrusResult && walrusResult.ok)
  const newPos = {
    id,
    marketId,
    question,
    side,
    entryPrice,
    openedAt,
    source,
    // Accepted by the relayer. The blob is committed in the background, so it
    // only shows up in recall (and onWalrus: true) once that lands.
    onWalrus: acceptedByWalrus,
    memorySource: acceptedByWalrus ? 'pending' : 'local',
    savedAt: Date.now()
  }

  const existing = readCacheFile() ?? inMemoryPositions
  const positions = [newPos, ...existing.filter((p) => p && p.id !== newPos.id)]
  const cached = writeCacheFile(positions)

  res.status(201).json({
    position: newPos,
    walrus: walrusResult,
    memoryAvailable: acceptedByWalrus,
    cached
  })
})

// GET /api/memory/status
router.get('/memory/status', (req, res) => {
  const status = memoryStatus()
  res.json({
    namespace: positionsNamespace(),
    configured: status.configured,
    server: status.server
  })
})

export default router
