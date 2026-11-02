import {
  ArrowRight,
  CheckCircle,
  MinusCircle,
  ShieldCheck,
  XCircle,
} from '@phosphor-icons/react'
import {
  Container,
  ExternalLink,
  SectionHead,
} from './ui'
import { LINKS } from './data'

const problemPoints = [
  {
    title: 'Selective memory',
    body: 'Losing predictions get deleted or buried on social feeds; only winning calls are retweeted.',
  },
  {
    title: 'Zero cryptographic provenance',
    body: 'Screenshots, spreadsheets, and social posts carry no verifiable timestamp or content hash.',
  },
  {
    title: 'Custodial revisionism',
    body: 'Centralized database rows can be silently edited, rolled back, or deleted after the fact.',
  },
  {
    title: 'Inaccessible to agents',
    body: 'Autonomous software systems cannot audit historical track records without blind human trust.',
  },
]

const solutionPoints = [
  {
    title: 'Pre-resolution commitment',
    body: 'Every position is serialized and committed to Walrus Memory before the outcome is known.',
  },
  {
    title: 'Content-addressed blobs',
    body: 'The position exists as a public, tamper-evident blob ID on decentralized Walrus storage.',
  },
  {
    title: 'On-chain Sui timestamp',
    body: 'An immutable Sui network epoch binds the exact execution moment irreversibly in advance.',
  },
  {
    title: 'x402 agent monetization',
    body: 'Autonomous agents verify accuracy on demand and pay per call via USDC micro-payments.',
  },
]

const comparisonMatrix = [
  {
    dimension: 'Temporal ordering',
    statusQuo: 'Retrospective claim asserted after the event',
    reckon: 'Cryptographic commitment prior to resolution',
  },
  {
    dimension: 'Storage layer',
    statusQuo: 'Ephemeral social feeds or private SQL databases',
    reckon: 'Decentralized Walrus Memory blobs',
  },
  {
    dimension: 'Tamper resistance',
    statusQuo: 'Silently mutable, deletable, or prunable',
    reckon: 'Content-addressed and mathematically unalterable',
  },
  {
    dimension: 'Provenance verification',
    statusQuo: 'Unverifiable screenshots and claims',
    reckon: 'Public Sui transaction digests and epoch stamps',
  },
  {
    dimension: 'Machine accessibility',
    statusQuo: 'Manual human inspection only',
    reckon: 'Native HTTP 402 micro-payment settlement for AI agents',
  },
]

export function Problem() {
  return (
    <section id="what-it-is" className="border-b border-primary py-8xl sm:py-9xl" aria-labelledby="problem-title">
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
            <div className="flex items-center justify-between gap-md">
              <span className="rounded-full border border-primary bg-primary px-md py-xs text-xs font-medium text-quaternary">
                The Status Quo
              </span>
              <XCircle size={18} weight="bold" className="text-quaternary" aria-hidden="true" />
            </div>
            <h3 className="mt-md text-lg font-semibold text-primary">Hindsight claims and ephemeral feeds</h3>
            <p className="mt-xs text-xs text-secondary">
              How forecasters, tipsters, and trading accounts currently publish calls.
            </p>
            <ul className="mt-xl space-y-lg">
              {problemPoints.map((point) => (
                <li key={point.title} className="flex gap-md text-sm text-secondary">
                  <MinusCircle
                    size={16}
                    weight="bold"
                    className="mt-0.5 shrink-0 text-quaternary"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-medium text-primary">{point.title}: </span>
                    <span className="text-secondary">{point.body}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-reckon-accent/40 bg-secondary p-xl sm:p-2xl">
            <div className="flex items-center justify-between gap-md">
              <span className="rounded-full border border-reckon-accent/40 bg-reckon-accent/10 px-md py-xs text-xs font-medium text-reckon-accent">
                The Reckon Standard
              </span>
              <ShieldCheck size={18} weight="fill" className="text-reckon-accent" aria-hidden="true" />
            </div>
            <h3 className="mt-md text-lg font-semibold text-primary">Cryptographic pre-commitment</h3>
            <p className="mt-xs text-xs text-secondary">
              How Reckon establishes an irreversible, machine-verifiable audit trail.
            </p>
            <ul className="mt-xl space-y-lg">
              {solutionPoints.map((point) => (
                <li key={point.title} className="flex gap-md text-sm text-secondary">
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="mt-0.5 shrink-0 text-reckon-accent"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-medium text-primary">{point.title}: </span>
                    <span className="text-secondary">{point.body}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-xl overflow-hidden rounded-2xl border border-primary bg-secondary">
          <div className="border-b border-primary px-xl py-lg">
            <p className="text-xs font-medium text-quaternary">Forensic comparison</p>
            <h4 className="mt-xs text-base font-semibold text-primary">Status Quo vs Reckon Standard</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-primary bg-primary/40 text-quaternary">
                  <th scope="col" className="px-xl py-md font-medium">Dimension</th>
                  <th scope="col" className="px-xl py-md font-medium">The Status Quo</th>
                  <th scope="col" className="px-xl py-md font-medium text-reckon-accent">The Reckon Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary">
                {comparisonMatrix.map((row) => (
                  <tr key={row.dimension} className="transition-colors hover:bg-tertiary/40">
                    <td className="px-xl py-lg font-medium text-primary">{row.dimension}</td>
                    <td className="px-xl py-lg text-secondary">{row.statusQuo}</td>
                    <td className="px-xl py-lg font-medium text-primary">{row.reckon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
