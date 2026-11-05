import type { ReactNode } from 'react'
import { ArrowRight, Code, Plugs, ShieldCheck } from '@phosphor-icons/react'
import { LINKS, TATUM_ID } from './data'
import { Container, ExternalLink, SectionHead } from './ui'

export function TatumSection() {
  return (
    <section id="tatum" aria-labelledby="tatum-title" className="border-b border-primary py-8xl sm:py-9xl">
      <Container>
        <SectionHead
          id="tatum-title"
          index="04"
          label="Tatum"
          title="Tatum builds the app and verifies the chain."
          lede="Tatum AI Builder is the build environment, not a decoration on the page. The server carries a Tatum API client, reads every market through Tatum's prediction markets endpoints, and checks Sui payment digests through Tatum's Sui gRPC gateway. If the gateway cannot answer, verification falls back to public Sui GraphQL, and the result names the path that answered."
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
            body="The server routes through a Tatum-aware client. The key stays server-side. Market lists, position grading and Sui digest verification all use it; no route sends the key to the browser."
            href={LINKS.tatumClientSource}
            linkLabel="Read the client"
          />
          <TatumCard
            icon={<ShieldCheck size={16} weight="bold" aria-hidden="true" />}
            label="Verify"
            title="Sui verification over gRPC"
            body="Tatum's Sui gateway answers native gRPC over HTTP/2 and takes the key as x-api-key metadata. One call reads a digest's status and sender with an 8 second deadline, so a stalled gateway falls back instead of hanging the request."
            href={LINKS.verifySource}
            linkLabel="Read the verification source"
          />
        </div>

        <div className="mt-4xl grid gap-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl">
            <div className="flex flex-wrap items-center justify-between gap-md">
              <p className="text-xs font-medium text-quaternary">Verification path</p>
              <span className="rounded-full border border-reckon-accent/40 px-md py-xs text-xs font-medium text-reckon-accent">
                Tatum first
              </span>
            </div>

            <div className="mt-2xl grid items-stretch gap-md sm:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-xl border border-primary bg-tertiary p-lg">
                <p className="text-xs text-quaternary">Primary</p>
                <p className="mt-xs text-sm font-semibold text-primary">Tatum Sui gRPC</p>
                <p className="mt-sm break-all font-mono text-xs leading-5 text-secondary">
                  sui-mainnet-grpc.gateway.tatum.io
                </p>
                <p className="mt-md text-xs leading-5 text-quaternary">
                  Asked first, with the Tatum key in x-api-key metadata and a read mask for status and
                  sender only.
                </p>
              </div>
              <div className="flex items-center justify-center text-quaternary">
                <ArrowRight size={16} weight="bold" className="rotate-90 sm:rotate-0" aria-hidden="true" />
              </div>
              <div className="rounded-xl border border-dashed border-primary bg-primary p-lg">
                <p className="text-xs text-quaternary">Fallback</p>
                <p className="mt-xs text-sm font-semibold text-secondary">Sui GraphQL</p>
                <p className="mt-sm break-all font-mono text-xs leading-5 text-quaternary">
                  graphql.mainnet.sui.io
                </p>
                <p className="mt-md text-xs leading-5 text-quaternary">
                  Asked only when Tatum cannot answer: bad key, timeout or outage. The reply carries a
                  source field naming the path that answered.
                </p>
              </div>
            </div>

            <div className="mt-xl rounded-lg border border-primary bg-primary p-lg">
              <p className="text-xs font-medium text-quaternary">The call in the source</p>
              <pre className="judges-code mt-sm whitespace-pre-wrap font-mono text-xs leading-5 text-secondary">
{`const transport = new GrpcTransport({
  host: 'sui-mainnet-grpc.gateway.tatum.io:443',
  meta: { 'x-api-key': key },
})`}
              </pre>
            </div>

            <div className="mt-xl flex flex-wrap gap-x-xl gap-y-md">
              <ExternalLink href={LINKS.verifySource} className="text-sm">
                Verification source
              </ExternalLink>
              <ExternalLink href={LINKS.tatumClientSource} className="text-sm">
                Tatum gRPC client
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
            <p className="text-xs font-medium text-quaternary">What the fallback means</p>
            <h3 className="mt-sm text-lg font-semibold text-primary">
              A fallback is named, not hidden.
            </h3>
            <p className="mt-md text-sm leading-6 text-secondary">
              Tatum's gateway and the public Sui endpoint read the same chain. When Tatum answers,
              the response says so. When it does not, the check runs against public Sui GraphQL and
              the response says that instead. If neither answers, the endpoint reports that
              verification could not be performed, not that the payment was invalid.
            </p>
            <div className="mt-xl rounded-lg border border-primary bg-tertiary p-lg">
              <p className="text-xs text-quaternary">Build ID</p>
              <p className="mt-xs break-all font-mono text-sm text-primary">{TATUM_ID}</p>
            </div>
            <p className="mt-md text-xs leading-5 text-quaternary">
              The verification strip links every claim on this page. This section links the code
              that decides whether a digest counts, so a reader can check the ordering themselves.
            </p>
            <div className="mt-lg">
              <ExternalLink href={LINKS.repoMirror} className="text-sm">
                Open the parent repository
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
