import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CaretRight,
  CheckCircle,
  CircleNotch,
  MagnifyingGlass,
  Robot,
  Sparkle,
} from '@phosphor-icons/react'
import { LogoMark } from '../components/Logo'
import { BrandImage } from './Brand'
import {
  AI_AUTHOR,
  AI_COMMIT_COUNT,
  BLOB_ID,
  DEMO_MARKET,
  MEMORY_ACCOUNT,
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

function FocusHighlight({
  active,
  shape = 'square',
  label,
  className = '',
  style,
}: {
  active: boolean
  shape?: 'square' | 'circle'
  label?: string
  className?: string
  style?: React.CSSProperties
}) {
  if (!active) return null
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 border-2 border-reckon-accent ring-4 ring-reckon-accent/20 transition-all duration-300 ${
        shape === 'circle' ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
      style={style}
    >
      {label ? (
        <span className="absolute -top-3 right-2 rounded bg-reckon-accent px-xs py-xxs font-mono text-[9px] font-semibold uppercase tracking-wider text-black">
          {label}
        </span>
      ) : null}
    </div>
  )
}

function PhoneShell({
  children,
  activeTab = 'markets',
  scale = 1,
  origin = 'center',
}: {
  children: React.ReactNode
  activeTab?: 'markets' | 'record'
  scale?: number
  origin?: string
}) {
  return (
    <div
      className="relative mx-auto flex h-full w-full max-w-[370px] flex-col overflow-hidden rounded-[26px] border border-primary bg-primary shadow-2xl transition-transform duration-500 ease-out"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: origin,
      }}
    >
      {/* Top Phone Status Bar */}
      <div className="flex h-7 shrink-0 items-center justify-between border-b border-primary/40 bg-secondary/80 px-md text-[10px] text-quaternary backdrop-blur-sm">
        <span className="font-mono text-secondary">9:41</span>
        <div className="h-2.5 w-16 rounded-full bg-tertiary" />
        <div className="flex items-center gap-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-reckon-accent" />
          <span className="font-mono text-[9px]">5G</span>
        </div>
      </div>

      {/* Actual App Header from App.tsx */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-primary bg-primary px-md">
        <div className="flex items-center gap-xs">
          <LogoMark size={18} />
          <span className="text-xs font-semibold text-primary">Reckon</span>
        </div>
        <div className="flex items-center gap-xs rounded-lg border border-primary bg-tertiary p-xxs text-[10px]">
          <span
            className={`rounded-md px-sm py-xxs font-medium ${
              activeTab === 'markets'
                ? 'border border-primary bg-primary text-primary'
                : 'text-secondary'
            }`}
          >
            Markets
          </span>
          <span
            className={`flex items-center gap-xs rounded-md px-sm py-xxs font-medium ${
              activeTab === 'record'
                ? 'border border-primary bg-primary text-primary'
                : 'text-secondary'
            }`}
          >
            Record
            <span className="rounded-full bg-reckon-accent/20 px-xs py-none text-[9px] text-reckon-accent">
              3
            </span>
          </span>
        </div>
      </div>

      {/* Screen Body */}
      <div className="relative flex-1 overflow-hidden p-md">
        {children}
      </div>
    </div>
  )
}

