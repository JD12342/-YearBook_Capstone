import * as THREE from 'three'
import { paintYearbookCover, coverTextColor } from '../../../yearbook/data/coverArtwork.js'

const TEXTURE_WIDTH = 768
const TEXTURE_HEIGHT = 1024

function wrapText(context, text, maxWidth, maxLines = 6) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width > maxWidth && line) {
      if (lines.length < maxLines) lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })

  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

function drawLines(context, lines, x, y, lineHeight) {
  lines.forEach((line, index) => context.fillText(line, x, y + (index * lineHeight)))
  return y + (lines.length * lineHeight)
}

function drawImageCover(context, image, x, y, width, height) {
  const sourceRatio = image.width / image.height
  const targetRatio = width / height
  let sourceWidth = image.width
  let sourceHeight = image.height
  let sourceX = 0
  let sourceY = 0

  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio
    sourceX = (image.width - sourceWidth) / 2
  } else {
    sourceHeight = image.width / targetRatio
    sourceY = (image.height - sourceHeight) / 2
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

function drawPaper(context, presentation) {
  context.fillStyle = presentation.pageColor
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)

  const wash = context.createRadialGradient(390, 430, 20, 390, 430, 640)
  wash.addColorStop(0, 'rgba(255,255,255,.16)')
  wash.addColorStop(1, 'rgba(91,67,31,.07)')
  context.fillStyle = wash
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)

  context.save()
  context.globalAlpha = 0.055
  context.fillStyle = presentation.inkColor
  for (let index = 0; index < 220; index += 1) {
    context.fillRect((index * 97) % TEXTURE_WIDTH, (index * 53) % TEXTURE_HEIGHT, 1.2, 1.2)
  }
  context.restore()

  context.save()
  context.globalAlpha = 0.58
  context.strokeStyle = presentation.accentColor
  context.lineWidth = 1.5
  context.strokeRect(30, 30, TEXTURE_WIDTH - 60, TEXTURE_HEIGHT - 60)
  context.restore()
}

function createCanvasTexture(paint, imageUrl = '') {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_WIDTH
  canvas.height = TEXTURE_HEIGHT
  const context = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4

  let active = true
  const sources = Array.isArray(imageUrl) ? imageUrl : [imageUrl]
  const images = sources.map(() => null)
  const repaint = () => {
    if (!active) return
    paint(context, Array.isArray(imageUrl) ? images : images[0])
    texture.needsUpdate = true
  }
  repaint()
  const pending = sources.map((url, index) => {
    if (!url) return null
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => { images[index] = image; repaint() }
    image.onerror = () => { images[index] = null; repaint() }
    image.src = url
    return image
  })
  texture.userData.cancelImageLoad = () => {
    active = false
    pending.forEach(image => { if (image) { image.onload = null; image.onerror = null; image.src = '' } })
  }
  return texture
}

function createCoverTexture(presentation) {
  return createCanvasTexture((context, image) => paintYearbookCover(context, presentation, image), presentation.coverImageUrl || '/snhs-seal.png')
}

