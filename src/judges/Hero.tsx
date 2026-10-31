import {
  ArrowRight,
  CheckCircle,
  MinusCircle,
  SealCheck,
} from '@phosphor-icons/react'
import {
  Container,
  CopyButton,
  ExternalButton,
  ExternalLink,
  Eyebrow,
  ScrollButton,
  SectionHead,
} from './ui'
import { BLOB_ID, CAPTURE_DATE, LINKS, MEMORY_NAMESPACE } from './data'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-primary" aria-labelledby="hero-title">
      <Container className="grid items-start gap-5xl py-6xl sm:py-7xl lg:grid-cols-[1.15fr_0.85fr] lg:gap-5xl lg:py-9xl">
        <div className="min-w-0">
          <Eyebrow>Public forecasting analyst</Eyebrow>
          <h1
            id="hero-title"
            className="mt-xl max-w-2xl text-heading-sm font-semibold tracking-tight text-primary sm:text-heading-md lg:text-heading-lg xl:text-heading-xl"
          >
            A forecasting record you can audit
          </h1>
          <p className="mt-xl max-w-xl text-md text-secondary sm:text-lg">
            Reckon takes positions on real prediction markets and writes each one to Walrus
            Memory before the outcome. The record is timestamped, content-addressed, and
            rebuilt from memory rather than claimed after the fact.
          </p>

          <div className="mt-3xl flex flex-col gap-md sm:flex-row sm:items-center">
            <ExternalButton href={LINKS.live}>Open the live app</ExternalButton>
            <ScrollButton target="walkthrough" variant="secondary">
              See the walkthrough
              <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </ScrollButton>
          </div>

          <div className="mt-2xl flex flex-wrap items-center gap-x-xl gap-y-md text-xs text-quaternary">
            <span className="inline-flex items-center gap-xs">
              <SealCheck size={14} weight="fill" className="text-reckon-accent" aria-hidden="true" />
              Walrus Memory, namespace {MEMORY_NAMESPACE}
            </span>
            <span className="inline-flex items-center gap-xs">
              <span className="h-1 w-1 rounded-full bg-divider" aria-hidden="true" />
              Sui testnet payments
            </span>
            <span className="inline-flex items-center gap-xs">
              <span className="h-1 w-1 rounded-full bg-divider" aria-hidden="true" />
              10 commits by Tatum AI Builder
            </span>
          </div>

          <p className="mt-4xl max-w-xl text-sm text-secondary">
            No account, no API key, no claim of a win rate. Every claim links to something you
            can check.
          </p>
        </div>

        <RecordReceipt />
      </Container>
    </section>
  )
}

function RecordReceipt() {
  return (
    <aside
      aria-label="A committed record from the production namespace"
      className="min-w-0 rounded-2xl border border-primary bg-secondary shadow-2xl"
    >
      <div aria-hidden="true" className="h-0.5 rounded-t-2xl bg-reckon-accent" />
      <div className="p-xl sm:p-2xl">
        <div className="flex items-start justify-between gap-md">
          <div>
            <p className="font-mono text-xs text-quaternary">Production record</p>
            <p className="mt-xs text-sm font-semibold text-primary">Written before the outcome</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-xs rounded-full border border-reckon-accent/40 px-md py-xs text-xs font-medium text-reckon-accent">
            <span className="h-1 w-1 rounded-full bg-reckon-accent" aria-hidden="true" />
            Committed
          </span>
        </div>

        <dl className="mt-2xl divide-y divide-primary border-y border-primary">
          <div className="py-lg">
            <dt className="text-xs text-quaternary">Namespace</dt>
            <dd className="mt-xs font-mono text-sm text-primary">{MEMORY_NAMESPACE}</dd>
          </div>
          <div className="py-lg">
            <dt className="text-xs text-quaternary">Walrus blob</dt>
            <dd className="mt-xs break-all font-mono text-xs leading-6 text-primary">{BLOB_ID}</dd>
            <div className="mt-sm flex flex-wrap items-center gap-md">
              <ExternalLink href={LINKS.blob} className="text-xs">
                Open the blob
              </ExternalLink>
              <CopyButton value={BLOB_ID} label="Copy the committed blob id" />
            </div>
          </div>
          <div className="py-lg">
            <dt className="text-xs text-quaternary">Commit job</dt>
            <dd className="mt-xs text-sm text-primary">About 12 seconds after acceptance</dd>
          </div>
          <div className="py-lg">
            <dt className="text-xs text-quaternary">Recall</dt>
            <dd className="mt-xs text-sm text-primary">3.8s cold, 1.0 to 1.2s warm</dd>
          </div>
        </dl>

        <p className="mt-lg text-xs text-tertiary">
          Captured {CAPTURE_DATE}. The blob is encrypted at rest; the link proves it exists and
          is addressable.
        </p>
      </div>
    </aside>
  )
}

