const MB = 1024 * 1024
export const PORTRAIT_MAX_EDGE = 3000
const PORTRAIT_TARGET_BYTES = 8 * MB
const MAX_SOURCE_BYTES = 60 * MB
const portraitCache = new WeakMap()

const canvasToBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) resolve(blob)
    else reject(new Error('The browser could not prepare this image.'))
  }, 'image/jpeg', quality)
})

const loadImageSource = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      }
    } catch {
      // Some browsers do not support imageOrientation. The image element fallback
      // still honors EXIF orientation in current Chrome, Edge, Firefox, and Safari.
    }
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = objectUrl
  try {
    await image.decode()
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => URL.revokeObjectURL(objectUrl),
  }
}

const optimizedName = (name = 'portrait') => `${name.replace(/\.[^.]+$/, '') || 'portrait'}-optimized.jpg`

async function createOptimizedPortrait(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose a JPG, PNG, or WebP image.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('This image is too large to process safely. Choose a photo under 60 MB.')

  let loaded
  try {
    loaded = await loadImageSource(file)
    if (!loaded.width || !loaded.height) throw new Error('This image has no readable dimensions.')

    const scale = Math.min(1, PORTRAIT_MAX_EDGE / Math.max(loaded.width, loaded.height))
    const width = Math.max(1, Math.round(loaded.width * scale))
    const height = Math.max(1, Math.round(loaded.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('The browser could not prepare this image.')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(loaded.source, 0, 0, width, height)

    let blob
    for (const quality of [0.94, 0.91, 0.88]) {
      blob = await canvasToBlob(canvas, quality)
      if (blob.size <= PORTRAIT_TARGET_BYTES) break
    }

    const canKeepOriginal = file.type === 'image/jpeg'
      && file.size <= PORTRAIT_TARGET_BYTES
      && file.size <= blob.size
      && scale === 1
    const uploadFile = canKeepOriginal
      ? file
      : new File([blob], optimizedName(file.name), { type: 'image/jpeg', lastModified: Date.now() })

    if (uploadFile.size > PORTRAIT_TARGET_BYTES) {
      throw new Error('The optimized portrait is still too large. Try exporting it as a JPG first.')
    }

    return {
      file: uploadFile,
      originalBytes: file.size,
      uploadedBytes: uploadFile.size,
      optimized: uploadFile !== file,
      width,
      height,
    }
  } catch (error) {
    if (error?.message?.includes('too large') || error?.message?.includes('optimized portrait')) throw error
    throw new Error('This photo could not be optimized. Choose a valid JPG, PNG, or WebP image.')
  } finally {
    loaded?.release?.()
  }
}

export function optimizePortraitForUpload(file) {
  if (!file || typeof file !== 'object') return Promise.reject(new Error('Choose a portrait to upload.'))
  if (!portraitCache.has(file)) portraitCache.set(file, createOptimizedPortrait(file))
  return portraitCache.get(file)
}