function Pointer({
  from,
  to,
  travel,
  tap,
  visible = 1,
}: {
  from: [number, number]
  to: [number, number]
  travel: number
  tap: number
  visible?: number
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
        opacity: show ? Math.min(1, travel * 6) * visible : 0,
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
  const questionIn = easeOut(span(progress, 0.02, 0.2))
  const typedCount = Math.round(
    DEMO_MARKET.question.length * span(progress, 0.04, 0.3)
  )
  const typed = DEMO_MARKET.question.slice(0, typedCount)
  const typing = progress < 0.3
  const pricesIn = easeOut(span(progress, 0.16, 0.3))
  const count = easeOut(span(progress, 0.22, 0.58))
  const volumeIn = easeOut(span(progress, 0.58, 0.72))
  const volumeCount = Math.round(6384 * easeOut(span(progress, 0.12, 0.88)))
  const volume = String(volumeCount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const firstTravel = span(progress, 0.2, 0.4)
  const firstTap = span(progress, 0.4, 0.48)
  const secondTravel = span(progress, 0.54, 0.7)
  const secondTap = span(progress, 0.7, 0.78)
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(progress * Math.PI * 8))
  const feedOne = easeOut(span(progress, 0.42, 0.5))
  const feedTwo = easeOut(span(progress, 0.6, 0.68))
  const feedThree = easeOut(span(progress, 0.8, 0.88))
  const yes = Number.parseInt(DEMO_MARKET.yes, 10)
  const no = Number.parseInt(DEMO_MARKET.no, 10)

  // Zoom smoothly into the active market card during the second beat
  const zoom = 1 + easeOut(span(progress, 0.45, 0.85)) * 0.06

  return (
    <div className="flex h-full flex-col justify-center gap-md p-sm sm:p-lg">
      <SceneHeader label="Live Mobile Feed / Polymarket" meta="Public API" />

      <PhoneShell activeTab="markets" scale={zoom} origin="center 60%">
        {/* Mobile Search & Filter Tabs from App.tsx */}
        <div className="space-y-xs pb-sm">
          <div className="flex items-center gap-xs rounded-md border border-primary bg-secondary px-sm py-xxs text-[10px] text-quaternary">
            <MagnifyingGlass size={12} className="text-quaternary" />
            <span>Filter markets by question...</span>
          </div>
          <div className="flex items-center gap-md border-b border-secondary pt-xxs text-[11px]">
            <span className="border-b border-reckon-accent pb-xxs font-semibold text-primary">
              All markets
            </span>
            <span className="pb-xxs text-quaternary">Sports markets</span>
          </div>
        </div>

        {/* Live Market Card from App.tsx */}
        <div
          className="relative rounded-xl border border-primary bg-secondary p-sm shadow-xs"
          style={enter(easeOut(span(progress, 0, 0.14)))}
        >
          {/* Highlight square focusing attention on the live price tiles */}
          <FocusHighlight
            active={progress >= 0.38 && progress <= 0.82}
            shape="square"
            label="Live Odds"
            className="inset-x-1 bottom-1 top-12"
          />

          <div className="flex items-center justify-between gap-xs text-[10px] text-quaternary">
            <span className="truncate">24h vol: ${volume}</span>
            <span>Closes {DEMO_MARKET.close}</span>
          </div>

          <p className="mt-xs text-xs font-semibold leading-4 text-primary">
            <span className="invisible">{DEMO_MARKET.question}</span>
            <span className="absolute inset-x-sm top-7" style={{ opacity: questionIn }}>
              {typed}
              {typing ? (
                <span className="ml-0.5 inline-block h-3 w-0.5 bg-reckon-accent align-middle" />
              ) : null}
            </span>
          </p>

          <div className="relative mt-md grid grid-cols-2 gap-xs">
            <PriceTile
              label="Yes"
              value={`${Math.round(yes * count)}c`}
              active={firstTap > 0.05}
              style={{ opacity: pricesIn, transform: `translateY(${(1 - pricesIn) * 8}px)` }}
            />
            <PriceTile
              label="No"
              value={`${Math.round(no * count)}c`}
              active={secondTap > 0.05}
              style={{ opacity: pricesIn, transform: `translateY(${(1 - pricesIn) * 8}px)` }}
            />
            <Pointer
              from={[82, 110]}
              to={[25, 48]}
              travel={firstTravel}
              tap={firstTap}
              visible={1 - span(progress, 0.51, 0.54)}
            />
            <Pointer
              from={[25, 48]}
              to={[72, 48]}
              travel={secondTravel}
              tap={secondTap}
              visible={span(progress, 0.51, 0.54)}
            />
          </div>
        </div>

        {/* Status feed pills */}
        <div className="mt-sm flex flex-wrap items-center gap-xs text-[10px]">
          <span className="inline-flex items-center gap-xs text-quaternary">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-reckon-accent"
              style={{ opacity: pulse }}
            />
            Live feed
          </span>
          <span className="text-quaternary" style={{ opacity: feedOne }}>
            quote received
          </span>
          <span className="text-quaternary" style={{ opacity: feedTwo }}>
            price read
          </span>
          <span className="text-quaternary" style={{ opacity: feedThree }}>
            no order placed
          </span>
        </div>
      </PhoneShell>
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
      className={`rounded-lg border p-sm text-center ${
        active ? 'border-reckon-accent bg-reckon-accent/10' : 'border-primary bg-tertiary'
      }`}
      style={style}
    >
      <p className={`text-[10px] ${active ? 'text-reckon-accent' : 'text-quaternary'}`}>{label}</p>
      <p className="mt-xxs text-heading-xs font-semibold text-primary">{value}</p>
    </div>
  )
}

function PositionScene({ progress }: { progress: number }) {
  const row = RECORD_ROWS[0]
  const entry = Number.parseFloat(row.entry)
  const cardIn = easeOut(span(progress, 0, 0.12))
  const entryCount = easeOut(span(progress, 0.06, 0.34))
  const entryValue = entryCount > 0.999 ? row.entry : `${(entry * entryCount).toFixed(1)}c`
  const firstTravel = span(progress, 0.1, 0.26)
  const firstTap = span(progress, 0.26, 0.34)
  const selected = progress >= 0.26
  const selectedIn = easeOut(span(progress, 0.26, 0.34))
  const secondTravel = span(progress, 0.46, 0.62)
  const secondTap = span(progress, 0.62, 0.7)
  const confirmed = progress >= 0.62
  const confirmation = easeOut(span(progress, 0.7, 0.84))
  const press = firstTap > 0 && firstTap < 1 ? 1 - firstTap : 0
  const pressTwo = secondTap > 0 && secondTap < 1 ? 1 - secondTap : 0

  // Mobile camera pan/zoom into the commitment action
  const zoom = 1 + easeOut(span(progress, 0.4, 0.8)) * 0.05

  return (
    <div className="flex h-full flex-col justify-center gap-md p-sm sm:p-lg">
      <SceneHeader label="Position Detail / Action" meta="Pre-Commitment" />

      <PhoneShell activeTab="markets" scale={zoom} origin="center 70%">
        {/* Detail Screen Back Bar from App.tsx */}
        <div className="flex items-center gap-xs pb-xs text-[11px] font-semibold text-tertiary">
          <ArrowLeft size={12} />
          <span>Back to markets</span>
        </div>

        <div
          className="relative rounded-xl border border-primary bg-secondary p-sm shadow-xs"
          style={enter(cardIn)}
        >
          {/* Highlight square framing the outcome selection */}
          <FocusHighlight
            active={progress >= 0.2 && progress <= 0.45}
            shape="square"
            label="Selected"
            className="-inset-1"
          />

          <div className="flex items-center justify-between gap-xs text-[10px] text-quaternary">
            <span className="font-mono">ID: 0x9f2a...</span>
            <span>Closes {DEMO_MARKET.close}</span>
          </div>
          <p className="mt-xs text-xs font-semibold leading-4 text-primary">{row.question}</p>

          <div className="mt-sm grid grid-cols-2 gap-xs">
            <div
              className={`rounded-lg border p-xs ${
                selected ? 'border-reckon-accent bg-reckon-accent/10' : 'border-primary bg-tertiary'
              }`}
              style={{ transform: `scale(${1 + press * 0.025})` }}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className={selected ? 'text-reckon-accent font-medium' : 'text-quaternary'}>
                  {row.side}
                </span>
                <span className="text-reckon-accent" style={{ opacity: selectedIn }}>
                  Selected
                </span>
              </div>
              <p className="mt-xxs text-sm font-semibold text-primary">{entryValue}</p>
            </div>

            <div className="rounded-lg border border-primary bg-tertiary p-xs">
              <span className="text-[10px] text-quaternary">FURIA</span>
              <p className="mt-xxs text-xs text-quaternary">67.5c</p>
            </div>
          </div>

          {/* Action button with Highlight focus square */}
          <div className="relative mt-sm">
            <FocusHighlight
              active={progress >= 0.55 && progress <= 0.85}
              shape="square"
              label="Commit"
              className="-inset-1"
            />
            <div
              className={`flex items-center justify-between gap-xs rounded-lg border px-sm py-xs ${
                confirmed
                  ? 'border-reckon-accent/60 bg-reckon-accent/10'
                  : 'border-primary bg-tertiary'
              }`}
              style={{ transform: `scale(${1 + pressTwo * 0.02})` }}
            >
              <span className="flex items-center gap-xs text-xs font-semibold text-primary">
                {confirmed ? (
                  <CheckCircle size={14} weight="fill" className="text-reckon-accent" />
                ) : null}
                {confirmed ? `Position locked at ${row.entry}` : 'Commit Position'}
              </span>
              <span className="font-mono text-[10px] text-quaternary">{row.side}</span>
            </div>
          </div>

          {/* Exact success toast from App.tsx */}
          {confirmed ? (
            <div
              className="mt-xs flex items-center gap-xs rounded-md border border-reckon-accent/40 bg-primary px-xs py-xxs text-[10px] text-reckon-accent"
              style={{ opacity: confirmation }}
            >
              <CheckCircle size={12} weight="fill" />
              <span className="truncate">Position logged on {row.side} at {row.entry} on the record.</span>
            </div>
          ) : null}

          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30">
            <Pointer
              from={[80, 90]}
              to={[25, 46]}
              travel={firstTravel}
              tap={firstTap}
              visible={1 - span(progress, 0.43, 0.46)}
            />
            <Pointer
              from={[25, 46]}
              to={[50, 78]}
              travel={secondTravel}
              tap={secondTap}
              visible={span(progress, 0.43, 0.46)}
            />
          </div>
        </div>
      </PhoneShell>
    </div>
  )
}

function WalrusScene({ progress }: { progress: number }) {
  const appIn = easeOut(span(progress, 0, 0.12))
  const storeIn = easeOut(span(progress, 0.02, 0.14))
  const outbound = easeInOut(span(progress, 0.08, 0.32))
  const middle = easeInOut(span(progress, 0.36, 0.6))
  const returning = easeInOut(span(progress, 0.88, 0.99))
  const committed = progress >= 0.86
  const commitIn = easeOut(span(progress, 0.86, 0.93))
  const blobIn = easeOut(span(progress, 0.84, 0.92))
  const accountIn = easeOut(span(progress, 0.9, 0.97))
  const stepOne = easeOut(span(progress, 0.28, 0.36))
  const stepTwo = easeOut(span(progress, 0.8, 0.87))
  const stepThree = easeOut(span(progress, 0.91, 0.97))
  const phase =
    progress < 0.34
      ? 'Posting'
      : progress < 0.62
        ? 'Encrypting'
        : progress < 0.86
          ? 'Committing'
          : 'Committed'

  return (
    <div className="flex h-full flex-col justify-center gap-md p-sm sm:p-lg">
      <SceneHeader label="Write Job / Walrus Memory" meta="about 12 seconds" />

      <PhoneShell activeTab="markets">
        <div className="space-y-sm">
          {/* App toast state */}
          <div className="rounded-md border border-reckon-accent/30 bg-secondary p-xs text-[10px]">
            <p className="font-semibold text-primary">Walrus Memory Pipeline</p>
            <p className="text-secondary">Namespace: {MEMORY_NAMESPACE} / Sui epoch anchored</p>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-xs">
            <div
              className="flex flex-col rounded-lg border border-primary bg-secondary p-xs"
              style={enter(appIn)}
            >
              <div className="flex items-center gap-xs">
                <LogoMark size={14} />
                <span className="text-[10px] font-semibold text-primary">App</span>
              </div>
              <p className="mt-xs text-[9px] leading-3 text-secondary">
                Opened {RECORD_ROWS[0].side} at {RECORD_ROWS[0].entry}
              </p>
              <p className="mt-auto pt-xs text-[8px] text-quaternary">sentence payload</p>
            </div>

            <div className="relative flex w-10 items-center justify-center">
              <div className="h-0.5 w-full border-t border-dashed border-primary" />
              <div
                className="absolute inset-0"
                style={{
                  transform: `translateX(${outbound * 100}%)`,
                  opacity: outbound > 0.01 && outbound < 0.999 ? 1 : 0,
                }}
              >
                <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-reckon-accent" />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  transform: `translateX(${(1 - returning) * 100}%)`,
                  opacity: returning > 0.01 && returning < 0.999 ? 1 : 0,
                }}
              >
                <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-reckon-accent" />
              </div>
            </div>

            <div
              className="relative flex flex-col rounded-lg border border-reckon-accent/40 bg-secondary p-xs"
              style={enter(storeIn)}
            >
              {/* Highlight square on committed blob */}
              <FocusHighlight
                active={committed}
                shape="square"
                label="Blob ID"
                className="-inset-1"
              />

              <div className="flex items-center gap-xs">
                <BrandImage brand="memwal" height={12} alt="MemWal" />
                <span className="text-[10px] font-semibold text-primary">Walrus</span>
              </div>
              <div className="mt-xs flex items-center gap-xs text-[9px]">
                {!committed ? (
                  <>
                    <CircleNotch size={10} className="animate-spin text-reckon-accent" />
                    <span className="text-secondary">{phase}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={10} weight="fill" className="text-reckon-accent" />
                    <span className="font-semibold text-primary">Committed</span>
                  </>
                )}
              </div>
              <p
                className="mt-xs break-all font-mono text-[8px] leading-3 text-primary"
                style={{ opacity: blobIn }}
              >
                {BLOB_ID.slice(0, 16)}...
              </p>
            </div>
          </div>

          <div className="rounded-md border border-primary bg-primary p-xs text-[10px]">
            <p className="text-quaternary">
              Sui Account: <span className="font-mono text-secondary">{MEMORY_ACCOUNT.slice(0, 12)}...</span>
            </p>
            <p className="mt-xxs text-quaternary" style={{ opacity: commitIn }}>
              Recall is the single source of truth.
            </p>
          </div>
        </div>
      </PhoneShell>
    </div>
  )
}

