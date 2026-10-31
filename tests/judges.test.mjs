// Guards for the public /judges page. These are source-level invariants, not a
// browser test: they catch a fabricated value, a broken link attribute, a
// non-ASCII glyph or a token that should not be on the page before a build.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const judgesDir = join(root, 'src', 'judges')
const files = readdirSync(judgesDir).filter((file) => /\.(tsx|ts|css)$/.test(file))
const sources = Object.fromEntries(
  files.map((file) => [file, readFileSync(join(judgesDir, file), 'utf8')])
)
const all = Object.values(sources).join('\n')

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
    '10 commits',
  ]
  for (const fact of facts) {
    assert.ok(all.includes(fact), `missing verified fact: ${fact}`)
  }
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

test('the scene is lazy, pausable and reduced-motion safe', () => {
  const walkthrough = readFileSync(join(judgesDir, 'Walkthrough.tsx'), 'utf8')
  const scene = readFileSync(join(judgesDir, 'AmbientScene.tsx'), 'utf8')
  const css = readFileSync(join(judgesDir, 'judges.css'), 'utf8')

  assert.match(walkthrough, /lazy\(\(\) => import\('\.\/AmbientScene'\)\)/)
  assert.match(walkthrough, /<Suspense/)
  assert.match(scene, /IntersectionObserver/)
  assert.match(scene, /visibilitychange/)
  assert.match(scene, /prefers-reduced-motion: reduce/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('the route is isolated from the product app', () => {
  const main = readFileSync(join(root, 'src', 'main.tsx'), 'utf8')
  assert.match(main, /const path = window\.location\.pathname\.replace/)
  assert.match(main, /path === '\/judges'/)
  assert.match(main, /lazy\(\(\) => import\('\.\/judges\/JudgesPage\.tsx'\)\)/)
  assert.match(main, /<App \/>/)
})
