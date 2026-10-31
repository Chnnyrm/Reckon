import { ArrowUp } from '@phosphor-icons/react'
import { Logo } from '../components/Logo'
import { ExternalButton, ExternalLink, Container } from './ui'
import { CAPTURE_DATE, LINKS } from './data'

const focus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black'

export function JudgesHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary bg-primary">
      <Container className="flex h-14 items-center justify-between gap-sm">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
          aria-label="Reckon, back to top"
          className={`shrink-0 rounded-md ${focus}`}
        >
          <Logo size={20} />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-center text-xs font-normal text-secondary sm:text-sm">
          A forecasting record you can audit
        </h1>

        <ExternalButton
          href={LINKS.live}
          className="min-h-10 shrink-0 px-md py-sm text-xs"
        >
          <span className="sm:hidden">Live</span>
          <span className="hidden sm:inline">Live app</span>
        </ExternalButton>
      </Container>
    </header>
  )
}

export function JudgesFooter() {
  return (
    <footer className="border-t border-primary py-5xl">
      <Container>
        <div className="grid gap-4xl lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo size={30} />
            <p className="mt-lg text-sm text-secondary">
              A forecasting record you can audit. Positions are written before outcomes, and
              rebuilt from Walrus Memory on every read, with a labelled cache fallback.
            </p>
            <ExternalButton href={LINKS.live} className="mt-xl">
              Open the live app
            </ExternalButton>
          </div>

          <FooterColumn
            title="The app"
            links={[
              { label: 'Live app', href: LINKS.live },
              { label: 'Market API', href: LINKS.gamma },
              { label: 'One market', href: LINKS.market },
            ]}
          />
          <FooterColumn
            title="The record"
            links={[
              { label: 'Committed blob', href: LINKS.blob },
              { label: 'Walrus Memory SDK', href: LINKS.walrusMemory },
              { label: 'Memory account', href: LINKS.accountExplorer },
            ]}
          />
          <FooterColumn
            title="The build"
            links={[
              { label: 'Parent repo', href: LINKS.repoMirror },
              { label: 'Deployed fork', href: LINKS.repoDeployed },
              { label: 'Tatum', href: LINKS.tatum },
            ]}
          />
        </div>

        <div className="mt-5xl flex flex-col gap-lg border-t border-primary pt-xl sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-tertiary">
            Demo values captured {CAPTURE_DATE}. Sources linked above.
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
            className={`inline-flex items-center gap-xs self-start rounded-sm text-xs text-secondary transition-colors hover:text-primary sm:self-auto ${focus}`}
          >
            <ArrowUp size={12} weight="bold" aria-hidden="true" />
            Back to top
          </button>
        </div>
      </Container>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-medium text-tertiary">{title}</p>
      <ul className="mt-lg space-y-md">
        {links.map((link) => (
          <li key={link.href}>
            <ExternalLink href={link.href} subtle icon={false} className="text-sm">
              {link.label}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

