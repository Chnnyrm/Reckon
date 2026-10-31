import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowSquareOut,
  Check,
  Copy as CopyIcon,
} from '@phosphor-icons/react'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-xl sm:px-2xl lg:px-4xl ${className}`}>
      {children}
    </div>
  )
}

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black'

export function ExternalLink({
  href,
  children,
  className = '',
  icon = true,
  subtle = false,
}: {
  href: string
  children: ReactNode
  className?: string
  icon?: boolean
  subtle?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-xs rounded-sm underline-offset-4 transition-colors duration-200 ${
        subtle
          ? 'text-secondary underline decoration-primary hover:text-primary hover:decoration-reckon-accent'
          : 'text-primary underline decoration-primary hover:text-reckon-accent hover:decoration-reckon-accent'
      } ${focus} ${className}`}
    >
      <span>{children}</span>
      <span className="sr-only"> (opens in a new tab)</span>
      {icon ? (
        <ArrowSquareOut
          size={13}
          weight="bold"
          aria-hidden="true"
          className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      ) : null}
    </a>
  )
}

export function ExternalButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}) {
  const styles =
    variant === 'primary'
      ? 'bg-brand-solid text-black hover:bg-brand-solid-hover'
      : 'border border-primary bg-secondary text-primary hover:border-reckon-accent hover:text-reckon-accent'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-11 items-center justify-center gap-sm rounded-lg px-xl py-lg text-sm font-semibold transition-colors duration-200 active:scale-[0.99] ${styles} ${focus} ${className}`}
    >
      <span>{children}</span>
      <span className="sr-only"> (opens in a new tab)</span>
      <ArrowSquareOut size={15} weight="bold" aria-hidden="true" />
    </a>
  )
}

export function ScrollButton({
  target,
  children,
  variant = 'secondary',
  className = '',
}: {
  target: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'quiet'
  className?: string
}) {
  const styles =
    variant === 'primary'
      ? 'bg-brand-solid text-black hover:bg-brand-solid-hover'
      : variant === 'quiet'
        ? 'text-secondary hover:text-primary'
        : 'border border-primary bg-secondary text-primary hover:border-reckon-accent hover:text-reckon-accent'

  return (
    <button
      type="button"
      onClick={() => {
        const element = document.getElementById(target)
        if (!element) return
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
      }}
      className={`inline-flex min-h-11 items-center justify-center gap-sm rounded-lg px-xl py-lg text-sm font-semibold transition-colors duration-200 ${styles} ${focus} ${className}`}
    >
      {children}
    </button>
  )
}

export function CopyButton({
  value,
  label,
  className = '',
}: {
  value: string
  label: string
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value)
      } else {
        const area = document.createElement('textarea')
        area.value = value
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        if (!ok) throw new Error('copy failed')
      }
      setState('copied')
    } catch {
      setState('failed')
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2200)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`inline-flex min-h-8 items-center gap-xs rounded-md border border-primary bg-tertiary px-md py-xs text-xs font-medium text-secondary transition-colors duration-200 hover:border-reckon-accent hover:text-primary ${focus} ${className}`}
    >
      {state === 'copied' ? (
        <Check size={12} weight="bold" aria-hidden="true" />
      ) : (
        <CopyIcon size={12} weight="bold" aria-hidden="true" />
      )}
      <span aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
      </span>
    </button>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-sm text-xs font-medium text-reckon-accent">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-reckon-accent" />
      <span>{children}</span>
    </p>
  )
}

export function SectionHead({
  index,
  label,
  title,
  lede,
  id,
}: {
  index: string
  label: string
  title: string
  lede: ReactNode
  id: string
}) {
  return (
    <div className="max-w-3xl">
      <p className="mb-lg flex items-center gap-md font-mono text-xs text-quaternary">
        <span className="text-reckon-accent">{index}</span>
        <span aria-hidden="true" className="h-px w-8 bg-divider" />
        <span>{label}</span>
      </p>
      <h2
        id={id}
        className="text-heading-xs font-semibold tracking-tight text-primary sm:text-heading-sm"
      >
        {title}
      </h2>
      <p className="mt-xl max-w-2xl text-md text-secondary">{lede}</p>
    </div>
  )
}
