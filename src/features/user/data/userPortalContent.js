export const userPortalNavigation = [
  { label: 'Overview', to: '/community', end: true },
  { label: 'Explore', to: '/community/explore' },
  { label: 'Yearbooks', to: '/community/yearbooks' },
  { label: 'School story', to: '/community/history' },
  { label: 'Updates', to: '/community/updates' },
]

export const userHighlights = [
  {
    icon: 'book',
    eyebrow: 'YEARBOOK ARCHIVE',
    title: 'Every graduating class, kept together.',
    description: 'Browse published yearbooks and revisit the portraits, achievements, and memories that defined each batch.',
    href: '/community/yearbooks',
  },
  {
    icon: 'landmark',
    eyebrow: 'SCHOOL HERITAGE',
    title: 'See the story behind the campus.',
    description: 'Move through the milestones, traditions, and people that continue to shape the identity of SNHS.',
    href: '/community/history',
  },
  {
    icon: 'sparkles',
    eyebrow: 'COMMUNITY STORIES',
    title: 'Stay close to what is happening now.',
    description: 'Read published school updates and discover the stories being added to the living archive.',
    href: '/community/updates',
  },
]

export const previewYearbooks = [
  { id: 'preview-heritage', title: 'The Heritage Collection', subtitle: 'School milestones and lasting traditions', status: 'Archive preview', tone: 'heritage' },
  { id: 'preview-portraits', title: 'Graduating Class Portraits', subtitle: 'The people behind every school year', status: 'Archive preview', tone: 'portraits' },
  { id: 'preview-campus', title: 'Campus Memories', subtitle: 'Clubs, celebrations, and everyday school life', status: 'Archive preview', tone: 'campus' },
]

export const previewStories = [
  {
    id: 'preview-story',
    category: 'SCHOOL STORY',
    title: 'A legacy made to be remembered.',
    body: 'Discover the people, traditions, and moments that continue to shape Sorsogon National High School.',
  },
]

export const previewAnnouncements = [
  {
    id: 'preview-welcome',
    title: 'Welcome to the GradBook community',
    body: 'This is your read-only window into published yearbooks, school stories, and community updates.',
    dateLabel: 'COMMUNITY NOTE',
  },
  {
    id: 'preview-publishing',
    title: 'New chapters are being prepared',
    body: 'Announcements created and published by the school administrator will appear here automatically.',
    dateLabel: 'COMING SOON',
  },
]
