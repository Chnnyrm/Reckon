// Guards for the public /judges page. These are source-level invariants, not a
// browser test: they catch a fabricated value, a broken link attribute, a
// non-ASCII glyph, a broken film clock or a token that should not be on the
// page before a build.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const judgesDir = join(root, 'src', 'judges')
const files = readdirSync(judgesDir).filter((file) => /\.(tsx|ts|css)$/.test(file))
const sources = Object.fromEntries(
  files.map((file) => [file, readFileSync(join(judgesDir, file), 'utf8')])
)
const all = Object.values(sources).join('\n')
const filmModel = await import(pathToFileURL(join(judgesDir, 'film.ts')).href)
const narrationModel = await import(pathToFileURL(join(judgesDir, 'narration.ts')).href)

test('the verified facts are the ones in the page', () => {
  const facts = [
    'https://reckon-three-beta.vercel.app',
    'https://github.com/Chnnyrm/Reckon',
    'https://github.com/Ksschkw/Reckon',
    '6addae51f9f9306c432153f9',
    'reckon',
    '0xd6122a37730a5c4d4cd72a690cf8f9d7a2590b33567d266e1faef3e9b6dbeeac',
    '9N5s961oZXH3-eA1pbazpLo1Xs1yTEgWd7xNV1hiEWU',
    '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
    '0x051cd98ec3919dd48497b2e6d9e3304e8c9e8cbafa83cb4b26ae1139199516d5',
    '3.8s',
    '1.0 to 1.2s',
    '15s',
    'about 12 seconds',
    'AI Builder <ai-builder@tatum.io>',
  ]
  for (const fact of facts) {
    assert.ok(all.includes(fact), `missing verified fact: ${fact}`)
  }

  assert.match(sources['data.ts'], /export const AI_COMMIT_COUNT = 10/)
  assert.match(sources['BuildEvidence.tsx'], /AI_COMMIT_COUNT/)
  assert.match(sources['BuildEvidence.tsx'], /LINKS\.commits/)
  assert.match(sources['data.ts'], /commits\/main/)
})

test('the page is ASCII only', () => {
  for (const [file, source] of Object.entries(sources)) {
    assert.doesNotMatch(source, /[^\x00-\x7F]/, `${file} contains a non-ASCII character`)
  }
})

