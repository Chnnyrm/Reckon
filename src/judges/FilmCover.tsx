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
import { CHAPTERS, coverOpacityAt, easeOut, span, type Chapter } from './film'

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

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-20 flex flex-col justify-between bg-primary p-lg sm:p-2xl"
      style={{ opacity }}
    >
      <div>
        <div className="flex items-center gap-md" style={{ opacity: numberIn }}>
          <span className="font-mono text-xs text-reckon-accent">
            {String(index + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </span>
          <span
            className="h-px w-12 origin-left bg-reckon-accent"
            style={{ transform: `scaleX(${rule})` }}
          />
        </div>

        <h3
          className="mt-lg max-w-2xl text-heading-xs font-semibold tracking-tight text-primary sm:text-heading-sm"
          style={{
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 10}px)`,
          }}
        >
          {chapter.coverTitle}
        </h3>

        <p
          className="mt-md max-w-xl text-sm text-secondary sm:text-md"
          style={{
            opacity: lineIn,
            transform: `translateY(${(1 - lineIn) * 10}px)`,
          }}
        >
          {chapter.coverLine}
        </p>

        {staticMode ? <StaticValues index={index} /> : null}
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 right-lg font-mono text-heading-2xl font-semibold leading-none tracking-tight text-primary sm:bottom-20 sm:right-2xl"
        style={{ opacity: 0.07 }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="flex items-end justify-between gap-md">
        <p className="font-mono text-xs text-quaternary">Reckon / captured 31 Oct 2026</p>
        <div
          className="flex items-end gap-lg"
          style={{
            opacity: markIn,
            transform: `translateY(${(1 - markIn) * 8}px)`,
          }}
        >
          {index === 2 ? <BrandImage brand="walrus" height={56} /> : null}
          {index === 4 ? (
            <>
              <BrandImage brand="tatum" height={26} />
              <X402Wordmark className="text-heading-xs" />
            </>
          ) : null}
          {index === 5 ? <BrandImage brand="tatum" height={36} /> : null}
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