function RecordScene({ progress }: { progress: number }) {
  const scan = span(progress, 0.45, 1)
  const activeIndex = progress < 0.35 ? 0 : progress < 0.7 ? 1 : 2

  return (
    <div className="flex h-full flex-col justify-center gap-md p-sm sm:p-lg">
      <SceneHeader label="The Reckon Record / Mobile" meta="Mark to Market" />

      <PhoneShell activeTab="record">
        {/* Record Screen Header from App.tsx */}
        <div className="space-y-xs pb-xs">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-primary">The Reckon Record</span>
            <span className="rounded-full border border-reckon-accent/30 bg-reckon-accent/10 px-xs py-none text-[9px] text-reckon-accent">
              Walrus Verified
            </span>
          </div>
          <div className="flex items-center gap-xs text-[9px] text-quaternary">
            <span className="rounded bg-secondary px-xs py-none text-secondary">3 Tracked</span>
            <span className="rounded bg-secondary px-xs py-none text-reckon-up">1 Gaining</span>
            <span className="rounded bg-secondary px-xs py-none text-reckon-down">1 Declining</span>
          </div>
        </div>

        {/* 3 Mobile Position Rows from App.tsx */}
        <div className="relative space-y-xs divide-y divide-primary/50 overflow-hidden rounded-xl border border-primary bg-secondary">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 z-10 h-px bg-reckon-accent"
            style={{
              top: `${scan * 100}%`,
              opacity: scan > 0.001 && scan < 1 ? 0.4 : 0,
            }}
          />

          {RECORD_ROWS.map((row, index) => {
            const appear = easeOut(span(progress, 0.02 + index * 0.06, 0.15 + index * 0.06))
            const count = easeOut(span(progress, 0.1 + index * 0.15, 0.65 + index * 0.1))
            const up = row.direction === 'up'
            const isFocused = activeIndex === index && progress >= 0.3

            return (
              <div
                key={row.question}
                className={`relative p-xs transition-colors duration-300 ${
                  isFocused ? 'bg-primary/60' : ''
                }`}
                style={{ opacity: appear, transform: `translateY(${(1 - appear) * 8}px)` }}
              >
                {/* Highlight square shifting across active rows */}
                <FocusHighlight
                  active={isFocused}
                  shape="square"
                  label="Graded"
                  className="-inset-0.5"
                />

                <div className="flex items-start justify-between gap-xs">
                  <p className="truncate text-[10px] font-semibold text-primary">{row.question}</p>
                  <span
                    className={`inline-flex shrink-0 items-center gap-xxs text-[10px] font-semibold ${
                      up ? 'text-reckon-up' : 'text-reckon-down'
                    }`}
                  >
                    {up ? (
                      <ArrowUpRight size={10} weight="bold" />
                    ) : (
                      <ArrowDownRight size={10} weight="bold" />
                    )}
                    {row.change}
                  </span>
                </div>
                <div className="mt-xxs flex items-center justify-between text-[9px] text-quaternary">
                  <span className="rounded bg-tertiary px-xs py-none text-secondary">{row.side}</span>
                  <span>
                    Entry <span className="text-secondary">{row.entry}</span> {'->'} Mark{' '}
                    <span className="font-semibold text-primary">{row.mark}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </PhoneShell>
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
  { id: 'request', from: 0, to: 1, label: 'request', start: 0.02, end: 0.12 },
  { id: 'challenge', from: 1, to: 0, label: '402 challenge', start: 0.15, end: 0.26 },
  { id: 'transfer', from: 0, to: 2, label: '0.01 USDC', start: 0.3, end: 0.45 },
  { id: 'digest', from: 0, to: 1, label: 'digest', start: 0.49, end: 0.61, brand: 'tatum' },
  { id: 'verdict', from: 1, to: 0, label: 'verdict 200', start: 0.66, end: 0.78 },
]

const COLUMN_CENTERS = [16.7, 50, 83.3]

function AgentScene({ progress }: { progress: number }) {
  const drop = easeOut(span(progress, 0.3, 0.5))
  const paid = progress >= 0.45
  const phase =
    progress < 0.15
      ? 0
      : progress < 0.3
        ? 1
        : progress < 0.49
          ? 2
          : progress < 0.66
            ? 3
            : 4
  const panelIn = easeOut(span(progress, 0.15, 0.25))

  return (
    <div className="flex h-full flex-col justify-center gap-md p-sm sm:p-lg">
      <SceneHeader label="Autonomous Agent / x402" meta="Sui Micro-payment" />

      <PhoneShell activeTab="markets">
        <div className="space-y-xs">
          <div className="grid grid-cols-3 gap-xs">
            <div className="rounded-lg border border-primary bg-secondary p-xs text-center">
              <Robot size={14} className="mx-auto text-reckon-accent" />
              <p className="mt-xxs text-[9px] font-semibold text-primary">Agent</p>
              <span className="text-[8px] text-quaternary">{paid ? '-0.01 USDC' : 'wallet'}</span>
            </div>
            <div className="rounded-lg border border-primary bg-secondary p-xs text-center">
              <LogoMark size={14} className="mx-auto" />
              <p className="mt-xxs text-[9px] font-semibold text-primary">Endpoint</p>
              <span className="text-[8px] text-quaternary">/verdict</span>
            </div>
            <div className="rounded-lg border border-primary bg-secondary p-xs text-center">
              <BrandImage brand="sui" height={14} />
              <p className="mt-xxs text-[9px] font-semibold text-primary">Sui</p>
              <span className="text-[8px] text-quaternary">testnet</span>
            </div>
          </div>

          {/* Interactive 402 challenge panel with highlight box */}
          <div className="relative mt-xs rounded-xl border border-primary bg-secondary p-xs">
            <FocusHighlight
              active={phase === 1}
              shape="square"
              label="402 Paywall"
              className="-inset-1"
            />
            <FocusHighlight
              active={phase === 4}
              shape="circle"
              label="Verified"
              className="-inset-1"
            />

            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-primary">
                {phase < 2 ? 'HTTP 402 Challenge' : phase < 4 ? 'Payment Digest' : 'HTTP 200 OK'}
              </span>
              <span className="font-mono text-reckon-accent">
                {phase < 2 ? '402' : phase < 4 ? 'Settling' : '200'}
              </span>
            </div>

            <div className="mt-xs font-mono text-[9px] text-secondary">
              {phase < 2 ? (
                <>
                  <p>scheme: {X402_CHALLENGE.scheme}</p>
                  <p>price: {X402_CHALLENGE.amount} USDC on {X402_CHALLENGE.network}</p>
                </>
              ) : phase < 4 ? (
                <p className="truncate">digest: 0xa1ec7f... settled</p>
              ) : (
                <p className="text-reckon-up">Oracle verdict unlocked: verified on chain.</p>
              )}
            </div>
          </div>
        </div>
      </PhoneShell>
    </div>
  )
}

function BuilderScene({ progress }: { progress: number }) {
  const headerIn = easeOut(span(progress, 0, 0.08))
  const generated = span(progress, 0.06, 0.34)
  const extended = span(progress, 0.48, 0.74)
  const panelOne = easeOut(span(progress, 0.3, 0.4))
  const panelTwo = easeOut(span(progress, 0.68, 0.78))
  const factOne = [0.32, 0.39, 0.46]
  const factTwo = [0.72, 0.79, 0.86]
  const pulseGenerated = progress > 0.8 ? (progress - 0.8) / 0.2 : null
  const pulseExtended = progress > 0.88 ? (progress - 0.88) / 0.12 : null

  return (
    <div className="flex h-full flex-col justify-center gap-md p-lg sm:p-2xl">
      <SceneHeader label="How it was built / Tatum AI Builder" meta="one prompt" />

      <div className="grid grid-cols-2 gap-md" style={{ opacity: headerIn }}>
        <div className="relative flex min-w-0 items-center gap-md rounded-xl border border-primary bg-secondary p-md">
          <FocusHighlight
            active={progress >= 0.25 && progress <= 0.6}
            shape="square"
            label="Scaffold"
            className="-inset-1"
          />
          <BrandImage brand="tatum" height={28} />
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-4 text-primary">Tatum AI Builder</p>
            <p className="mt-xs text-xs text-quaternary">build environment</p>
          </div>
        </div>
        <div className="relative flex min-w-0 items-center gap-md rounded-xl border border-reckon-accent/40 bg-secondary p-md">
          <FocusHighlight
            active={progress >= 0.65}
            shape="square"
            label="Hand-written"
            className="-inset-1"
          />
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
          drawn={progress >= 0.06}
          pulse={pulseGenerated}
        />
        <FlowLane
          progress={extended}
          reverse
          label="extended by hand"
          top={32}
          drawn={progress >= 0.48}
          pulse={pulseExtended}
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
  pulse = null,
}: {
  progress: number
  reverse: boolean
  label: string
  top: number
  drawn: boolean
  pulse?: number | null
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
      {pulse !== null && drawn ? (
        <span
          className="absolute inset-0"
          style={{ transform: `translateX(${lerp(from, to, pulse)}%)` }}
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




