import { ArrowRight, WarningCircle } from '@phosphor-icons/react'
import { LIMITS, LINKS } from './data'
import {
  Container,
  ExternalButton,
  ExternalLink,
  ScrollButton,
  SectionHead,
} from './ui'

export function Limits() {
  return (
    <section id="limits" aria-labelledby="limits-title" className="border-b border-primary py-8xl sm:py-9xl">
      <Container>
        <SectionHead
          id="limits-title"
          index="07"
          label="Limits"
          title="What this does not do."
          lede="Six boundaries. Each one is a real constraint on what this is ready for, stated here so that nothing above has to be taken on trust."
        />

        <ol className="mt-4xl divide-y divide-primary border-y border-primary">
          {LIMITS.map((limit, index) => (
            <li key={limit.title} className="grid gap-md py-xl sm:grid-cols-[3rem_1fr] sm:gap-xl">
              <p className="font-mono text-xs text-reckon-accent">
                {String(index + 1).padStart(2, '0')}
              </p>
              <div className="min-w-0">
                <div className="flex items-start gap-md">
                  <WarningCircle
                    size={15}
                    weight="bold"
                    className="mt-1 shrink-0 text-quaternary"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-primary">{limit.title}</h3>
                    <p className="mt-xs max-w-3xl text-sm leading-6 text-secondary">{limit.body}</p>
                    <div className="mt-sm">
                      <ExternalLink href={limit.href} className="text-xs" subtle>
                        {limit.linkLabel}
                      </ExternalLink>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4xl grid gap-xl rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-medium text-reckon-accent">In short</p>
            <p className="mt-sm max-w-2xl text-lg font-semibold text-primary">
              Positions are real and graded from live prices. Markets, grading and payment
              verification run through Tatum. The payment rail is a testnet draft, and it is
              labelled as one everywhere it appears.
            </p>
            <div className="mt-lg flex flex-wrap gap-x-xl gap-y-md">
              <ExternalLink href={LINKS.deployNotes} className="text-sm">
                Deploy notes
              </ExternalLink>
              <ExternalLink href={LINKS.verifySource} className="text-sm">
                Verification source
              </ExternalLink>
              <ExternalLink href={LINKS.suimpp} className="text-sm">
                suimpp scheme
              </ExternalLink>
            </div>
          </div>
          <div className="flex flex-col gap-md sm:flex-row lg:flex-col">
            <ExternalButton href={LINKS.live}>Open the live app</ExternalButton>
            <ScrollButton target="demo">
              Replay the film
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </ScrollButton>
          </div>
        </div>
      </Container>
    </section>
  )
}
