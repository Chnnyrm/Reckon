import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowCounterClockwise,
  ListBullets,
  Pause,
  Play,
  SpeakerSlash,
} from '@phosphor-icons/react'
import { Logo } from '../components/Logo'
import { Container, useReducedMotion } from './ui'
import {
  CHAPTERS,
  CHAPTER_STARTS,
  TOTAL_MS,
  TOTAL_SECONDS,
  chapterDurationMs,
  clamp01,
  formatClock,
  timelineAt,
} from './film'
import { CoverCard } from './FilmCover'
import { ChapterScene } from './FilmStages'

const AmbientScene = lazy(() => import('./AmbientScene'))

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black'

export default function Film() {
  const reduced = useReducedMotion()
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const [playing, setPlaying] = useState(() => !reduced)
  const [started, setStarted] = useState(() => !reduced)
  const [chaptersOpen, setChaptersOpen] = useState(() => reduced)
  const frame = timelineAt(elapsed)
  const staticMode = reduced && !started

  useEffect(() => {
    if (!reduced) return
    setPlaying(false)
    setChaptersOpen(true)
  }, [reduced])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const delta = Math.min(64, Math.max(0, now - last))
      last = now
      elapsedRef.current = (elapsedRef.current + delta) % TOTAL_MS
      setElapsed(elapsedRef.current)
      raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [playing])

  const jumpTo = useCallback((index: number, within = 0) => {
    // Land just inside the cover rather than on its first empty frame, so a
    // seek while paused shows the title card rather than a black stage.
    const offset = Math.max(400, chapterDurationMs(CHAPTERS[index]) * clamp01(within))
    const next = CHAPTER_STARTS[index] + offset
    elapsedRef.current = next
    setElapsed(next)
  }, [])

  const seekTo = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const ratio = clamp01((event.clientX - rect.left) / Math.max(1, rect.width))
      jumpTo(index, Math.min(0.999, ratio))
    },
    [jumpTo]
  )

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false)
      return
    }
    setStarted(true)
    setPlaying(true)
  }, [playing])

  const replay = useCallback(() => {
    elapsedRef.current = 0
    setElapsed(0)
    setStarted(true)
    setPlaying(true)
    setChaptersOpen(false)
  }, [])

  return (
    <section id="demo" aria-label="The Reckon demo" className="border-b border-primary py-lg sm:py-2xl">
      <Container>
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-primary bg-secondary shadow-2xl">
          <div className="flex h-11 items-center justify-between gap-sm border-b border-primary px-lg sm:px-2xl">
            <div className="flex min-w-0 items-center gap-sm">
              <Logo size={18} />
              <span className="text-xs text-quaternary" aria-hidden="true">
                /
              </span>
              <span className="truncate text-xs font-medium text-secondary">The demo</span>
            </div>
            <div className="flex shrink-0 items-center gap-md">
              <span
                className="inline-flex items-center gap-xs text-xs text-quaternary"
                aria-label="Muted. This film has no audio."
              >
                <SpeakerSlash size={14} weight="bold" aria-hidden="true" />
                <span className="hidden sm:inline">Muted</span>
              </span>
              <span className="font-mono text-xs text-quaternary">
                {String(frame.index + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
              </span>
              <span className="inline-flex items-center gap-xs rounded-full border border-primary bg-primary px-sm py-xs text-xs text-secondary">
                <span
                  className={`h-1 w-1 rounded-full ${staticMode ? 'bg-reckon-accent' : playing ? 'bg-reckon-up' : 'bg-reckon-accent'}`}
                  aria-hidden="true"
                />
                {staticMode ? 'Static' : playing ? 'Playing' : 'Paused'}
              </span>
            </div>
          </div>

          <div className="relative bg-primary">
            {!reduced ? (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
                <Suspense fallback={null}>
                  <AmbientScene paused={!playing} />
                </Suspense>
              </div>
            ) : null}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 bg-primary/55"
            />

            <div className="relative min-h-[30rem] sm:aspect-video sm:min-h-[28rem]">
              <div className="absolute inset-0 z-10">
                <ChapterScene index={frame.index} progress={staticMode ? 1 : frame.scene} />
              </div>
              <CoverCard
                chapter={frame.chapter}
                index={frame.index}
                localMs={frame.localMs}
                staticMode={staticMode}
              />
            </div>
          </div>

          <div
            className="border-t border-primary px-lg py-md sm:px-2xl"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-start gap-md">
              <span className="mt-0.5 shrink-0 font-mono text-xs text-reckon-accent">
                {String(frame.index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">{frame.chapter.name}</p>
                <p className="mt-xs text-sm leading-5 text-secondary">{frame.chapter.caption}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-primary px-lg py-md sm:px-2xl">
            <div className="flex items-center justify-between gap-md text-xs text-quaternary">
              <span>Chapters</span>
              <span className="font-mono">
                {formatClock(elapsed / 1000)} / {formatClock(TOTAL_SECONDS)}
              </span>
            </div>
            <div className="mt-sm grid grid-cols-6 gap-xs">
              {CHAPTERS.map((chapter, index) => {
                const fill =
                  index < frame.index
                    ? 1
                    : index === frame.index && !staticMode
                      ? frame.fill
                      : 0
                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={(event) => seekTo(event, index)}
                    aria-label={`Seek within chapter ${index + 1}, ${chapter.name}`}
                    aria-current={index === frame.index ? 'step' : undefined}
                    className={`flex min-h-11 min-w-0 flex-col justify-center rounded-sm ${FOCUS}`}
                  >
                    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-divider">
                      <span
                        className="block h-full w-full origin-left bg-reckon-accent"
                        style={{ transform: `scaleX(${fill})` }}
                      />
                    </span>
                    <span
                      className={`mt-xs block truncate text-left text-xs leading-4 ${
                        index === frame.index ? 'text-primary' : 'text-quaternary'
                      }`}
                    >
                      {chapter.segment}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-sm border-t border-primary px-lg py-md sm:px-2xl">
            <div className="flex items-center gap-xs sm:gap-sm">
              <button
                type="button"
                onClick={togglePlay}
                className={`inline-flex min-h-11 items-center justify-center gap-sm rounded-lg bg-brand-solid px-md py-sm text-sm font-semibold text-black transition-colors duration-200 hover:bg-brand-solid-hover ${FOCUS}`}
              >
                {playing ? (
                  <Pause size={15} weight="fill" aria-hidden="true" />
                ) : (
                  <Play size={15} weight="fill" aria-hidden="true" />
                )}
                {playing ? 'Pause' : 'Play'}
              </button>

              <button
                type="button"
                onClick={replay}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-sm rounded-lg border border-primary bg-secondary px-md py-sm text-sm font-semibold text-primary transition-colors duration-200 hover:border-reckon-accent hover:text-reckon-accent ${FOCUS}`}
                aria-label="Replay the film from the start"
              >
                <ArrowCounterClockwise size={15} weight="bold" aria-hidden="true" />
                <span className="hidden sm:inline">Replay</span>
              </button>

              <button
                type="button"
                onClick={() => setChaptersOpen((open) => !open)}
                aria-label="Show or hide the chapter list"
                aria-expanded={chaptersOpen}
                aria-controls="film-chapters"
                className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-sm rounded-lg border border-primary bg-secondary px-md py-sm text-sm font-semibold text-primary transition-colors duration-200 hover:border-reckon-accent hover:text-reckon-accent ${FOCUS}`}
              >
                <ListBullets size={15} weight="bold" aria-hidden="true" />
                <span className="hidden sm:inline">Chapters</span>
              </button>
            </div>

            <p className="hidden text-xs text-quaternary sm:block">
              No audio. Every value is a captured fixture.
            </p>
          </div>

          {chaptersOpen ? (
            <div id="film-chapters" className="border-t border-primary bg-primary px-lg py-md sm:px-2xl">
              <ol className="grid gap-xs sm:grid-cols-2 lg:grid-cols-3">
                {CHAPTERS.map((chapter, index) => (
                  <li key={chapter.id}>
                    <button
                      type="button"
                      onClick={() => jumpTo(index)}
                      aria-current={index === frame.index ? 'step' : undefined}
                      className={`flex min-h-11 w-full items-center gap-md rounded-md border border-primary bg-secondary px-md py-sm text-left transition-colors duration-200 hover:border-reckon-accent ${FOCUS}`}
                    >
                      <span className="font-mono text-xs text-quaternary">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-primary">
                          {chapter.name}
                        </span>
                        <span className="block font-mono text-xs text-quaternary">
                          {formatClock(chapterDurationMs(chapter) / 1000)}
                        </span>
                      </span>
                      {index === frame.index ? (
                        <span className="shrink-0 text-xs text-reckon-accent">Now</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-sm text-xs text-quaternary">
                Covers hold 1.2 seconds, final frames hold 0.8 seconds. Total runtime{' '}
                {formatClock(TOTAL_SECONDS)}.
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-md text-xs leading-5 text-quaternary">
          A {TOTAL_SECONDS} second reconstruction, captured 31 October 2026. No API is called:
          every number is a captured fixture, and the only requests are the brand images.
        </p>
      </Container>
    </section>
  )
}
