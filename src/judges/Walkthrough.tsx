import type { ReactNode } from 'react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowCounterClockwise,
  CheckCircle,
  CircleNotch,
  LockKey,
  SealCheck,
} from '@phosphor-icons/react'
import { Logo } from '../components/Logo'
import {
  BLOB_ID,
  DEMO_MARKET,
  LINKS,
  RECORD_ROWS,
  X402_BODY,
} from './data'
import {
  Container,
  CopyButton,
  ExternalLink,
  SectionHead,
  useReducedMotion,
} from './ui'

const AmbientScene = lazy(() => import('./AmbientScene'))

const STEP_COUNT = 5

type Step = {
  title: string
  body: string
  caption: string
  links: { href: string; label: string }[]
  tab: string
}

const STEPS: Step[] = [
  {
    title: 'Browse a real market',
    body:
      "Markets are read from Polymarket's public Gamma API: question, outcomes, prices, 24h volume and close date. Reckon never transacts on Polygon. This row is a capture of that feed, not a hard-coded mock.",
    caption: "Markets come from Polymarket's public API with live prices.",
    tab: 'Markets',
    links: [
      { href: LINKS.market, label: 'The market on Polymarket' },
      { href: LINKS.gamma, label: 'Gamma API response' },
      { href: LINKS.live, label: 'Open the live app' },
    ],
  },
  {
    title: 'Take a position',
    body:
      'A position fixes the side and the entry price at commit time. The form cannot rewrite yesterday\'s price later. That single constraint is what turns a call into a record.',
    caption: 'The position is written with the price at the moment it was taken.',
    tab: 'Position',
    links: [
      { href: LINKS.live, label: 'Open the live app' },
      { href: LINKS.positionsSource, label: 'Position route source' },
    ],
  },
  {
    title: 'Written to Walrus',
    body:
      'The app posts a sentence to Walrus Memory and gets a job back. A worker encrypts and commits the blob. Every later read is a recall, so a row cannot outlive the memory that backs it.',
    caption:
      'The write is a job, about 12 seconds to commit, and recall is the only source of truth.',
    tab: 'Walrus',
    links: [
      { href: LINKS.blob, label: 'Open the committed blob' },
      { href: LINKS.walrusMemory, label: 'Walrus Memory SDK' },
      { href: LINKS.deployNotes, label: 'Write and recall timings' },
    ],
  },
  {
    title: 'The record, marked to market',
    body:
      'Mark to market is direction, not accuracy. A market that has not resolved can move against a position and still end up a win, or move for it and end up a loss. The record shows the movement without pretending it knows the ending.',
    caption: 'These markets have not resolved. This is movement, not win rate.',
    tab: 'Record',
    links: [
      { href: LINKS.live, label: 'Open the live app' },
      { href: LINKS.gamma, label: 'Market prices' },
      { href: LINKS.cacheCommit, label: 'Cache fallback commit' },
    ],
  },
  {
    title: 'An agent pays for a call',
    body:
      'No account and no API key. The agent reads the 402, pays 0.01 USDC on Sui testnet, and retries with the transaction digest. The endpoint checks the payment before it returns a verdict.',
    caption: 'The endpoint is public, the payment is the credential, and one digest buys one call.',
    tab: 'Agent',
    links: [
      { href: LINKS.oracle, label: 'Call the 402 endpoint' },
      { href: LINKS.x402, label: 'x402' },
      { href: LINKS.suimpp, label: 'suimpp scheme' },
      { href: LINKS.mppx, label: 'mppx SDK' },
      { href: LINKS.oracleSource, label: 'Route source' },
    ],
  },
]

