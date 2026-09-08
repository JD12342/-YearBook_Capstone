import { EditorialStory, LandingFooter, LandingHeader, LandingHero } from '../components/landing/index.js'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

export function LandingPage() {
  useScrollReveal()

  return (
    <div className="public-site">
      <LandingHeader />
      <main>
        <LandingHero />
        <EditorialStory />
      </main>
      <LandingFooter />
    </div>
  )
}
