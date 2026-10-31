import { GitCommit, SealCheck } from '@phosphor-icons/react'
import {
  AI_AUTHOR,
  AI_COMMIT_COUNT,
  AI_COMMITS,
  LINKS,
  TATUM_ID,
} from './data'
import {
  Container,
  CopyButton,
  ExternalLink,
  SectionHead,
} from './ui'

export function BuildEvidence() {
  return (
    <section id="build" aria-labelledby="build-title" className="border-b border-primary py-8xl sm:py-9xl">
      <Container>
        <div className="grid gap-4xl lg:grid-cols-[1.04fr_0.96fr] lg:items-start">
          <div>
            <SectionHead
              id="build-title"
              index="02"
              label="The build"
              title="Built with Tatum AI Builder."
              lede={`This app was built in Tatum AI Builder. ${AI_COMMIT_COUNT} commits on the project are authored by AI Builder, and the build ID ties the running app to that workspace. The evidence is in the history, not in a badge on this page.`}
            />

            <div className="mt-3xl rounded-2xl border border-primary bg-secondary p-xl sm:p-2xl">
              <div className="flex flex-wrap items-center justify-between gap-md">
                <p className="text-xs font-medium text-quaternary">Tatum AI Builder ID</p>
                <CopyButton value={TATUM_ID} label="Copy the Tatum AI Builder id" />
              </div>
              <p className="mt-md break-all font-mono text-sm text-primary sm:text-base">{TATUM_ID}</p>
              <p className="mt-md text-xs leading-5 text-quaternary">
                A build identifier, not a transaction. It maps this page to the workspace that
                produced the app.
              </p>
            </div>

            <ul className="mt-2xl space-y-md">
              <BuildPoint
                title="Scaffold and product shell"
                body="The initial commit and the page structure came from the builder."
                href={`${LINKS.repoMirror}/commit/47099ac`}
                label="Open the scaffold commit"
              />
              <BuildPoint
                title="The Walrus write path"
                body="The memory bridge and the position record were written in the AI-authored commits."
                href={`${LINKS.repoMirror}/commit/4a8b7af`}
                label="Open the memory commit"
              />
              <BuildPoint
                title="The 402 payment route"
                body="The Sui testnet payment challenge is an AI-authored commit, not a later hand-wave."
                href={`${LINKS.repoMirror}/commit/309c250`}
                label="Open the payment commit"
              />
            </ul>

            <div className="mt-2xl flex flex-wrap gap-x-xl gap-y-md">
              <ExternalLink href={LINKS.tatum} className="text-sm">
                Tatum
              </ExternalLink>
              <ExternalLink href={LINKS.commits} className="text-sm">
                Read the AI Builder commit history
              </ExternalLink>
              <ExternalLink href={LINKS.repoMirror} className="text-sm">
                Parent repository
              </ExternalLink>
              <ExternalLink href={LINKS.repoDeployed} className="text-sm">
                Deployed fork
              </ExternalLink>
            </div>
          </div>

          <div className="rounded-2xl border border-primary bg-secondary shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-md border-b border-primary px-xl py-lg">
              <div className="flex items-center gap-md">
                <GitCommit size={16} weight="bold" className="text-reckon-accent" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary">Commit evidence</p>
              </div>
              <span className="rounded-full border border-reckon-accent/40 px-md py-xs text-xs font-medium text-reckon-accent">
                {AI_COMMIT_COUNT} by AI Builder
              </span>
            </div>

            <ul className="divide-y divide-primary">
              {AI_COMMITS.map((commit) => (
                <li key={commit.sha} className="px-xl py-lg">
                  <div className="flex items-start justify-between gap-md">
                    <ExternalLink
                      href={commit.href}
                      icon={false}
                      className="min-w-0 text-sm font-medium"
                    >
                      <span className="break-words">{commit.title}</span>
                    </ExternalLink>
                    <span className="shrink-0 font-mono text-xs text-quaternary">{commit.sha}</span>
                  </div>
                  <p className="mt-xs break-all font-mono text-xs text-quaternary">
                    {AI_AUTHOR}
                  </p>
                  <p className="mt-xs text-xs text-quaternary">{commit.date}</p>
                </li>
              ))}
            </ul>

            <div className="border-t border-primary px-xl py-lg">
              <p className="text-xs leading-5 text-quaternary">
                The page states the stable number, {AI_COMMIT_COUNT} AI-authored commits, and
                links to the history rather than freezing a total that changes with every page
                edit.
              </p>
              <div className="mt-md">
                <ExternalLink href={LINKS.commits} className="text-sm">
                  Read the commit history
                </ExternalLink>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4xl flex items-start gap-md rounded-xl border border-reckon-accent/40 bg-secondary p-xl">
          <SealCheck size={18} weight="fill" className="mt-0.5 shrink-0 text-reckon-accent" aria-hidden="true" />
          <p className="max-w-3xl text-sm leading-6 text-secondary">
            The build record is public in the same way the forecasting record is: a reader does
            not have to take the page's word for it. The parent repository carries the commits
            and the source.
          </p>
        </div>
      </Container>
    </section>
  )
}

function BuildPoint({
  title,
  body,
  href,
  label,
}: {
  title: string
  body: string
  href: string
  label: string
}) {
  return (
    <li className="rounded-xl border border-primary bg-secondary p-lg">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <p className="mt-xs text-sm leading-6 text-secondary">{body}</p>
      <div className="mt-sm">
        <ExternalLink href={href} className="text-xs" subtle>
          {label}
        </ExternalLink>
      </div>
    </li>
  )
}