export function Walkthrough() {
  const [step, setStep] = useState(0)
  const [side, setSide] = useState<'Yes' | 'No'>('Yes')
  const [committed, setCommitted] = useState(false)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const go = useCallback((next: number) => {
    setStep(Math.min(STEP_COUNT - 1, Math.max(0, next)))
  }, [])

  const replay = useCallback(() => {
    setStep(0)
    setSide('Yes')
    setCommitted(false)
  }, [])

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting))
      },
      { threshold: 0 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!inView) return
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setStep((current) => Math.min(STEP_COUNT - 1, current + 1))
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setStep((current) => Math.max(0, current - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView])

  const current = STEPS[step]

  return (
    <section
      id="walkthrough"
      aria-labelledby="walkthrough-title"
      className="border-b border-primary py-8xl sm:py-9xl"
    >
      <Container>
        <div className="flex flex-col justify-between gap-2xl lg:flex-row lg:items-end">
          <SectionHead
            id="walkthrough-title"
            index="02"
            label="The walkthrough"
            title="Five steps from market to memory."
            lede="A reconstruction of the live flow, with values captured from the live app and Polymarket on 31 October 2026. Clicking these steps does not call an API."
          />
          <div className="flex flex-wrap items-center gap-sm text-xs text-quaternary lg:justify-end">
            <span className="rounded-full border border-primary bg-secondary px-md py-xs">
              Interactive
            </span>
            <span className="rounded-full border border-primary bg-secondary px-md py-xs">
              Keyboard: left and right
            </span>
            <span className="rounded-full border border-primary bg-secondary px-md py-xs">
              Reduced motion: static
            </span>
          </div>
        </div>

        <div ref={sectionRef} className="mt-4xl">
          <div className="overflow-hidden rounded-2xl border border-primary bg-secondary shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-md border-b border-primary px-lg py-lg sm:px-2xl">
              <div className="flex items-center gap-lg">
                <p className="font-mono text-xs text-quaternary">
                  <span className="text-primary">{String(step + 1).padStart(2, '0')}</span>
                  <span className="px-xs">/</span>
                  {String(STEP_COUNT).padStart(2, '0')}
                </p>
                <div
                  role="progressbar"
                  aria-label="Walkthrough progress"
                  aria-valuemin={1}
                  aria-valuemax={STEP_COUNT}
                  aria-valuenow={step + 1}
                  className="flex items-center gap-xs"
                >
                  {STEPS.map((item, index) => (
                    <span
                      key={item.title}
                      aria-hidden="true"
                      className={`h-1 w-6 rounded-full transition-colors duration-300 sm:w-8 ${
                        index <= step ? 'bg-reckon-accent' : 'bg-divider'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={replay}
                className="inline-flex min-h-8 items-center gap-xs rounded-md px-md py-xs text-xs font-medium text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" />
                Replay
              </button>
            </div>

            <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
              <div className="order-2 min-w-0 border-t border-primary p-lg sm:p-2xl lg:order-1 lg:border-r lg:border-t-0">
                <DemoStage
                  step={step}
                  side={side}
                  setSide={setSide}
                  committed={committed}
                  setCommitted={setCommitted}
                  reduced={reduced}
                  tab={current.tab}
                />
              </div>

              <div className="order-1 flex min-w-0 flex-col p-xl sm:p-2xl lg:order-2">
                <p className="font-mono text-xs text-reckon-accent">Step {step + 1}</p>
                <h3 className="mt-sm text-2xl font-semibold tracking-tight text-primary">
                  {current.title}
                </h3>
                <p className="mt-lg text-sm leading-6 text-secondary">{current.body}</p>

                <blockquote className="mt-xl border-l-2 border-reckon-accent pl-lg">
                  <p className="text-sm font-medium leading-6 text-primary">{current.caption}</p>
                </blockquote>

                <div className="mt-xl border-t border-primary pt-lg">
                  <p className="text-xs font-medium text-quaternary">Check this step</p>
                  <ul className="mt-md space-y-sm">
                    {current.links.map((link) => (
                      <li key={link.href} className="flex">
                        <ExternalLink href={link.href} className="text-sm" subtle>
                          {link.label}
                        </ExternalLink>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-auto pt-2xl text-xs text-tertiary">
                  A reconstruction, not a live feed. Every figure is either captured or labelled
                  as a response shape.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-md border-t border-primary px-lg py-lg sm:flex-row sm:items-center sm:justify-between sm:px-2xl">
              <p className="hidden text-xs text-quaternary sm:block" aria-hidden="true">
                Use the left and right arrow keys while this section is in view.
              </p>
              <p className="sr-only" aria-live="polite">
                Step {step + 1} of {STEP_COUNT}: {current.title}
              </p>
              <div className="flex items-center gap-md">
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={step === 0}
                  aria-controls="judges-demo-panel"
                  className="inline-flex min-h-11 items-center justify-center gap-sm rounded-lg border border-primary bg-secondary px-lg py-md text-sm font-semibold text-primary transition-colors duration-200 hover:border-reckon-accent hover:text-reckon-accent disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <ArrowLeft size={14} weight="bold" aria-hidden="true" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => go(step + 1)}
                  disabled={step === STEP_COUNT - 1}
                  aria-controls="judges-demo-panel"
                  className="inline-flex min-h-11 items-center justify-center gap-sm rounded-lg bg-brand-solid px-lg py-md text-sm font-semibold text-black transition-colors duration-200 hover:bg-brand-solid-hover disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Next
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function DemoStage({
  step,
  side,
  setSide,
  committed,
  setCommitted,
  reduced,
  tab,
}: {
  step: number
  side: 'Yes' | 'No'
  setSide: (side: 'Yes' | 'No') => void
  committed: boolean
  setCommitted: (value: boolean) => void
  reduced: boolean
  tab: string
}) {
  return (
    <div
      id="judges-demo-panel"
      className="relative overflow-hidden rounded-xl border border-primary bg-primary"
    >
      <div className="flex items-center justify-between gap-md border-b border-primary px-lg py-md">
        <div className="flex min-w-0 items-center gap-sm">
          <Logo size={20} />
          <span className="text-xs text-quaternary" aria-hidden="true">
            /
          </span>
          <span className="truncate text-xs font-medium text-secondary">{tab}</span>
        </div>
        <span className="shrink-0 rounded-full border border-primary bg-secondary px-md py-xs text-xs text-quaternary">
          Walkthrough
        </span>
      </div>

      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <Suspense fallback={null}>
            <AmbientScene />
          </Suspense>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-primary/50" />

        <div key={step} className="judges-step relative z-10 min-h-80 p-lg sm:p-xl">
          {step === 0 ? <BrowseVisual /> : null}
          {step === 1 ? (
            <PositionVisual
              side={side}
              setSide={setSide}
              committed={committed}
              setCommitted={setCommitted}
            />
          ) : null}
          {step === 2 ? <WalrusVisual reduced={reduced} /> : null}
          {step === 3 ? <RecordVisual /> : null}
          {step === 4 ? <AgentVisual reduced={reduced} /> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-lg gap-y-xs border-t border-primary px-lg py-md text-xs text-quaternary">
        <span>namespace reckon</span>
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-divider" />
        <span className="break-all font-mono">blob {BLOB_ID.slice(0, 10)}...{BLOB_ID.slice(-6)}</span>
        <span className="ml-auto hidden sm:inline">Captured 31 Oct 2026</span>
      </div>
    </div>
  )
}

function BrowseVisual() {
  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between gap-md">
        <p className="text-xs text-quaternary">All markets / sorted by 24h volume</p>
        <span className="rounded-full border border-reckon-accent/40 px-md py-xs text-xs font-medium text-reckon-accent">
          Captured
        </span>
      </div>

      <div className="rounded-xl border border-primary bg-secondary p-lg sm:p-xl">
        <div className="flex flex-wrap items-center gap-x-md gap-y-xs text-xs text-quaternary">
          <span className="font-medium text-secondary">Polymarket</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-divider" />
          <span>24h vol {DEMO_MARKET.volume}</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-divider" />
          <span>Closes {DEMO_MARKET.close}</span>
        </div>

        <h4 className="mt-md text-base font-semibold leading-6 text-primary">
          {DEMO_MARKET.question}
        </h4>

        <div className="mt-xl grid grid-cols-2 gap-md">
          <PriceTile label="Yes" price={DEMO_MARKET.yes} active />
          <PriceTile label="No" price={DEMO_MARKET.no} />
        </div>

        <div className="mt-lg flex flex-wrap items-center justify-between gap-md border-t border-primary pt-lg">
          <p className="text-xs text-quaternary">
            Displayed to the nearest cent. Raw capture: {DEMO_MARKET.rawYes} /{' '}
            {DEMO_MARKET.rawNo}.
          </p>
          <ExternalLink href={LINKS.market} className="text-xs">
            View on Polymarket
          </ExternalLink>
        </div>
      </div>

      <div className="flex items-start gap-md rounded-lg border border-primary bg-secondary p-lg">
        <SealCheck size={16} weight="fill" className="mt-0.5 shrink-0 text-reckon-accent" aria-hidden="true" />
        <p className="text-xs leading-5 text-secondary">
          Public API, no key. The app reads the market; it never places an order on Polygon.
        </p>
      </div>
    </div>
  )
}

function PriceTile({ label, price, active = false }: { label: string; price: string; active?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-lg ${
        active ? 'border-reckon-accent/50 bg-reckon-accent/10' : 'border-primary bg-tertiary'
      }`}
    >
      <p className={`text-xs ${active ? 'text-reckon-accent' : 'text-quaternary'}`}>{label}</p>
      <p className="mt-xs text-xl font-semibold text-primary">{price}</p>
    </div>
  )
}

function PositionVisual({
  side,
  setSide,
  committed,
  setCommitted,
}: {
  side: 'Yes' | 'No'
  setSide: (side: 'Yes' | 'No') => void
  committed: boolean
  setCommitted: (value: boolean) => void
}) {
  const price = side === 'Yes' ? DEMO_MARKET.yes : DEMO_MARKET.no
  const raw = side === 'Yes' ? DEMO_MARKET.rawYes : DEMO_MARKET.rawNo

  if (committed) {
    return (
      <div className="judges-panel-in rounded-xl border border-reckon-accent/40 bg-secondary p-lg sm:p-xl">
        <div className="flex items-center gap-md">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-reckon-accent/40 bg-reckon-accent/10 text-reckon-accent">
            <CheckCircle size={18} weight="fill" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Position confirmed</p>
            <p className="text-xs text-quaternary">Entry price locked at commit</p>
          </div>
        </div>

        <div className="mt-xl rounded-lg border border-primary bg-tertiary p-lg">
          <p className="text-xs text-quaternary">Market</p>
          <p className="mt-xs text-sm font-medium leading-6 text-primary">{DEMO_MARKET.question}</p>
          <dl className="mt-lg grid grid-cols-2 gap-md">
            <div>
              <dt className="text-xs text-quaternary">Side</dt>
              <dd className="mt-xs text-base font-semibold text-primary">{side}</dd>
            </div>
            <div>
              <dt className="text-xs text-quaternary">Entry price</dt>
              <dd className="mt-xs text-base font-semibold text-primary">{price}</dd>
            </div>
          </dl>
          <p className="mt-md text-xs text-quaternary">Raw price {raw}. Shown to the nearest cent.</p>
        </div>

        <div className="mt-lg flex items-center gap-md rounded-lg border border-primary bg-tertiary p-lg">
          <CircleNotch size={16} weight="bold" className="shrink-0 text-reckon-accent" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-primary">Write queued for Walrus Memory</p>
            <p className="text-xs text-quaternary">The walkthrough stops here; step 3 shows the real blob.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCommitted(false)}
          className="mt-lg inline-flex min-h-8 items-center rounded-md text-xs font-medium text-secondary underline decoration-primary underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Edit this position
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary bg-secondary p-lg sm:p-xl">
      <div className="flex items-center justify-between gap-md">
        <p className="text-xs text-quaternary">Position / new</p>
        <span className="text-xs text-quaternary">Captured</span>
      </div>
      <p className="mt-md text-sm font-medium leading-6 text-primary">{DEMO_MARKET.question}</p>

      <div className="mt-xl grid grid-cols-2 gap-md" role="group" aria-label="Choose a side">
        {(['Yes', 'No'] as const).map((option) => {
          const selected = side === option
          const optionPrice = option === 'Yes' ? DEMO_MARKET.yes : DEMO_MARKET.no
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => setSide(option)}
              className={`rounded-lg border p-lg text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                selected
                  ? 'border-reckon-accent/60 bg-reckon-accent/10'
                  : 'border-primary bg-tertiary hover:border-secondary'
              }`}
            >
              <span className={`block text-xs ${selected ? 'text-reckon-accent' : 'text-quaternary'}`}>
                {option}
              </span>
              <span className="mt-xs block text-xl font-semibold text-primary">{optionPrice}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-lg flex items-center justify-between border-t border-primary pt-lg text-sm">
        <span className="text-secondary">Entry price</span>
        <span className="font-semibold text-primary">{price}</span>
      </div>
      <p className="mt-xs text-xs text-quaternary">
        Raw {raw}. The price is fixed when the position is taken.
      </p>

      <button
        type="button"
        onClick={() => setCommitted(true)}
        className="mt-xl inline-flex min-h-11 w-full items-center justify-center gap-sm rounded-lg bg-brand-solid px-lg py-md text-sm font-semibold text-black transition-colors duration-200 hover:bg-brand-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        Take this position
        <ArrowRight size={15} weight="bold" aria-hidden="true" />
      </button>
      <p className="mt-sm text-center text-xs text-quaternary">
        Simulated in this walkthrough. No live write happens here.
      </p>
    </div>
  )
}

function WalrusVisual({ reduced }: { reduced: boolean }) {
  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between gap-md">
        <p className="text-xs text-quaternary">Write job / Walrus Memory</p>
        <span className="rounded-full border border-primary px-md py-xs text-xs text-secondary">
          ~12 s
        </span>
      </div>

      <div className="rounded-xl border border-primary bg-secondary p-lg sm:p-xl">
        <div className="grid grid-cols-3 gap-sm">
          {[
            { label: 'Accepted', value: '202', done: true },
            { label: 'Committing', value: 'job', done: true },
            { label: 'Committed', value: 'blob', done: true },
          ].map((stage) => (
            <div key={stage.label} className="min-w-0">
              <div className="flex items-center gap-xs">
                {stage.done ? (
                  <CheckCircle size={13} weight="fill" className="text-reckon-accent" aria-hidden="true" />
                ) : (
                  <CircleNotch size={13} weight="bold" className="text-reckon-accent" aria-hidden="true" />
                )}
                <p className="truncate text-xs font-medium text-primary">{stage.label}</p>
              </div>
              <p className="mt-xs pl-4 font-mono text-xs text-quaternary">{stage.value}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-xl h-28" aria-hidden="true">
          <div className="absolute left-5 top-0 h-full w-px bg-divider" />
          <div className="judges-write-line absolute left-5 top-0 h-full w-px bg-reckon-accent" />
          <div
            className={`absolute left-5 -translate-y-1/2 ${
              reduced ? 'judges-track-dot-static' : 'judges-track-dot'
            }`}
          >
            <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-reckon-accent" />
            <span className="ml-md inline-block whitespace-nowrap rounded-md border border-reckon-accent/50 bg-reckon-accent/10 px-md py-xs font-mono text-xs text-reckon-accent">
              position sentence
            </span>
          </div>
          <div className="absolute bottom-0 left-5 flex -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-md border border-primary bg-tertiary p-xs">
            <SealCheck size={14} weight="fill" className="text-reckon-accent" />
          </div>
        </div>

        <div className="mt-xl rounded-lg border border-primary bg-tertiary p-lg">
          <div className="flex items-center justify-between gap-md">
            <p className="text-xs font-medium text-primary">Walrus Memory</p>
            <span className="text-xs text-quaternary">namespace reckon</span>
          </div>
          <p className="mt-sm text-xs leading-5 text-secondary">
            The relayer encrypts the sentence and commits a blob. The app polls the job; the
            record is rebuilt later from recall.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-reckon-accent/40 bg-secondary p-lg sm:p-xl">
        <div className="flex flex-wrap items-center justify-between gap-md">
          <p className="text-xs font-medium text-reckon-accent">Real blob from the record</p>
          <span className="text-xs text-quaternary">658 bytes</span>
        </div>
        <p className="mt-sm break-all font-mono text-xs leading-6 text-primary">{BLOB_ID}</p>
        <div className="mt-md flex flex-wrap items-center gap-md">
          <ExternalLink href={LINKS.blob} className="text-xs">
            Open the committed blob
          </ExternalLink>
          <CopyButton value={BLOB_ID} label="Copy the committed blob id" />
        </div>
        <p className="mt-md text-xs leading-5 text-tertiary">
          This is not the walkthrough write. It is a blob this app committed before the
          outcome, and it is the same one the app recalls in production.
        </p>
      </div>
    </div>
  )
}

function RecordVisual() {
  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between gap-md">
        <p className="text-xs text-quaternary">Record / mark to market</p>
        <span className="rounded-full border border-primary px-md py-xs text-xs text-secondary">
          Walkthrough
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-primary bg-secondary divide-y divide-primary">
        {RECORD_ROWS.map((row) => (
          <div key={row.question} className="p-lg">
            <div className="flex items-start justify-between gap-md">
              <p className="min-w-0 text-sm font-medium leading-5 text-primary">{row.question}</p>
              <span
                className={`inline-flex shrink-0 items-center gap-xs text-sm font-semibold ${
                  row.direction === 'up' ? 'text-reckon-up' : 'text-reckon-down'
                }`}
              >
                {row.direction === 'up' ? (
                  <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={14} weight="bold" aria-hidden="true" />
                )}
                {row.change}
              </span>
            </div>
            <div className="mt-md flex flex-wrap items-center gap-x-lg gap-y-xs text-xs">
              <span className="rounded border border-primary bg-tertiary px-sm py-xxs text-secondary">
                {row.side}
              </span>
              <span className="text-quaternary">
                Entry <span className="font-medium text-secondary">{row.entry}</span>
              </span>
              <span className="text-quaternary">
                Mark <span className="font-medium text-secondary">{row.mark}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-md rounded-lg border border-primary bg-secondary p-lg">
        <SealCheck size={16} weight="fill" className="mt-0.5 shrink-0 text-reckon-accent" aria-hidden="true" />
        <p className="text-xs leading-5 text-secondary">
          Every row was open at capture. The percentages are price movement since entry. None
          of them is a resolved win or loss, and none is a win rate.
        </p>
      </div>
    </div>
  )
}

function AgentVisual({ reduced }: { reduced: boolean }) {
  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between gap-md">
        <p className="text-xs text-quaternary">Agent / paid request</p>
        <span className="rounded-full border border-primary px-md py-xs text-xs text-secondary">
          Live 402 body
        </span>
      </div>

      <CodeCard label="Request" meta="GET">
        <span className="text-secondary">GET</span> /api/oracle/verdict
        {'\n'}
        <span className="text-quaternary">Host:</span> reckon-three-beta.vercel.app
      </CodeCard>

      <CodeCard label="402 response" meta="HTTP 402">
        {X402_BODY}
      </CodeCard>

      <div
        className={`flex items-center gap-md rounded-lg border border-reckon-accent/40 bg-tertiary px-lg py-md ${
          reduced ? '' : 'judges-pay-step'
        }`}
      >
        <LockKey size={16} weight="bold" className="shrink-0 text-reckon-accent" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">Payment sent, then retry</p>
          <p className="mt-xs break-all font-mono text-xs text-secondary">
            x-sui-digest: {'<transaction digest>'}
          </p>
        </div>
      </div>

      <CodeCard label="200 response shape" meta="verdict">
        {`{
  "verdict": {
    "status": "OPEN",
    "confidence": 0.88,
    "analysis": "High probability convergence on implied consensus based on latest Polymarket liquidity and orderbook volume.",
    "evaluatedAt": "<server time>"
  }
}`}
      </CodeCard>

      <p className="text-xs leading-5 text-tertiary">
        The 402 body above was captured from the endpoint. The verdict block shows the route's
        response fields; the timestamp is generated per call.
      </p>
    </div>
  )
}

function CodeCard({
  label,
  meta,
  children,
}: {
  label: string
  meta: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-primary bg-secondary">
      <div className="flex items-center justify-between gap-md border-b border-primary px-lg py-sm">
        <p className="text-xs font-medium text-secondary">{label}</p>
        <p className="font-mono text-xs text-quaternary">{meta}</p>
      </div>
      <pre className="judges-code whitespace-pre-wrap px-lg py-md font-mono text-xs leading-5 text-secondary">
        {children}
      </pre>
    </div>
  )
}
