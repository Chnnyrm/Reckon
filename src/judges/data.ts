// Everything on the judges page that a reader can check lives here.
//
// Rules for this file:
// - Only values confirmed against the live app, the public APIs, or the
//   repository are allowed. No invented counts, testimonials or market data.
// - All display copy is ASCII. Use "c" for cents, not the cent sign.
// - Every external target is https and is rendered through ExternalLink, which
//   adds target="_blank" and rel="noopener noreferrer".

export const CAPTURE_DATE = '31 October 2026'
export const LIVE_APP = 'https://reckon-three-beta.vercel.app'
// Both repositories are public. The parent carries the commit history and is
// the one to submit; the fork is the deployment target.
export const REPO_PUBLIC = 'https://github.com/Ksschkw/Reckon'
export const REPO_FORK = 'https://github.com/Chnnyrm/Reckon'
export const REPO_DEPLOYED = REPO_FORK
export const REPO_MIRROR = REPO_PUBLIC

export const TATUM_ID = '6addae51f9f9306c432153f9'
export const AI_COMMIT_COUNT = 10
export const AI_AUTHOR = 'AI Builder <ai-builder@tatum.io>'
export const MEMORY_NAMESPACE = 'reckon'
export const MEMORY_ACCOUNT =
  '0xd6122a37730a5c4d4cd72a690cf8f9d7a2590b33567d266e1faef3e9b6dbeeac'
export const BLOB_ID = '9N5s961oZXH3-eA1pbazpLo1Xs1yTEgWd7xNV1hiEWU'
export const BLOB_BYTES = 658

export const LINKS = {
  live: LIVE_APP,
  repoDeployed: REPO_DEPLOYED,
  repoMirror: REPO_MIRROR,
  commits: `${REPO_PUBLIC}/commits/main`,
  deployNotes: `${REPO_PUBLIC}/blob/main/DEPLOY.md`,
  readme: `${REPO_PUBLIC}/blob/main/README.md`,
  verifySource: `${REPO_PUBLIC}/blob/main/server/lib/verify-digest.mjs`,
  oracleSource: `${REPO_PUBLIC}/blob/main/server/routes/oracle.mjs`,
  tatumSource: `${REPO_PUBLIC}/blob/main/server/routes/tatum.mjs`,
  tatumClientSource: `${REPO_PUBLIC}/blob/main/server/tatum-client.mjs`,
  bridgeSource: `${REPO_PUBLIC}/blob/main/memory/bridge.js`,
  positionsSource: `${REPO_PUBLIC}/blob/main/server/routes/reckon.mjs`,
  cacheCommit: `${REPO_PUBLIC}/commit/a983a74`,
  blob: `https://aggregator.walrus-mainnet.walrus.space/v1/blobs/${BLOB_ID}`,
  blobExplorer: `https://walruscan.com/mainnet/blob/${BLOB_ID}`,
  accountExplorer: `https://suiscan.xyz/mainnet/object/${MEMORY_ACCOUNT}`,
  walrusMemory: 'https://github.com/MystenLabs/walrus-memory',
  walrus: 'https://walrus.xyz',
  sui: 'https://sui.io',
  tatum: 'https://tatum.io',
  x402: 'https://x402.org',
  suimpp: 'https://suimpp.dev',
  mppx: 'https://github.com/wevm/mppx',
  polymarket: 'https://polymarket.com',
  gamma:
    'https://gamma-api.polymarket.com/markets?closed=false&limit=40&order=volume24hr&ascending=false',
  oracle: `${LIVE_APP}/api/oracle/verdict`,
  memoryStatus: `${LIVE_APP}/api/memory/status`,
  market:
    'https://polymarket.com/event/will-olivia-rodrigo-appear-at-the-2027-big-game-halftime-show',
} as const

// Prices were captured through the app's public market feed on 31 October 2026:
// 6.05c and 93.95c. The row shows them to the nearest cent, as the live app
// does. The rest of the row is the same capture.
export const DEMO_MARKET = {
  question: 'Will Olivia Rodrigo appear at the 2027 Big Game halftime show?',
  yes: '6c',
  no: '94c',
  rawYes: '6.05c',
  rawNo: '93.95c',
  volume: '$6,384',
  close: '18 Feb 2027',
  outcomes: ['Yes', 'No'],
} as const

// The three record rows are film fixtures built only from captured market
// values. The live record returned two committed positions at capture;
// this view exists to show how grading reads. It is not a live feed.
export const RECORD_ROWS = [
  {
    question: 'Counter-Strike: Nemiga vs FURIA (BO5) - PGL Masters Bucharest Playoffs',
    side: 'Nemiga',
    entry: '32.5c',
    mark: '33.5c',
    change: '+3.1%',
    direction: 'up' as const,
  },
  {
    question: 'Will the Republican Party control the House after the 2026 Midterm elections?',
    side: 'Yes',
    entry: '6.5c',
    mark: '5.5c',
    change: '-15.4%',
    direction: 'down' as const,
  },
  {
    question: DEMO_MARKET.question,
    side: 'Yes',
    entry: '6.0c',
    mark: '6.05c',
    change: '+0.8%',
    direction: 'up' as const,
  },
]

// The exact body returned by the live endpoint on 31 October 2026.
export const X402_CHALLENGE = {
  scheme: 'sui',
  network: 'testnet',
  amount: '0.01',
  recipient: '0x051cd98ec3919dd48497b2e6d9e3304e8c9e8cbafa83cb4b26ae1139199516d5',
  currency:
    '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
} as const

