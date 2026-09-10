export const COVER_ART_WIDTH = 768
export const COVER_ART_HEIGHT = 1024

export function coverTextColor(color = '#087a5c') {
  const rgb = color.replace('#', '').match(/.{2}/g)?.map(v => parseInt(v, 16) / 255) || [0, 0, 0]
  const linear = rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722 > .179 ? '#102c24' : '#fffaf0'
}

export function paintYearbookCover(context, presentation, image) {
  const width = COVER_ART_WIDTH, height = COVER_ART_HEIGHT
  context.save()
  context.clearRect(0, 0, width, height)
  context.fillStyle = presentation.coverColor || '#087a5c'
  context.fillRect(0, 0, width, height)
  if (presentation.coverImageUrl && image) {
    const scale = Math.max(width / image.width, height / image.height)
    context.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale)
    context.restore()
    return
  }
  const ink = coverTextColor(presentation.coverColor)
  context.strokeStyle = presentation.accentColor || '#d7b866'
  context.lineWidth = 2
  context.strokeRect(30, 30, width - 60, height - 60)
  context.globalAlpha = .3
  context.beginPath()
  context.arc(680, 140, 240, 0, Math.PI * 2)
  context.stroke()
  context.globalAlpha = 1
  if (image && !presentation.coverImageUrl) context.drawImage(image, 64, 70, 98, 98)
  context.fillStyle = ink
  context.textAlign = 'left'
  context.font = 'bold 17px Arial'
  context.fillText('SORSOGON NATIONAL HIGH SCHOOL', 64, 610, 640)
  const title = String(presentation.coverTitle || 'GRAD BOOK').toUpperCase()
  let lines = [], size = 100
  do {
    context.font = `500 ${size}px Georgia`
    lines = ['']
    for (const word of title.split(/\s+/)) {
      const i = lines.length - 1
      if (lines[i] && context.measureText(`${lines[i]} ${word}`).width > 630) lines.push(word)
      else lines[i] = `${lines[i]} ${word}`.trim()
    }
    if (lines.length <= 3) break
    size -= 4
  } while (size > 28)
  lines.slice(0, 3).forEach((line, index) => context.fillText(line, 60, 690 + index * size * 1.04, 640))
  context.fillStyle = presentation.accentColor || ink
  context.fillRect(64, 924, 72, 3)
  context.fillStyle = ink
  context.font = '500 24px Georgia'
  context.fillText(String(presentation.coverSubtitle || ''), 64, 972, 630)
  context.restore()
}
