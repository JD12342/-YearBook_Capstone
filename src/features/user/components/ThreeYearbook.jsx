import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  COVER_DEPTH,
  COVER_HEIGHT,
  COVER_WIDTH,
  PAGE_HEIGHT,
  PAGE_LAYER_GAP,
  PAGE_WIDTH,
  createPageGeometry,
  getClosedCoverCenterDepth,
} from './yearbook3d/yearbookGeometry.js'
import { updateHardcover, updatePageLeaf } from './yearbook3d/yearbookLayering.js'
import { createYearbookTextureSet } from './yearbook3d/yearbookTextures.js'

export function ThreeYearbook({ isOpen, onOpen, pageIndex, presentation }) {
  const mountRef = useRef(null)
  const isOpenRef = useRef(isOpen)
  const pageIndexRef = useRef(pageIndex)
  const onOpenRef = useRef(onOpen)
  const [failed, setFailed] = useState(false)

  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
  useEffect(() => { pageIndexRef.current = pageIndex }, [pageIndex])
  useEffect(() => { onOpenRef.current = onOpen }, [onOpen])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    let renderer
    let frame
    let resizeObserver
    const geometries = []
    const materials = []
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    try {
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
      camera.position.set(0, 0.2, 11.7)
      camera.lookAt(0, 0, 0)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.NoToneMapping
      renderer.toneMappingExposure = 1.08
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFShadowMap
      mount.appendChild(renderer.domElement)

      scene.add(new THREE.HemisphereLight(0xfff7df, 0x08271f, 2.45))
      const keyLight = new THREE.DirectionalLight(0xfffbef, 3.8)
      keyLight.position.set(-4.5, 6, 8)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.set(2048, 2048)
      keyLight.shadow.radius = 4
      keyLight.shadow.normalBias = 0.025
      scene.add(keyLight)

      const rimLight = new THREE.PointLight(presentation.accentColor, 18, 16)
      rimLight.position.set(4, -2.5, 5)
      scene.add(rimLight)

      const book = new THREE.Group()
      scene.add(book)

      const {
        leaves: leafDefinitions,
        textures,
        coverTexture,
        backCoverTexture,
        insideFrontCoverTexture,
        insideBackCoverTexture,
      } = createYearbookTextureSet(presentation)
      const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
      textures.forEach((texture) => { texture.anisotropy = maxAnisotropy })

      const paperEdgeMaterial = new THREE.MeshStandardMaterial({ color: '#d9ccb0', roughness: 0.94 })
      const coverEdgeMaterial = new THREE.MeshStandardMaterial({ color: presentation.coverColor, roughness: 0.7 })
      const pageBlockMaterial = new THREE.MeshStandardMaterial({ color: '#eee9dd', roughness: 0.92 })
      const pageLayerMaterial = new THREE.MeshStandardMaterial({ color: '#c9c0ac', roughness: 1 })
      materials.push(paperEdgeMaterial, coverEdgeMaterial, pageBlockMaterial, pageLayerMaterial)

      // The page block is intentionally neutral, like the exposed paper in the
      // reference book. It sits between the two boards and is visible only at the
      // fore-edge, so custom cover artwork remains the focus.
      const pageBlockDepth = Math.max(0.19, leafDefinitions.length * PAGE_LAYER_GAP + 0.07)
      const closedBookPageBlock = new THREE.Group()
      const pageBlockGeometry = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, pageBlockDepth)
      pageBlockGeometry.translate(PAGE_WIDTH / 2, 0, 0)
      const pageBlock = new THREE.Mesh(pageBlockGeometry, pageBlockMaterial)
      pageBlock.position.z = (pageBlockDepth / 2) - 0.014
      pageBlock.castShadow = true
      pageBlock.receiveShadow = true
      closedBookPageBlock.add(pageBlock)
      geometries.push(pageBlockGeometry)

      const foreEdgeGeometry = new THREE.BoxGeometry(0.052, PAGE_HEIGHT - 0.11, pageBlockDepth + 0.02)
      const foreEdge = new THREE.Mesh(foreEdgeGeometry, pageBlockMaterial)
      foreEdge.position.set(PAGE_WIDTH + 0.007, 0, (pageBlockDepth / 2) - 0.014)
      foreEdge.castShadow = true
      foreEdge.receiveShadow = true
      closedBookPageBlock.add(foreEdge)
      geometries.push(foreEdgeGeometry)

      const pageLayerGeometry = new THREE.BoxGeometry(0.06, 0.007, pageBlockDepth + 0.024)
      for (let index = 1; index < 28; index += 1) {
        const layer = new THREE.Mesh(pageLayerGeometry, pageLayerMaterial)
        layer.position.set(PAGE_WIDTH + 0.01, -PAGE_HEIGHT / 2 + (index * PAGE_HEIGHT / 28), (pageBlockDepth / 2) - 0.014)
        closedBookPageBlock.add(layer)
      }
      geometries.push(pageLayerGeometry)
      book.add(closedBookPageBlock)

      const leaves = leafDefinitions.map((definition, index) => {
        const pageGeometry = createPageGeometry()
        geometries.push(pageGeometry)
        const frontMaterial = new THREE.MeshBasicMaterial({ map: definition.front })
        const backMaterial = new THREE.MeshBasicMaterial({ map: definition.back })
        materials.push(frontMaterial, backMaterial)

        const mesh = new THREE.Mesh(
          pageGeometry,
          [paperEdgeMaterial, paperEdgeMaterial, paperEdgeMaterial, paperEdgeMaterial, frontMaterial, backMaterial],
        )
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false

        const group = new THREE.Group()
        group.position.z = (leafDefinitions.length - index) * PAGE_LAYER_GAP
        group.add(mesh)
        book.add(group)
        return { group, geometry: pageGeometry, currentAngle: 0, fromAngle: 0, targetAngle: 0, transitionStartedAt: performance.now() }
      })

      const frontCoverGeometry = new THREE.BoxGeometry(COVER_WIDTH, COVER_HEIGHT, COVER_DEPTH)
      frontCoverGeometry.translate(COVER_WIDTH / 2, 0, 0)
      const frontCoverMaterial = new THREE.MeshStandardMaterial({ map: coverTexture, roughness: 0.38, metalness: 0.06 })
      const frontCoverInsideMaterial = new THREE.MeshStandardMaterial({ map: insideFrontCoverTexture, roughness: 0.62 })
      const frontCover = new THREE.Mesh(frontCoverGeometry, [coverEdgeMaterial, coverEdgeMaterial, coverEdgeMaterial, coverEdgeMaterial, frontCoverMaterial, frontCoverInsideMaterial])
      frontCover.position.z = getClosedCoverCenterDepth(leafDefinitions.length)
      frontCover.castShadow = true
      frontCover.receiveShadow = true
      const frontCoverGroup = new THREE.Group()
      frontCoverGroup.add(frontCover)
      book.add(frontCoverGroup)
      const frontCoverState = { group: frontCoverGroup, currentAngle: 0, fromAngle: 0, targetAngle: 0, transitionStartedAt: performance.now() }
      geometries.push(frontCoverGeometry)
      materials.push(frontCoverMaterial, frontCoverInsideMaterial)

      const backCoverGeometry = new THREE.BoxGeometry(COVER_WIDTH, COVER_HEIGHT, COVER_DEPTH)
      backCoverGeometry.translate(COVER_WIDTH / 2, 0, 0)
      const backCoverInsideMaterial = new THREE.MeshStandardMaterial({ map: insideBackCoverTexture, roughness: 0.62 })
      const backCoverOuterMaterial = new THREE.MeshStandardMaterial({ map: backCoverTexture, roughness: 0.4, metalness: 0.04 })
      const backCover = new THREE.Mesh(backCoverGeometry, [coverEdgeMaterial, coverEdgeMaterial, coverEdgeMaterial, coverEdgeMaterial, backCoverInsideMaterial, backCoverOuterMaterial])
      // A small gap lets the rear board read separately behind the page block.
      backCover.position.z = -(COVER_DEPTH / 2) - 0.055
      backCover.castShadow = true
      backCover.receiveShadow = true
      book.add(backCover)
      geometries.push(backCoverGeometry)
      materials.push(backCoverInsideMaterial, backCoverOuterMaterial)

      const spineGeometry = new THREE.CylinderGeometry(0.15, 0.15, PAGE_HEIGHT + 0.12, 40, 1, false, Math.PI / 2, Math.PI)
      const spineMaterial = new THREE.MeshStandardMaterial({ color: presentation.coverColor, roughness: 0.38, metalness: 0.08 })
      const spine = new THREE.Mesh(spineGeometry, spineMaterial)
      spine.position.set(-0.02, 0, -0.055)
      spine.castShadow = true
      book.add(spine)
      geometries.push(spineGeometry)
      materials.push(spineMaterial)

      const floorGeometry = new THREE.PlaneGeometry(13, 8)
      const floorMaterial = new THREE.ShadowMaterial({ color: 0x00160f, opacity: 0.26 })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.position.set(0, -3.02, -0.7)
      floor.rotation.x = -Math.PI / 2
      floor.receiveShadow = true
      scene.add(floor)
      geometries.push(floorGeometry)
      materials.push(floorMaterial)

      const pointer = { x: 0, y: 0 }
      const raycaster = new THREE.Raycaster()
      const pointerPosition = new THREE.Vector2()
      const updatePointer = (event) => {
        const rect = mount.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1
        pointerPosition.set(pointer.x, -pointer.y)
      }
      const isBookHit = () => {
        raycaster.setFromCamera(pointerPosition, camera)
        return raycaster.intersectObject(book, true).length > 0
      }
      const handlePointerMove = (event) => {
        updatePointer(event)
        mount.classList.toggle('is-book-hovered', !isOpenRef.current && isBookHit())
      }
      const handlePointerLeave = () => mount.classList.remove('is-book-hovered')
      const handlePointerUp = (event) => {
        if (isOpenRef.current) return
        updatePointer(event)
        if (isBookHit()) onOpenRef.current?.()
      }
      mount.addEventListener('pointermove', handlePointerMove)
      mount.addEventListener('pointerleave', handlePointerLeave)
      mount.addEventListener('pointerup', handlePointerUp)

      const resize = () => {
        const width = Math.max(1, mount.clientWidth)
        const height = Math.max(1, mount.clientHeight)
        const aspect = width / height
        renderer.setSize(width, height, false)
        camera.aspect = aspect
        camera.position.z = 11.7
        camera.position.y = aspect < 0.72 ? 0 : 0.2
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
      }
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(mount)
      resize()

      const startedAt = performance.now()
      const render = (now) => {
        const requestedPage = isOpenRef.current ? pageIndexRef.current + 1 : 0
        const openingProgress = updateHardcover({ cover: frontCoverState, isOpen: isOpenRef.current, now, reduceMotion })
        leaves.forEach((leaf, leafIndex) => updatePageLeaf({ leaf, leafIndex, leafCount: leaves.length, requestedPage, now, reduceMotion }))

        // The compressed page block is a closed-book construction detail. Once the
        // cover opens, individual animated leaves take over with no solid block
        // behind them, so the two-page spread cannot be covered or overlap.
        closedBookPageBlock.visible = openingProgress < 0.025

        const idle = (now - startedAt) * 0.00055
        book.position.x = THREE.MathUtils.lerp(-PAGE_WIDTH / 2, 0, openingProgress)
        book.position.y = reduceMotion ? 0 : Math.sin(idle) * 0.055 * (1 - openingProgress)
        book.rotation.y = THREE.MathUtils.lerp(book.rotation.y, (-0.31 * (1 - openingProgress)) + (pointer.x * 0.045 * (1 - openingProgress)), 0.06)
        book.rotation.x = THREE.MathUtils.lerp(book.rotation.x, -0.025 + (pointer.y * 0.025 * (1 - openingProgress)), 0.06)
        book.scale.setScalar(THREE.MathUtils.lerp(1.08, 1, openingProgress))

        const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
        // The cover keeps the original comfortable scale; opened spreads move closer
        // to use the available space without clipping at the screen edges.
        const padding = THREE.MathUtils.lerp(1.3, 1.08, openingProgress)
        const fittedDistance = Math.max(COVER_HEIGHT * padding / (2 * halfFov), COVER_WIDTH * (1 + openingProgress) * padding / (2 * halfFov * camera.aspect)) + THREE.MathUtils.lerp(0.7, 0.22, openingProgress)
        camera.position.z = reduceMotion ? fittedDistance : THREE.MathUtils.lerp(camera.position.z, fittedDistance, 0.12)
        renderer.render(scene, camera)
        frame = requestAnimationFrame(render)
      }
      frame = requestAnimationFrame(render)

      return () => {
        cancelAnimationFrame(frame)
        resizeObserver?.disconnect()
        mount.removeEventListener('pointermove', handlePointerMove)
        mount.removeEventListener('pointerleave', handlePointerLeave)
        mount.removeEventListener('pointerup', handlePointerUp)
        textures.forEach((texture) => {
          texture.userData.cancelImageLoad?.()
          texture.dispose()
        })
        geometries.forEach((geometry) => geometry.dispose())
        materials.forEach((material) => material.dispose())
        renderer.dispose()
        renderer.domElement.remove()
      }
    } catch {
      setFailed(true)
      renderer?.dispose()
      return undefined
    }
  }, [presentation])

  if (failed) {
    return (
      <div className="yearbook-webgl-fallback">
        <small>SORSOGON NATIONAL HIGH SCHOOL</small>
        <strong>{presentation.coverTitle}</strong>
        <span>{presentation.coverSubtitle}</span>
      </div>
    )
  }

  const openFromKeyboard = (event) => {
    if (!isOpen && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onOpenRef.current?.()
    }
  }

  return (
    <div
      className={`yearbook-three-canvas ${isOpen ? 'is-open' : ''}`}
      ref={mountRef}
      role={!isOpen ? 'button' : 'img'}
      tabIndex={!isOpen ? 0 : -1}
      aria-label={isOpen ? `Open 3D yearbook, page ${pageIndex + 1}` : `Open ${presentation.title}`}
      onKeyDown={openFromKeyboard}
    />
  )
}
