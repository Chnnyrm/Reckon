// Tatum prediction markets. This is the only place Reckon reads market data:
// the market list comes from Tatum's list endpoint, and a position is graded
// from the detail endpoint by its stored condition id. The underlying markets
// are Polymarket's; Reckon never calls Polymarket directly.
//
// Every request goes through tatumFetch, which adds x-api-key and a 20s
// timeout. The key is never read, logged or returned here — a missing key
// throws tatum-client's MissingApiKeyError and the route turns that into the
// same degraded state as any other upstream failure.

import { tatumFetch } from './tatum-client.mjs'

// The list endpoint returns at most 100. Reckon shows the 40 highest-volume
// markets, as the old feed did.
const LIST_LIMIT = 100
const DISPLAY_LIMIT = 40
// The markets list endpoint has no working tag filter (every tag returns an
// empty data array), so the Sports tab uses Tatum's event list for the tag and
// its market detail endpoint for each market in those events.
const SPORTS_EVENT_LIMIT = 12
const SPORTS_MARKET_LIMIT = 40
// A warm instance reuses a list for a minute. The route's file cache is the
// failure fallback; this only spares the API repeated identical calls.
const MEMORY_TTL_MS = 60_000

export class MarketsUnavailableError extends Error {
  constructor(message) {
    super(message)
    this.name = 'MarketsUnavailableError'
  }
}

// The UI's first feed used YES/NO from gamma as Yes/No. Tatum uppercases the
// same outcome names. Normalize only that pair; every other outcome keeps the
// platform's own name. Grading matches sides case-insensitively, so positions
// stored before this change still resolve.
function normalizeOutcomeName(value) {
  const name = String(value ?? '').trim()
  if (/^yes$/i.test(name)) return 'Yes'
  if (/^no$/i.test(name)) return 'No'
  return name
}

function normalizePrice(value) {
  const price = Number(value)
  return Number.isFinite(price) ? price : null
}

// One market shape for the UI and for grading. Fields are the ones the app
// already reads; `status` is kept so the sports path can leave resolved
// markets out of the feed.
export function normalizeMarket(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  const question = typeof raw.question === 'string' ? raw.question.trim() : ''
  if (!id || !question) return null

  const outcomes = Array.isArray(raw.outcomes) ? raw.outcomes : []
  return {
    question,
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    conditionId: id,
    outcomes: outcomes.map((outcome) => normalizeOutcomeName(outcome && outcome.name)),
    outcomePrices: outcomes.map((outcome) => normalizePrice(outcome && outcome.price)),
    // Tatum calls this total volume and reports it in `volumeUnit`; the field
    // name is the one the existing UI reads.
    volume24hr: normalizePrice(raw.volume) ?? 0,
    endDate: typeof raw.closeTime === 'string' ? raw.closeTime : '',
    image: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    status: typeof raw.status === 'string' ? raw.status : ''
  }
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function isActive(market) {
  // The public list currently only returns active markets, but do not bet the
  // UI on that: a status of anything other than active is left out.
  return !market.status || market.status === 'active'
}

// GET /v4/data/prediction/markets?limit=N
async function listAllMarkets() {
  const response = await tatumFetch(`/v4/data/prediction/markets?limit=${LIST_LIMIT}`, {
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) {
    throw new MarketsUnavailableError(`Tatum market list returned status ${response.status}`)
  }

  const body = await readJson(response)
  const rows = body && Array.isArray(body.data) ? body.data : []
  return rows
    .map(normalizeMarket)
    .filter((market) => market && isActive(market))
    .sort((a, b) => b.volume24hr - a.volume24hr)
    .slice(0, DISPLAY_LIMIT)
}

// GET /v4/data/prediction/events?limit=N&platform=polymarket&tag=sports, then
// GET /v4/data/prediction/markets/{id} for the markets in those events. The
// detail response is the same shape as a list row.
async function listSportsMarkets() {
  const response = await tatumFetch(
    `/v4/data/prediction/events?limit=${SPORTS_EVENT_LIMIT}&platform=polymarket&tag=sports`,
    { headers: { Accept: 'application/json' } }
  )
  if (!response.ok) {
    throw new MarketsUnavailableError(`Tatum event list returned status ${response.status}`)
  }

  const body = await readJson(response)
  const events = body && Array.isArray(body.data) ? body.data : []
  const ids = []
  for (const event of events) {
    for (const id of Array.isArray(event && event.markets) ? event.markets : []) {
      if (typeof id === 'string' && !ids.includes(id)) ids.push(id)
    }
  }

  const settled = await Promise.allSettled(
    ids.slice(0, SPORTS_MARKET_LIMIT).map((id) => getMarketById(id))
  )
  const markets = []
  let failures = 0
  for (const result of settled) {
    if (result.status === 'rejected') {
      failures += 1
      continue
    }
    if (result.value && isActive(result.value)) markets.push(result.value)
  }

  // Every detail call failing is an outage, not an empty sports feed.
  if (markets.length === 0 && failures === settled.length && failures > 0) {
    throw new MarketsUnavailableError('Tatum market detail calls all failed')
  }

  return markets.slice(0, DISPLAY_LIMIT)
}

const memoryCache = new Map()

// A tab is either 'all' or 'sports'. Throws MarketsUnavailableError (or
// MissingApiKeyError from tatumFetch) so the route can serve its cache.
export async function listMarkets(tab = 'all') {
  const key = tab === 'sports' ? 'sports' : 'all'
  const hit = memoryCache.get(key)
  if (hit && Date.now() - hit.at < MEMORY_TTL_MS) return hit.markets

  const markets = key === 'sports' ? await listSportsMarkets() : await listAllMarkets()
  memoryCache.set(key, { at: Date.now(), markets })
  return markets
}

// GET /v4/data/prediction/markets/{conditionId}. Returns null for a market
// Tatum does not know (404); every other failure throws. Grading treats both
// as "unavailable" and never invents a price.
export async function getMarketById(conditionId) {
  if (typeof conditionId !== 'string' || conditionId.trim() === '') return null
  const response = await tatumFetch(
    `/v4/data/prediction/markets/${encodeURIComponent(conditionId.trim())}`,
    { headers: { Accept: 'application/json' } }
  )
  if (response.status === 404) return null
  if (!response.ok) {
    throw new MarketsUnavailableError(`Tatum market detail returned status ${response.status}`)
  }

  const body = await readJson(response)
  return normalizeMarket(body && body.data)
}
