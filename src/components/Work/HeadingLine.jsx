import { useId, useLayoutEffect, useRef } from 'react'

// Geometry of the Figma connector line (px): a hairline that steps up around the title —
// 45° slopes, 24px-radius corners — and runs flat to both edges of its box.
const STROKE = 1
const RISE = 29 // the Figma line's 33, 4px shorter
const RADIUS = 24
const TANGENT = RADIUS * Math.tan(Math.PI / 8) // corner start → virtual corner, ≈ 9.94
const HANDLE = (4 / 3) * Math.tan(Math.PI / 16) * RADIUS // Bézier handle for a 45° arc, ≈ 6.37
const DIAG = Math.SQRT1_2 // a unit step along the 45° slope, per axis
// Flat runs inset by half a stroke, so the stroke's outer edges start on whole pixels.
const TOP = STROKE / 2
const BOTTOM = TOP + RISE
const HEIGHT = BOTTOM + STROKE / 2
// The raised part's flat top ends this far inside each edge of the title.
const INSET = 6

const r = (n) => Math.round(n * 1000) / 1000

/** Path for a line `width` wide whose raised flat top is `flat` wide, centred. */
function linePath(width, flat) {
  const c = width / 2
  const half = Math.max(0, flat / 2)
  // Left half, as x offsets from the centre (mirrored for the right half).
  const plateau = half // top corner ends / plateau begins
  const topCorner = half + TANGENT // virtual top corner
  const bottomCorner = topCorner + RISE // virtual bottom corner
  const flatEnd = bottomCorner + TANGENT // bottom corner begins (end of the flat run)

  const left = (dx) => r(c - dx)
  const right = (dx) => r(c + dx)
  const slopeLow = BOTTOM - TANGENT * DIAG // where the bottom corner meets the slope
  const slopeHigh = TOP + TANGENT * DIAG // where the slope meets the top corner
  const h = HANDLE * DIAG

  return [
    `M0 ${BOTTOM}`,
    `H${left(flatEnd)}`,
    `C${left(flatEnd - HANDLE)} ${BOTTOM} ${left(bottomCorner - TANGENT * DIAG + h)} ${r(slopeLow + h)} ${left(bottomCorner - TANGENT * DIAG)} ${r(slopeLow)}`,
    `L${left(topCorner + TANGENT * DIAG)} ${r(slopeHigh)}`,
    `C${left(topCorner + TANGENT * DIAG - h)} ${r(slopeHigh - h)} ${left(plateau + HANDLE)} ${TOP} ${left(plateau)} ${TOP}`,
    `H${right(plateau)}`,
    `C${right(plateau + HANDLE)} ${TOP} ${right(topCorner + TANGENT * DIAG - h)} ${r(slopeHigh - h)} ${right(topCorner + TANGENT * DIAG)} ${r(slopeHigh)}`,
    `L${right(bottomCorner - TANGENT * DIAG)} ${r(slopeLow)}`,
    `C${right(bottomCorner - TANGENT * DIAG + h)} ${r(slopeLow + h)} ${right(flatEnd - HANDLE)} ${BOTTOM} ${right(flatEnd)} ${BOTTOM}`,
    `H${r(width)}`,
  ].join('')
}

/**
 * The connector line under a section title: full width of its box, raised under the title
 * (`titleRef`) and sized to it. Stroke: 0.75px, cyan → blue → cyan gradient (faded at the
 * ends), 20% opacity — as in the Figma file.
 *
 * `fill` (a CSS colour, optional) fills everything above the line, up to the top of its
 * positioned container, so the line becomes the bottom edge of a solid block — notch
 * included, with whatever's behind showing beneath it. Stack the line under the content
 * above it (e.g. z-index: -1) so the fill stays behind that content.
 *
 * Redrawn whenever the box or title resizes — straight onto the SVG, in the same frame, so
 * it keeps up with a title whose size is animated.
 */
export default function HeadingLine({ titleRef, fill, className = '' }) {
  const box = useRef(null)
  const svg = useRef(null)
  const path = useRef(null)
  const area = useRef(null)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gradientId = `heading-line-${uid}`

  useLayoutEffect(() => {
    const draw = () => {
      const width = box.current.clientWidth
      const title = titleRef.current.getBoundingClientRect().width
      svg.current.setAttribute('width', width)
      svg.current.setAttribute('viewBox', `0 0 ${width} ${HEIGHT}`)
      const line = linePath(width, title - 2 * INSET)
      path.current.setAttribute('d', line)
      // The line, closed along the top of the positioned container.
      area.current?.setAttribute('d', `${line}V${-box.current.offsetTop}H0Z`)
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(box.current)
    observer.observe(titleRef.current)
    return () => observer.disconnect()
  }, [titleRef])

  return (
    <div ref={box} className={className} aria-hidden="true">
      <svg ref={svg} width="0" height={HEIGHT} fill="none" overflow="visible">
        <defs>
          {/* Spread over the middle 89% of the width, as in the original (78 → 1338 of 1416). */}
          <linearGradient id={gradientId} x1="0.0551" y1="0" x2="0.9449" y2="0">
            <stop stopColor="#48CAE4" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#0077B6" />
            <stop offset="1" stopColor="#48CAE4" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {fill && <path ref={area} style={{ fill }} />}
        <path ref={path} opacity="0.2" stroke={`url(#${gradientId})`} strokeWidth={STROKE} />
      </svg>
    </div>
  )
}
