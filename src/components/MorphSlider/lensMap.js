// How far the sides bulge out, as a share of the displacement scale.
const BULGE = 0.38

/**
 * Displacement map for the slider's glass lens (feDisplacementMap): flat across the middle —
 * `flat`, a share of the width — then bending gently at first and more and more towards both
 * sides, outwards and a little taller, as through the edge of a lens. Red is the horizontal
 * shift, green the vertical, mid-grey none. Returns a PNG data URL, stretched over the stage.
 */
export function lensMap(flat) {
  const width = 256
  const height = 96
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  const image = context.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height - 0.5 // −0.5 (top) … 0.5 (bottom)
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width - 0.5 // −0.5 (left) … 0.5 (right)
      const t = Math.min(1, Math.max(0, (Math.abs(u) * 2 - flat) / (1 - flat)))
      const bend = (t * t * (3 - 2 * t)) ** 2
      const i = (y * width + x) * 4
      image.data[i] = Math.round(255 * (0.5 - Math.sign(u) * BULGE * bend))
      image.data[i + 1] = Math.round(255 * (0.5 - v * bend))
      image.data[i + 2] = 128
      image.data[i + 3] = 255
    }
  }

  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}
