import * as THREE from 'three'

export const PAGE_WIDTH = 3.72
export const PAGE_HEIGHT = 5.08
export const PAGE_DEPTH = 0.018
export const PAGE_LAYER_GAP = PAGE_DEPTH * 1.45
export const PAGE_TURN_CLEARANCE = PAGE_DEPTH * 4
export const COVER_WIDTH = PAGE_WIDTH + 0.2
export const COVER_HEIGHT = PAGE_HEIGHT + 0.26
export const COVER_DEPTH = 0.11

export function createPageGeometry() {
  const geometry = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH)
  geometry.translate(PAGE_WIDTH / 2, 0, 0)
  return geometry
}

export function getClosedCoverCenterDepth(pageCount) {
  return (pageCount * PAGE_LAYER_GAP) + (COVER_DEPTH / 2) + PAGE_DEPTH
}
