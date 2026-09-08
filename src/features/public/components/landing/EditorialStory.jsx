import { AccessSection } from './AccessSection.jsx'
import { CampusFilm } from './CampusFilm.jsx'
import { FeaturedStories } from './FeaturedStories.jsx'
import { LegacyPrologue } from './LegacyPrologue.jsx'
import { LivingLegacySection } from './LivingLegacySection.jsx'
import { SchoolStorySection } from './SchoolStorySection.jsx'
import { StoryMosaic } from './StoryMosaic.jsx'

export function EditorialStory() {
  return (
    <section className="editorial-story">
      <LegacyPrologue />
      <SchoolStorySection />
      <LivingLegacySection />
      <StoryMosaic />
      <AccessSection />
      <FeaturedStories />
      <CampusFilm />
    </section>
  )
}
