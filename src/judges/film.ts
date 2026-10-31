// The film timeline. Every frame is a pure function of one elapsed time, so
// pausing freezes exactly and seeking renders the frame that belongs there.
// No timers, no per-chapter chains: one requestAnimationFrame clock in Film.tsx
// advances this model.

export const COVER_MS = 1200
export const HOLD_MS = 800

export type Chapter = {
  id: string
  name: string
  segment: string
  coverTitle: string
  coverLine: string
  caption: string
  line: string
  sceneMs: number
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'markets',
    name: 'Markets',
    segment: 'Markets',
    coverTitle: 'Markets',
    coverLine: 'Live prediction markets, real prices.',
    caption: "Markets come from Polymarket's public API with live prices.",
    line: 'Reckon is a forecasting record for prediction markets. A forecaster takes a position, and the app writes down the price at that exact moment. It is built for forecasters and analysts, and for the software agents that depend on their calls.',
    sceneMs: 22000,
  },
  {
    id: 'position',
    name: 'Take a position',
    segment: 'Position',
    coverTitle: 'A position',
    coverLine: 'Written with the price at the moment it was taken.',
    caption: 'The position is written with the price at the moment it was taken.',
    line: 'Taking a position means choosing a side at a price you can see. You pick yes or no, and the app fixes the entry price the instant you confirm. If the price moves a minute later, the record still shows the price you took.',
    sceneMs: 22000,
  },
  {
    id: 'walrus',
    name: 'Walrus Memory',
    segment: 'Walrus',
    coverTitle: 'Walrus Memory',
    coverLine: 'Timestamped on Sui before the outcome.',
    caption: 'The write takes about 12 seconds to commit; recall is the source of truth.',
    line: 'The position goes to Walrus Memory as a short sentence, and its hash is timestamped on Sui. The blob is public, so anyone can read the proof. That sentence is fixed once the outcome lands, and it cannot be edited or quietly removed.',
    sceneMs: 26000,
  },
  {
    id: 'record',
    name: 'The record',
    segment: 'Record',
    coverTitle: 'The record',
    coverLine: 'Graded mark to market, not by hindsight.',
    caption: 'These markets have not resolved. This is movement, not win rate.',
    line: 'Grading is mark to market, not hindsight. These markets resolve months from now, so the record shows the mark at each check, not a result picked after the fact. A position that moved against us stays visible, with its entry and its mark.',
    sceneMs: 23000,
  },
  {
    id: 'agent',
    name: 'An agent pays',
    segment: 'Agent',
    coverTitle: 'x402',
    coverLine: 'An agent pays 0.01 USDC on Sui.',
    caption: 'The endpoint is public, the payment is the credential, and one digest buys one call.',
    line: 'An agent has no account here, so it pays for each call instead. It sends one cent in USDC on Sui testnet in a gasless transfer, and gets one digest in return. Reckon verifies that digest on chain before it answers, and one digest buys one call.',
    sceneMs: 31000,
  },
  {
    id: 'builder',
    name: 'Built with Tatum AI Builder',
    segment: 'Tatum',
    coverTitle: 'Built with Tatum AI Builder',
    coverLine: 'One prompt produced the shell. We extended it by hand.',
    caption: 'The shell was generated. The Walrus and x402 integrations were built by hand.',
    line: 'The shell was generated with Tatum AI Builder, then extended by hand. We wrote the Walrus Memory client and the payment route ourselves. The commit history shows which commits came from the builder, so you can check how it was made.',
    sceneMs: 26000,
  },
]

// SpeechSynthesis does not report how long an utterance will run, so the film
// budgets 13 characters per second at the voice's slow rate and adds two
// seconds for breath. A chapter never ends before its line can be spoken. The
// scene keeps its own motion through that time, so the margin is never a still
// frame.
export const SPEECH_CHARS_PER_SECOND = 13

export function speechBudgetMs(line: string): number {
  return Math.round((line.length / SPEECH_CHARS_PER_SECOND) * 1000) + 2000
}

export function chapterDurationMs(chapter: Chapter): number {
  return COVER_MS + Math.max(chapter.sceneMs, speechBudgetMs(chapter.line)) + HOLD_MS
}

export const CHAPTER_STARTS: number[] = (() => {
  let at = 0
  return CHAPTERS.map((chapter) => {
    const start = at
    at += chapterDurationMs(chapter)
    return start
  })
})()

export const TOTAL_MS = CHAPTERS.reduce((sum, chapter) => sum + chapterDurationMs(chapter), 0)
export const TOTAL_SECONDS = Math.round(TOTAL_MS / 1000)

export type TimelineFrame = {
  index: number
  chapter: Chapter
  startMs: number
  localMs: number
  durationMs: number
  scene: number
  fill: number
  cover: number
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function span(value: number, start: number, end: number): number {
  if (end <= start) return value >= end ? 1 : 0
  return clamp01((value - start) / (end - start))
}

// The one easing curve used by every move in the film:
// cubic-bezier(0.22, 1, 0.36, 1). CSS owns the curve for interface motion; this
// solver owns it for the animation clock. Nothing in the film moves linearly.
const BEZIER_X1 = 0.22
const BEZIER_X2 = 0.36
const BEZIER_Y1 = 1
const BEZIER_Y2 = 1

function bezier(t: number, first: number, second: number): number {
  const rest = 1 - t
  return 3 * rest * rest * t * first + 3 * rest * t * t * second + t * t * t
}

export function easeOut(value: number): number {
  const target = clamp01(value)
  let low = 0
  let high = 1
  let mid = target

  for (let step = 0; step < 24; step += 1) {
    mid = (low + high) / 2
    if (bezier(mid, BEZIER_X1, BEZIER_X2) < target) low = mid
    else high = mid
  }

  return bezier(mid, BEZIER_Y1, BEZIER_Y2)
}

export function easeInOut(value: number): number {
  return easeOut(value)
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

export function timelineAt(elapsedMs: number): TimelineFrame {
  const wrapped = ((elapsedMs % TOTAL_MS) + TOTAL_MS) % TOTAL_MS
  let start = 0

  for (let index = 0; index < CHAPTERS.length; index += 1) {
    const chapter = CHAPTERS[index]
    const duration = chapterDurationMs(chapter)
    const next = start + duration
    if (wrapped < next || index === CHAPTERS.length - 1) {
      const local = Math.min(duration, wrapped - start)
      return {
        index,
        chapter,
        startMs: start,
        localMs: local,
        durationMs: duration,
        // The scene clock covers the final frame hold as well, so a chapter
        // never freezes at its last beat while the next title waits.
        scene: clamp01((local - COVER_MS) / (duration - COVER_MS)),
        fill: clamp01(local / duration),
        cover: clamp01(local / COVER_MS),
      }
    }
    start = next
  }

  const last = CHAPTERS.length - 1
  return {
    index: last,
    chapter: CHAPTERS[last],
    startMs: start,
    localMs: 0,
    durationMs: chapterDurationMs(CHAPTERS[last]),
    scene: 0,
    fill: 0,
    cover: 0,
  }
}

export function coverOpacityAt(localMs: number): number {
  return 1 - easeInOut(span(localMs, COVER_MS - 200, COVER_MS + 250))
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}