function createInsideCoverTexture(presentation, label) {
  return createCanvasTexture((context, seal) => {
    const gradient = context.createLinearGradient(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
    gradient.addColorStop(0, presentation.coverColor)
    gradient.addColorStop(1, presentation.coverColor)
    context.fillStyle = gradient
    context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
    context.save()
    context.globalAlpha = 0.28
    context.strokeStyle = presentation.accentColor
    context.lineWidth = 2
    context.strokeRect(38, 38, TEXTURE_WIDTH - 76, TEXTURE_HEIGHT - 76)
    context.restore()
    if (seal) {
      context.save()
      context.globalAlpha = 0.72
      drawImageCover(context, seal, 304, 330, 160, 160)
      context.restore()
    }
    context.fillStyle = coverTextColor(presentation.coverColor)
    context.textAlign = 'center'
    context.font = '500 34px Georgia'
    context.fillText(label, TEXTURE_WIDTH / 2, 565)
    context.fillStyle = presentation.accentColor
    context.font = '700 17px Arial'
    context.fillText('SORSOGON NATIONAL HIGH SCHOOL', TEXTURE_WIDTH / 2, 612)
  }, '/snhs-seal.png')
}

function createBackCoverTexture(presentation) {
  return createCanvasTexture((context, seal) => {
    const coverInk = coverTextColor(presentation.coverColor)
    const gradient = context.createLinearGradient(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
    gradient.addColorStop(0, presentation.coverColor)
    gradient.addColorStop(1, presentation.coverColor)
    context.fillStyle = gradient
    context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
    context.strokeStyle = coverInk
    context.globalAlpha = 0.34
    context.lineWidth = 2
    context.strokeRect(30, 30, TEXTURE_WIDTH - 60, TEXTURE_HEIGHT - 60)
    context.globalAlpha = 1
    if (seal) drawImageCover(context, seal, 319, 348, 130, 130)
    context.fillStyle = coverInk
    context.textAlign = 'center'
    context.font = '500 36px Georgia'
    context.fillText('The story continues.', TEXTURE_WIDTH / 2, 550)
    context.font = '700 16px Arial'
    context.fillText('SORSOGON NATIONAL HIGH SCHOOL', TEXTURE_WIDTH / 2, 602)
    context.globalAlpha = 0.62
    context.font = '500 20px Georgia'
    context.fillText(String(presentation.coverSubtitle || ''), TEXTURE_WIDTH / 2, 642)
    context.globalAlpha = 1
  }, '/snhs-seal.png')
}

function createEndpaperTexture(presentation) {
  return createCanvasTexture((context, seal) => {
    drawPaper(context, presentation)
    context.save()
    context.globalAlpha = 0.12
    if (seal) drawImageCover(context, seal, 214, 340, 340, 340)
    context.restore()
    context.fillStyle = presentation.inkColor
    context.textAlign = 'center'
    context.font = '700 16px Arial'
    context.fillText('SORSOGON NATIONAL HIGH SCHOOL', TEXTURE_WIDTH / 2, 760)
    context.globalAlpha = 0.72
    context.font = '500 24px Georgia'
    context.fillText(String(presentation.coverSubtitle || ''), TEXTURE_WIDTH / 2, 808)
    context.globalAlpha = 1
  }, '/snhs-seal.png')
}

function createProfilePageTexture(presentation, page, pageNumber, side) {
  const artworkUrl = side === 'left' ? page.leftPageImageUrl : page.rightPageImageUrl
  const profiles = Array.isArray(page.profiles) ? page.profiles : []
  // One portrait per physical page: left then right, continuing on the next spread.
  const visibleProfiles = profiles.slice(side === 'left' ? 0 : 1, side === 'left' ? 1 : 2)

  return createCanvasTexture((context, images) => {
    const artwork = images?.[0]
    if (artworkUrl && artwork) {
      drawImageCover(context, artwork, 0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
      return
    }

    drawPaper(context, presentation)
    context.fillStyle = presentation.inkColor
    context.textAlign = 'left'
    context.font = '700 16px Arial'
    context.fillText('THE GRADUATING CLASS', 56, 82)
    context.globalAlpha = 0.5
    context.textAlign = 'right'
    context.font = '18px Georgia'
    context.fillText(String(pageNumber).padStart(2, '0'), 708, 82)
    context.globalAlpha = 1

    if (!visibleProfiles.length) {
      context.textAlign = 'center'
      context.fillStyle = presentation.inkColor
      context.font = '28px Georgia'
      context.fillText(profiles.length ? 'End of class records' : 'No student records published yet.', 384, 480)
    }
    visibleProfiles.forEach((profile, index) => {
      const rowTop = 154 + (index * 430)
      const photoX = 56
      const photoY = rowTop
      const portraitWidth = 230
      const portraitHeight = 288
      const detailsX = 322
      const portraitGradient = context.createLinearGradient(photoX, photoY, photoX, photoY + portraitHeight)
      portraitGradient.addColorStop(0, '#d7d8d3')
      portraitGradient.addColorStop(1, '#b9bcb8')
      context.fillStyle = portraitGradient
      context.fillRect(photoX, photoY, portraitWidth, portraitHeight)
      if (images?.[index + 1]) drawImageCover(context, images[index + 1], photoX, photoY, portraitWidth, portraitHeight)
      else {
        context.fillStyle = presentation.inkColor
        context.font = '16px Arial'
        context.textAlign = 'center'
        context.fillText('Portrait not available', photoX + (portraitWidth / 2), photoY + (portraitHeight / 2))
      }
      context.fillStyle = presentation.inkColor
      context.textAlign = 'left'
      context.font = '600 31px Georgia'
      const nameEnd = drawLines(context, wrapText(context, String(profile.name || '').toUpperCase(), 392, 2), detailsX, rowTop + 38, 34)
      context.fillStyle = presentation.accentColor
      context.fillRect(detailsX, nameEnd + 5, 86, 8)
      context.fillStyle = presentation.inkColor
      context.font = '700 18px Arial'
      const questionEnd = drawLines(context, wrapText(context, [profile.strand, profile.section].filter(Boolean).join(' · '), 392, 4), detailsX, nameEnd + 54, 25)
      context.globalAlpha = 0.78
      context.font = '19px Arial'
      drawLines(context, wrapText(context, profile.awards ? `Awards: ${profile.awards}` : '', 392, 7), detailsX, questionEnd + 24, 27)
      context.globalAlpha = 1
    })
  }, [artworkUrl || '', ...visibleProfiles.map(profile => profile.photoUrl || '')])
}

function createEditorialPageTexture(presentation, page, pageNumber, side) {
  const artworkUrl = side === 'left' ? page.leftPageImageUrl : page.rightPageImageUrl
  const featureImageUrl = side === 'right' ? (page.imageUrl || '/school.jpg') : '/snhs-seal.png'

  return createCanvasTexture((context, image) => {
    if (artworkUrl && image) {
      drawImageCover(context, image, 0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT)
      return
    }

    drawPaper(context, presentation)
    if (side === 'left') {
      context.fillStyle = presentation.inkColor
      context.textAlign = 'left'
      context.font = '700 17px Arial'
      context.fillText(String(page.eyebrow || '').toUpperCase(), 76, 104)
      if (image) {
        context.save()
        context.globalAlpha = 0.68
        drawImageCover(context, image, 588, 138, 92, 92)
        context.restore()
      }
      context.fillStyle = presentation.inkColor
      context.font = '500 64px Georgia'
      const titleEnd = drawLines(context, wrapText(context, page.title, 590, 3), 76, 400, 66)
      context.globalAlpha = 0.78
      context.font = '26px Arial'
      drawLines(context, wrapText(context, page.body, 590, 6), 76, titleEnd + 36, 36)
      context.globalAlpha = 1
    } else {
      if (image) drawImageCover(context, image, 0, 0, TEXTURE_WIDTH, 610)
      const fade = context.createLinearGradient(0, 370, 0, 680)
      fade.addColorStop(0, 'rgba(0,0,0,0)')
      fade.addColorStop(1, presentation.pageColor)
      context.fillStyle = fade
      context.fillRect(0, 360, TEXTURE_WIDTH, 340)
      context.fillStyle = presentation.inkColor
      context.textAlign = 'left'
      context.font = '500 54px Georgia'
      drawLines(context, wrapText(context, `“${page.quote}”`, 580, 5), 78, 690, 58)
      context.fillStyle = presentation.inkColor
      context.font = '700 14px Arial'
      context.fillText(`SORSOGON NATIONAL HIGH SCHOOL · ${presentation.coverSubtitle}`.toUpperCase(), 78, 942)
    }
    context.globalAlpha = 0.5
    context.textAlign = 'right'
    context.font = '18px Georgia'
    context.fillText(String(pageNumber).padStart(2, '0'), 686, 104)
    context.globalAlpha = 1
  }, artworkUrl || featureImageUrl)
}

function createClosingTexture(presentation) {
  return createCanvasTexture((context) => {
    drawPaper(context, presentation)
    context.fillStyle = presentation.inkColor
    context.textAlign = 'center'
    context.font = '500 62px Georgia'
    context.fillText('The story continues.', TEXTURE_WIDTH / 2, 470)
    context.fillStyle = presentation.inkColor
    context.globalAlpha = 0.7
    context.font = '22px Arial'
    context.fillText('Sorsogon National High School', TEXTURE_WIDTH / 2, 525)
    context.globalAlpha = 1
  })
}

export function createYearbookTextureSet(presentation) {
  const pages = presentation.pages || []
  const textures = []
  const pageTexture = (page, index, side) => {
    const pageNumber = (index * 2) + (side === 'left' ? 1 : 2)
    const texture = page.layout === 'profiles' || page.id === 'portraits'
      ? createProfilePageTexture(presentation, page, pageNumber, side)
      : createEditorialPageTexture(presentation, page, pageNumber, side)
    textures.push(texture)
    return texture
  }
  const leftTextures = pages.map((page, index) => pageTexture(page, index, 'left'))
  const rightTextures = pages.map((page, index) => pageTexture(page, index, 'right'))
  const coverTexture = createCoverTexture(presentation)
  const backCoverTexture = createBackCoverTexture(presentation)
  const insideFrontCoverTexture = createInsideCoverTexture(presentation, 'This is our story.')
  const insideBackCoverTexture = createInsideCoverTexture(presentation, 'Once a student, always part of the story.')
  const endpaperTexture = createEndpaperTexture(presentation)
  const closingTexture = createClosingTexture(presentation)
  textures.push(coverTexture, backCoverTexture, insideFrontCoverTexture, insideBackCoverTexture, endpaperTexture, closingTexture)

  const leaves = [{ front: endpaperTexture, back: leftTextures[0] }]
  for (let index = 1; index < pages.length; index += 1) {
    leaves.push({ front: rightTextures[index - 1], back: leftTextures[index] })
  }
  leaves.push({ front: rightTextures[pages.length - 1], back: closingTexture })

  return { leaves, textures, coverTexture, backCoverTexture, insideFrontCoverTexture, insideBackCoverTexture }
}
