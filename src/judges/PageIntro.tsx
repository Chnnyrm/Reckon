import { useCallback } from 'react'
import { useReducedMotion } from './ui'

const CHIPS = [
  { label: 'What it is', target: 'what-it-is' },
  { label: 'Walrus Memory', target: 'walrus-memory' },
  { label: 'Tatum', target: 'tatum' },
  { label: 'Agent payments', target: 'payments' },
  { label: 'Tatum AI Builder', target: 'build' },
]

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black'

export function PageIntro() {
  const reduced = useReducedMotion()

  const jump = useCallback(
    (target: string) => {
      const element = document.getElementById(target)
      if (!element) return
      element.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      })
    },
    [reduced]
  )

  return (
    <section
      aria-labelledby="intro-title"
      className="border-b border-primary pb-2xl pt-3xl sm:pb-3xl sm:pt-4xl"
    >
      <div className="mx-auto w-full max-w-[1100px] px-xl sm:px-2xl">
        <p className="flex items-center gap-sm text-xs font-medium text-reckon-accent">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-reckon-accent" />
          <span>Reckon</span>
        </p>

        <h2
          id="intro-title"
          className="mt-lg max-w-2xl text-2xl font-semibold tracking-tight text-primary sm:text-heading-sm"
        >
          A forecast record written before the outcome.
        </h2>

        <p className="mt-md max-w-2xl text-md leading-7 text-secondary">
          For forecasters, analysts, and the software agents that rely on their calls.
        </p>

        <nav aria-label="Explanations on this page" className="mt-xl flex flex-wrap gap-sm">
          {CHIPS.map((chip) => (
            <button
              key={chip.target}
              type="button"
              onClick={() => jump(chip.target)}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-secondary px-md py-sm text-xs font-medium text-secondary transition-colors duration-200 hover:border-reckon-accent hover:text-primary ${focus}`}
            >
              {chip.label}
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}
