import { useEffect } from 'react'
import { Hero, Problem } from './Hero'
import { Walkthrough } from './Walkthrough'
import { BuildEvidence } from './BuildEvidence'
import { JudgesFooter, JudgesHeader, ScrollProgress } from './Chrome'
import './judges.css'

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
      <ScrollProgress />
      <JudgesHeader />
      <main id="main">
        <Hero />
        <Problem />
        <Walkthrough />
        <BuildEvidence />
      </main>
      <JudgesFooter />
    </div>
  )
}
