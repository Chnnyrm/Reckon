# Walrus Memory relayer: verified auth contract

Investigated against the installed Python SDK
(`memwal/client.py::_signed_request`, `memwal/utils.py`) and verified with live
calls to `https://relayer.memory.walrus.xyz`. This file records what the
relayer actually accepts so the Node client does not have to guess.

## Canonical signed message

```
{timestamp}.{METHOD}.{path_and_query}.{body_sha256}.{nonce}.{account_id}
```

- `timestamp`: Unix seconds as a string.
- `body_sha256`: SHA-256 hex of the exact JSON body string sent, serialised
  with `separators=(",", ":")` (no spaces).
- `GET`: the canonical body is the empty string and no HTTP body is sent.
- `nonce`: UUID v4, replay-protected server side.
- Key: Ed25519. The SDK accepts a 32-byte seed as hex.

Headers: `x-public-key` (hex), `x-signature` (hex), `x-timestamp`, `x-nonce`,
`x-account-id`, `Content-Type: application/json`, and `x-seal-session`.

## Is `x-seal-session` required?

**Optional at the auth layer, required in practice for readable recall.**

The relayer's `auth.rs` reads the header as `Option`, so a signed request
without it is not rejected. What changes is whether SEAL data can be
decrypted:

- `POST /api/remember` works with **no** seal session. It returns `202` with
  `{job_id, status}` and a background worker commits the blob
  (`GET /api/remember/{job_id}` reaches `status: "done"` with a `blob_id`).
- `POST /api/recall` without any credential returns **HTTP 200 but silently
  drops every row it cannot decrypt**: `{"results":[],"total":0,
  "dropped_count":N}`. An empty `results` therefore does *not* mean the
  namespace is empty. `dropped_count > 0` means memories exist but were not
  decryptable.

Server-side credential resolution (`storage/seal.rs::from_auth_or_fallback`)
accepts, in order: `x-seal-session`, then the legacy `x-delegate-key`, then a
server fallback key. The legacy header works but transmits the raw private key
on every request and is marked for removal, so this project sends
`x-seal-session`.

## Building the seal session in Node

A seal session is a base64 of this compact JSON:

```json
{"address":...,"packageId":...,"mvrName":null,"creationTimeMs":...,
 "ttlMin":5,"personalMessageSignature":...,"sessionKey":...}
```

- `packageId`: from unauthenticated `GET /config`.
- `sessionKey`: an ephemeral Ed25519 seed encoded as Sui bech32
  `suiprivkey1...` over `0x00 || seed` (scheme flag byte, then 8-to-5 bit
  conversion, bech32 checksum constant 1).
- `address`: `blake2b-256(0x00 || delegate_public_key)`, hex with `0x`.
- `personalMessageSignature`: base64 of `0x00 || sig(64) || pubkey(32)`, where
  `sig` is Ed25519 over `blake2b-256(0x03 0x00 0x00 || uleb128(len) || message)`
  and the message is
  `Accessing keys of package {packageId} for {ttl} mins from {UTC}, session key {base64(session_pub)}`.

`blake2b-256` must be a real 32-byte BLAKE2b: Node's `crypto` only exposes
`blake2b512`, and truncating that is a different function (verified: it does
not match). This project therefore carries a small pure-JS BLAKE2b.

The server accepts the session for 5 minutes; this client rebuilds it before
it expires and on any auth failure.

## Live results observed

| Request | Credential | Status | Body |
| --- | --- | --- | --- |
| `POST /api/remember` | none | `202` | `{"job_id":...,"status":"running"}` |
| `GET /api/remember/{id}` | none | `200` | `status` `pending` -> `done` + `blob_id` |
| `POST /api/recall` | none | `200` | `results: []`, `dropped_count: 3` |
| `POST /api/recall` | `x-delegate-key` | `200` | 3 rows with `text` |
| `POST /api/recall` | `x-seal-session` | `200` | 3 rows with `text` |

The Node-built seal session was checked byte-for-byte against the Python SDK
for the same inputs (address, personal message, signature, session key) before
the live call.