test('every literal anchor opens a new tab with a safe rel', () => {
  const anchors = all.match(/<a\b[\s\S]*?>/g) ?? []
  assert.ok(anchors.length > 0, 'expected at least one literal anchor')
  for (const anchor of anchors) {
    assert.match(anchor, /target="_blank"/, `anchor lacks target: ${anchor.slice(0, 120)}`)
    assert.match(anchor, /rel="noopener noreferrer"/, `anchor lacks rel: ${anchor.slice(0, 120)}`)
  }
  assert.doesNotMatch(all, /href="(?:#|\/(?!\/))/, 'internal anchors are not allowed')
})

test('the page keeps the dark brand constraints', () => {
  const forbidden = [
    /font-bold/,
    /\bitalic\b/,
    /purple/i,
    /indigo/i,
    /violet/i,
    /gradient/i,
    /#4f37fd/i,
    /#4832e7/i,
  ]
  for (const pattern of forbidden) {
    assert.doesNotMatch(all, pattern, `forbidden token on the judges page: ${pattern}`)
  }
  assert.match(all, /text-heading-/)
  assert.match(all, /bg-reckon-accent/)
})

test('the film is first, lazy, and has one clock', () => {
  const page = sources['JudgesPage.tsx']
  const film = sources['Film.tsx']
  const model = sources['film.ts']
  const scenes = sources['FilmStages.tsx']

  assert.match(page, /lazy\(\(\) => import\('\.\/Film'\)\)/)
  assert.match(page, /<Suspense/)
  assert.ok(
    page.indexOf('<Suspense') < page.indexOf('<Problem'),
    'the film must be the first section after the masthead'
  )
  for (const section of [
    '<Problem',
    '<BuildEvidence',
    '<WalrusSection',
    '<TatumSection',
    '<PaymentsSection',
    '<VerifyStrip',
    '<Limits',
  ]) {
    assert.ok(page.includes(section), `missing section: ${section}`)
  }

  assert.match(film, /window\.requestAnimationFrame/)
  for (const [file, source] of Object.entries({
    'Film.tsx': film,
    'film.ts': model,
    'FilmStages.tsx': scenes,
    'FilmCover.tsx': sources['FilmCover.tsx'],
  })) {
    assert.doesNotMatch(source, /\bsetTimeout\s*\(|\bsetInterval\s*\(/, `${file} uses a timer`)
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest/, `${file} calls the network`)
  }

  assert.equal((model.match(/id: '/g) ?? []).length, 6, 'expected six chapters')
  assert.equal((model.match(/coverTitle: '/g) ?? []).length, 6, 'expected six cover cards')
  assert.match(model, /coverTitle: 'Built with Tatum AI Builder'/)
  assert.match(model, /sceneMs:/)
  assert.match(scenes, /function Pointer\(/)
  assert.match(scenes, /function BuilderScene\(/)
  assert.match(scenes, /TATUM_ID/)
  assert.match(scenes, /AI_COMMIT_COUNT/)
  assert.match(scenes, /AI_AUTHOR/)
})

test('brand marks are real files with intrinsic sizes', () => {
  const brand = sources['Brand.tsx']
  assert.match(brand, /\/brands\/tatum-chip\.png/)
  assert.match(brand, /\/brands\/sui-chip\.png/)
  assert.match(brand, /\/brands\/memwal-chip\.png/)
  assert.match(brand, /\/brands\/walrus-white\.png/)
  assert.match(brand, /width=\{width\}/)
  assert.match(brand, /height=\{height\}/)
  assert.match(brand, /alt=/)
})

test('the scene is lazy, pausable and reduced-motion safe', () => {
  const film = sources['Film.tsx']
  const scene = sources['AmbientScene.tsx']
  const css = sources['judges.css']
  const cover = sources['FilmCover.tsx']

  assert.match(film, /lazy\(\(\) => import\('\.\/AmbientScene'\)\)/)
  assert.match(film, /<Suspense/)
  assert.match(film, /paused=\{!playing\}/)
  assert.match(film, /useReducedMotion/)
  assert.match(film, /staticMode/)
  assert.match(scene, /IntersectionObserver/)
  assert.match(scene, /visibilitychange/)
  assert.match(scene, /prefers-reduced-motion: reduce/)
  assert.match(scene, /pausedRef/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.match(cover, /coverOpacityAt/)
})

test('the route is isolated from the product app', () => {
  const main = readFileSync(join(root, 'src', 'main.tsx'), 'utf8')
  assert.match(main, /const path = window\.location\.pathname\.replace/)
  assert.match(main, /path === '\/judges'/)
  assert.match(main, /lazy\(\(\) => import\('\.\/judges\/JudgesPage\.tsx'\)\)/)
  assert.match(main, /<App \/>/)
})


test('the narration is paced to fit each chapter', () => {
  const {
    CHAPTERS,
    INTRO_LINE,
    INTRO_MS,
    INTRO_TITLE,
    TOTAL_SECONDS,
    CHAPTER_STARTS,
    chapterDurationMs,
    beatTwoStartMs,
    speechEstimateMs,
    FIRST_LINE_AT,
    timelineAt,
  } = filmModel
  assert.equal(CHAPTERS.length, 6)
  assert.ok(TOTAL_SECONDS >= 180 && TOTAL_SECONDS <= 190, `runtime ${TOTAL_SECONDS}s is outside 180 to 190`)

  assert.equal(INTRO_TITLE, 'A forecasting record you can audit')
  const introWords = INTRO_LINE.trim().split(/\s+/).length
  assert.ok(introWords >= 25 && introWords <= 32, `intro has ${introWords} words`)
  assert.doesNotMatch(INTRO_LINE, /\d{3,}|0x[0-9a-f]|9N5s961|6addae|a1ec7f|::/i)
  assert.ok(INTRO_MS >= 7000)
  assert.ok(INTRO_MS >= speechEstimateMs(INTRO_LINE) + 500, 'the intro must fit its spoken line')
  assert.equal(CHAPTER_STARTS[0], INTRO_MS)
  assert.equal(timelineAt(0).intro, true)
  assert.equal(timelineAt(INTRO_MS).intro, false)
  assert.equal(timelineAt(INTRO_MS).index, 0)

  let total = INTRO_MS
  for (const chapter of CHAPTERS) {
    assert.equal(chapter.lines.length, 2, `${chapter.id} needs two beats`)

    for (const [index, line] of chapter.lines.entries()) {
      const words = line.trim().split(/\s+/).length
      assert.ok(
        words >= 20 && words <= 30,
        `${chapter.id} beat ${index + 1} has ${words} spoken words`
      )
      const sentences = (line.match(/[.!?](\s|$)/g) ?? []).length
      assert.ok(
        sentences >= 1 && sentences <= 3,
        `${chapter.id} beat ${index + 1} has ${sentences} sentences`
      )

      // No identifier or long number is spoken. These belong in the visible
      // text, where a reader can copy them.
      assert.doesNotMatch(line, /\d{3,}|0x[0-9a-f]|9N5s961|6addae|a1ec7f|::/i)
    }

    const duration = chapterDurationMs(chapter)
    const beatTwo = beatTwoStartMs(chapter)
    assert.ok(
      FIRST_LINE_AT + speechEstimateMs(chapter.lines[0]) + 500 <= beatTwo,
      `${chapter.id} first line runs into the second beat`
    )
    assert.ok(
      beatTwo + speechEstimateMs(chapter.lines[1]) + 500 <= duration,
      `${chapter.id} second line runs past the chapter`
    )
    total += duration
  }
  assert.equal(Math.round(total / 1000), TOTAL_SECONDS)
})

test('the cover holds for two and a half seconds', () => {
  const {
    CHAPTERS,
    COVER_MS,
    COVER_FADE_MS,
    FIRST_LINE_AT,
    HOLD_MS,
    coverOpacityAt,
    chapterDurationMs,
  } = filmModel

  assert.equal(COVER_MS, 2800)
  assert.equal(COVER_FADE_MS, 350)
  assert.equal(FIRST_LINE_AT, 2450)
  assert.ok(coverOpacityAt(0) > 0.999)
  assert.ok(coverOpacityAt(FIRST_LINE_AT) > 0.999, 'the cover is still opaque when the line starts')
  const midFade = coverOpacityAt(FIRST_LINE_AT + COVER_FADE_MS / 2)
  assert.ok(midFade > 0.4 && midFade < 0.6, 'the cover must be mid dissolve')
  assert.ok(coverOpacityAt(COVER_MS) < 0.001, 'the cover must be gone when the scene starts')
  assert.equal(chapterDurationMs(CHAPTERS[0]), COVER_MS + CHAPTERS[0].sceneMs + HOLD_MS)
})

test('the header and its chips are above the player and target real sections', () => {
  const page = sources['JudgesPage.tsx']
  const intro = sources['PageIntro.tsx']

  assert.ok(page.indexOf('<PageIntro') < page.indexOf('<Suspense'), 'the intro must sit above the film')
  for (const label of [
    'What it is',
    'Walrus Memory',
    'Tatum',
    'Agent payments',
    'Tatum AI Builder',
  ]) {
    assert.ok(intro.includes(label), `missing chip: ${label}`)
  }

  for (const [file, id] of [
    ['Problem.tsx', 'what-it-is'],
    ['WalrusSection.tsx', 'walrus-memory'],
    ['TatumSection.tsx', 'tatum'],
    ['PaymentsSection.tsx', 'payments'],
    ['BuildEvidence.tsx', 'build'],
  ]) {
    assert.match(sources[file], new RegExp(`id="${id}"`), `${file} lacks the ${id} target`)
  }

  assert.match(intro, /scrollIntoView/)
  assert.match(intro, /min-h-11/)
})

test('the player is capped and the narration panel is beside it', () => {
  const film = sources['Film.tsx']

  assert.match(film, /max-w-\[1100px\]/, 'the player is not capped')
  assert.match(film, /md:grid-cols-\[320px_minmax\(0,1fr\)\]/)
  assert.match(film, /lg:grid-cols-\[340px_minmax\(0,1fr\)\]/)
  assert.match(film, /md:order-1/)
  assert.match(film, /md:order-2/)
  assert.match(film, /<aside/)
  assert.ok(film.indexOf('<aside') > film.indexOf('min-w-0 md:order-2'))
  assert.match(film, /min-h-11/)
  assert.match(film, /h-\[30rem\]/)
  assert.match(film, /grid-cols-7/)
  assert.match(film, /Go to the intro/)
})

test('the captions mirror the narration and can be turned off', () => {
  const film = sources['Film.tsx']

  assert.match(film, /const \[captionsOn, setCaptionsOn\] = useState\(true\)/)
  assert.match(film, /Turn captions off/)
  assert.match(film, /Turn captions on/)
  assert.match(film, /aria-label="Captions"/)
  assert.match(film, /h-\[4\.5rem\]/)
  assert.match(film, /text-\[10px\] leading-\[14px\]/)
  assert.match(film, /captionText/)
  assert.match(film, /frame\.intro\s*\?\s*INTRO_LINE/)
  assert.match(film, /frame\.chapter\.coverTitle/)
  assert.match(film, /frame\.chapter\.coverLine/)
  assert.match(film, /frame\.chapter\.lines\[frame\.beat - 1\]/)
  assert.doesNotMatch(film, /localStorage|sessionStorage|document\.cookie/)
})

test('the voiceover follows the browser speech brief', () => {
  const narration = sources['narration.ts']
  const film = sources['Film.tsx']

  assert.match(narration, /SPEECH_RATE = 1\.0/)
  assert.match(narration, /SPEECH_PITCH = 1\.0/)
  assert.match(narration, /SPEECH_VOLUME = 1/)
  assert.match(narration, /voiceschanged/)
  assert.match(narration, /VOICE_TIMEOUT_MS = 1600/)
  for (const name of [
    'espeak',
    'pico',
    'compact',
    'mbrola',
    'festival',
    'flite',
    'robot',
  ]) {
    assert.ok(narration.includes(`'${name}'`), `missing rejected voice: ${name}`)
  }
  for (const name of [
    'Google US English',
    'Google UK English Female',
    'Samantha',
    'Aria',
    'Jenny',
    'Zira',
    'Google UK English Male',
  ]) {
    assert.ok(narration.includes(`'${name}'`), `missing preferred voice: ${name}`)
  }
  assert.match(narration, /localService/)
  assert.match(narration, /voiceURI/)

  const unavailable = 'Narration is not available on this device.'
  assert.match(film, /NARRATION_UNAVAILABLE/)
  assert.equal(all.split(unavailable).length - 1, 1, 'the unavailable line is defined once')
  assert.ok((film.match(/NARRATION_UNAVAILABLE/g) ?? []).length >= 3, 'the line must render in the panel in both modes')

  assert.match(film, /narrator\.speak\(spokenLine\)/)
  assert.match(film, /frame\.beat === 2/)
  assert.match(film, /frame\.chapter\.coverTitle/)
  assert.match(film, /frame\.chapter\.coverLine/)
  assert.match(film, /narrator\.cancel\(\)/)
  assert.match(film, /const \[playing, setPlaying\] = useState\(false\)/)
  assert.match(film, /const \[started, setStarted\] = useState\(false\)/)
  assert.match(film, /Play the demo with sound/)
  assert.match(film, /Watch without sound/)
  assert.match(film, /Sound off/)
  assert.match(film, /staticMode/)
  assert.match(film, /\{!reduced \?/)
})

test('the voice chooser rejects synthetic engines and keeps the order', () => {
  const voice = (
    name,
    lang = 'en-US',
    localService = true,
    voiceURI = ''
  ) => ({ name, lang, localService, voiceURI })

  const { chooseVoice, isUsableVoice } = narrationModel

  assert.equal(isUsableVoice(voice('eSpeak NG')), false)
  assert.equal(isUsableVoice(voice('Pico TTS')), false)
  assert.equal(isUsableVoice(voice('Samantha (Compact)')), false)
  assert.equal(isUsableVoice(voice('Cloud English', 'en-US', false)), false)
  assert.equal(isUsableVoice(voice('Network English', 'en-US', false)), false)
  assert.equal(isUsableVoice(voice('English (America)', 'en-US', true, 'espeak')), false)
  assert.equal(isUsableVoice(voice('Google US English', 'en-US', false)), true)
  assert.equal(isUsableVoice(voice('Ting-Ting', 'zh-CN')), false)

  assert.equal(chooseVoice([voice('eSpeak NG'), voice('Pico TTS')]), null)
  assert.equal(chooseVoice([voice('Ting-Ting', 'zh-CN')]), null)

  assert.equal(
    chooseVoice([
      voice('eSpeak NG'),
      voice('Samantha'),
      voice('Google US English'),
    ]).name,
    'Google US English'
  )
  assert.equal(
    chooseVoice([
      voice('Samantha'),
      voice('Google UK English Female'),
    ]).name,
    'Google UK English Female'
  )
  assert.equal(
    chooseVoice([
      voice('Google UK English Male'),
      voice('Microsoft Zira Desktop - English (United States)'),
    ]).name,
    'Microsoft Zira Desktop - English (United States)'
  )
  assert.equal(
    chooseVoice([voice('Daniel', 'en-GB'), voice('Ting-Ting', 'zh-CN')]).name,
    'Daniel'
  )
})
