// The voiceover for the film. The browser speaks one line at the start of each
// chapter and the left panel shows the same line in full. The chosen voice is
// private to this module: the page never names it, because the available voice
// depends on the machine and a name in the UI would be a claim the page cannot
// keep.
//
// Plain rate and pitch on purpose. Several engines stretch the waveform when
// the rate is below 1, and the result is thin and full of artefacts. A voice
// that is not a normal English voice is worse than no voice at all, so the
// synthetic Linux and Android engines are rejected rather than used.
//
// Speech is best effort. If the browser has no speech synthesis, or no usable
// English voice arrives before the timeout, the film plays silently and the
// panel keeps the text. Nothing here can stop the clock.

export const SPEECH_RATE = 1.0
export const SPEECH_PITCH = 1.0
export const SPEECH_VOLUME = 1
export const VOICE_TIMEOUT_MS = 1600

// Checked, case-insensitively, against both the voice name and its URI. These
// are the engines that read as static, buzz or an oddly pitched monotone.
export const REJECTED_VOICE_NAMES = [
  'espeak',
  'pico',
  'compact',
  'mbrola',
  'festival',
  'flite',
  'robot',
]

// A non-local voice that presents itself as a network voice is another remote
// synthesis service. The name has to carry one of these markers to be
// rejected; a network-backed Google voice keeps its ordinary name and is
// still allowed.
export const NETWORK_VOICE_MARKERS = [
  'network',
  'online',
  'remote',
  'cloud',
  'internet',
]

// In order. A name match is case-insensitive. Exact names win over names that
// merely contain the preferred name, and the first usable match is taken.
export const PREFERRED_VOICES = [
  'Google US English',
  'Google UK English Female',
  'Samantha',
  'Aria',
  'Jenny',
  'Zira',
  'Google UK English Male',
]

function textFor(voice: SpeechSynthesisVoice): { name: string; uri: string } {
  return {
    name: typeof voice.name === 'string' ? voice.name : '',
    uri: typeof voice.voiceURI === 'string' ? voice.voiceURI : '',
  }
}

function matchesMarker(value: string, markers: string[]): boolean {
  const text = value.toLowerCase()
  return markers.some((marker) => text.includes(marker))
}

export function isRejectedVoice(voice: SpeechSynthesisVoice): boolean {
  const { name, uri } = textFor(voice)
  if (matchesMarker(name, REJECTED_VOICE_NAMES)) return true
  if (matchesMarker(uri, REJECTED_VOICE_NAMES)) return true
  if (!voice.localService && matchesMarker(name, NETWORK_VOICE_MARKERS)) return true
  return false
}

export function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  return typeof voice.lang === 'string' && voice.lang.toLowerCase().startsWith('en')
}

export function isUsableVoice(voice: SpeechSynthesisVoice): boolean {
  return isEnglishVoice(voice) && !isRejectedVoice(voice)
}

export function chooseVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const usable = voices.filter(isUsableVoice)
  if (usable.length === 0) return null

  for (const preferred of PREFERRED_VOICES) {
    const wanted = preferred.toLowerCase()
    const exact = usable.find((voice) => voice.name.toLowerCase() === wanted)
    if (exact) return exact
    const match = usable.find((voice) => voice.name.toLowerCase().includes(wanted))
    if (match) return match
  }

  return usable[0]
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
    // The engine is checked again here, so a rejected voice can never be used
    // even if the list changed between ready() and this call.
    if (!this.voice || !isUsableVoice(this.voice)) {
      this.voice = null
      return false
    }

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
