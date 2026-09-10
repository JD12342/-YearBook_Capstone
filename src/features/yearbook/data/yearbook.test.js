import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStudentPages } from './studentPages.js'
import { createDefaultYearbookPages, getYearbookPresentation } from './yearbookDefaults.js'
import { coverTextColor, paintYearbookCover } from './coverArtwork.js'

test('unverified legacy student samples never reach the reader', () => {
  const pages = [{ id: 'portraits', profiles: [{ name: 'STUDENT NAME', answer: 'Invented answer' }] }]
  assert.deepEqual(getYearbookPresentation({ pages }).pages[0].profiles, [])
  assert.deepEqual(createDefaultYearbookPages('2022-2023')[1].profiles, [])
})

test('all real students remain in order with one portrait on each physical page', () => {
  const profiles = Array.from({ length: 17 }, (_, id) => ({ id: String(id), name: `Test record ${id}` }))
  const pages = buildStudentPages(createDefaultYearbookPages('2022-2023'), profiles)
  const view = getYearbookPresentation({ pages, recordsVersion: 1 })
  assert.equal(view.pages.length, 11)
  assert.deepEqual(view.pages.flatMap(page => page.profiles), profiles)
  assert.equal(new Set(view.pages.map(page => page.id)).size, view.pages.length)
})

test('resync removes stale people and artwork without deleting editorial pages', () => {
  const original = [{ id: 'story', body: 'Keep this story' }, { id: 'portraits', layout: 'profiles', leftPageImageUrl: 'old.png', profiles: [{ name: 'Old record' }] }, { id: 'portraits-2', layout: 'profiles' }]
  const updated = buildStudentPages(original, [])
  assert.equal(updated.length, 2)
  assert.equal(updated[0].body, 'Keep this story')
  assert.deepEqual(updated[1].profiles, [])
  assert.equal(updated[1].leftPageImageUrl, '')
})

test('cover text remains legible on both light and dark custom colors', () => {
  assert.equal(coverTextColor('#ffffff'), '#102c24')
  assert.equal(coverTextColor('#001a10'), '#fffaf0')
})

test('custom full-cover artwork replaces all generated lettering', () => {
  const calls = []
  const context = new Proxy({}, { get: (_, key) => (...args) => calls.push([key, ...args]), set: () => true })
  paintYearbookCover(context, { coverColor: '#123456', coverImageUrl: 'custom.png', coverTitle: 'Hidden title' }, { width: 900, height: 1200 })
  assert.equal(calls.filter(call => call[0] === 'drawImage').length, 1)
  assert.equal(calls.filter(call => call[0] === 'fillText').length, 0)
})
