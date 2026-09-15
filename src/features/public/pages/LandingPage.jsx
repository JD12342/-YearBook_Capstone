import { EditorialStory, LandingFooter, LandingHeader, LandingHero } from '../components/landing/index.js'
import { useScrollReveal } from '../hooks/useScrollReveal.js'
import { LandingContentProvider } from '../hooks/useLandingContent.js'

export function LandingPage() {
  useScrollReveal()

  return (
    <LandingContentProvider><div className="public-site">
      <LandingHeader />
      <main>
        <LandingHero />
        <EditorialStory />
      </main>
      <LandingFooter />
    </div></LandingContentProvider>
  )
}
