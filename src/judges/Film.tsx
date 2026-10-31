import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowCounterClockwise,
  ClosedCaptioning,
  ListBullets,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
} from '@phosphor-icons/react'
import { Logo } from '../components/Logo'
import { useReducedMotion } from './ui'
import {
  CHAPTERS,
  CHAPTER_STARTS,
  INTRO_LINE,
  INTRO_MS,
  INTRO_TITLE,
  TOTAL_MS,
  TOTAL_SECONDS,
  chapterDurationMs,
  formatClock,
  timelineAt,
} from './film'
import { narrator } from './narration'
import { CoverCard, IntroCard } from './FilmCover'
import { ChapterScene } from './FilmStages'

const AmbientScene = lazy(() => import('./AmbientScene'))

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black'

const PLAYER = 'mx-auto w-full max-w-[1100px] px-xl sm:px-2xl'
const NARRATION_UNAVAILABLE = 'Narration is not available on this device.'

export default function Film() {
  const reduced = useReducedMotion()
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [voiceReady, setVoiceReady] = useState(false)
  const [voiceChecked, setVoiceChecked] = useState(false)
  const [speechEpoch, setSpeechEpoch] = useState(0)
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [captionsOn, setCaptionsOn] = useState(true)

  const frame = timelineAt(elapsed)
  const staticMode = reduced && !started

  useEffect(() => {
    let live = true
    narrator.ready().then((ok) => {
      if (!live) return
      setVoiceReady(ok)
      setVoiceChecked(true)
      if (!ok) setSoundOn(false)
    })
    return () => {
      live = false
      narrator.cancel()
    }
  }, [])

  const spokenLine = frame.intro
    ? INTRO_LINE
    : frame.beat === 2
      ? frame.chapter.lines[1]
      : frame.beat === 1
        ? frame.chapter.lines[0]
        : null

  useEffect(() => {
    if (started && playing && soundOn && voiceReady && spokenLine) {
      narrator.speak(spokenLine)
    } else {
      narrator.cancel()
    }
    return () => narrator.cancel()
  }, [started, playing, soundOn, voiceReady, spokenLine, speechEpoch])

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

  const start = useCallback((withSound: boolean) => {
    setStarted(true)
    setPlaying(true)
    setSoundOn(withSound)
    if (withSound) {
      narrator.ready().then((ok) => {
        setVoiceReady(ok)
        setVoiceChecked(true)
        if (!ok) setSoundOn(false)
      })
    }
  }, [])

  const seekToIntro = useCallback(() => {
    elapsedRef.current = 0
    setElapsed(0)
    setSpeechEpoch((epoch) => epoch + 1)
  }, [])

  const seekToChapter = useCallback((index: number) => {
    // A chapter is one narration line. Seeking lands on its first frame, and
    // the speech effect cancels the old utterance and speaks the new line.
    const next = CHAPTER_STARTS[index]
    elapsedRef.current = next
    setElapsed(next)
    setSpeechEpoch((epoch) => epoch + 1)
  }, [])

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false)
      return
    }
    setStarted(true)
    setPlaying(true)
    setSpeechEpoch((epoch) => epoch + 1)
  }, [playing])

  const replay = useCallback(() => {
    elapsedRef.current = 0
    setElapsed(0)
    setStarted(true)
    setPlaying(true)
    setSpeechEpoch((epoch) => epoch + 1)
    setChaptersOpen(false)
  }, [])

  const toggleSound = useCallback(() => {
    setSoundOn((on) => !on)
  }, [])

  const toggleCaptions = useCallback(() => {
    setCaptionsOn((on) => !on)
  }, [])

  const segments = [
    {
      id: 'intro',
      label: 'Intro',
      full: 'Intro',
      start: 0,
      duration: INTRO_MS,
      chapterIndex: -1,
    },
    ...CHAPTERS.map((chapter, index) => ({
      id: chapter.id,
      label: chapter.segment,
      full: chapter.name,
      start: CHAPTER_STARTS[index],
      duration: chapterDurationMs(chapter),
      chapterIndex: index,
    })),
  ]
  const activeSegment = frame.intro ? 0 : frame.index + 1
  const goToSegment = (chapterIndex: number) => {
    if (chapterIndex < 0) seekToIntro()
    else seekToChapter(chapterIndex)
  }

  const captionTitle =
    frame.intro || frame.beat !== 0 ? null : frame.chapter.coverTitle
  const captionLine = frame.intro
    ? INTRO_LINE
    : frame.beat === 0
      ? frame.chapter.coverLine
      : frame.chapter.lines[frame.beat - 1]
  const captionText = captionTitle ? `${captionTitle}. ${captionLine}` : captionLine

  const label = staticMode
    ? 'Static'
    : playing
      ? 'Playing'
      : started
        ? 'Paused'
        : 'Ready'

  return (
    <section id="demo" aria-label="The Reckon demo" className="border-b border-primary py-lg sm:py-2xl">
      <div className={PLAYER}>
        <div className="grid gap-xl md:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)] md:items-start">
          <div className="min-w-0 md:order-2">
            <div className="overflow-hidden rounded-2xl border border-primary bg-secondary shadow-2xl">
              <div className="flex h-11 items-center justify-between gap-sm border-b border-primary px-lg sm:px-2xl">
                <div className="flex min-w-0 items-center gap-sm">
                  <Logo size={18} />
                  <span className="text-xs text-quaternary" aria-hidden="true">
                    /
                  </span>
                  <span className="truncate text-xs font-medium text-secondary">The demo</span>
                </div>
                <div className="flex shrink-0 items-center gap-md">
                  <span className="font-mono text-xs text-quaternary">
                    {frame.intro
                      ? 'Intro'
                      : `${String(frame.index + 1).padStart(2, '0')} / ${String(CHAPTERS.length).padStart(2, '0')}`}
                  </span>
                  <span className="inline-flex items-center gap-xs rounded-full border border-primary bg-primary px-sm py-xs text-xs text-secondary">
                    <span
                      className={`h-1 w-1 rounded-full ${
                        staticMode ? 'bg-reckon-accent' : playing ? 'bg-reckon-up' : 'bg-reckon-accent'
                      }`}
                      aria-hidden="true"
                    />
                    {label}
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

                <div className="relative w-full">
                  <div className="relative h-[30rem] w-full sm:h-[32rem]">
                    {frame.intro ? (
                      <IntroCard />
                    ) : (
                      <>
                        <div className="absolute inset-0 z-10">
                          <ChapterScene index={frame.index} progress={staticMode ? 1 : frame.scene} />
                        </div>
                        <CoverCard
                          chapter={frame.chapter}
                          index={frame.index}
                          localMs={frame.localMs}
                          staticMode={staticMode}
                          held={!playing && frame.beat === 0}
                        />
                      </>
                    )}

                    {!started ? (
                      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-primary bg-primary px-lg py-lg sm:px-2xl">
                        <div className="flex flex-col items-stretch gap-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                          <button
                            type="button"
                            onClick={() => start(true)}
                            className={`inline-flex min-h-11 w-full items-center justify-center gap-sm rounded-lg bg-brand-solid px-lg py-sm text-sm font-semibold text-black transition-colors duration-200 hover:bg-brand-solid-hover sm:w-auto ${FOCUS}`}
                          >
                            <Play size={15} weight="fill" aria-hidden="true" />
                            {reduced ? 'Play with sound' : 'Play the demo with sound'}
                          </button>
                          <button
                            type="button"
                            onClick={() => start(false)}
                            className={`inline-flex min-h-11 w-full items-center justify-center gap-sm rounded-lg border border-primary bg-secondary px-lg py-sm text-sm font-semibold text-primary transition-colors duration-200 hover:border-reckon-accent hover:text-reckon-accent sm:w-auto ${FOCUS}`}
                          >
                            <SpeakerSlash size={15} weight="bold" aria-hidden="true" />
                            Watch without sound
                          </button>
                        </div>
                        <p className="mt-sm text-center text-xs leading-5 text-quaternary">
                          {reduced
                            ? 'Reduced motion is on. Nothing moves and nothing is spoken until you press play.'
                            : 'The film waits on its first frame. Pressing play starts the picture and the voice together.'}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div
                    role="region"
                    aria-label="Captions"
                    className="relative z-30 flex h-[4.5rem] items-center justify-center border-t border-primary bg-primary/90 px-1 sm:px-md"
                  >
                    {captionsOn ? (
                      <p className="max-w-full text-center text-[10px] leading-[14px] text-primary sm:text-xs sm:leading-4 lg:text-sm lg:leading-5">
                        {captionText}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="border-t border-primary px-lg py-md sm:px-2xl">
                <div className="flex items-start gap-md">
                  <span className="mt-0.5 shrink-0 font-mono text-xs text-reckon-accent">
                    {frame.intro ? '00' : String(frame.index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      {frame.intro ? 'Intro' : frame.chapter.name}
                    </p>
                    <p className="mt-xs text-sm leading-5 text-secondary">
                      {frame.intro ? INTRO_TITLE : frame.chapter.caption}
                    </p>
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
                <div className="mt-sm grid grid-cols-7 gap-xs">
                  {segments.map((segment, segmentIndex) => {
                    const isActive = segmentIndex === activeSegment
                    const fill =
                      segmentIndex < activeSegment
                        ? 1
                        : isActive && !staticMode
                          ? frame.fill
                          : 0
                    return (
                      <button
                        key={segment.id}
                        type="button"
                        onClick={() => goToSegment(segment.chapterIndex)}
                        aria-label={
                          segment.chapterIndex < 0
                            ? 'Go to the intro'
                            : `Go to chapter ${segment.chapterIndex + 1}, ${segment.full}`
                        }
                        aria-current={isActive ? 'step' : undefined}
                        className={`flex min-h-11 min-w-0 flex-col justify-center rounded-sm ${FOCUS}`}
                      >
                        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-divider">
                          <span
                            className="block h-full w-full origin-left bg-reckon-accent"
                            style={{ transform: `scaleX(${fill})` }}
                          />
                        </span>
                        <span
                          className={`mt-xs block text-left text-xs leading-4 ${
                            isActive ? 'text-primary' : 'text-quaternary'
                          }`}
                        >
                          <span className="block truncate sm:hidden">{segment.label}</span>
                          <span className="hidden sm:block">{segment.full}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {started ? (
                <div className="flex flex-wrap items-center justify-between gap-sm border-t border-primary px-lg py-md sm:px-2xl">
                  <div className="flex flex-wrap items-center gap-xs sm:gap-sm">
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
                      aria-label="Replay from the start"
                    >
                      <ArrowCounterClockwise size={15} weight="bold" aria-hidden="true" />
                      <span className="hidden sm:inline">Replay</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleSound}
                      aria-pressed={!soundOn}
                      aria-label={soundOn ? 'Turn the sound off' : 'Turn the sound on'}
                      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-sm rounded-lg border border-primary bg-secondary px-md py-sm text-sm font-semibold transition-colors duration-200 hover:border-reckon-accent hover:text-reckon-accent ${
                        soundOn ? 'text-primary' : 'text-reckon-accent'
                      } ${FOCUS}`}
                    >
                      {soundOn ? (
                        <SpeakerHigh size={15} weight="bold" aria-hidden="true" />
                      ) : (
                        <SpeakerSlash size={15} weight="bold" aria-hidden="true" />
                      )}
                      {soundOn ? 'Sound on' : 'Sound off'}
                    </button>

                    <button
                      type="button"
                      onClick={toggleCaptions}
                      aria-pressed={captionsOn}
                      aria-label={captionsOn ? 'Turn captions off' : 'Turn captions on'}
                      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-sm rounded-lg border border-primary bg-secondary px-md py-sm text-sm font-semibold transition-colors duration-200 hover:border-reckon-accent hover:text-reckon-accent ${
                        captionsOn ? 'text-primary' : 'text-reckon-accent'
                      } ${FOCUS}`}
                    >
                      <ClosedCaptioning size={15} weight="bold" aria-hidden="true" />
                      <span className="hidden sm:inline">Captions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChaptersOpen((open) => !open)}
                      aria-label="Show or hide the section list"
                      aria-expanded={chaptersOpen}
                      aria-controls="film-chapters"
                      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-sm rounded-lg border border-primary bg-secondary px-md py-sm text-sm font-semibold text-primary transition-colors duration-200 hover:border-reckon-accent hover:text-reckon-accent ${FOCUS}`}
                    >
                      <ListBullets size={15} weight="bold" aria-hidden="true" />
                      <span className="hidden sm:inline">Sections</span>
                    </button>
                  </div>

                  <p className="hidden text-xs text-quaternary sm:block">
                    {soundOn
                      ? 'Narration follows the chapter clock.'
                      : 'Silent playthrough. The text panel stays on screen.'}
                  </p>
                </div>
              ) : null}

              {chaptersOpen ? (
                <div id="film-chapters" className="border-t border-primary bg-primary px-lg py-md sm:px-2xl">
                  <ol className="grid gap-xs sm:grid-cols-2 lg:grid-cols-3">
                    {segments.map((segment, segmentIndex) => (
                      <li key={segment.id}>
                        <button
                          type="button"
                          onClick={() => goToSegment(segment.chapterIndex)}
                          aria-current={segmentIndex === activeSegment ? 'step' : undefined}
                          className={`flex min-h-11 w-full items-center gap-md rounded-md border border-primary bg-secondary px-md py-sm text-left transition-colors duration-200 hover:border-reckon-accent ${FOCUS}`}
                        >
                          <span className="font-mono text-xs text-quaternary">
                            {segment.chapterIndex < 0
                              ? '00'
                              : String(segment.chapterIndex + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-primary">
                              {segment.full}
                            </span>
                            <span className="block font-mono text-xs text-quaternary">
                              {(segment.duration / 1000).toFixed(1)}s
                            </span>
                          </span>
                          {segmentIndex === activeSegment ? (
                            <span className="shrink-0 text-xs text-reckon-accent">Now</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-sm text-xs text-quaternary">
                    The intro holds {(INTRO_MS / 1000).toFixed(1)} seconds. Covers hold 2.45
                    seconds, then dissolve over 0.35 seconds. Final frames hold 0.8 seconds. Total
                    runtime {formatClock(TOTAL_SECONDS)}.
                  </p>
                </div>
              ) : null}
            </div>

          </div>

          <aside
            aria-label="Narration"
            className="min-w-0 self-start rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl md:order-1 md:sticky md:top-20"
          >
            <div className="flex items-center justify-between gap-sm">
              <p className="flex items-center gap-sm text-xs font-medium text-reckon-accent">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-reckon-accent" />
                <span>Narration</span>
              </p>
              <span className="font-mono text-xs text-quaternary">
                {staticMode
                  ? 'Static'
                  : frame.intro
                    ? 'Intro'
                    : `${String(frame.index + 1).padStart(2, '0')} / ${String(CHAPTERS.length).padStart(2, '0')}`}
              </span>
            </div>

            {staticMode ? (
              <div className="mt-lg">
                <p className="text-sm font-semibold text-primary">Every line, written out.</p>
                <p className="mt-xs text-xs leading-5 text-quaternary">
                  Reduced motion is on. The first frame is held and the narration is below.
                </p>
                {voiceChecked && !voiceReady ? (
                  <p className="mt-xs text-xs leading-5 text-quaternary">
                    {NARRATION_UNAVAILABLE}
                  </p>
                ) : null}
                <ol className="mt-xl space-y-xl">
                  <li>
                    <p className="font-mono text-xs text-reckon-accent">Intro</p>
                    <p className="mt-xs text-sm font-semibold text-primary">{INTRO_TITLE}</p>
                    <p className="mt-xs text-sm leading-6 text-secondary">{INTRO_LINE}</p>
                  </li>
                  {CHAPTERS.map((chapter, index) => (
                    <li key={chapter.id}>
                      <p className="font-mono text-xs text-reckon-accent">
                        {String(index + 1).padStart(2, '0')} /{' '}
                        {String(CHAPTERS.length).padStart(2, '0')}
                      </p>
                      <p className="mt-xs text-sm font-semibold text-primary">{chapter.name}</p>
                      {chapter.lines.map((line, lineIndex) => (
                        <p
                          key={lineIndex}
                          className="mt-xs text-sm leading-6 text-secondary"
                        >
                          {line}
                        </p>
                      ))}
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div
                className="mt-xl"
                aria-live={soundOn && voiceReady ? 'off' : 'polite'}
              >
                {frame.intro ? (
                  <div key="intro" className="narration-line">
                    <h2 className="text-lg font-semibold text-primary">{INTRO_TITLE}</h2>
                    <p className="mt-md text-md leading-7 text-secondary">{INTRO_LINE}</p>
                  </div>
                ) : frame.beat === 0 ? (
                  <div key={`cover-${frame.index}`} className="narration-line">
                    <h2 className="text-lg font-semibold text-primary">
                      {frame.chapter.coverTitle}
                    </h2>
                    <p className="mt-md text-md leading-7 text-secondary">
                      {frame.chapter.coverLine}
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-primary">{frame.chapter.name}</h2>
                    <p
                      key={`one-${frame.index}`}
                      className="narration-line mt-md text-md leading-7 text-secondary"
                    >
                      {frame.chapter.lines[0]}
                    </p>
                    {frame.beat === 2 ? (
                      <p
                        key={`two-${frame.index}`}
                        className="narration-line mt-sm text-md leading-7 text-secondary"
                      >
                        {frame.chapter.lines[1]}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {!staticMode ? (
              <>
                <div className="mt-xl h-1 w-full overflow-hidden rounded-full bg-divider">
                  <span
                    className="block h-full w-full origin-left bg-reckon-accent"
                    style={{ transform: `scaleX(${frame.fill})` }}
                  />
                </div>
                <p className="mt-md text-xs leading-5 text-quaternary">
                  {voiceChecked && !voiceReady
                    ? NARRATION_UNAVAILABLE
                    : !started
                      ? 'Press play to start the film and the narration.'
                      : !soundOn
                        ? 'Sound off. The full narration for this section stays on screen.'
                        : !voiceReady
                          ? 'Playing silently. The full narration for this section stays on screen.'
                          : frame.intro
                            ? playing
                              ? 'The intro line is playing.'
                              : 'Paused on the intro. Press play to continue.'
                            : playing && frame.beat === 0
                              ? 'The cover holds, then the first line begins.'
                              : playing
                                ? 'The narration follows the chapter clock.'
                                : 'Paused on this chapter. Press play to continue.'}
                </p>
                <ol className="mt-lg grid grid-cols-7 gap-xs" aria-label="Section progress">
                  {segments.map((segment, segmentIndex) => (
                    <li key={segment.id}>
                      <button
                        type="button"
                        onClick={() => goToSegment(segment.chapterIndex)}
                        aria-label={
                          segment.chapterIndex < 0
                            ? 'Go to the intro'
                            : `Go to chapter ${segment.chapterIndex + 1}, ${segment.full}`
                        }
                        aria-current={segmentIndex === activeSegment ? 'step' : undefined}
                        className={`block min-h-11 w-full rounded-sm ${FOCUS}`}
                      >
                        <span
                          className={`block h-1 w-full rounded-full ${
                            segmentIndex <= activeSegment ? 'bg-reckon-accent' : 'bg-divider'
                          }`}
                        />
                        <span
                          className={`mt-xs block truncate text-left text-xs ${
                            segmentIndex === activeSegment ? 'text-primary' : 'text-quaternary'
                          }`}
                        >
                          {segment.chapterIndex < 0
                            ? 'Intro'
                            : String(segment.chapterIndex + 1).padStart(2, '0')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </aside>
        </div>

        <p className="mt-md text-xs leading-5 text-quaternary">
          A {formatClock(TOTAL_SECONDS)} reconstruction, captured 31 October 2026. Speech runs in
          your browser. No API is called: every number is a captured fixture, and the only requests
          are the brand images.
        </p>
      </div>
    </section>
  )
}
