import {
  ArrowRight,
  CheckCircle,
  MinusCircle,
} from '@phosphor-icons/react'
import {
  Container,
  ExternalLink,
  SectionHead,
} from './ui'
import { LINKS } from './data'

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
