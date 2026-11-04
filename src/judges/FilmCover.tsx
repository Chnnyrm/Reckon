import { Robot, ShieldCheck, Sparkle, Cpu, Database, TrendUp, TrendDown, ArrowsClockwise } from '@phosphor-icons/react'
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
  const exhibitIn = at(160)
  const markIn = at(200)
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
          className="mt-sm max-w-2xl text-heading-xs font-semibold tracking-tight text-primary sm:text-heading-sm"
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
          className="mt-xs max-w-xl text-xs leading-5 text-secondary sm:text-sm"
          style={{
            opacity: lineIn,
            transform: `translateY(${(1 - lineIn) * 10}px)`,
          }}
        >
          {chapter.coverLine}
        </p>

        {/* Rich Illustrated Technical Exhibit & Object Model */}
        <div
          className="mt-sm max-w-2xl"
          style={{
            opacity: exhibitIn,
            transform: `translateY(${(1 - exhibitIn) * 8}px)`,
          }}
        >
          <CoverExhibit index={index} />
        </div>
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
              <span>Tatum Markets</span>
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

function CoverExhibit({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="rounded-lg border border-primary/50 bg-secondary/70 p-sm backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-primary/40 pb-xxs font-mono text-[10px] text-quaternary">
          <div className="flex items-center gap-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-reckon-up animate-pulse" />
            <span className="text-primary font-semibold">CLOB ORDER BOOK</span>
          </div>
          <span>SYNC: 1.0 to 1.2s</span>
        </div>
        <div className="mt-xs grid grid-cols-2 gap-sm pt-xxs">
          <div className="space-y-xxs">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-quaternary">Yes / No</span>
              <span className="text-primary font-medium">{DEMO_MARKET.yes} / {DEMO_MARKET.no}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-[6%] rounded bg-reckon-up" />
              <div className="h-1.5 w-[94%] rounded bg-reckon-down/80" />
            </div>
            <div className="flex items-center justify-between font-mono text-[9px] text-quaternary">
              <span>Bid 6.00c</span>
              <span>Ask 6.10c</span>
            </div>
          </div>
          <div className="space-y-xxs border-l border-primary/40 pl-sm font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-quaternary">24h Vol</span>
              <span className="text-primary">{DEMO_MARKET.volume}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Spread</span>
              <span className="text-reckon-accent">0.10c</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Engine</span>
              <span className="text-secondary">Polymarket via Tatum</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (index === 1) {
    return (
      <div className="rounded-lg border border-primary/50 bg-secondary/70 p-sm backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-primary/40 pb-xxs font-mono text-[10px] text-quaternary">
          <span className="text-primary font-semibold">DETERMINISTIC MOVE TICK</span>
          <span className="text-reckon-accent font-semibold">CANONICAL SHA-256</span>
        </div>
        <div className="mt-xs grid grid-cols-2 gap-sm pt-xxs">
          <div className="space-y-xxs font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-quaternary">Side</span>
              <span className="text-reckon-accent font-medium">Nemiga Gaming</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Entry</span>
              <span className="text-primary font-medium">32.5c</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Epoch Tick</span>
              <span className="text-secondary">1761921600</span>
            </div>
          </div>
          <div className="space-y-xxs border-l border-primary/40 pl-sm font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-quaternary">Signature</span>
              <span className="text-reckon-up font-medium">Ed25519 Verified</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Digest</span>
              <span className="truncate max-w-[100px] text-primary">0x4f8a...7c1b</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Tamper Lock</span>
              <span className="text-reckon-accent font-medium">Pre-Resolution</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (index === 2) {
    return (
      <div className="rounded-lg border border-primary/50 bg-secondary/70 p-sm backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-primary/40 pb-xxs font-mono text-[10px] text-quaternary">
          <span className="text-primary font-semibold">DECENTRALIZED STORAGE PIPELINE</span>
          <span className="text-reckon-accent font-semibold">REED-SOLOMON 20 SLIVERS</span>
        </div>
        <div className="mt-xs grid grid-cols-2 gap-sm pt-xxs">
          <div className="space-y-xxs font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-quaternary">Namespace</span>
              <span className="text-primary font-medium">{MEMORY_NAMESPACE}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Commit</span>
              <span className="text-reckon-accent font-medium">about 12 seconds</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Blob ID</span>
              <span className="truncate max-w-[95px] text-secondary">{BLOB_ID}</span>
            </div>
          </div>
          <div className="space-y-xxs border-l border-primary/40 pl-sm font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-quaternary">Sui Object</span>
              <span className="truncate max-w-[95px] text-primary">0xd612...eeac</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Walrus Nodes</span>
              <span className="text-reckon-up font-medium">Active Quorum</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Attestation</span>
              <span className="text-reckon-accent font-medium">Epoch Proof</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (index === 3) {
    return (
      <div className="rounded-lg border border-primary/50 bg-secondary/70 p-sm backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-primary/40 pb-xxs font-mono text-[10px] text-quaternary">
          <span className="text-primary font-semibold">MARK-TO-MARKET FORENSIC DRIFT</span>
          <span className="text-reckon-accent font-semibold">APPEND-ONLY DAG</span>
        </div>
        <div className="mt-xs space-y-xxs pt-xxs">
          {RECORD_ROWS.map((row) => (
            <div key={row.question} className="flex items-center justify-between font-mono text-[10px]">
              <span className="truncate max-w-[140px] text-secondary">{row.side}</span>
              <span className="text-quaternary">{row.entry} to {row.mark}</span>
              <span className={`font-semibold ${row.direction === 'up' ? 'text-reckon-up' : 'text-reckon-down'}`}>
                {row.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (index === 4) {
    return (
      <div className="rounded-lg border border-primary/50 bg-secondary/70 p-sm backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-primary/40 pb-xxs font-mono text-[10px] text-quaternary">
          <span className="text-primary font-semibold">MACHINE-TO-MACHINE PROTOCOL</span>
          <span className="text-reckon-accent font-semibold">HTTP 402 STATE MACHINE</span>
        </div>
        <div className="mt-xs grid grid-cols-2 gap-sm pt-xxs">
          <div className="space-y-xxs font-mono text-[10px]">
            <div className="flex items-center gap-xs text-quaternary">
              <span className="text-reckon-accent">1.</span> GET /api/forecast
            </div>
            <div className="flex items-center gap-xs text-quaternary">
              <span className="text-reckon-accent">2.</span> 402 Challenge
            </div>
            <div className="flex items-center gap-xs text-quaternary">
              <span className="text-reckon-accent">3.</span> 0.01 USDC Pay
            </div>
            <div className="flex items-center gap-xs text-reckon-up">
              <span className="text-reckon-accent">4.</span> 200 OK Digest
            </div>
          </div>
          <div className="space-y-xxs border-l border-primary/40 pl-sm font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-quaternary">Latency</span>
              <span className="text-primary font-medium">3.8s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Amount</span>
              <span className="text-reckon-accent font-medium">0.01 USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-quaternary">Recipient</span>
              <span className="truncate max-w-[90px] text-secondary">0x051cd...16d5</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-primary/50 bg-secondary/70 p-sm backdrop-blur-xs">
      <div className="flex items-center justify-between border-b border-primary/40 pb-xxs font-mono text-[10px] text-quaternary">
        <span className="text-primary font-semibold">FULL-STACK ARCHITECTURE</span>
        <span className="text-reckon-accent font-semibold">VERIFIED CITATION</span>
      </div>
      <div className="mt-xs grid grid-cols-2 gap-sm pt-xxs">
        <div className="space-y-xxs font-mono text-[10px]">
          <div className="text-quaternary">Tatum AI Builder Layer</div>
          <div className="text-primary font-medium">{AI_COMMIT_COUNT} commits by AI Builder</div>
          <div className="truncate text-secondary">ID: {TATUM_ID}</div>
          <div className="truncate text-quaternary">Authored: {AI_AUTHOR}</div>
        </div>
        <div className="space-y-xxs border-l border-primary/40 pl-sm font-mono text-[10px]">
          <div className="text-quaternary">Custom Hand-Crafted Core</div>
          <div className="text-reckon-accent">Walrus Blob Storage</div>
          <div className="text-reckon-accent">Sui Epoch Attestation</div>
          <div className="text-reckon-accent">x402 Micropayments</div>
        </div>
      </div>
    </div>
  )
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

      <div className="relative z-10 mt-sm flex flex-wrap items-center justify-between gap-md border-t border-primary/40 pt-md font-mono text-[11px] text-quaternary">
        <div className="flex items-center gap-md">
          <span>SUI MAINNET</span>
          <span>/</span>
          <span>WALRUS MEMORY</span>
          <span>/</span>
          <span>TATUM SCALED</span>
        </div>
        <div className="flex items-center gap-md opacity-80">
          <BrandImage brand="sui" height={20} alt="Sui" />
          <BrandImage brand="walrus" height={28} alt="Walrus" />
          <BrandImage brand="tatum" height={24} alt="Tatum" />
        </div>
      </div>
    </div>
  )
}
