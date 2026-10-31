import {
  ArrowDownRight,
  ArrowUpRight,
  CaretRight,
  CheckCircle,
  CircleNotch,
  Robot,
} from '@phosphor-icons/react'
import { LogoMark } from '../components/Logo'
import { BrandImage } from './Brand'
import {
  AI_AUTHOR,
  AI_COMMIT_COUNT,
  BLOB_ID,
  DEMO_MARKET,
  MEMORY_NAMESPACE,
  RECORD_ROWS,
  TATUM_ID,
  X402_CHALLENGE,
} from './data'
import { easeInOut, easeOut, lerp, span } from './film'

export function ChapterScene({ index, progress }: { index: number; progress: number }) {
  if (index === 0) return <MarketsScene progress={progress} />
  if (index === 1) return <PositionScene progress={progress} />
  if (index === 2) return <WalrusScene progress={progress} />
  if (index === 3) return <RecordScene progress={progress} />
  if (index === 4) return <AgentScene progress={progress} />
  return <BuilderScene progress={progress} />
}

function enter(value: number, distance = 10) {
  return {
    opacity: value,
    transform: `translateY(${(1 - value) * distance}px)`,
  }
}

function Pointer({
  from,
  to,
  travel,
  tap,
}: {
  from: [number, number]
  to: [number, number]
  travel: number
  tap: number
}) {
  const t = easeOut(travel)
  const x = lerp(from[0], to[0], t)
  const y = lerp(from[1], to[1], t)
  const ring = tap > 0 && tap < 1 ? tap : 0
  const show = travel > 0.001

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30"
      style={{
        opacity: show ? Math.min(1, travel * 6) : 0,
        transform: `translate(${x}%, ${y}%)`,
      }}
    >
      <span
        className="absolute h-8 w-8 rounded-full border-2 border-reckon-accent"
        style={{
          left: 0,
          top: 0,
          opacity: ring ? 1 - ring : 0,
          transform: `translate(-50%, -50%) scale(${0.35 + ring * 1.5})`,
        }}
      />
      <svg
        width="20"
        height="24"
        viewBox="0 0 20 24"
        fill="none"
        aria-hidden="true"
        className="absolute left-0 top-0"
        style={{ transform: 'translate(-2px, -2px)' }}
      >
        <path
          d="M2 2 L2 19.5 L7.4 14.6 L10.7 21.9 L13.9 20.5 L10.7 13.4 L17.5 13.2 Z"
          fill="#FF7A1A"
          stroke="#000000"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function SceneHeader({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-md">
      <p className="text-xs text-quaternary">{label}</p>
      <span className="shrink-0 rounded-full border border-primary bg-primary px-md py-xs text-xs text-secondary">
        {meta}
      </span>
    </div>
  )
}

function MarketsScene({ progress }: { progress: number }) {
  const questionIn = easeOut(span(progress, 0.02, 0.24))
  const typedCount = Math.round(
    DEMO_MARKET.question.length * span(progress, 0.06, 0.46)
  )
  const typed = DEMO_MARKET.question.slice(0, typedCount)
  const typing = progress < 0.46
  const pricesIn = easeOut(span(progress, 0.28, 0.42))
  const count = easeOut(span(progress, 0.34, 0.7))
  const volumeIn = easeOut(span(progress, 0.68, 0.82))
  const pointerTravel = span(progress, 0.32, 0.64)
  const tap = span(progress, 0.66, 0.84)
  const yes = Number.parseInt(DEMO_MARKET.yes, 10)
  const no = Number.parseInt(DEMO_MARKET.no, 10)

  return (
    <div className="flex h-full flex-col justify-center gap-lg p-lg sm:p-2xl">
      <SceneHeader label="Markets / sorted by 24h volume" meta="Polymarket" />

      <div
        className="rounded-xl border border-primary bg-secondary"
        style={enter(easeOut(span(progress, 0, 0.18)))}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-md gap-y-xs border-b border-primary px-lg py-md">
          <span className="text-xs font-medium text-secondary">Will Olivia Rodrigo appear?</span>
          <span className="text-xs text-quaternary">Closes {DEMO_MARKET.close}</span>
        </div>

        <div className="p-lg">
          <div className="relative">
            <p className="text-base font-semibold leading-6 text-primary sm:text-lg">
              <span className="invisible">{DEMO_MARKET.question}</span>
              <span className="absolute inset-0" style={{ opacity: questionIn }}>
                {typed}
                {typing ? (
                  <span className="ml-0.5 inline-block h-4 w-0.5 bg-reckon-accent align-middle" />
                ) : null}
              </span>
            </p>
          </div>

          <div className="relative mt-lg grid grid-cols-2 gap-md">
            <PriceTile
              label="Yes"
              value={`${Math.round(yes * count)}c`}
              active={tap > 0.05}
              style={{ opacity: pricesIn, transform: `translateY(${(1 - pricesIn) * 8}px)` }}
            />
            <PriceTile
              label="No"
              value={`${Math.round(no * count)}c`}
              style={{ opacity: pricesIn, transform: `translateY(${(1 - pricesIn) * 8}px)` }}
            />
            <Pointer
              from={[86, 116]}
              to={[25, 50]}
              travel={pointerTravel}
              tap={tap}
            />
          </div>

          <div className="mt-lg flex flex-wrap items-center justify-between gap-md border-t border-primary pt-md">
            <p className="text-xs text-quaternary" style={{ opacity: volumeIn }}>
              24h vol <span className="font-medium text-secondary">{DEMO_MARKET.volume}</span>
            </p>
            <p className="text-xs text-quaternary" style={{ opacity: pricesIn }}>
              Yes {DEMO_MARKET.yes} / No {DEMO_MARKET.no}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs leading-5 text-tertiary">
        Public Gamma API, no key. The app reads the market and never places an order on Polygon.
      </p>
    </div>
  )
}

function PriceTile({
  label,
  value,
  active = false,
  style,
}: {
  label: string
  value: string
  active?: boolean
  style?: { opacity: number; transform: string }
}) {
  return (
    <div
      className={`rounded-lg border p-lg ${
        active ? 'border-reckon-accent bg-reckon-accent/10' : 'border-primary bg-tertiary'
      }`}
      style={style}
    >
      <p className={`text-xs ${active ? 'text-reckon-accent' : 'text-quaternary'}`}>{label}</p>
      <p className="mt-xs text-heading-xs font-semibold text-primary">{value}</p>
    </div>
  )
}

function PositionScene({ progress }: { progress: number }) {
  const row = RECORD_ROWS[0]
  const cardIn = easeOut(span(progress, 0, 0.16))
  const pointerTravel = span(progress, 0.08, 0.4)
  const tap = span(progress, 0.42, 0.6)
  const selected = progress >= 0.42
  const selectedIn = easeOut(span(progress, 0.42, 0.52))
  const confirmation = easeOut(span(progress, 0.56, 0.7))
  const press = tap > 0 && tap < 1 ? 1 - tap : 0

  return (
    <div className="flex h-full flex-col justify-center gap-lg p-lg sm:p-2xl">
      <SceneHeader label="Position / new" meta="Captured" />

      <div
        className="rounded-xl border border-primary bg-secondary p-lg"
        style={enter(cardIn)}
      >
        <div className="flex items-center justify-between gap-md text-xs">
          <span className="text-quaternary">Market</span>
          <span className="text-quaternary">Price at commit</span>
        </div>
        <p className="mt-sm text-sm font-medium leading-5 text-primary">{row.question}</p>

        <div className="relative mt-lg grid grid-cols-2 gap-md">
          <div
            className={`rounded-lg border p-lg ${
              selected ? 'border-reckon-accent bg-reckon-accent/10' : 'border-primary bg-tertiary'
            }`}
            style={{ transform: `scale(${1 + press * 0.025})` }}
          >
            <div className="flex items-center justify-between gap-xs">
              <span className={`text-xs ${selected ? 'text-reckon-accent' : 'text-quaternary'}`}>
                {row.side}
              </span>
              <span
                className="text-xs font-medium text-reckon-accent"
                style={{ opacity: selectedIn }}
              >
                Selected
              </span>
            </div>
            <p className="mt-xs text-heading-xs font-semibold text-primary">{row.entry}</p>
          </div>

          <div className="rounded-lg border border-primary bg-tertiary p-lg">
            <span className="text-xs text-quaternary">FURIA</span>
            <p className="mt-xs text-sm font-medium text-quaternary">Not in this capture</p>
          </div>

          <Pointer from={[86, 118]} to={[25, 50]} travel={pointerTravel} tap={tap} />
        </div>

        <div className="mt-lg flex items-center justify-between border-t border-primary pt-md text-sm">
          <span className="text-secondary">Entry price</span>
          <span className="font-semibold text-primary">{row.entry}</span>
        </div>
        <p className="mt-xs text-xs text-quaternary">
          The price is fixed when the position is taken.
        </p>
      </div>

      <div
        className="flex items-center gap-md rounded-lg border border-reckon-accent/40 bg-secondary px-lg py-md"
        style={enter(confirmation, 6)}
      >
        <CheckCircle size={18} weight="fill" className="shrink-0 text-reckon-accent" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">
            Position captured at {row.entry}
          </p>
          <p className="mt-xs text-xs text-quaternary">
            {row.side} is locked with this entry price at commit time.
          </p>
        </div>
      </div>

      <p className="text-xs leading-5 text-tertiary">
        Simulated in this demo. No write is sent from the film.
      </p>
    </div>
  )
}

function WalrusScene({ progress }: { progress: number }) {
  const appIn = easeOut(span(progress, 0, 0.12))
  const storeIn = easeOut(span(progress, 0.02, 0.14))
  const travel = easeInOut(span(progress, 0.16, 0.56))
  const spinner = progress < 0.72
  const committed = easeOut(span(progress, 0.72, 0.86))
  const blobIn = easeOut(span(progress, 0.76, 0.9))
  const tick = easeOut(span(progress, 0.74, 0.86))

  return (
    <div className="flex h-full flex-col justify-center gap-lg p-lg sm:p-2xl">
      <SceneHeader label="Write job / Walrus Memory" meta="about 12 seconds" />

      <div className="grid min-w-0 grid-cols-[1fr_2.5rem_1fr] items-stretch gap-xs sm:gap-md">
        <div
          className="flex min-w-0 flex-col rounded-xl border border-primary bg-secondary p-lg"
          style={enter(appIn)}
        >
          <div className="flex items-center gap-xs">
            <LogoMark size={18} />
            <span className="text-xs font-medium text-primary">App</span>
          </div>
          <p className="mt-md text-xs leading-5 text-secondary">
            Opened {RECORD_ROWS[0].side} on{' '}
            <span className="font-medium text-primary">{RECORD_ROWS[0].question}</span> at{' '}
            <span className="font-medium text-primary">{RECORD_ROWS[0].entry}</span>.
          </p>
          <p className="mt-auto pt-md text-xs text-quaternary">position sentence</p>
        </div>

        <div className="relative flex min-h-24 items-center" aria-hidden="true">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-primary" />
          <div
            className="absolute inset-0 z-10"
            style={{ transform: `translateX(${travel * 100}%)`, opacity: travel > 0.02 ? 1 : 0 }}
          >
            <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-reckon-accent" />
          </div>
          <CaretRight
            size={12}
            weight="bold"
            aria-hidden="true"
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 text-reckon-accent"
            style={{ opacity: easeOut(span(progress, 0.56, 0.68)) }}
          />
        </div>

        <div
          className="flex min-w-0 flex-col rounded-xl border border-reckon-accent/40 bg-secondary p-lg"
          style={enter(storeIn)}
        >
          <div className="flex min-w-0 items-center gap-xs">
            <BrandImage brand="memwal" height={16} alt="MemWal" />
            <span className="text-xs font-medium leading-4 text-primary">Walrus Memory</span>
          </div>
          <p className="mt-xs truncate font-mono text-xs text-quaternary">namespace {MEMORY_NAMESPACE}</p>

          <div className="mt-md flex items-center gap-xs">
            {spinner ? (
              <>
                <CircleNotch
                  size={14}
                  weight="bold"
                  aria-hidden="true"
                  className="shrink-0 text-reckon-accent"
                  style={{ transform: `rotate(${progress * 1440}deg)` }}
                />
                <span className="text-xs text-secondary">Committing</span>
              </>
            ) : (
              <>
                <span
                  className="flex shrink-0 items-center justify-center text-reckon-accent"
                  style={{ opacity: tick, transform: `scale(${0.6 + tick * 0.4})` }}
                >
                  <CheckCircle size={14} weight="fill" aria-hidden="true" />
                </span>
                <span className="text-xs font-medium text-primary">Committed</span>
              </>
            )}
          </div>

          <p
            className="mt-md break-all font-mono text-xs leading-5 text-primary"
            style={{ opacity: blobIn }}
          >
            {BLOB_ID}
          </p>
          <p className="mt-auto pt-md text-xs text-quaternary" style={{ opacity: committed }}>
            recall is the source of truth
          </p>
        </div>
      </div>

      <p className="text-xs leading-5 text-tertiary">
        The relayer encrypts the sentence and commits a blob to Walrus. The record is rebuilt
        from recall on every read.
      </p>
    </div>
  )
}

function RecordScene({ progress }: { progress: number }) {
  const footer = easeOut(span(progress, 0.76, 0.88))

  return (
    <div className="flex h-full flex-col justify-center gap-md p-lg sm:p-2xl">
      <SceneHeader label="Record / mark to market" meta="3 positions" />

      <div className="overflow-hidden rounded-xl border border-primary bg-secondary divide-y divide-primary">
        {RECORD_ROWS.map((row, index) => {
          const appearStart = 0.04 + index * 0.14
          const countStart = 0.1 + index * 0.14
          const appear = easeOut(span(progress, appearStart, appearStart + 0.12))
          const count = easeOut(span(progress, countStart, countStart + 0.28))
          const up = row.direction === 'up'
          const absolute = Math.abs(Number.parseFloat(row.change.replace('%', '').replace('+', '')))
          const value =
            count > 0.999
              ? row.change
              : `${up ? '+' : '-'}${(absolute * count).toFixed(1)}%`
          const mark = Number.parseFloat(row.mark)
          const markDecimals = row.mark.includes('.')
            ? row.mark.split('.')[1].replace('c', '').length
            : 0
          const markValue =
            count > 0.999 ? row.mark : `${(mark * count).toFixed(markDecimals)}c`

          return (
            <div
              key={row.question}
              className="p-lg"
              style={{ opacity: appear, transform: `translateY(${(1 - appear) * 12}px)` }}
            >
              <div className="flex items-start justify-between gap-md">
                <p className="min-w-0 text-sm font-medium leading-5 text-primary">{row.question}</p>
                <span
                  className={`inline-flex shrink-0 items-center gap-xs text-sm font-semibold ${
                    up ? 'text-reckon-up' : 'text-reckon-down'
                  }`}
                >
                  {up ? (
                    <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={14} weight="bold" aria-hidden="true" />
                  )}
                  {value}
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
                  Mark{' '}
                  <span className="font-medium text-secondary">{markValue}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs leading-5 text-tertiary" style={{ opacity: footer }}>
        These markets have not resolved. This is movement, not win rate.
      </p>
    </div>
  )
}

type Leg = {
  id: string
  from: number
  to: number
  label: string
  start: number
  end: number
  brand?: 'tatum'
}

const AGENT_LEGS: Leg[] = [
  { id: 'request', from: 0, to: 1, label: 'request', start: 0.02, end: 0.16 },
  { id: 'challenge', from: 1, to: 0, label: '402', start: 0.2, end: 0.34 },
  { id: 'transfer', from: 0, to: 2, label: '0.01 USDC', start: 0.38, end: 0.55 },
  { id: 'digest', from: 0, to: 1, label: 'digest', start: 0.59, end: 0.73, brand: 'tatum' },
  { id: 'verdict', from: 1, to: 0, label: 'verdict', start: 0.78, end: 0.92 },
]

const COLUMN_CENTERS = [16.7, 50, 83.3]

function AgentScene({ progress }: { progress: number }) {
  const drop = easeOut(span(progress, 0.38, 0.56))
  const paid = progress > 0.5
  const phase =
    progress < 0.18
      ? 0
      : progress < 0.36
        ? 1
        : progress < 0.57
          ? 2
          : progress < 0.76
            ? 3
            : 4
  const phaseStart = [0, 0.18, 0.36, 0.57, 0.76][phase]
  const panelIn = easeOut(span(progress, phaseStart, phaseStart + 0.07))

  return (
    <div className="flex h-full flex-col justify-center gap-md p-lg sm:p-2xl">
      <SceneHeader label="Agent payments / x402" meta="Sui testnet" />

      <div className="grid min-w-0 grid-cols-3 gap-sm">
        <div className="min-w-0 rounded-lg border border-primary bg-secondary p-md">
          <div className="flex items-center gap-sm">
            <Robot size={18} weight="bold" className="shrink-0 text-reckon-accent" aria-hidden="true" />
            <span className="truncate text-xs font-semibold text-primary">Agent</span>
          </div>
          <span className="mt-xs inline-flex items-center rounded-full border border-reckon-accent/40 px-xs py-xxs text-xs text-reckon-accent">
            no account
          </span>
          <div className="mt-sm">
            <div className="h-1 w-full overflow-hidden rounded-full bg-divider">
              <div
                className="h-full w-full origin-left bg-reckon-accent"
                style={{ transform: `scaleX(${1 - drop * 0.45})` }}
              />
            </div>
            <p className="mt-xs truncate font-mono text-xs text-quaternary">
              {paid ? '-0.01 USDC' : 'wallet'}
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-primary bg-secondary p-md">
          <div className="flex items-center gap-sm">
            <LogoMark size={18} />
            <span className="truncate text-xs font-semibold text-primary">Reckon</span>
          </div>
          <p className="mt-sm break-all font-mono text-xs leading-4 text-quaternary">
            /api/oracle/verdict
          </p>
          <p className="mt-xs text-xs text-quaternary">x402 endpoint</p>
        </div>

        <div className="min-w-0 rounded-lg border border-primary bg-secondary p-md">
          <div className="flex items-center gap-sm">
            <BrandImage brand="sui" height={18} />
            <span className="truncate text-xs font-semibold text-primary">Sui</span>
          </div>
          <p className="mt-sm font-mono text-xs text-quaternary">testnet</p>
          <p className="mt-xs text-xs text-quaternary">0.01 USDC</p>
        </div>
      </div>

      <div className="relative min-h-40">
        <div className="absolute inset-0" aria-hidden="true">
          {COLUMN_CENTERS.map((center) => (
            <span
              key={center}
              className="absolute inset-y-0 border-l border-dashed border-primary"
              style={{ left: `${center}%`, opacity: 0.35 }}
            />
          ))}
        </div>

        {AGENT_LEGS.map((leg) => {
          const t = span(progress, leg.start, leg.end)
          const drawn = progress >= leg.start
          const done = progress >= leg.end
          const open = t > 0 && t < 1
          const fromCenter = COLUMN_CENTERS[leg.from]
          const toCenter = COLUMN_CENTERS[leg.to]
          const reverse = toCenter < fromCenter
          const left = Math.min(fromCenter, toCenter)
          const width = Math.abs(toCenter - fromCenter)
          const mid = (fromCenter + toCenter) / 2
          const opacity = done ? 0.62 : open ? 1 : 0.16

          return (
            <div key={leg.id} className="relative h-8 sm:h-9" style={{ opacity }}>
              <span
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary bg-primary px-sm py-xxs text-xs text-secondary"
                style={{ left: `${mid}%` }}
              >
                <span className="inline-flex items-center gap-xs">
                  {leg.label}
                  {leg.brand ? <BrandImage brand="tatum" height={16} alt="Tatum" /> : null}
                </span>
              </span>

              <span
                className="absolute top-1/2 border-t border-dashed border-reckon-accent/70"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  transform: `scaleX(${drawn ? easeInOut(t) : 0})`,
                  transformOrigin: reverse ? 'right' : 'left',
                }}
              />
              <span
                className="absolute top-1/2 text-reckon-accent"
                style={{
                  left: `${toCenter}%`,
                  opacity: drawn ? 1 : 0,
                  transform: `translate(-50%, -50%) rotate(${reverse ? 180 : 0}deg)`,
                }}
              >
                <CaretRight size={10} weight="bold" aria-hidden="true" />
              </span>
              {open ? (
                <span
                  className="absolute inset-0"
                  style={{
                    transform: `translateX(${lerp(fromCenter, toCenter, easeInOut(t))}%)`,
                  }}
                >
                  <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-reckon-accent" />
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <div
        className="min-h-24 rounded-lg border border-primary bg-secondary p-md"
        style={{ opacity: panelIn, transform: `translateY(${(1 - panelIn) * 6}px)` }}
      >
        {phase === 0 ? (
          <div>
            <p className="text-xs font-medium text-primary">Request</p>
            <p className="mt-xs break-all font-mono text-xs text-secondary">
              GET /api/oracle/verdict
            </p>
          </div>
        ) : null}

        {phase === 1 ? (
          <div>
            <div className="flex items-center justify-between gap-md">
              <p className="text-xs font-medium text-primary">402 challenge</p>
              <span className="font-mono text-xs text-reckon-accent">HTTP 402</span>
            </div>
            <dl className="mt-xs grid grid-cols-2 gap-x-md gap-y-xxs text-xs">
              <Field label="scheme" value={X402_CHALLENGE.scheme} />
              <Field label="network" value={X402_CHALLENGE.network} />
              <Field label="amount" value={`${X402_CHALLENGE.amount} USDC`} />
              <Field label="currency" value={X402_CHALLENGE.currency.split('::').pop() ?? 'USDC'} />
              <div className="col-span-2">
                <dt className="text-quaternary">recipient</dt>
                <dd className="break-all font-mono text-primary" title={X402_CHALLENGE.recipient}>
                  <span className="sm:hidden">
                    {X402_CHALLENGE.recipient.slice(0, 10)}...{X402_CHALLENGE.recipient.slice(-6)}
                  </span>
                  <span className="hidden sm:inline">{X402_CHALLENGE.recipient}</span>
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {phase === 2 ? (
          <div>
            <p className="text-xs font-medium text-primary">Payment sent</p>
            <p className="mt-xs text-xs text-secondary">
              0.01 USDC leaves the agent wallet on Sui testnet. The balance drops and the agent
              keeps no account.
            </p>
          </div>
        ) : null}

        {phase === 3 ? (
          <div>
            <div className="flex items-center justify-between gap-md">
              <p className="text-xs font-medium text-primary">Digest returned</p>
              <BrandImage brand="tatum" height={14} alt="Tatum" />
            </div>
            <p className="mt-xs break-all font-mono text-xs text-secondary">
              x-sui-digest: {'<transaction digest>'}
            </p>
            <p className="mt-xs text-xs text-quaternary">
              Reckon verifies the digest through Sui GraphQL.
            </p>
          </div>
        ) : null}

        {phase === 4 ? (
          <div className="flex items-start gap-md">
            <CheckCircle
              size={16}
              weight="fill"
              className="mt-0.5 shrink-0 text-reckon-accent"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-medium text-primary">200 verdict returned</p>
              <p className="mt-xs text-xs text-secondary">One digest buys one call.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-quaternary">{label}</dt>
      <dd className="break-all font-mono text-primary">{value}</dd>
    </div>
  )
}

function BuilderScene({ progress }: { progress: number }) {
  const headerIn = easeOut(span(progress, 0, 0.1))
  const generated = span(progress, 0.1, 0.32)
  const extended = span(progress, 0.54, 0.74)
  const panelOne = easeOut(span(progress, 0.32, 0.42))
  const panelTwo = easeOut(span(progress, 0.7, 0.8))
  const factOne = [0.34, 0.41, 0.48]
  const factTwo = [0.72, 0.79, 0.86]

  return (
    <div className="flex h-full flex-col justify-center gap-md p-lg sm:p-2xl">
      <SceneHeader label="How it was built / Tatum AI Builder" meta="one prompt" />

      <div className="grid grid-cols-2 gap-md" style={{ opacity: headerIn }}>
        <div className="flex min-w-0 items-center gap-md rounded-xl border border-primary bg-secondary p-md">
          <BrandImage brand="tatum" height={28} />
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-4 text-primary">Tatum AI Builder</p>
            <p className="mt-xs text-xs text-quaternary">build environment</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-md rounded-xl border border-reckon-accent/40 bg-secondary p-md">
          <LogoMark size={24} />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-primary">Reckon</p>
            <p className="mt-xs text-xs text-quaternary">the app</p>
          </div>
        </div>
      </div>

      <div className="relative h-16">
        <FlowLane
          progress={generated}
          reverse={false}
          label="generated"
          top={0}
          drawn={progress >= 0.1}
        />
        <FlowLane
          progress={extended}
          reverse
          label="extended by hand"
          top={32}
          drawn={progress >= 0.54}
        />
      </div>

      <div className="grid grid-cols-2 gap-sm">
        <FactPanel
          title="Generated shell"
          tone="accent"
          opacity={panelOne}
          facts={[
            { label: 'Tatum account', value: TATUM_ID, at: factOne[0] },
            { label: 'Commits by AI Builder', value: String(AI_COMMIT_COUNT), at: factOne[1] },
            { label: 'Authored as', value: AI_AUTHOR, at: factOne[2] },
          ]}
          progress={progress}
        />
        <FactPanel
          title="Built by hand"
          tone="neutral"
          opacity={panelTwo}
          facts={[
            { label: 'Walrus Memory client', value: 'hand written', at: factTwo[0] },
            { label: 'x402 payment route', value: 'hand written', at: factTwo[1] },
            { label: 'Deployment config', value: 'hand written', at: factTwo[2] },
          ]}
          progress={progress}
        />
      </div>

      <p className="text-xs leading-5 text-tertiary">
        The shell was generated. The Walrus Memory client, the x402 route and the deployment
        config were written by hand.
      </p>
    </div>
  )
}

function FlowLane({
  progress,
  reverse,
  label,
  top,
  drawn,
}: {
  progress: number
  reverse: boolean
  label: string
  top: number
  drawn: boolean
}) {
  const from = reverse ? 75 : 25
  const to = reverse ? 25 : 75
  const t = easeInOut(progress)

  return (
    <div className="absolute inset-x-0 h-8" style={{ top }}>
      <span
        className="absolute top-0 whitespace-nowrap rounded-full border border-primary bg-primary px-sm py-xxs text-xs text-secondary"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        {label}
      </span>
      <span
        className="absolute top-1/2 border-t border-dashed border-reckon-accent/70"
        style={{
          left: `${Math.min(from, to)}%`,
          width: `${Math.abs(to - from)}%`,
          transform: `scaleX(${drawn ? t : 0})`,
          transformOrigin: reverse ? 'right' : 'left',
        }}
      />
      <span
        className="absolute top-1/2 text-reckon-accent"
        style={{
          left: `${to}%`,
          opacity: drawn ? 1 : 0,
          transform: `translate(-50%, -50%) rotate(${reverse ? 180 : 0}deg)`,
        }}
      >
        <CaretRight size={10} weight="bold" aria-hidden="true" />
      </span>
      {drawn && progress > 0 && progress < 1 ? (
        <span
          className="absolute inset-0"
          style={{ transform: `translateX(${lerp(from, to, t)}%)` }}
        >
          <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-reckon-accent" />
        </span>
      ) : null}
    </div>
  )
}

function FactPanel({
  title,
  tone,
  opacity,
  facts,
  progress,
}: {
  title: string
  tone: 'accent' | 'neutral'
  opacity: number
  facts: { label: string; value: string; at: number }[]
  progress: number
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border bg-secondary p-md ${
        tone === 'accent' ? 'border-reckon-accent/40' : 'border-primary'
      }`}
      style={{ opacity, transform: `translateY(${(1 - opacity) * 8}px)` }}
    >
      <p className="text-xs font-semibold text-primary">{title}</p>
      <dl className="mt-sm space-y-xs">
        {facts.map((fact) => {
          const at = easeOut(span(progress, fact.at, fact.at + 0.08))
          return (
            <div
              key={fact.label}
              style={{ opacity: at, transform: `translateY(${(1 - at) * 4}px)` }}
            >
              <dt className="text-xs text-quaternary">{fact.label}</dt>
              <dd className="break-all font-mono text-xs leading-4 text-primary">{fact.value}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