const problemPoints = [
  'Accuracy gets asserted after the result.',
  'Misses can be deleted before anyone checks.',
  'A screenshot carries no timestamp you can trust.',
]

const solutionPoints = [
  'The position is committed before resolution.',
  'The blob id is public and content-addressed.',
  'Recall rebuilds the record; a cache fallback is labelled.',
]

export function Problem() {
  return (
    <section className="border-b border-primary py-8xl sm:py-9xl" aria-labelledby="problem-title">
      <Container>
        <SectionHead
          id="problem-title"
          index="01"
          label="The problem"
          title="A forecast is easy to edit after the fact."
          lede="Prediction markets produce a clean public price. The weak point is the forecaster: anyone can claim a call they never made, or quietly remove the one that went wrong. Time ordering is what makes a record different from a story."
        />

        <div className="mt-5xl grid gap-xl lg:grid-cols-2">
          <div className="rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl">
            <p className="text-xs font-medium text-quaternary">The usual shape</p>
            <h3 className="mt-sm text-lg font-semibold text-primary">Claimed after the outcome</h3>
            <ul className="mt-xl space-y-lg">
              {problemPoints.map((point) => (
                <li key={point} className="flex gap-md text-sm text-secondary">
                  <MinusCircle
                    size={16}
                    weight="bold"
                    className="mt-0.5 shrink-0 text-quaternary"
                    aria-hidden="true"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-reckon-accent/40 bg-secondary p-xl sm:p-2xl">
            <p className="text-xs font-medium text-reckon-accent">What Reckon changes</p>
            <h3 className="mt-sm text-lg font-semibold text-primary">Written before it</h3>
            <ul className="mt-xl space-y-lg">
              {solutionPoints.map((point) => (
                <li key={point} className="flex gap-md text-sm text-secondary">
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-reckon-accent"
                    aria-hidden="true"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-xl rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl">
          <div className="grid gap-xl sm:grid-cols-[auto_1fr] sm:items-center sm:gap-2xl">
            <p className="text-xs font-medium text-quaternary sm:max-w-40">
              The ordering is the product
            </p>
            <ol className="flex flex-col gap-lg sm:flex-row sm:items-center sm:gap-md">
              <OrderStep number="01" title="Position committed" active arrow />
              <OrderStep number="02" title="Market resolves" arrow />
              <OrderStep number="03" title="Outcome known" />
            </ol>
          </div>
          <div className="mt-xl flex flex-wrap gap-x-xl gap-y-md border-t border-primary pt-lg">
            <ExternalLink href={LINKS.walrusMemory} subtle className="text-sm">
              Read the Walrus Memory SDK
            </ExternalLink>
            <ExternalLink href={LINKS.blob} subtle className="text-sm">
              Open a committed blob
            </ExternalLink>
            <ExternalLink href={LINKS.market} subtle className="text-sm">
              See the market behind the demo
            </ExternalLink>
          </div>
        </div>
      </Container>
    </section>
  )
}

function OrderStep({
  number,
  title,
  active = false,
  arrow = false,
}: {
  number: string
  title: string
  active?: boolean
  arrow?: boolean
}) {
  return (
    <li className="flex min-w-0 items-center gap-md">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-xs ${
          active
            ? 'border-reckon-accent/50 bg-reckon-accent/10 text-reckon-accent'
            : 'border-primary bg-tertiary text-quaternary'
        }`}
        aria-hidden="true"
      >
        {number}
      </span>
      <span className={`whitespace-nowrap text-sm ${active ? 'text-primary' : 'text-secondary'}`}>
        {title}
      </span>
      {arrow ? (
        <ArrowRight
          size={14}
          weight="bold"
          aria-hidden="true"
          className="ml-xs hidden shrink-0 text-quaternary sm:block"
        />
      ) : null}
    </li>
  )
}
