const MODEL_URL = '/face-models'
const MATCH_DISTANCE_LIMIT = 0.56
const descriptorCache = new Map()

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
