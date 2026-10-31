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
