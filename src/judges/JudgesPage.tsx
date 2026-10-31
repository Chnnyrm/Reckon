import { lazy, Suspense, useEffect } from 'react'
import { Problem } from './Problem'
import { BuildEvidence } from './BuildEvidence'
import { WalrusSection } from './WalrusSection'
import { TatumSection } from './TatumSection'
import { PaymentsSection } from './PaymentsSection'
import { VerifyStrip } from './VerifyStrip'
import { Limits } from './Limits'
import { JudgesFooter, JudgesHeader } from './Chrome'
import { Container } from './ui'
import { PageIntro } from './PageIntro'
import './judges.css'

// The film is its own chunk: the page shell, masthead and sections paint
// first, and the player replaces a sized placeholder immediately below the
// masthead. It is not behind a click.
const Film = lazy(() => import('./Film'))

function FilmFallback() {
  return (
    <section aria-label="The Reckon demo" className="border-b border-primary py-lg sm:py-2xl">
      <Container>
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-primary bg-secondary sm:aspect-video sm:min-h-96">
          <p className="text-sm text-secondary" role="status">
            Loading the film
          </p>
        </div>
      </Container>
    </section>
  )
}

export default function JudgesPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Reckon - A forecasting record you can audit'

    const description = document.createElement('meta')
    description.name = 'description'
    description.content =
      'Reckon takes positions on real prediction markets and writes each one to Walrus Memory before the outcome, so the record can be audited rather than claimed.'
    document.head.appendChild(description)

    return () => {
      document.title = previousTitle
      description.remove()
    }
  }, [])

  return (
    <div className="judges-root min-h-screen bg-primary font-sans text-primary selection:bg-reckon-accent/20">
      <JudgesHeader />
      <main id="main">
        <PageIntro />
        <Suspense fallback={<FilmFallback />}>
          <Film />
        </Suspense>
        <Problem />
        <BuildEvidence />
        <WalrusSection />
        <TatumSection />
        <PaymentsSection />
        <VerifyStrip />
        <Limits />
      </main>
      <JudgesFooter />
    </div>
  )
}
