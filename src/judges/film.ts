// The film timeline. Every frame is a pure function of one elapsed time, so
// pausing freezes exactly and seeking renders the frame that belongs there.
// No timers, no per-chapter chains: one requestAnimationFrame clock in Film.tsx
// advances this model.

export const COVER_MS = 2800
export const COVER_FADE_MS = 350
export const FIRST_LINE_AT = COVER_MS - COVER_FADE_MS
export const HOLD_MS = 800

export type Chapter = {
  id: string
  name: string
  segment: string
  coverTitle: string
  coverLine: string
  caption: string
  lines: [string, string]
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
    lines: [
      'On screen, the mobile feed streams live prediction markets, showing real odds from Polymarket with no custodial user account required.',
      'Highlighting the outcome tiles, live volume updates on screen as the app monitors contract liquidity without placing any speculative orders.',
    ],
    sceneMs: 22000,
  },
  {
    id: 'position',
    name: 'Take a position',
    segment: 'Position',
    coverTitle: 'A position',
    coverLine: 'Written with the price at the moment it was taken.',
    caption: 'The position is written with the price at the moment it was taken.',
    lines: [
      'Navigating into the detail screen, the mobile view locks thirty-two and a half cents as the exact entry mark at execution.',
      'Focusing on the action button, confirming the call commits the position directly into the memory pipeline before outcomes can resolve.',
    ],
    sceneMs: 22000,
  },
  {
    id: 'walrus',
    name: 'Walrus Memory',
    segment: 'Walrus',
    coverTitle: 'Walrus Memory',
    coverLine: 'Timestamped on Sui before the outcome.',
    caption: 'The write takes about 12 seconds to commit; recall is the source of truth.',
    lines: [
      'The position sentence payload dispatches to the Walrus Memory relayer under the reckon namespace, returning an immediate asynchronous job confirmation.',
      'Highlighting the committed hash, Walrus seals an immutable blob, anchored to an irreversible Sui network epoch timestamp on decentralized storage.',
    ],
    sceneMs: 26000,
  },
  {
    id: 'record',
    name: 'The record',
    segment: 'Record',
    coverTitle: 'The record',
    coverLine: 'Graded mark to market, not by hindsight.',
    caption: 'These markets have not resolved. This is movement, not win rate.',
    lines: [
      'Opening the mobile record screen, the user portfolio rebuilds directly from Walrus Memory recall, without relying on private database tables.',
      'Tracking live price moves on screen, each position row shows true mark-to-market drift on chain, cleanly eliminating retroactive hindsight claims.',
    ],
    sceneMs: 23000,
  },
  {
    id: 'agent',
    name: 'An agent pays',
    segment: 'Agent',
    coverTitle: 'x402',
    coverLine: 'An agent pays 0.01 USDC on Sui.',
    caption: 'The endpoint is public, the payment is the credential, and one digest buys one call.',
    lines: [
      'An autonomous software agent queries the oracle endpoint, receiving a standard payment challenge without needing prior user accounts or keys.',
      'The agent settles one cent in USDC on Sui testnet, and the endpoint verifies the transaction digest before releasing the verdict.',
    ],
    sceneMs: 31000,
  },
  {
    id: 'builder',
    name: 'Built with Tatum AI Builder',
    segment: 'Tatum',
    coverTitle: 'Built with Tatum AI Builder',
    coverLine: 'One prompt produced the shell. We extended it by hand.',
    caption: 'The shell was generated. The Walrus and x402 integrations were built by hand.',
    lines: [
      'Tatum AI Builder scaffolded the full application shell and Express backend server, generating the core interface and verified build configuration.',
      'Hand-written extensions wired the native Walrus Memory client and Sui payment verification, establishing full commit provenance in the git history.',
    ],
    sceneMs: 26000,
  },
]

// Two beats per chapter. The first starts with the chapter, the second at 55
// percent. SpeechSynthesis cannot report a duration, so 13 characters per
// second is the conservative estimate used by the tests and the report. It
// does not stretch the clock: the scene keeps moving between the two beats.
export const SPEECH_CHARS_PER_SECOND = 13
export const SECOND_BEAT_AT = 0.55

export function speechEstimateMs(line: string): number {
  return Math.round((line.length / SPEECH_CHARS_PER_SECOND) * 1000)
}

// The intro is not a chapter and has no market scene. It holds a full-frame
// card while one line explains what Reckon is and who it is for. The card is
// longer than seven seconds because the line is 26 words: at 13 characters per
// second it needs twelve seconds, and the intro must not cut the line short.
export const INTRO_TITLE = 'A forecasting record you can audit'
export const INTRO_LINE =
  'Reckon is a public record of forecasting positions on prediction markets. It is for analysts and forecasters, and for the software agents that rely on them.'
export const INTRO_MS = Math.max(7000, speechEstimateMs(INTRO_LINE) + 500)

export function chapterDurationMs(chapter: Chapter): number {
  return COVER_MS + chapter.sceneMs + HOLD_MS
}

export function beatTwoStartMs(chapter: Chapter): number {
  return Math.round(chapterDurationMs(chapter) * SECOND_BEAT_AT)
}

export const CHAPTER_STARTS: number[] = (() => {
  let at = INTRO_MS
  return CHAPTERS.map((chapter) => {
    const start = at
    at += chapterDurationMs(chapter)
    return start
  })
})()

export const TOTAL_MS =
  INTRO_MS + CHAPTERS.reduce((sum, chapter) => sum + chapterDurationMs(chapter), 0)
export const TOTAL_SECONDS = Math.round(TOTAL_MS / 1000)

export type TimelineFrame = {
  intro: boolean
  index: number
  chapter: Chapter
  startMs: number
  localMs: number
  durationMs: number
  scene: number
  fill: number
  cover: number
  beat: 0 | 1 | 2
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

  if (wrapped < INTRO_MS) {
    return {
      intro: true,
      index: -1,
      chapter: CHAPTERS[0],
      startMs: 0,
      localMs: wrapped,
      durationMs: INTRO_MS,
      scene: 0,
      fill: clamp01(wrapped / INTRO_MS),
      cover: 0,
      beat: 0,
    }
  }

  let start = INTRO_MS

  for (let index = 0; index < CHAPTERS.length; index += 1) {
    const chapter = CHAPTERS[index]
    const duration = chapterDurationMs(chapter)
    const next = start + duration
    if (wrapped < next || index === CHAPTERS.length - 1) {
      const local = Math.min(duration, wrapped - start)
      const beat: 0 | 1 | 2 =
        local >= duration * SECOND_BEAT_AT ? 2 : local >= FIRST_LINE_AT ? 1 : 0
      return {
        intro: false,
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
        beat,
      }
    }
    start = next
  }

  const last = CHAPTERS.length - 1
  return {
    intro: false,
    index: last,
    chapter: CHAPTERS[last],
    startMs: start,
    localMs: 0,
    durationMs: chapterDurationMs(CHAPTERS[last]),
    scene: 0,
    fill: 0,
    cover: 0,
    beat: 0,
  }
}

export function coverOpacityAt(localMs: number): number {
  // A plain smoothstep, not the film's fast-out easing curve. The cover has
  // to read as a 350ms dissolve rather than a snap in its last frames.
  const t = clamp01((localMs - FIRST_LINE_AT) / (COVER_MS - FIRST_LINE_AT))
  return 1 - t * t * (3 - 2 * t)
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(whole / 60)
  const rest = whole % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}
