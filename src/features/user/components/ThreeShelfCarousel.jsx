import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getYearbookPresentation } from '../../yearbook/data/yearbookDefaults.js'
import { coverSurfaceColor } from '../../yearbook/data/coverArtwork.js'
import { createShelfCoverTextures } from './yearbook3d/yearbookTextures.js'

const smooth = t => t * t * (3 - 2 * t)

export function ThreeShelfCarousel({ yearbooks, activeIndex, mode, locked, onSelect, onOpen, onSettled }) {
  const mountRef = useRef(null)
  const invalidateRef = useRef(null)
  const current = useRef({ activeIndex, mode, locked, onSelect, onOpen, onSettled })
  const [failed, setFailed] = useState(false)
  useEffect(() => { if (failed) current.current.onSettled() }, [failed, activeIndex, mode])
  useEffect(() => {
    current.current = { activeIndex, mode, locked, onSelect, onOpen, onSettled }
    invalidateRef.current?.()
  }, [activeIndex, mode, locked, onSelect, onOpen, onSettled])
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    let renderer, frame, observer, viewportObserver
    let disposed = false
    let frameQueued = false
    let inViewport = true
    let renderFrame = () => {}
    const requestRender = () => {
      if (disposed || frameQueued || document.hidden || !inViewport) return
      frameQueued = true
      frame = requestAnimationFrame((now) => renderFrame(now))
    }
    const handleVisibilityChange = () => { if (!document.hidden) requestRender() }
    invalidateRef.current = requestRender
    const geometry = [], materials = [], textures = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lowPower = window.matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4
    try {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#2c3e50')
      const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100)
      renderer = new THREE.WebGLRenderer({ antialias: !lowPower, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.15 : 1.5))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mount.appendChild(renderer.domElement)
      scene.add(new THREE.HemisphereLight('#ffffff', '#60503c', 2.2))
      const light = new THREE.DirectionalLight('#fff4df', 2.5)
      light.position.set(-4, 8, 7)
      light.castShadow = true
      light.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024)
      Object.assign(light.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10 })
      light.shadow.normalBias = 0.025
      scene.add(light)

      // Procedural oak grain keeps the scene independent of remote assets.
      const woodCanvas = document.createElement('canvas')
      woodCanvas.width = woodCanvas.height = 512
      const ctx = woodCanvas.getContext('2d')
      ctx.fillStyle = '#a88b68'
      ctx.fillRect(0, 0, 512, 512)
      let seed = 73
      const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
      for (let i = 0; i < 1700; i++) {
        const y = random() * 512
        ctx.strokeStyle = `rgba(60,36,18,${random() * .14})`
        ctx.lineWidth = random() * 2 + .3
        ctx.beginPath(); ctx.moveTo(0, y)
        ctx.bezierCurveTo(170, y + random() * 14, 340, y - random() * 14, 512, y)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(50,30,15,.2)'
      ctx.fillRect(0, 0, 512, 2)
      const wood = new THREE.CanvasTexture(woodCanvas)
      wood.colorSpace = THREE.SRGBColorSpace
      wood.wrapS = wood.wrapT = THREE.RepeatWrapping
      wood.repeat.set(5, 9)
      textures.push(wood)
      const floorGeometry = new THREE.PlaneGeometry(70, 24)
      const floorMaterial = new THREE.MeshStandardMaterial({ map: wood, roughness: .85 })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.set(0, -1.95, 9)
      floor.receiveShadow = true
      scene.add(floor)
      geometry.push(floorGeometry); materials.push(floorMaterial)

      const books = yearbooks.map((record, index) => {
        const presentation = getYearbookPresentation(record, record.schoolYearName)
        const group = new THREE.Group()
        group.userData.index = index
        const covers = createShelfCoverTextures(presentation, requestRender)
        textures.push(covers.front, covers.back)
        const cloth = new THREE.MeshStandardMaterial({ color: coverSurfaceColor(presentation), roughness: .68 })
        const front = new THREE.MeshBasicMaterial({ map: covers.front })
        const back = new THREE.MeshBasicMaterial({ map: covers.back })
        const paper = new THREE.MeshStandardMaterial({ color: '#e8dfca', roughness: .92 })
        const label = document.createElement('canvas')
        label.width = 256; label.height = 2048
        const c = label.getContext('2d')
        c.fillStyle = coverSurfaceColor(presentation); c.fillRect(0, 0, 256, 2048)
        c.strokeStyle = '#d1b476'; c.lineWidth = 5; c.strokeRect(18, 32, 220, 1984)
        c.translate(128, 1024); c.rotate(Math.PI / 2)
        c.fillStyle = '#fff4d7'; c.textAlign = 'center'; c.font = 'bold 90px Georgia'
        c.fillText(presentation.title, 0, -8, 1770)
        c.font = '52px Georgia'; c.fillText(record.schoolYearName || presentation.coverSubtitle, 0, 70, 1700)
        const spineTexture = new THREE.CanvasTexture(label)
        spineTexture.colorSpace = THREE.SRGBColorSpace
        textures.push(spineTexture)
        const spine = new THREE.MeshBasicMaterial({ map: spineTexture })
        materials.push(cloth, front, back, paper, spine)
        const add = (w, h, d, material, x = 0, z = 0) => {
          const shape = new THREE.BoxGeometry(w, h, d)
          const mesh = new THREE.Mesh(shape, material)
          mesh.position.set(x, 0, z)
          mesh.castShadow = true; mesh.receiveShadow = true
          group.add(mesh); geometry.push(shape)
        }
        add(2.54, 3.80, .27, paper)
        add(2.64, 3.90, .045, [cloth, cloth, cloth, cloth, front, cloth], 0, .158)
        add(2.64, 3.90, .045, [cloth, cloth, cloth, cloth, cloth, back], 0, -.158)
        add(.06, 3.90, .36, [cloth, spine, cloth, cloth, cloth, cloth], -1.30)
        group.rotation.y = Math.PI / 2
        group.position.set((index - current.current.activeIndex) * .42, 0, -1.3)
        scene.add(group)
        return { group, from: group.position.clone(), rotationFrom: group.rotation.y }
      })
      let lastKey = '', started = performance.now(), settled = true
      const resize = () => {
        const w = mount.clientWidth, h = mount.clientHeight
        renderer.setSize(w, h, false)
        camera.aspect = w / Math.max(h, 1)
        // Keep the foreground cover fully visible; the outer shelf can continue offscreen.
        camera.position.set(0, .65, Math.max(8.8, 6.1 / camera.aspect + 1.95))
        camera.lookAt(0, -.4, 0)
        camera.updateProjectionMatrix()
        requestRender()
      }
      observer = new ResizeObserver(resize); observer.observe(mount); resize()
      if ('IntersectionObserver' in window) {
        viewportObserver = new IntersectionObserver(([entry]) => {
          inViewport = entry.isIntersecting
          if (inViewport) requestRender()
        }, { rootMargin: '120px' })
        viewportObserver.observe(mount)
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)
      const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2()
      let down = null
      const pointerDown = e => { if (e.button === 0) down = { x: e.clientX, y: e.clientY } }
      const pointerUp = e => {
        const start = down; down = null
        if (!start || current.current.locked || !settled || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) return
        const rect = mount.getBoundingClientRect()
        pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1)
        raycaster.setFromCamera(pointer, camera)
        const hit = raycaster.intersectObjects(books.map(b => b.group), true)[0]
        if (!hit) return
        let target = hit.object
        while (target.parent && target.userData.index === undefined) target = target.parent
        const index = target.userData.index
        if (index === current.current.activeIndex && current.current.mode === 'COVER_VIEW') current.current.onOpen()
        else current.current.onSelect(index)
      }
      mount.addEventListener('pointerdown', pointerDown)
      mount.addEventListener('pointerup', pointerUp)
      renderFrame = now => {
        frameQueued = false
        if (disposed || document.hidden || !inViewport) return
        const { activeIndex: selected, mode: view } = current.current
        const key = `${selected}:${view}`
        if (key !== lastKey) {
          lastKey = key; started = now; settled = false
          books.forEach(book => { book.from.copy(book.group.position); book.rotationFrom = book.group.rotation.y })
        }
        const t = reduced ? 1 : Math.min(1, (now - started) / 900)
        books.forEach(({group, from, rotationFrom}, index) => {
          const offset = index - selected
          const active = offset === 0 && view === 'COVER_VIEW'
          const x = view === 'SHELF' ? offset * .42 : offset === 0 ? 0 : Math.sign(offset) * (1.69 + (Math.abs(offset) - 1) * .40)
          const z = active ? 1.75 : -1.30
          group.position.x = THREE.MathUtils.lerp(from.x, x, smooth(t))
          group.position.z = THREE.MathUtils.lerp(from.z, z, smooth(Math.min(1, t * 1.5)))
          group.rotation.y = THREE.MathUtils.lerp(rotationFrom, active ? 0 : Math.PI / 2, smooth(Math.max(0, (t - .16) / .84)))
        })
        if (!settled && t === 1) { settled = true; current.current.onSettled() }
        renderer.render(scene, camera)
        if (!settled) requestRender()
      }
      requestRender()
      return () => {
        disposed = true
        invalidateRef.current = null
        cancelAnimationFrame(frame); observer.disconnect(); viewportObserver?.disconnect()
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        mount.removeEventListener('pointerdown', pointerDown); mount.removeEventListener('pointerup', pointerUp)
        geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose())
        textures.forEach(t => { t.userData.cancelImageLoad?.(); t.dispose() })
        renderer.dispose(); renderer.domElement.remove()
      }
    } catch {
      disposed = true
      invalidateRef.current = null
      setFailed(true)
      current.current.onSettled()
      observer?.disconnect(); viewportObserver?.disconnect(); cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose())
      renderer?.dispose(); renderer?.domElement.remove()
    }
  }, [yearbooks])
  return <div className="yearbook-shared-scene" ref={mountRef} role="img" aria-label="Yearbooks standing on a wooden shelf">{failed && <p className="yearbook-scene-fallback">Use the book selector below to browse your yearbooks.</p>}</div>
}
