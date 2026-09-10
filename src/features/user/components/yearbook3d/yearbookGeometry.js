import * as THREE from 'three'

export const PAGE_WIDTH = 3.72
export const PAGE_HEIGHT = 5.08
export const PAGE_DEPTH = 0.018
export const PAGE_LAYER_GAP = PAGE_DEPTH * 1.45
export const PAGE_TURN_CLEARANCE = PAGE_DEPTH * 4
export const COVER_WIDTH = PAGE_WIDTH + 0.1
export const COVER_HEIGHT = PAGE_HEIGHT + 0.1
export const COVER_DEPTH = 0.1

export function createPageGeometry() {
  // Dense horizontal segments let the turning sheet bend and ripple rather
  // than behaving like a rigid card.
  const geometry = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, 40, 2, 1)
  geometry.translate(PAGE_WIDTH / 2, 0, 0)
  geometry.userData.restPosition = geometry.attributes.position.array.slice()
  return geometry
}

export function deformPageGeometry(geometry, turnProgress, direction = 1) {
  const position = geometry.attributes.position
  const rest = geometry.userData.restPosition
  if (!rest) return

  const flex = Math.sin(turnProgress * Math.PI)
  for (let index = 0; index < position.count; index += 1) {
    const offset = index * 3
    const x = rest[offset]
    const y = rest[offset + 1]
    const normalizedX = x / PAGE_WIDTH
    // The spine remains stable while the outer edge lifts in a broad arc.
    const arc = Math.sin(normalizedX * Math.PI) * flex * 0.34 * direction
    // Two smaller waves remove the flat, cardboard-like surface.
    const ripple = Math.sin(normalizedX * Math.PI * 3.5 + (y / PAGE_HEIGHT) * 1.6) * flex * 0.018
    position.setXYZ(index, x, y, rest[offset + 2] + arc + ripple)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
}

export function getClosedCoverCenterDepth(pageCount) {
  return (pageCount * PAGE_LAYER_GAP) + (COVER_DEPTH / 2) + PAGE_DEPTH
}
