import type { ReactNode } from 'react'
import { ArrowRight, Code, Plugs, WarningCircle } from '@phosphor-icons/react'
import { LINKS, TATUM_ID } from './data'
import { Container, ExternalLink, SectionHead } from './ui'

export function TatumSection() {
  return (
    <section id="tatum" aria-labelledby="tatum-title" className="border-b border-primary py-8xl sm:py-9xl">
      <Container>
        <SectionHead
          id="tatum-title"
          index="05"
          label="Tatum"
          title="Tatum builds the app. Verification still has a gap."
          lede="Tatum AI Builder is the build environment, not a decoration on the page. The server also carries a Tatum API client for REST and JSON-RPC work. Sui is the exception: Tatum has no Sui JSON-RPC host, so payment verification calls Sui GraphQL today."
        />

        <div className="mt-4xl grid gap-xl lg:grid-cols-3">
          <TatumCard
            icon={<Code size={16} weight="bold" aria-hidden="true" />}
            label="Build"
            title="Tatum AI Builder"
            body="The app was scaffolded and extended in the builder. Ten commits carry the AI Builder author, and the build ID is 6addae51...f9."
            href={LINKS.commits}
            linkLabel="Inspect the commits"
          />
          <TatumCard
            icon={<Plugs size={16} weight="bold" aria-hidden="true" />}
            label="Server"
            title="Tatum API client"
            body="The server routes through a Tatum-aware client. The key stays server-side. Today its visible use is a health check; the Sui verification path below is the exception."
            href={LINKS.tatumClientSource}
            linkLabel="Read the client"
          />
          <TatumCard
            icon={<WarningCircle size={16} weight="bold" aria-hidden="true" />}
            label="Gap"
            title="No Sui JSON-RPC host"
            body="Verification uses the public Sui GraphQL endpoint. The TODO is explicit: move to Tatum Sui gRPC when the host exists."
            href={LINKS.verifySource}
            linkLabel="Read the TODO"
            tone="accent"
          />
        </div>

        <div className="mt-4xl grid gap-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl">
            <div className="flex flex-wrap items-center justify-between gap-md">
              <p className="text-xs font-medium text-quaternary">Verification path</p>
              <span className="rounded-full border border-reckon-accent/40 px-md py-xs text-xs font-medium text-reckon-accent">
                Honest gap
              </span>
            </div>

            <div className="mt-2xl grid items-stretch gap-md sm:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-xl border border-primary bg-tertiary p-lg">
                <p className="text-xs text-quaternary">Today</p>
                <p className="mt-xs text-sm font-semibold text-primary">Sui GraphQL</p>
                <p className="mt-sm break-all font-mono text-xs leading-5 text-secondary">
                  graphql.mainnet.sui.io
                </p>
                <p className="mt-md text-xs leading-5 text-quaternary">
                  Used by the verify helper and the oracle fallback.
                </p>
              </div>
              <div className="flex items-center justify-center text-quaternary">
                <ArrowRight size={16} weight="bold" className="rotate-90 sm:rotate-0" aria-hidden="true" />
              </div>
              <div className="rounded-xl border border-dashed border-primary bg-primary p-lg">
                <p className="text-xs text-quaternary">TODO</p>
                <p className="mt-xs text-sm font-semibold text-secondary">Tatum Sui gRPC</p>
                <p className="mt-sm break-all font-mono text-xs leading-5 text-quaternary">
                  sui-mainnet-grpc.gateway.tatum.io
                </p>
                <p className="mt-md text-xs leading-5 text-quaternary">
                  Not available today. The code names the target without pretending it is live.
                </p>
              </div>
            </div>

            <div className="mt-xl rounded-lg border border-primary bg-primary p-lg">
              <p className="text-xs font-medium text-quaternary">The comment in the source</p>
              <pre className="judges-code mt-sm whitespace-pre-wrap font-mono text-xs leading-5 text-secondary">
{`// TODO: route this through Tatum Sui gRPC at
// sui-mainnet-grpc.gateway.tatum.io`}
              </pre>
            </div>

            <div className="mt-xl flex flex-wrap gap-x-xl gap-y-md">
              <ExternalLink href={LINKS.verifySource} className="text-sm">
                Verification source
              </ExternalLink>
              <ExternalLink href={LINKS.tatum} className="text-sm">
                Tatum
              </ExternalLink>
              <ExternalLink href={LINKS.tatumSource} className="text-sm">
                Tatum routes
              </ExternalLink>
            </div>
          </div>

          <div className="rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl">
            <p className="text-xs font-medium text-quaternary">What we do not claim</p>
            <h3 className="mt-sm text-lg font-semibold text-primary">
              Tatum is not verifying Sui transactions yet.
            </h3>
            <p className="mt-md text-sm leading-6 text-secondary">
              The earlier commit message says "verify Sui transactions through Tatum". The code
              does not support that reading today, so this page does not repeat it. The build is
              Tatum's; the current verification call is Sui's public GraphQL API.
            </p>
            <div className="mt-xl rounded-lg border border-primary bg-tertiary p-lg">
              <p className="text-xs text-quaternary">Build ID</p>
              <p className="mt-xs break-all font-mono text-sm text-primary">{TATUM_ID}</p>
            </div>
            <p className="mt-md text-xs leading-5 text-quaternary">
              This is the kind of gap the verification strip is for: name it, link it, and let a
              reader decide what it is worth.
            </p>
            <div className="mt-lg">
              <ExternalLink href={LINKS.repoDeployed} className="text-sm">
                Open the deployed repository
              </ExternalLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function TatumCard({
  icon,
  label,
  title,
  body,
  href,
  linkLabel,
  tone = 'neutral',
}: {
  icon: ReactNode
  label: string
  title: string
  body: string
  href: string
  linkLabel: string
  tone?: 'neutral' | 'accent'
}) {
  return (
    <div
      className={`rounded-2xl border bg-secondary p-xl ${
        tone === 'accent' ? 'border-reckon-accent/40' : 'border-primary'
      }`}
    >
      <div className="flex items-center justify-between gap-md">
        <span className={tone === 'accent' ? 'text-reckon-accent' : 'text-secondary'}>{icon}</span>
        <span className="text-xs text-quaternary">{label}</span>
      </div>
      <h3 className="mt-lg text-base font-semibold text-primary">{title}</h3>
      <p className="mt-sm text-sm leading-6 text-secondary">{body}</p>
      <div className="mt-lg">
        <ExternalLink href={href} className="text-xs" subtle>
          {linkLabel}
        </ExternalLink>
      </div>
    </div>
  )
}
