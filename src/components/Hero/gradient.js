// Geometry of the hero's radial gradient (see .backdrop in Hero.module.css): an ellipse
// centred at (50%, -3.78%) of the backdrop's box whose radii are --glow-size of the box
// (103.78% when settled; animated from 0% by the intro). The backdrop scrolls with the
// page; the horizon (its bottom curve, drawn over the pinned content) shares its geometry.
export const GRADIENT_SIZE = '103.78%'
const SETTLED_SIZE = parseFloat(GRADIENT_SIZE)
const CENTRE_Y = -0.0378

// From ~94% of the radius the rim runs pale cyan → white; outside the ellipse it's white.
const LIGHT_FROM = 0.94

// Furthest along a band bandThrough() goes, as a share of its horizontal radius: past it the
// band turns vertical. (Only points off-screen get this far.)
const BAND_EDGE = 0.98

/**
 * The gradient's colour band through a point on its centre line. Every band of colour is a
 * scaled copy of the gradient's ellipse — same centre, same proportions as the box — so
 * this is the curve that runs parallel to the gradient's bottom curve at that depth.
 *
 * For a `width` × `height` box (the settled gradient) and the point `y` px below its top,
 * returns a function of `x` (px from the box's centre line, negative = left) giving the
 * band there: `y`, how far it sits below the point (px, negative = above), and `angle`, its
 * slope (degrees, clockwise — a CSS rotate).
 */
export function bandThrough(width, height, y) {
  const ry = y - CENTRE_Y * height // vertical radius: centre → the point
  const rx = (ry * width) / height // horizontal radius, in the box's proportions
  return (x) => {
    const u = Math.min(Math.max(x / rx, -BAND_EDGE), BAND_EDGE)
    const s = Math.sqrt(1 - u * u)
    return {
      y: ry * (s - 1),
      angle: (Math.atan((-ry / rx) * (u / s)) * 180) / Math.PI,
    }
  }
}

// Is (x, y) beyond the dark part of the gradient ellipse laid over `box`?
function isLightIn(box, size, x, y) {
  const dx = (x - (box.left + box.width / 2)) / (box.width * size)
  const dy = (y - (box.top + CENTRE_Y * box.height)) / (box.height * size)
  return dx * dx + dy * dy > LIGHT_FROM * LIGHT_FROM
}

/**
 * Whether the page at viewport point (x, y) is light: outside the dark part of the hero
 * gradient, or covered by the horizon (the bottom curve that scrolls up over the hero, with
 * the white page after it). Tracks the gradient while the intro is growing it.
 */
export function isHeroLightAt(x, y) {
  const backdrop = document.querySelector('[data-anim="backdrop"]')
  if (!backdrop) return false

  const box = backdrop.getBoundingClientRect()
  if (x < box.left || x > box.right || y < box.top || y > box.bottom) return true // white page

  const animated = backdrop.style.getPropertyValue('--glow-size')
  const size = (animated ? parseFloat(animated) : SETTLED_SIZE) / 100
  if (size <= 0) return true
  if (isLightIn(box, size, x, y)) return true

  const horizon = document.querySelector('[data-anim="horizon"]')
  if (!horizon) return false
  const h = horizon.getBoundingClientRect()
  if (y >= h.bottom) return true // the page below the horizon
  return y >= h.top && isLightIn(h, size, x, y)
}
