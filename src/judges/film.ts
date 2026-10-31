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
      'The market card opens with a question about the halftime show. Two price tiles follow: one for yes, one for no, both still counting.',
      'The two prices count toward six and ninety-four cents. The volume climbs, and the app places no order. The feed stays open.',
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
      'The position card opens on the Nemiga market. The entry price counts up to thirty-two and a half cents. The side and confirm control sit below.',
      'Nemiga is selected, and the entry price is locked at thirty-two and a half cents. The pointer moves to confirm the position on screen.',
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
      'The header reads write job. The app card holds the sentence, and the store card shows the reckon namespace. A packet travels between them.',
      'The sentence reached Walrus Memory. The write job reads encrypting, the spinner turns, and the job status shows accepted. The blob is not visible.',
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
      'The record header counts three positions. Each row shows its entry price and a mark counting against the current price. The rows settle.',
      'Each row is marked against the current price: one moves up, one moves down, and the third holds close to its entry. The arrows show the move.',
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
      'The agent, the endpoint, and Sui sit on screen. The agent has no account, so the request gets a payment challenge. The panel lists testnet, one cent.',
      'The agent\'s balance drops by a cent, and a digest comes back. The endpoint checks it on chain. The panel shows the payment check.',
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
      'Tatum AI Builder generated the shell. The generated lane connects the builder to Reckon, and the build details sit below. Builder left, app right.',
      'The hand-written lane draws back toward the builder, and its panel lists the Walrus Memory client, the payment route, and the deployment config.',
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
