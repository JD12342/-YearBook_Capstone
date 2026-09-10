const MODEL_URL = '/face-models'
const MATCH_DISTANCE_LIMIT = 0.56
const descriptorCache = new Map()
const imageSignatureCache = new Map()

let faceApiPromise
let modelsPromise

const loadFaceApi = async () => {
  if (!faceApiPromise) faceApiPromise = import('@vladmandic/face-api')
  return faceApiPromise
}

export const loadFaceSearchModels = async () => {
  if (!modelsPromise) {
    modelsPromise = loadFaceApi().then(async (faceapi) => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      return faceapi
    }).catch((error) => {
      modelsPromise = undefined
      throw error
    })
  }
  return modelsPromise
}

const detectorOptions = (faceapi) => new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })

const imageFromUrl = async (faceapi, url) => {
  const response = await fetch(url, { mode: 'cors' })
  if (!response.ok) throw new Error('Published portrait could not be read.')
  return faceapi.bufferToImage(await response.blob())
}

const descriptorFromPublishedPortrait = async (url) => {
  if (!descriptorCache.has(url)) {
    descriptorCache.set(url, loadFaceSearchModels().then(async (faceapi) => {
      const image = await imageFromUrl(faceapi, url)
      const detection = await faceapi
        .detectSingleFace(image, detectorOptions(faceapi))
        .withFaceLandmarks(true)
        .withFaceDescriptor()
      return detection?.descriptor || null
    }).catch((error) => {
      descriptorCache.delete(url)
      throw error
    }))
  }
  return descriptorCache.get(url)
}

export const collectPublishedPortraits = (yearbooks = []) => {
  const seen = new Set()
  return yearbooks.flatMap((yearbook) => (yearbook.pages || []).flatMap((page) => (page.profiles || []).map((profile) => ({
    ...profile,
    yearbookId: yearbook.id,
    yearbookTitle: yearbook.title || `Graduation Yearbook ${yearbook.schoolYearName || ''}`.trim(),
    schoolYear: yearbook.schoolYearName || '',
  })))).filter((profile) => {
    const key = `${profile.id || profile.name}|${profile.photoUrl || ''}`
    if (!profile.photoUrl || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// This is a readable closeness score, not a probability or identity decision.
export const distanceToSimilarity = (distance) => Math.max(0, Math.min(100, Math.round((1 - distance) * 100)))

export const rankFaceMatches = (candidates, limit = 5) => candidates
  .filter((candidate) => Number.isFinite(candidate.distance) && candidate.distance <= MATCH_DISTANCE_LIMIT)
  .sort((left, right) => left.distance - right.distance)
  .slice(0, limit)
  .map((candidate) => ({ ...candidate, similarity: distanceToSimilarity(candidate.distance) }))

const imageToSignature = (image) => {
  const size = 24
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, size, size)
  const pixels = context.getImageData(0, 0, size, size).data
  const luminance = []
  const histogram = Array(12).fill(0)

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index] / 255
    const green = pixels[index + 1] / 255
    const blue = pixels[index + 2] / 255
    luminance.push((red * 0.299) + (green * 0.587) + (blue * 0.114))
    histogram[Math.min(3, Math.floor(red * 4))] += 1
    histogram[4 + Math.min(3, Math.floor(green * 4))] += 1
    histogram[8 + Math.min(3, Math.floor(blue * 4))] += 1
  }

  const mean = luminance.reduce((sum, value) => sum + value, 0) / luminance.length
  const variance = luminance.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / luminance.length
  const deviation = Math.sqrt(variance) || 1
  return {
    luminance: luminance.map((value) => (value - mean) / deviation),
    histogram: histogram.map((value) => value / luminance.length),
  }
}

const signatureFromBlob = async (blob) => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob)
    try {
      return imageToSignature(bitmap)
    } finally {
      bitmap.close()
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('The selected image could not be read.'))
      element.src = objectUrl
    })
    return imageToSignature(image)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const signatureFromPublishedPortrait = async (url) => {
  if (!imageSignatureCache.has(url)) {
    imageSignatureCache.set(url, fetch(url, { mode: 'cors' }).then(async (response) => {
      if (!response.ok) throw new Error('Published portrait could not be read.')
      return signatureFromBlob(await response.blob())
    }).catch((error) => {
      imageSignatureCache.delete(url)
      throw error
    }))
  }
  return imageSignatureCache.get(url)
}

export const imageSimilarity = (left, right) => {
  if (!left?.luminance?.length || left.luminance.length !== right?.luminance?.length) return 0
  const luminanceCorrelation = left.luminance.reduce((sum, value, index) => sum + (value * right.luminance[index]), 0) / left.luminance.length
  const structureScore = Math.max(0, Math.min(1, (luminanceCorrelation + 1) / 2))
  const histogramDifference = left.histogram.reduce((sum, value, index) => sum + Math.abs(value - right.histogram[index]), 0)
  const colorScore = Math.max(0, 1 - (histogramDifference / 6))
  return Math.round(((structureScore * 0.72) + (colorScore * 0.28)) * 100)
}

export const rankImageMatches = (candidates, limit = 5) => candidates
  .filter((candidate) => Number.isFinite(candidate.similarity))
  .sort((left, right) => right.similarity - left.similarity)
  .slice(0, limit)

export const searchPublishedFaces = async ({ file, yearbooks, onProgress }) => {
  const faceapi = await loadFaceSearchModels()
  const queryImage = await faceapi.bufferToImage(file)
  const faces = await faceapi
    .detectAllFaces(queryImage, detectorOptions(faceapi))
    .withFaceLandmarks(true)
    .withFaceDescriptors()

  if (!faces.length) throw new Error('No clear face was found. Choose a bright, front-facing photo and try again.')
  if (faces.length > 1) throw new Error('More than one face was found. Choose or crop a photo with one person only.')

  const portraits = collectPublishedPortraits(yearbooks)
  if (!portraits.length) throw new Error('There are no approved yearbook portraits available to search yet.')

  const compared = []
  for (let index = 0; index < portraits.length; index += 1) {
    const portrait = portraits[index]
    try {
      const descriptor = await descriptorFromPublishedPortrait(portrait.photoUrl)
      if (descriptor) compared.push({
        ...portrait,
        distance: faceapi.euclideanDistance(faces[0].descriptor, descriptor),
      })
    } catch {
      // A broken published portrait should not stop the rest of the archive search.
    }
    onProgress?.({ completed: index + 1, total: portraits.length })
  }

  return {
    matches: rankFaceMatches(compared),
    searchedCount: portraits.length,
    readableCount: compared.length,
  }
}

export const searchPublishedImages = async ({ file, yearbooks, onProgress }) => {
  const portraits = collectPublishedPortraits(yearbooks)
  if (!portraits.length) throw new Error('There are no approved yearbook portraits available to search yet.')
  const querySignature = await signatureFromBlob(file)
  const compared = []

  for (let index = 0; index < portraits.length; index += 1) {
    const portrait = portraits[index]
    try {
      const signature = await signatureFromPublishedPortrait(portrait.photoUrl)
      compared.push({ ...portrait, similarity: imageSimilarity(querySignature, signature) })
    } catch {
      // Continue when a single published image is unavailable.
    }
    onProgress?.({ completed: index + 1, total: portraits.length })
  }

  return {
    matches: rankImageMatches(compared),
    searchedCount: portraits.length,
    readableCount: compared.length,
  }
}
