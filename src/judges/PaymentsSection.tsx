import { useId } from 'react'
import {
  ArrowRight,
  Key,
  LockKey,
  Wallet,
} from '@phosphor-icons/react'
import { LINKS, X402_CHALLENGE } from './data'
import {
  Container,
  CopyButton,
  ExternalLink,
  SectionHead,
} from './ui'

const agentSteps = [
  {
    title: 'Request',
    body: 'The agent calls the public URL. No account, key or session is sent.',
    meta: 'GET /api/oracle/verdict',
  },
  {
    title: 'Challenge',
    body: 'The endpoint answers 402 with the price and the recipient in the body.',
    meta: 'HTTP 402',
  },
  {
    title: 'Pay',
    body: 'The agent pays 0.01 USDC on Sui testnet through the suimpp scheme and mppx.',
    meta: 'scheme sui',
  },
  {
    title: 'Verdict',
    body: 'The agent retries with the transaction digest. The endpoint verifies it and answers.',
    meta: 'HTTP 200',
  },
]

export function PaymentsSection() {
  const headingId = useId()

  return (
    <section
      id="payments"
      aria-labelledby={`${headingId}-title`}
      className="border-b border-primary py-8xl sm:py-9xl"
    >
      <Container>
        <SectionHead
          id={`${headingId}-title`}
          index="06"
          label="Agent payments"
          title="An agent pays for one call."
          lede="The oracle endpoint has no account system. It is a public URL that answers 402 until the request carries a valid Sui payment digest. This is the flow from the agent's side: read the challenge, pay, retry, get the verdict."
        />

        <ol className="mt-4xl grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          {agentSteps.map((step, index) => (
            <li key={step.title} className="relative rounded-xl border border-primary bg-secondary p-lg">
              <div className="flex items-center justify-between gap-sm">
                <span className="font-mono text-xs text-reckon-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-mono text-xs text-quaternary">{step.meta}</span>
              </div>
              <p className="mt-lg text-sm font-semibold text-primary">{step.title}</p>
              <p className="mt-xs text-xs leading-5 text-secondary">{step.body}</p>
              {index < agentSteps.length - 1 ? (
                <ArrowRight
                  size={14}
                  weight="bold"
                  aria-hidden="true"
                  className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-primary p-xs text-quaternary lg:block"
                />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="mt-xl grid gap-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-primary bg-secondary">
            <div className="flex flex-wrap items-center justify-between gap-md border-b border-primary px-xl py-lg">
              <div className="flex items-center gap-md">
                <LockKey size={16} weight="bold" className="text-reckon-accent" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary">The live challenge</p>
              </div>
              <span className="rounded-full border border-reckon-accent/40 px-md py-xs text-xs font-medium text-reckon-accent">
                Captured
              </span>
            </div>

            <dl className="divide-y divide-primary">
              <ChallengeRow label="scheme" value={X402_CHALLENGE.scheme} />
              <ChallengeRow label="network" value={X402_CHALLENGE.network} />
              <ChallengeRow label="amount" value={X402_CHALLENGE.amount} />
              <ChallengeRow label="currency" value={X402_CHALLENGE.currency} />
              <ChallengeRow label="recipient" value={X402_CHALLENGE.recipient} />
            </dl>

            <div className="flex flex-wrap items-center gap-md border-t border-primary px-xl py-lg">
              <ExternalLink href={LINKS.oracle} className="text-sm">
                Call the endpoint yourself
              </ExternalLink>
              <ExternalLink href={LINKS.oracleSource} className="text-sm" subtle>
                Route source
              </ExternalLink>
            </div>
          </div>

          <div className="flex flex-col gap-xl">
            <div className="rounded-2xl border border-primary bg-secondary p-xl">
              <div className="flex items-center gap-md">
                <Wallet size={16} weight="bold" className="text-reckon-accent" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary">The payment is the credential</p>
              </div>
              <p className="mt-md text-sm leading-6 text-secondary">
                The retry carries an <span className="font-mono text-xs text-primary">x-sui-digest</span>{' '}
                header. The endpoint verifies the digest before it returns the verdict. There is
                no API key to rotate and no account to create.
              </p>
              <div className="mt-lg rounded-lg border border-primary bg-tertiary p-lg">
                <p className="text-xs font-medium text-primary">One digest buys one call</p>
                <p className="mt-xs text-xs leading-5 text-quaternary">
                  The mppx charge handler uses a digest store, and the route's fallback verifies a
                  supplied digest through Sui GraphQL. The store is in memory per running
                  instance, so replay protection is scoped to that instance.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-reckon-accent/40 bg-secondary p-xl">
              <div className="flex items-center gap-md">
                <Key size={16} weight="bold" className="text-reckon-accent" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary">Read the rail honestly</p>
              </div>
              <p className="mt-md text-sm leading-6 text-secondary">
                This is Sui testnet through suimpp, a draft community scheme. Sui is not a
                Coinbase-supported x402 network. The 0.01 USDC is test currency. The flow is real;
                the rail is not production money yet.
              </p>
              <div className="mt-lg flex flex-wrap gap-x-xl gap-y-md">
                <ExternalLink href={LINKS.suimpp} className="text-xs">
                  suimpp
                </ExternalLink>
                <ExternalLink href={LINKS.mppx} className="text-xs">
                  mppx
                </ExternalLink>
                <ExternalLink href={LINKS.x402} className="text-xs">
                  x402
                </ExternalLink>
                <ExternalLink href={LINKS.sui} className="text-xs">
                  Sui
                </ExternalLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function ChallengeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-xl py-lg">
      <div className="flex items-center justify-between gap-md">
        <dt className="text-xs text-quaternary">{label}</dt>
        <CopyButton value={value} label={`Copy the ${label} field`} />
      </div>
      <dd className="mt-xs break-all font-mono text-xs leading-6 text-primary">{value}</dd>
    </div>
  )
}
