import { Robot, ShieldCheck, Sparkle } from '@phosphor-icons/react'
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
import { BrandImage, X402Wordmark } from './Brand'
import { Logo } from '../components/Logo'
import { CHAPTERS, INTRO_TITLE, coverOpacityAt, easeOut, span, type Chapter } from './film'

export function CoverCard({
  chapter,
  index,
  localMs,
  staticMode,
  held = false,
}: {
  chapter: Chapter
  index: number
  localMs: number
  staticMode: boolean
  held?: boolean
}) {
  // A paused frame has to read as a title card, not as a black stage. When the
  // clock is not running the cover is shown in full; while it runs, the card
  // still fades in over the first third of a second.
  const still = staticMode || held
  const at = (start: number) => (still ? 1 : easeOut(span(localMs, start, start + 320)))
  const numberIn = at(0)
  const titleIn = at(60)
  const lineIn = at(120)
  const markIn = at(180)
  const rule = still ? 1 : easeOut(span(localMs, 60, 560))
  const opacity = still ? 1 : coverOpacityAt(localMs)

  // Fluid cinematic camera dolly: subtle 3D push-in over the card lifetime
  const cameraDolly = still ? 0 : easeOut(span(localMs, 0, 2800))
  const morphRotate = (localMs / 2800) * 36
  const morphScale = 1 + Math.sin((localMs / 2800) * Math.PI) * 0.08

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-20 flex flex-col justify-between overflow-hidden bg-primary p-lg sm:p-2xl"
      style={{
        opacity,
        perspective: '1200px',
      }}
    >
      {/* Morphing Geometric Background Shapes & 3D Optics */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 z-0 h-96 w-96 text-primary"
        style={{
          opacity: 0.12,
          transform: `translateZ(-50px) rotate(${morphRotate}deg) scale(${morphScale})`,
          transformOrigin: 'center center',
          transition: 'transform 100ms linear',
        }}
      >
        <svg viewBox="0 0 400 400" fill="none" className="h-full w-full">
          {/* Concentric morphing rings */}
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="6 8" />
          <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="95" stroke="#FF7A1A" strokeWidth="1.5" strokeDasharray="14 12" />
          <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="1" />
          {/* Radial crosshair calipers */}
          <line x1="200" y1="10" x2="200" y2="390" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 6" />
          <line x1="10" y1="200" x2="390" y2="200" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 6" />
          {/* Corner tick brackets */}
          <path d="M 60 100 L 60 60 L 100 60" stroke="#FF7A1A" strokeWidth="2" fill="none" />
          <path d="M 340 100 L 340 60 L 300 60" stroke="#FF7A1A" strokeWidth="2" fill="none" />
          <path d="M 60 300 L 60 340 L 100 340" stroke="#FF7A1A" strokeWidth="2" fill="none" />
          <path d="M 340 300 L 340 340 L 300 340" stroke="#FF7A1A" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Kinetic Typography and Chapter Header */}
      <div
        className="relative z-10"
        style={{
          transform: `translateZ(20px) scale(${1 + cameraDolly * 0.03})`,
          transformOrigin: 'left top',
        }}
      >
        <div className="flex items-center gap-md" style={{ opacity: numberIn }}>
          <span className="font-mono text-xs text-reckon-accent">
            {String(index + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </span>
          <span
            className="h-px w-14 origin-left bg-reckon-accent"
            style={{ transform: `scaleX(${rule})` }}
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-quaternary">
            {chapter.segment}
          </span>
        </div>

        {/* 3D Kinetic Title: expands tracking and tilts into view */}
        <h3
          className="mt-lg max-w-2xl text-heading-xs font-semibold tracking-tight text-primary sm:text-heading-sm"
          style={{
            opacity: titleIn,
            letterSpacing: `${(1 - titleIn) * 0.04}em`,
            transform: `perspective(1000px) rotateX(${(1 - titleIn) * 10}deg) translateY(${(1 - titleIn) * 12}px)`,
          }}
        >
          {chapter.coverTitle}
        </h3>

        {/* Subtitle Line with staggered slide-in */}
        <p
          className="mt-md max-w-xl text-sm leading-6 text-secondary sm:text-md"
          style={{
            opacity: lineIn,
            transform: `translateY(${(1 - lineIn) * 10}px)`,
          }}
        >
          {chapter.coverLine}
        </p>

        {staticMode ? <StaticValues index={index} /> : null}
      </div>

      {/* Large 3D watermark number in background */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 right-lg font-mono text-heading-2xl font-semibold leading-none tracking-tight text-primary sm:bottom-20 sm:right-2xl"
        style={{ opacity: 0.05 }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Bottom Bar: Metadata and Chapter Logos */}
      <div className="relative z-10 flex items-end justify-between gap-md border-t border-primary/40 pt-md">
        <p className="font-mono text-xs text-quaternary">Reckon / captured 31 Oct 2026</p>

        {/* Prominent Cinematic Brand & Element Badges */}
        <div
          className="flex items-center gap-md"
          style={{
            opacity: markIn,
            transform: `translateY(${(1 - markIn) * 8}px)`,
          }}
        >
          {/* Chapter 0: Markets */}
          {index === 0 ? (
            <div className="flex items-center gap-xs rounded-full border border-primary bg-secondary px-sm py-xxs text-[11px] text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-reckon-up" />
              <span>Polymarket Feed</span>
            </div>
          ) : null}

          {/* Chapter 1: Position */}
          {index === 1 ? (
            <div className="flex items-center gap-xs rounded-full border border-reckon-accent/40 bg-reckon-accent/10 px-sm py-xxs text-[11px] text-reckon-accent">
              <ShieldCheck size={14} weight="fill" />
              <span>Execution Tick</span>
            </div>
          ) : null}

          {/* Chapter 2: Walrus Memory (Walrus Logo + MemWal) */}
          {index === 2 ? (
            <div className="flex items-center gap-md">
              <BrandImage brand="memwal" height={24} alt="MemWal" />
              <BrandImage brand="walrus" height={52} alt="Walrus" />
            </div>
          ) : null}

          {/* Chapter 3: The Record */}
          {index === 3 ? (
            <div className="flex items-center gap-xs rounded-full border border-primary bg-secondary px-sm py-xxs text-[11px] text-secondary">
              <span className="font-mono text-reckon-accent">SUI:EPOCH</span>
              <span>Mark to Market</span>
            </div>
          ) : null}

          {/* Chapter 4: Agent Payments (Sui logo + x402 Wordmark + AI Agent Chip) */}
          {index === 4 ? (
            <div className="flex items-center gap-md">
              <BrandImage brand="sui" height={24} alt="Sui" />
              <X402Wordmark className="text-heading-xs" />
              <div className="flex items-center gap-xs rounded-full border border-reckon-accent/50 bg-reckon-accent/15 px-sm py-xs text-[11px] font-semibold text-reckon-accent">
                <Robot size={15} weight="bold" className="text-reckon-accent" />
                <span>AI Agent</span>
              </div>
            </div>
          ) : null}

          {/* Chapter 5: Tatum AI Builder (Tatum Logo + AI Builder Badge) */}
          {index === 5 ? (
            <div className="flex items-center gap-md">
              <BrandImage brand="tatum" height={34} alt="Tatum" />
              <span className="rounded-full border border-reckon-accent/40 bg-primary px-sm py-xxs text-[11px] font-medium text-reckon-accent">
                AI Builder
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StaticValues({ index }: { index: number }) {
  return (
    <dl className="mt-xl grid max-w-xl gap-sm border-t border-primary pt-lg">
      {staticValues(index).map((row) => (
        <div key={row.label} className="grid gap-xxs sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-md">
          <dt className="text-xs text-quaternary">{row.label}</dt>
          <dd className={`break-words font-mono text-xs leading-5 ${row.className ?? 'text-primary'}`}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function staticValues(index: number): { label: string; value: string; className?: string }[] {
  if (index === 0) {
    return [
      { label: 'Market', value: DEMO_MARKET.question },
      { label: 'Yes / No', value: `${DEMO_MARKET.yes} / ${DEMO_MARKET.no}` },
      { label: '24h volume', value: DEMO_MARKET.volume },
    ]
  }
  if (index === 1) {
    return [
      { label: 'Market', value: RECORD_ROWS[0].question },
      { label: 'Side', value: RECORD_ROWS[0].side },
      { label: 'Entry', value: RECORD_ROWS[0].entry },
    ]
  }
  if (index === 2) {
    return [
      { label: 'Namespace', value: MEMORY_NAMESPACE },
      { label: 'Commit', value: 'about 12 seconds' },
      { label: 'Blob', value: BLOB_ID },
    ]
  }
  if (index === 3) {
    return RECORD_ROWS.map((row, rowIndex) => ({
      label: `Move ${rowIndex + 1}`,
      value: `${row.side} ${row.entry} to ${row.mark}, ${row.change}`,
      className: row.direction === 'up' ? 'text-reckon-up' : 'text-reckon-down',
    }))
  }
  if (index === 4) {
    return [
      { label: 'Scheme / network', value: `${X402_CHALLENGE.scheme} / ${X402_CHALLENGE.network}` },
      { label: 'Amount', value: `${X402_CHALLENGE.amount} USDC` },
      { label: 'Recipient', value: X402_CHALLENGE.recipient },
    ]
  }
  return [
    { label: 'Tatum account', value: TATUM_ID },
    { label: 'Commits by AI Builder', value: String(AI_COMMIT_COUNT) },
    { label: 'Authored as', value: AI_AUTHOR },
  ]
}

export function IntroCard() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-20 flex flex-col justify-center gap-lg overflow-hidden bg-primary p-lg sm:p-2xl"
      style={{ perspective: '1200px' }}
    >
      {/* Morphing Background Optics for Intro */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 z-0 h-96 w-96 text-primary"
        style={{ opacity: 0.1 }}
      >
        <svg viewBox="0 0 400 400" fill="none" className="h-full w-full">
          <circle cx="200" cy="200" r="160" stroke="#FF7A1A" strokeWidth="1" strokeDasharray="8 8" />
          <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.75" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="0.75" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-sm">
        <Logo size={26} />
        <span className="rounded-full border border-reckon-accent/30 bg-reckon-accent/10 px-sm py-xxs font-mono text-[10px] text-reckon-accent">
          FORECAST PROTOCOL
        </span>
      </div>

      {/* Kinetic Typography on Intro Title */}
      <p
        className="relative z-10 max-w-xl text-heading-xs font-semibold tracking-tight text-primary sm:text-heading-sm"
        style={{
          letterSpacing: '-0.02em',
          transform: 'perspective(1000px) rotateX(2deg)',
        }}
      >
        {INTRO_TITLE}
      </p>

      <div className="relative z-10 mt-sm flex items-center gap-md border-t border-primary/40 pt-md font-mono text-[11px] text-quaternary">
        <span>SUI MAINNET</span>
        <span>/</span>
        <span>WALRUS MEMORY</span>
        <span>/</span>
        <span>TATUM SCALED</span>
      </div>
    </div>
  )
}
