import { Database, SealCheck } from '@phosphor-icons/react'
import {
  BLOB_BYTES,
  BLOB_ID,
  LINKS,
  MEMORY_ACCOUNT,
  MEMORY_NAMESPACE,
} from './data'
import {
  Container,
  CopyButton,
  ExternalLink,
  SectionHead,
} from './ui'

const flow = [
  {
    title: 'Encode the position',
    body: 'The side, question, entry price and timestamp become one sentence with a machine-readable tail.',
  },
  {
    title: 'Post it to Walrus Memory',
    body: 'The relayer accepts the sentence and returns a job id. The write does not block the request.',
  },
  {
    title: 'Commit the blob',
    body: 'A worker encrypts the sentence and commits it to Walrus. Measured commit time is about 12 seconds.',
  },
  {
    title: 'Rebuild by recall',
    body: 'Every read recalls the namespace and reconstructs rows. A local cache is only a fallback, never the source.',
  },
]

export function WalrusSection() {
  return (
    <section id="record" aria-labelledby="record-title" className="border-b border-primary py-8xl sm:py-9xl">
      <Container>
        <div className="grid gap-4xl lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <div>
            <SectionHead
              id="record-title"
              index="03"
              label="The record"
              title="The record lives in Walrus Memory."
              lede="A position is a sentence before it is a row. The app posts that sentence to Walrus Memory, which returns a job and commits an encrypted blob to Walrus. The record is rebuilt from recall on every read, so the durable copy is the memory, not a local database."
            />

            <div className="mt-3xl rounded-2xl border border-primary bg-secondary">
              <div className="border-b border-primary px-xl py-lg">
                <div className="flex items-center gap-md">
                  <Database size={16} weight="bold" className="text-reckon-accent" aria-hidden="true" />
                  <p className="text-sm font-semibold text-primary">Production memory</p>
                </div>
              </div>
              <dl className="divide-y divide-primary">
                <DataRow label="Namespace" value={MEMORY_NAMESPACE} copyLabel="Copy the namespace" />
                <DataRow
                  label="Account object"
                  value={MEMORY_ACCOUNT}
                  copyLabel="Copy the memory account object"
                  href={LINKS.accountExplorer}
                  linkLabel="View on Suiscan"
                  meta="MemWalAccount, Sui mainnet"
                />
                <DataRow
                  label="Committed blob"
                  value={BLOB_ID}
                  copyLabel="Copy the committed blob id"
                  href={LINKS.blob}
                  linkLabel="Open the blob"
                  meta={`${BLOB_BYTES} bytes, Walrus mainnet`}
                />
                <DataRow label="Write job" value="about 12 seconds to commit" />
              </dl>
            </div>

            <div className="mt-xl flex flex-wrap gap-x-xl gap-y-md">
              <ExternalLink href={LINKS.walrusMemory} className="text-sm">
                Walrus Memory SDK
              </ExternalLink>
              <ExternalLink href={LINKS.walrus} className="text-sm">
                Walrus
              </ExternalLink>
              <ExternalLink href={LINKS.bridgeSource} className="text-sm">
                Position sentence source
              </ExternalLink>
              <ExternalLink href={LINKS.deployNotes} className="text-sm">
                Write and recall timings
              </ExternalLink>
              <ExternalLink href={LINKS.memoryStatus} className="text-sm">
                Live memory status
              </ExternalLink>
            </div>
          </div>

          <div className="rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl">
            <p className="text-xs font-medium text-quaternary">Write once, recall always</p>
            <ol className="mt-2xl space-y-xl">
              {flow.map((item, index) => (
                <li key={item.title} className="relative flex gap-lg">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-reckon-accent/40 bg-reckon-accent/10 font-mono text-xs text-reckon-accent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {index < flow.length - 1 ? (
                      <span aria-hidden="true" className="mt-sm w-px flex-1 bg-divider" />
                    ) : null}
                  </div>
                  <div className="min-w-0 pb-sm">
                    <p className="text-sm font-semibold text-primary">{item.title}</p>
                    <p className="mt-xs text-sm leading-6 text-secondary">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-xl rounded-lg border border-primary bg-tertiary p-lg">
              <p className="text-xs font-medium text-quaternary">Sentence format</p>
              <p className="judges-code mt-sm font-mono text-xs leading-5 text-secondary">
                Opened {'<side>'} on {'<question>'} at {'<entryPrice>'} on {'<openedAt>'}.
                reckoning:v1 {'{...}'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4xl grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          <Metric value="3.8s" label="Recall, cold" />
          <Metric value="1.0 to 1.2s" label="Recall, warm" />
          <Metric value="15s" label="Recall bound" />
          <Metric value="~12s" label="Write commit" />
        </div>

        <div className="mt-xl grid gap-xl lg:grid-cols-2">
          <div className="rounded-xl border border-primary bg-secondary p-xl">
            <div className="flex items-center gap-md">
              <SealCheck size={16} weight="fill" className="text-reckon-accent" aria-hidden="true" />
              <p className="text-sm font-semibold text-primary">When recall is slow</p>
            </div>
            <p className="mt-md text-sm leading-6 text-secondary">
              The read is cut off at 15 seconds. The API then returns the cache with
              <span className="font-mono text-xs text-primary"> memoryAvailable: false</span> and a
              source of cache, and the app shows a notice. It does not present a cached row as a
              Walrus read.
            </p>
            <div className="mt-lg">
              <ExternalLink href={LINKS.cacheCommit} className="text-xs" subtle>
                Read the commit that added the notice
              </ExternalLink>
            </div>
          </div>

          <div className="rounded-xl border border-primary bg-secondary p-xl">
            <div className="flex items-center gap-md">
              <Database size={16} weight="bold" className="text-reckon-accent" aria-hidden="true" />
              <p className="text-sm font-semibold text-primary">When a row cannot be decrypted</p>
            </div>
            <p className="mt-md text-sm leading-6 text-secondary">
              An empty recall with a non-zero dropped count is treated as a decrypt failure, not
              as an empty namespace. The client retries once with a fresh session before it
              reports a problem.
            </p>
            <div className="mt-lg">
              <ExternalLink href={LINKS.bridgeSource} className="text-xs" subtle>
                Read the recall contract
              </ExternalLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function DataRow({
  label,
  value,
  meta,
  copyLabel,
  href,
  linkLabel,
}: {
  label: string
  value: string
  meta?: string
  copyLabel?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="px-xl py-lg">
      <dt className="text-xs text-quaternary">{label}</dt>
      <dd className="mt-xs break-all font-mono text-xs leading-6 text-primary">{value}</dd>
      {meta ? <p className="mt-xs text-xs text-tertiary">{meta}</p> : null}
      {copyLabel || href ? (
        <div className="mt-sm flex flex-wrap items-center gap-md">
          {copyLabel ? <CopyButton value={value} label={copyLabel} /> : null}
          {href && linkLabel ? (
            <ExternalLink href={href} className="text-xs">
              {linkLabel}
            </ExternalLink>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-primary bg-secondary p-lg">
      <p className="text-xl font-semibold text-primary">{value}</p>
      <p className="mt-xs text-xs text-quaternary">{label}</p>
    </div>
  )
}
