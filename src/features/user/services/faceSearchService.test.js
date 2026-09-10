import assert from 'node:assert/strict'
import test from 'node:test'
import { collectPublishedPortraits, distanceToSimilarity, rankFaceMatches } from './faceSearchService.js'

test('collectPublishedPortraits includes only unique profiles with published photos', () => {
  const profile = { id: 'student-1', name: 'Student One', photoUrl: 'approved.jpg' }
  const portraits = collectPublishedPortraits([{ id: 'book-1', schoolYearName: '2025-2026', pages: [{ profiles: [profile, profile, { id: 'student-2', name: 'No Photo' }] }] }])
  assert.equal(portraits.length, 1)
  assert.equal(portraits[0].yearbookId, 'book-1')
  assert.equal(portraits[0].schoolYear, '2025-2026')
})

test('rankFaceMatches rejects weak candidates and sorts closest first', () => {
  const matches = rankFaceMatches([{ id: 'far', distance: 0.7 }, { id: 'second', distance: 0.42 }, { id: 'first', distance: 0.31 }])
  assert.deepEqual(matches.map(({ id }) => id), ['first', 'second'])
  assert.ok(matches[0].similarity > matches[1].similarity)
  assert.equal(distanceToSimilarity(0.56), 44)
})
