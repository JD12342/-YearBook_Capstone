import * as THREE from 'three'
import {
  PAGE_LAYER_GAP,
  PAGE_TURN_CLEARANCE,
} from './yearbookGeometry.js'

const easeInOut = (value) => value < 0.5
  ? 4 * value * value * value
  : 1 - Math.pow(-2 * value + 2, 3) / 2

function getPageDepth({ leafIndex, leafCount, sideProgress }) {
  const rightStackDepth = (leafCount - leafIndex) * PAGE_LAYER_GAP
  const leftStackDepth = (leafIndex + 1) * PAGE_LAYER_GAP
  const settledDepth = THREE.MathUtils.lerp(rightStackDepth, leftStackDepth, sideProgress)

  // Keep the moving sheet above both stacks until it has crossed the spine.
  // The broad clearance curve prevents the far edge from cutting through the
  // pages below it near the beginning and end of a turn.
  const turningDepth = Math.max(rightStackDepth, leftStackDepth) + PAGE_TURN_CLEARANCE
  const clearanceWeight = Math.pow(Math.max(0, Math.sin(sideProgress * Math.PI)), 0.45)
  return THREE.MathUtils.lerp(settledDepth, turningDepth, clearanceWeight)
}

export function updateHardcover({ cover, isOpen, now, reduceMotion }) {
  const targetAngle = isOpen ? -Math.PI : 0
  if (targetAngle !== cover.targetAngle) {
    cover.fromAngle = cover.currentAngle
    cover.targetAngle = targetAngle
    cover.transitionStartedAt = now
  }

  const closeDelay = !reduceMotion && targetAngle === 0 ? 900 : 0
  const elapsed = Math.max(0, now - cover.transitionStartedAt - closeDelay)
  const progress = Math.min(1, elapsed / (reduceMotion ? 1 : 940))
  cover.currentAngle = THREE.MathUtils.lerp(
    cover.fromAngle,
    cover.targetAngle,
    easeInOut(progress),
  )
  cover.group.rotation.y = cover.currentAngle
  return Math.min(1, Math.abs(cover.currentAngle) / Math.PI)
}

export function updatePageLeaf({ leaf, leafIndex, leafCount, requestedPage, now, reduceMotion }) {
  const targetAngle = requestedPage > leafIndex ? -Math.PI : 0
  if (targetAngle !== leaf.targetAngle) {
    leaf.fromAngle = leaf.currentAngle
    leaf.targetAngle = targetAngle
    leaf.transitionStartedAt = now
  }

  const openingDelay = !reduceMotion && leafIndex === 0 && targetAngle === -Math.PI ? 360 : 0
  const elapsed = Math.max(0, now - leaf.transitionStartedAt - openingDelay)
  const transitionProgress = Math.min(1, elapsed / (reduceMotion ? 1 : 860))
  leaf.currentAngle = THREE.MathUtils.lerp(leaf.fromAngle, leaf.targetAngle, easeInOut(transitionProgress))
  leaf.group.rotation.y = leaf.currentAngle

  const sideProgress = Math.min(1, Math.abs(leaf.currentAngle) / Math.PI)
  leaf.group.position.z = getPageDepth({ leafIndex, leafCount, sideProgress })

}
