// The voiceover for the film. The browser speaks one line at the start of each
// chapter and the left panel shows the same line in full. The chosen voice is
// private to this module: the page never names it, because the available voice
// depends on the machine and a name in the UI would be a claim the page cannot
// keep.
//
// Speech is best effort. If the browser has no speech synthesis, or no English
// voice arrives before the timeout, the film plays silently and the panel keeps
// the text. Nothing here can stop the clock.

export const SPEECH_RATE = 0.92
export const SPEECH_PITCH = 1.02
export const SPEECH_VOLUME = 1
export const VOICE_TIMEOUT_MS = 1600

// In preference order. A name match wins over a language match, so a machine
// with an English female voice keeps it. The language fallbacks follow the
// brief: British English first, then American, then any English voice.
const PREFERRED_NAMES = [
  'female',
  'samantha',
  'zira',
  'aria',
  'jenny',
  'google uk english female',
]

function isEnglish(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('en')
}

export function chooseVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const english = voices.filter(isEnglish)
  for (const name of PREFERRED_NAMES) {
    const match = english.find((voice) => voice.name.toLowerCase().includes(name))
    if (match) return match
  }

  const british = english.find((voice) => voice.lang.toLowerCase().startsWith('en-gb'))
  if (british) return british

  const american = english.find((voice) => voice.lang.toLowerCase().startsWith('en-us'))
  if (american) return american

  return english[0] ?? null
}

function speechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return window.speechSynthesis
}

export function waitForVoices(timeoutMs = VOICE_TIMEOUT_MS): Promise<SpeechSynthesisVoice[]> {
  const synth = speechSynthesis()
  if (!synth) return Promise.resolve([])

  const current = synth.getVoices()
  if (current.length > 0) return Promise.resolve(current)

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      synth.removeEventListener('voiceschanged', finish)
      resolve(synth.getVoices())
    }
    const timer = window.setTimeout(finish, timeoutMs)
    synth.addEventListener('voiceschanged', finish)
  })
}

export class Narrator {
  private voice: SpeechSynthesisVoice | null = null
  private init: Promise<boolean> | null = null
  private generation = 0
  private readonly supported: boolean

  constructor() {
    this.supported =
      speechSynthesis() !== null &&
      typeof window !== 'undefined' &&
      typeof window.SpeechSynthesisUtterance === 'function'
  }

  ready(): Promise<boolean> {
    if (!this.supported) return Promise.resolve(false)
    if (!this.init) {
      this.init = waitForVoices().then((voices) => {
        this.voice = chooseVoice(voices)
        return this.voice !== null
      })
    }
    return this.init
  }

  speak(line: string): boolean {
    const synth = speechSynthesis()
    if (!synth) return false

    if (!this.voice) {
      this.voice = chooseVoice(synth.getVoices())
    }
    if (!this.voice) return false

    let utterance: SpeechSynthesisUtterance
    try {
      utterance = new SpeechSynthesisUtterance(line)
    } catch {
      return false
    }
    utterance.voice = this.voice
    utterance.lang = this.voice.lang
    utterance.rate = SPEECH_RATE
    utterance.pitch = SPEECH_PITCH
    utterance.volume = SPEECH_VOLUME

    this.generation += 1
    const generation = this.generation

    // Chrome can drop an utterance queued in the same task as a cancel. A
    // short gap makes a chapter change reliable, and the generation guard
    // keeps a cancelled line from starting after a pause.
    synth.cancel()
    window.setTimeout(() => {
      if (generation !== this.generation) return
      try {
        synth.speak(utterance)
      } catch {
        // A browser that refuses speech is a silent film, not a broken one.
      }
    }, 60)

    return true
  }

  cancel(): void {
    this.generation += 1
    speechSynthesis()?.cancel()
  }
}

export const narrator = new Narrator()
