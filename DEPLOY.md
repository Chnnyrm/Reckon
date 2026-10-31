# Deploying Reckon to Vercel

One project: `npm run build` produces `dist/`, Vercel serves it as static
assets, and every `/api/*` request runs the Express app in `api/index.mjs` as
a Node function. Local development is unchanged: `npm run dev` still runs
`server/index.mjs` with Vite in middleware mode.

## Environment variables

There is no `/creds/creds.json` on Vercel. `server/credentials-store.mjs`
tries that path (or `$CREDS_PATH`) and no-ops when it is unreadable, so the
process environment is the only credential source in a deployment. Set these
under Project → Settings → Environment Variables; never commit them.

| Name | Required | Notes |
| --- | --- | --- |
| `MEMWAL_ACCOUNT_ID` | yes | Walrus Memory account id. |
| `MEMWAL_PRIVATE_KEY` | yes | 32-byte Ed25519 seed as 64 hex characters; a leading `0x` is stripped. |
| `MEMWAL_SERVER_URL` | no | Defaults to `https://relayer.memory.walrus.xyz`. |
| `MEMWAL_NAMESPACE_PREFIX` | no | Unset means the namespace is `reckon`. Set to `x`, the namespace becomes `x-reckon`. This decides which memories the deployment reads — choose it deliberately. |
| `TATUM_API_KEY` | no | Only `/api/tatum/status` and `/api/verify` read it; the credential guard also redacts it from responses. |
| `TATUM_API_BASE` | no | Defaults to `https://api.tatum.io`. |
| `MPP_SECRET_KEY` | no | mppx realm secret; `server/routes/oracle.mjs` falls back to a development value when unset. |
| `RECKON_SUI_RECIPIENT` | no | mppx recipient; falls back to the zero address when unset. |

Do not set `CREDS_PATH`, `PORT` or `NODE_ENV` on Vercel: the first only means
something where a credentials file exists, and Vercel supplies the other two.

`/api/memory/status` reports `configured: true` only when both the account id
and a valid key are present. Without them the API still answers: reads serve
the cache with `memoryAvailable: false` and `memoryReason: "not_configured"`.

## Verified locally

`npm install --legacy-peer-deps`, `npm run build`, then
`NODE_ENV=production node server/index.mjs` with the variables above, no
`/creds` directory and no `/creds/creds.json`:

- `GET /` → 200, the built `dist/index.html`
- `GET /assets/index-*.js` → 200
- `GET /api/positions` → 200 JSON
- `POST /api/positions` → 201 with `walrus.jobId`; polling that job reached
  `done` with a blob id after ~12s, and the next `GET /api/positions` returned
  the row from recall with `onWalrus: true` and the same blob id

Recall against the live relayer measured 3.8s cold and 1.0–1.2s warm in the
`reckon` namespace (7.3s cold, 1.6–1.8s warm in a namespace holding four
memories). A full `GET /api/positions` after the write took 2.5s including the
Polymarket grading fetches. A recall that never answers is cut off at 15s and
serves the cache with `memoryAvailable: false`.

## What will not work on Vercel

- **This was not deployed.** There is no Vercel CLI or token in this
  environment, so no `vercel deploy` ran. `vercel.json` was checked against
  the published `vercel.json` schema and the function was exercised locally as
  a bare `(req, res)` handler; the CDN-side rewrites themselves are untested.
- **`/api/oracle/verdict`'s digest fallback.** When mppx does not answer, the
  route verifies a digest by fetching
  `http://localhost:${PORT ?? 3000}/api/verify` — a self-call to the local
  listener. On Vercel the function is invoked directly and nothing listens on
  a local port, so that fetch fails and the route answers 402. The normal
  mppx charge path does not use the self-call and is unaffected.
- **Cross-instance visibility of a just-written position.** Writes are
  acknowledged with a job, and the blob commits later (~12s above). Until it
  does, the position is only in the instance's `/tmp` cache, so a read that
  lands on another instance may not show it yet. That is the existing async
  write design, not a regression.
- **The `/tmp` cache is not durable.** Each function instance has its own
  `/tmp`, lost on cold start. Reads rebuild from recall, which is the source
  of truth; the cache only covers a failed recall and uncommitted writes.

