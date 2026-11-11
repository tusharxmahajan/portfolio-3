// Geometry of the hero's radial gradient (see .backdrop in Hero.module.css): an ellipse
// centred at (50%, -3.78%) of the hero box whose radii are --glow-size of the box
// (103.78% when settled; animated from 0% by the intro).
export const GRADIENT_SIZE = '103.78%'
const SETTLED_SIZE = parseFloat(GRADIENT_SIZE)
const CENTRE_Y = -0.0378

// From ~94% of the radius the rim runs pale cyan → white; outside the ellipse it's white.
const LIGHT_FROM = 0.94

/**
 * Whether the hero background at viewport point (x, y) is light — i.e. outside the dark
 * part of the gradient. Tracks the gradient while the intro is growing it.
 */
export function isHeroLightAt(x, y) {
  const backdrop = document.querySelector('[data-anim="backdrop"]')
  if (!backdrop) return false

  const box = backdrop.getBoundingClientRect()
  if (x < box.left || x > box.right || y < box.top || y > box.bottom) return true // white page

  const animated = backdrop.style.getPropertyValue('--glow-size')
  const size = (animated ? parseFloat(animated) : SETTLED_SIZE) / 100
  if (size <= 0) return true

  const dx = (x - (box.left + box.width / 2)) / (box.width * size)
  const dy = (y - (box.top + CENTRE_Y * box.height)) / (box.height * size)
  return dx * dx + dy * dy > LIGHT_FROM * LIGHT_FROM
}
