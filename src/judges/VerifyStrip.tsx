import { ArrowUpRight, CheckCircle } from '@phosphor-icons/react'
import { EVIDENCE, LINKS } from './data'
import { Container, ExternalLink, SectionHead } from './ui'

const groups = [
  {
    name: 'Live app',
    proves: 'the product and its record UI',
    href: LINKS.live,
  },
  {
    name: 'Parent repo',
    proves: 'the public source and commit history',
    href: LINKS.repoMirror,
  },
  {
    name: 'Deployed fork',
    proves: 'the deployment remote',
    href: LINKS.repoDeployed,
  },
  {
    name: 'Walrus blob',
    proves: 'a real memory write exists',
    href: LINKS.blob,
  },
  {
    name: 'Walrus Memory SDK',
    proves: 'the write and recall contract',
    href: LINKS.walrusMemory,
  },
  {
    name: 'Walrus',
    proves: 'where the blob is stored',
    href: LINKS.walrus,
  },
  {
    name: 'Sui',
    proves: 'where the account and payment live',
    href: LINKS.sui,
  },
  {
    name: 'Tatum',
    proves: 'the build environment',
    href: LINKS.tatum,
  },
  {
    name: 'x402',
    proves: 'the payment standard',
    href: LINKS.x402,
  },
  {
    name: 'suimpp',
    proves: 'the Sui scheme used here',
    href: LINKS.suimpp,
  },
  {
    name: 'mppx',
    proves: 'the server-side charge handler',
    href: LINKS.mppx,
  },
  {
    name: 'Polymarket',
    proves: 'the market feed',
    href: LINKS.gamma,
  },
]

export function VerifyStrip() {
  return (
    <section id="verify" aria-labelledby="verify-title" className="border-b border-primary py-8xl sm:py-9xl">
      <Container>
        <div className="flex flex-col justify-between gap-2xl lg:flex-row lg:items-end">
          <SectionHead
            id="verify-title"
            index="07"
            label="Verification"
            title="Every claim, with a link."
            lede="If a number appears on this page, it came from one of these places. Open them in order, or jump to the one you doubt. A claim without a link would be a bug."
          />
          <div className="flex items-center gap-sm text-xs text-quaternary">
            <CheckCircle size={14} weight="fill" className="text-reckon-accent" aria-hidden="true" />
            12 claim checks, each with a source
          </div>
        </div>

        <div className="mt-4xl overflow-hidden rounded-2xl border border-primary bg-secondary">
          <div className="hidden grid-cols-[1.15fr_0.95fr_auto] gap-xl border-b border-primary px-xl py-md text-xs text-quaternary sm:grid">
            <span>Claim</span>
            <span>Captured evidence</span>
            <span className="text-right">Check</span>
          </div>
          <ul className="divide-y divide-primary">
            {EVIDENCE.map((item, index) => (
              <li
                key={item.claim}
                className="grid gap-sm px-xl py-lg sm:grid-cols-[1.15fr_0.95fr_auto] sm:items-center sm:gap-xl"
              >
                <div className="flex min-w-0 items-baseline gap-md">
                  <span className="font-mono text-xs text-quaternary" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium text-primary">{item.claim}</span>
                </div>
                <p className="break-all font-mono text-xs text-secondary">{item.value}</p>
                <div className="sm:text-right">
                  <ExternalLink href={item.href} className="text-xs">
                    {item.linkLabel}
                  </ExternalLink>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5xl">
          <div className="flex flex-wrap items-baseline justify-between gap-md">
            <h3 className="text-lg font-semibold text-primary">Sources, grouped</h3>
            <p className="text-xs text-quaternary">What each link proves</p>
          </div>
          <div className="mt-xl grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <a
                key={group.name}
                href={group.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-16 items-start justify-between gap-md rounded-xl border border-primary bg-secondary p-lg transition-colors duration-200 hover:border-reckon-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reckon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-primary group-hover:text-reckon-accent">
                    {group.name}
                  </span>
                  <span className="mt-xs block text-xs leading-5 text-quaternary">
                    {group.proves}
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </span>
                <ArrowUpRight
                  size={14}
                  weight="bold"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-quaternary transition-colors group-hover:text-reckon-accent"
                />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-2xl max-w-3xl text-xs leading-5 text-tertiary">
          If a repository link returns 404, the fork is still private; the parent repository is
          public.
        </p>
      </Container>
    </section>
  )
}