export const X402_BODY = JSON.stringify(X402_CHALLENGE, null, 2)

// Ten commits on main are authored by AI Builder. The total commit count moves
// whenever this page changes, so the page states the stable number and links to
// the history rather than freezing a total.
export const AI_COMMITS = [
  {
    sha: '47099ac',
    title: 'scaffold',
    date: '31 Oct 2026',
    href: `${REPO_PUBLIC}/commit/47099ac`,
  },
  {
    sha: '4a8b7af',
    title: 'feat: write every position to Walrus Memory',
    date: '31 Oct 2026',
    href: `${REPO_PUBLIC}/commit/4a8b7af`,
  },
  {
    sha: '309c250',
    title: 'feat: 402 payment route on Sui testnet',
    date: '31 Oct 2026',
    href: `${REPO_PUBLIC}/commit/309c250`,
  },
] as const

export type Evidence = {
  claim: string
  value: string
  href: string
  linkLabel: string
}

export const EVIDENCE: Evidence[] = [
  {
    claim: 'The app is live',
    value: 'reckon-three-beta.vercel.app',
    href: LINKS.live,
    linkLabel: 'Open the live app',
  },
  {
    claim: 'A real blob exists on Walrus',
    value: `${BLOB_ID.slice(0, 10)}...${BLOB_ID.slice(-6)}`,
    href: LINKS.blob,
    linkLabel: 'Open the committed blob',
  },
  {
    claim: 'The namespace is in production',
    value: MEMORY_NAMESPACE,
    href: LINKS.memoryStatus,
    linkLabel: 'Read the live memory status',
  },
  {
    claim: 'The memory account is a Sui object',
    value: `${MEMORY_ACCOUNT.slice(0, 8)}...${MEMORY_ACCOUNT.slice(-6)}`,
    href: LINKS.accountExplorer,
    linkLabel: 'View the account object',
  },
  {
    claim: 'The 402 challenge is live',
    value: '0.01 USDC, Sui testnet',
    href: LINKS.oracle,
    linkLabel: 'Call the endpoint',
  },
  {
    claim: 'Markets come from Polymarket',
    value: 'gamma-api.polymarket.com',
    href: LINKS.gamma,
    linkLabel: 'Open the public market API',
  },
  {
    claim: 'Tatum AI Builder wrote commits',
    value: `${AI_COMMIT_COUNT} commits, ID ${TATUM_ID.slice(0, 8)}...`,
    href: LINKS.commits,
    linkLabel: 'Inspect the commit history',
  },
  {
    claim: 'Recall was measured',
    value: '3.8s cold, 1.0-1.2s warm',
    href: LINKS.deployNotes,
    linkLabel: 'Read the deploy notes',
  },
  {
    claim: 'The write commits in about 12s',
    value: 'job accepted, then blob',
    href: LINKS.deployNotes,
    linkLabel: 'Read the commit evidence',
  },
  {
    claim: 'x402 runs on Sui testnet',
    value: 'scheme sui, through suimpp',
    href: LINKS.suimpp,
    linkLabel: 'Read the suimpp scheme',
  },
  {
    claim: 'An agent pays with mppx',
    value: 'one digest, one call',
    href: LINKS.mppx,
    linkLabel: 'Read the mppx SDK',
  },
  {
    claim: 'The source is public',
    value: 'parent repository',
    href: LINKS.repoMirror,
    linkLabel: 'Open the parent repository',
  },
]

export type Limit = {
  title: string
  body: string
  href: string
  linkLabel: string
}

export const LIMITS: Limit[] = [
  {
    title: 'The payment rail is a draft, on testnet',
    body:
      'x402 settles on Sui testnet through suimpp, a draft community scheme. Sui is not a Coinbase-supported x402 network, and the 0.01 USDC is test currency. Treat this as an integration demo, not a production rail.',
    href: LINKS.suimpp,
    linkLabel: 'Read the suimpp scheme',
  },
  {
    title: 'Polymarket is read-only here',
    body:
      'Market questions and prices are read from the public Polymarket API. Reckon never transacts on Polygon and never takes a position in the underlying market.',
    href: LINKS.gamma,
    linkLabel: 'Open the public market API',
  },
  {
    title: 'Tatum does not host Sui JSON-RPC',
    body:
      'Tatum AI Builder built the app, but there is no Tatum Sui JSON-RPC host. Payment verification calls Sui GraphQL today. The code carries a TODO to move to Tatum Sui gRPC.',
    href: LINKS.verifySource,
    linkLabel: 'Read the verification source',
  },
  {
    title: 'Recall is bounded at 15 seconds',
    body:
      'A recall that never answers is cut off at 15 seconds and the record falls back to the cache. When that happens the app shows a notice instead of claiming Walrus answered.',
    href: LINKS.cacheCommit,
    linkLabel: 'Read the cache-notice commit',
  },
  {
    title: 'The blob link opens sealed bytes',
    body:
      'Walrus stores the memory encrypted with SEAL. The blob link proves the write exists and is addressable; it does not decrypt the sentence in your browser. The app decrypts it through a memory session.',
    href: LINKS.blob,
    linkLabel: 'Open the committed blob',
  },
  {
    title: 'The film is a reconstruction',
    body:
      'The market, the 402 body and the blob were captured on 31 October 2026. The six chapters play from those fixtures and call no API. The live app is one link away when you want the real thing.',
    href: LINKS.live,
    linkLabel: 'Open the live app',
  },
]
