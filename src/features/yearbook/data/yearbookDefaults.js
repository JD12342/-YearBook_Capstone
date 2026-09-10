export const DEFAULT_YEARBOOK_THEME = {
  coverColor: '#087a5c',
  accentColor: '#d7b866',
  pageColor: '#f7f0dc',
  inkColor: '#17372d',
}

export const createDefaultYearbookPages = (schoolYear = '2026–2027') => [
  {
    id: 'opening',
    eyebrow: 'OPENING CHAPTER',
    title: 'A legacy made to be remembered.',
    body: `This edition preserves the people, friendships, and defining moments of school year ${schoolYear}. Every page is a place to return to the story we created together.`,
    quote: 'Our stories move forward, but the memories stay with us.',
  },
  {
    id: 'portraits',
    layout: 'profiles',
    eyebrow: 'THE GRADUATING CLASS',
    title: 'The faces behind the year.',
    body: 'A class is more than a list of names. It is a community shaped by shared lessons, quiet victories, lasting friendships, and the courage to take the next step.',
    quote: 'Different paths. One school. One unforgettable chapter.',
    profiles: [
      {
        id: 'student-1',
        name: 'STUDENT NAME',
        question: 'What made this school year unforgettable?',
        answer: 'The friendships, lessons, and everyday moments gave this year a story worth remembering.',
      },
      {
        id: 'student-2',
        name: 'STUDENT NAME',
        question: 'What lesson will you carry forward?',
        answer: 'Growth begins when we stay curious, support one another, and keep moving through every challenge.',
      },
      {
        id: 'student-3',
        name: 'STUDENT NAME',
        question: 'What will you miss most about the campus?',
        answer: 'I will miss the familiar halls, shared laughter, and the people who made each ordinary day meaningful.',
      },
      {
        id: 'student-4',
        name: 'STUDENT NAME',
        question: 'What message would you leave for your class?',
        answer: 'Remember where we started, celebrate how far we came, and meet the future with courage.',
      },
    ],
  },
  {
    id: 'campus',
    eyebrow: 'CAMPUS MEMORIES',
    title: 'The moments between milestones.',
    body: 'From ordinary mornings to celebrations that filled the campus, these are the details that made the school year feel like home.',
    quote: 'We remember the big days—and the small moments that made them matter.',
  },
]

export function getYearbookPresentation(yearbook = {}, schoolYear = '') {
  const fallbackPages = createDefaultYearbookPages(schoolYear || yearbook.schoolYearName)
  const savedPages = Array.isArray(yearbook.pages) ? yearbook.pages : []

  return {
    ...DEFAULT_YEARBOOK_THEME,
    ...yearbook,
    title: yearbook.title || `Graduation Yearbook ${schoolYear || ''}`.trim(),
    coverTitle: yearbook.coverTitle || 'GRAD BOOK',
    coverSubtitle: yearbook.coverSubtitle || schoolYear || yearbook.schoolYearName || 'Sorsogon National High School',
    pages: fallbackPages.map((fallback, index) => ({
      ...fallback,
      ...(savedPages[index] || {}),
      id: savedPages[index]?.id || fallback.id,
    })),
  }
}
