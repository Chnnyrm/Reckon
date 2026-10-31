// Bridge between the app and Walrus Memory.
//
// This used to spawn `python3 memory/remember.py`. It now calls the pure Node
// client in ../server/memory-client.mjs, so the app has no interpreter
// dependency and works where no Python exists.
//
// Two functions are used by server/routes/reckon.mjs:
//   rememberPosition(input) -> { ok, reason }
//   recallPositions(query)  -> { ok, memories }
// Both resolve; neither throws.
//
// Each remembered sentence keeps a readable form plus a machine-readable tail,
// so a position can be rebuilt exactly from recall instead of being parsed out
// of prose (the question text itself may contain " at " or " on ").

import { remember, recall, memoryNamespace, isConfigured } from '../server/memory-client.mjs'

const MARKER = ' reckoning:v1 '

// The namespace the positions live in. Same value the old bridge used.
export function positionsNamespace() {
  return memoryNamespace('reckon')
}

/**
 * Build the sentence stored on Walrus for one position.
 * Readable for a human, exact for the app.
 */
export function encodePosition({ id, marketId, question, side, entryPrice, openedAt }) {
  const record = { id, marketId, question, side, entryPrice, openedAt }
  const readable = `Opened ${side} on ${question} at ${entryPrice} on ${openedAt}.`
  return `${readable}${MARKER}${JSON.stringify(record)}`
}

/**
 * Recover a position record from a remembered sentence.
 * Returns null when the text was not written by encodePosition.
 */
export function parsePosition(text) {
  if (typeof text !== 'string') return null
  const at = text.lastIndexOf(MARKER)
  if (at === -1) return null
  try {
    const record = JSON.parse(text.slice(at + MARKER.length))
    if (!record || typeof record !== 'object') return null
    if (typeof record.id !== 'string' || typeof record.marketId !== 'string') return null
    if (typeof record.side !== 'string' || typeof record.entryPrice !== 'number') return null
    if (typeof record.openedAt !== 'string') return null
    if (typeof record.question !== 'string') return null
    return {
      id: record.id,
      marketId: record.marketId,
      question: record.question,
      side: record.side,
      entryPrice: record.entryPrice,
      openedAt: record.openedAt
    }
  } catch {
    return null
  }
}

/**
 * Remember one opened position.
 * Resolves { ok, reason } and never throws.
 */
export async function rememberPosition({ id, marketId, question, side, entryPrice, openedAt }) {
  try {
    if (!id || !marketId || !question || !side || typeof entryPrice !== 'number') {
      return { ok: false, reason: 'incomplete_position' }
    }
    if (!isConfigured()) {
      return { ok: false, reason: 'not_configured' }
    }

    const text = encodePosition({ id, marketId, question, side, entryPrice, openedAt })
    const result = await remember(text, positionsNamespace())

    if (!result.ok) {
      return { ok: false, reason: result.reason || `http_${result.status || 0}` }
    }
    return { ok: true, jobId: result.jobId, status: result.status }
  } catch (err) {
    // The contract is "never throws": a surprise here must not take the route
    // down with it.
    return { ok: false, reason: `bridge_error: ${err && err.message ? err.message : 'unknown'}` }
  }
}

/**
 * Recall remembered positions.
 * Resolves { ok, memories: [{ text, blobId, distance, createdAt }] }.
 * Never throws.
 *
 * `ok: false` means the read itself failed (network, auth, decrypt). It does
 * not mean "no positions" — callers must not present it as such.
 */
export async function recallPositions(query = 'trading position opened entry price market', limit = 100) {
  try {
    if (!isConfigured()) {
      return { ok: false, memories: [], reason: 'not_configured' }
    }
    const result = await recall(query, positionsNamespace(), limit)
    if (!result.ok) {
      return { ok: false, memories: [], reason: result.reason || 'recall_failed' }
    }
    return { ok: true, memories: result.memories, droppedCount: result.droppedCount || 0 }
  } catch (err) {
    return { ok: false, memories: [], reason: `bridge_error: ${err && err.message ? err.message : 'unknown'}` }
  }
}
