# Reckon

A forecasting record you can audit.

Reckon takes positions on live prediction markets and writes each one to Walrus
Memory before the outcome is known. When a market moves, the position is graded
against the current price. Because the write is timestamped on Sui, the record
cannot be edited after the fact.

Live application: https://reckon-three-beta.vercel.app
Judges briefing: https://reckon-three-beta.vercel.app/judges
Build notes: https://dev.to/chnnyrm/i-asked-an-ai-builder-to-build-a-forecasting-app-in-one-pass-3dke

## The problem

Forecasters claim accuracy after the fact. The misses are deleted and the hits are
posted. A reader has no way to tell a good record from a well edited one, because
nothing about a screenshot proves when it was taken.

A prediction market tells you the current consensus price. It does not tell you
whose opinion is worth trusting. That requires a track record, and a track record
is only meaningful if it cannot be rewritten.

## What Reckon does

1. Reads live markets through Tatum's prediction markets endpoints with their
   current prices. The underlying markets are Polymarket's.
2. Takes a position and writes it to Walrus Memory with the price at that moment.
3. Grades every position against the live price, mark to market, by fetching the
   market's condition id from Tatum's detail endpoint.
4. Sells a verdict to software agents over x402, paid in USDC on Sui.

Grading is mark to market rather than resolution. These markets resolve months
from now, so a resolution based design would show nothing for weeks.

## Architecture

```mermaid
flowchart LR
    B[Browser<br/>React and Vite] -->|/api| F[Vercel function<br/>Express]
    F -->|market data| T[Tatum prediction markets]
    T -.->|underlying markets| P[Polymarket]
    F -->|remember and recall| W[Walrus Memory<br/>relayer]
    W -->|blobs| S[Sui]
    F -->|verify digest| TG[Tatum Sui gRPC]
    TG -.->|fallback| G[Sui GraphQL]
    A[External agent] -->|402 then digest| F
```

The frontend is static. Every route under `/api` runs in one serverless function.
Nothing in the browser ever sees a credential.

## The position lifecycle

```mermaid
sequenceDiagram
    participant U as Reader
    participant API as Reckon API
    participant WM as Walrus Memory
    participant S as Sui

    U->>API: POST /api/positions
    API->>WM: remember sentence with entry price
    WM-->>API: job accepted
    Note over WM,S: the job commits a blob, about 12 seconds
    U->>API: GET /api/positions
    API->>WM: recall namespace reckon
    WM-->>API: stored positions with blob ids
    API-->>U: record, graded mark to market
```

Walrus Memory is the source of truth. The local file is a cache only, because a
serverless instance does not keep one between requests.

## Paying as a software agent

An agent cannot sign up for an account. It has no email address and cannot accept
terms. The endpoint answers with a price instead.

```mermaid
sequenceDiagram
    participant A as Agent
    participant R as Reckon
    participant C as Sui
    participant T as Tatum Sui gRPC

    A->>R: GET /api/oracle/verdict
    R-->>A: 402 with amount, recipient, currency
    A->>C: transfer USDC, gasless
    C-->>A: transaction digest
    A->>R: retry with x-sui-digest
    R->>T: read the transaction
    T-->>R: status and sender
    Note over R,T: public Sui GraphQL answers if Tatum cannot
    R-->>A: verdict
```

One digest buys one call. The digest is stored and replaying it is refused.

Verification asks Tatum's Sui gRPC gateway first, with the key in `x-api-key`
metadata. If that call fails - bad key, timeout, outage, a digest Tatum does not
know - it asks public Sui GraphQL, and the response carries
`source: "sui-graphql"` instead of `source: "tatum"`. When neither path answers,
the result is `ok: false` with a reason that says verification could not be
performed; a payment that cannot be checked is never reported as invalid.

## How it was built

The application was generated with Tatum AI Builder from a written specification,
then extended by hand. The repository history shows both: ten commits authored by
`AI Builder <ai-builder@tatum.io>` and the rest by hand.

Tatum account: `6addae51f9f9306c432153f9`

## Integrations

| Service | Used for |
| --- | --- |
| Walrus Memory | every position, one namespace per app, recalled by meaning |
| Tatum | server side key handling, every market read, and on chain verification |
| Sui | blob storage for memories, and settlement for agent payments |
| x402 through suimpp | the payment scheme for agent access |
| Polymarket | the underlying markets behind the feed, read only through Tatum |

## Honest limits

- x402 on Sui uses `suimpp`, a draft community scheme. Coinbase's x402 does not
  list Sui as a supported network.
- Markets arrive through Tatum's prediction markets API. The underlying contracts
  are Polymarket's, and Reckon never transacts on Polygon.
- If Tatum cannot answer, the last market list is served with
  `marketsAvailable: false` and a reason, or the page shows an error. An empty
  list is never presented as "there are no markets".
- On chain verification runs through Tatum's Sui gRPC gateway, with public Sui
  GraphQL as a named fallback when Tatum is unreachable. Neither is a full node
  we operate, and the response says which path answered.
- Recall is bounded at 15 seconds. Past that the record is served from cache and
  the page says so rather than showing a short list as if it were complete.
- These markets have not resolved, so the record shows movement, not accuracy.

## Running it

```
npm install --legacy-peer-deps
npm run build
npm run dev
```

Environment variables are listed in DEPLOY.md. None belong in the browser.
