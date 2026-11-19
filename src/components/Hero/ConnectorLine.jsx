import { useId } from 'react'
import styles from './ConnectorLine.module.css'
import { fadingDash } from './fadingDash.js'

// Artboard geometry (446 × 32.75). The headline end is on the right (x = 446); the right-hand
// connector is this one mirrored.
const WIDTH = 446
const FORK_Y = 16.375 // the stem's height: where the branches meet
const FORK_X = 280
const CURVE_X = 264 // the S-curves' control points
const RUN_X = 248 // where each S-curve meets its straight run
const RUNS = [0.375, 32.375] // the branches' straight runs, top and bottom

// Drawn outward by the intro: headline end → fork, then fork → S-curve → far end.
const STEM = `M${WIDTH} ${FORK_Y}H${FORK_X}`
const branch = (y) => `M${FORK_X} ${FORK_Y}C${CURVE_X} ${FORK_Y} ${CURVE_X} ${y} ${RUN_X} ${y}H0`
// A pulse's route: one branch and the stem, the other way — far end → fork → headline.
const route = (y) => `M0 ${y}H${RUN_X}C${CURVE_X} ${y} ${CURVE_X} ${FORK_Y} ${FORK_X} ${FORK_Y}H${WIDTH}`
// A pulse: a 28px dash, one per 1028px of its route (so one at a time), fading from its tail
// to its head in 14 steps of 2px (fadingDash.js). Moved along by ConnectorLine.module.css.
const PULSE_PIECES = fadingDash(28, 1028, 14)

/**
 * Connector line from the Figma artboard (446 × 32.75) with S-curve forks.
 * Inline SVG (not an <img>) so the intro can draw the strokes.
 *
 * Paths start at the end nearest the headline, so drawing them runs outward:
 *   stem    — single line from the headline end to the fork
 *   branch  — S-curve out of the fork, then the straight run to the far end (× 2)
 *
 * The strokes are solid white; the fade and 20% opacity are applied once to the group
 * (alpha mask + group opacity), so the overlapping branches at the fork don't stack.
 *
 * Over them, a light pulse per branch (data-part="pulse", in pieces): a short glowing dash,
 * transparent at its tail and full at its head, that runs in from the far end, through the
 * fork, into the headline, on a loop (ConnectorLine.module.css).
 * `pulseDelays` staggers them: seconds, one per branch, top first. Coloured with the client
 * logos' gradient laid along the line — light cyan at the far end → cyan at the headline —
 * so each pulse deepens as it travels in; and under the same fade, so it brightens too.
 */
export default function ConnectorLine({ pulseDelays = [0, 0], ...props }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fadeId = `connector-fade-${uid}`
  const maskId = `connector-mask-${uid}`
  const glowId = `connector-glow-${uid}`
  const pulseColourId = `connector-pulse-${uid}`

  return (
    <svg
      width="446"
      height="32.75"
      viewBox="0 0 446 32.75"
      fill="none"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="446" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient
          id={pulseColourId}
          x1="0"
          y1="0"
          x2="446"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop style={{ stopColor: 'var(--color-cyan-light)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-cyan)' }} />
        </linearGradient>
        {/* Room around the box for the pulses' glow. */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="-8"
          y="-8"
          width="462"
          height="48.75"
          style={{ maskType: 'alpha' }}
        >
          <rect x="-8" y="-8" width="462" height="48.75" fill={`url(#${fadeId})`} />
        </mask>
        <filter
          id={glowId}
          filterUnits="userSpaceOnUse"
          x="-8"
          y="-8"
          width="462"
          height="48.75"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow dx="0" dy="0" stdDeviation="0.5" floodColor="#5fe6ff" />
        </filter>
      </defs>

      <g mask={`url(#${maskId})`} opacity="0.2" stroke="#fff" strokeWidth="0.75">
        <path data-part="stem" d={STEM} />
        {RUNS.map((y) => (
          <path key={y} data-part="branch" d={branch(y)} />
        ))}
      </g>

      <g mask={`url(#${maskId})`} filter={`url(#${glowId})`} stroke={`url(#${pulseColourId})`}>
        {RUNS.map((y, i) =>
          PULSE_PIECES.map((piece, k) => (
            <path
              key={`${y}-${k}`}
              className={styles.pulse}
              data-part="pulse"
              d={route(y)}
              style={{ ...piece, animationDelay: `${pulseDelays[i]}s` }}
            />
          )),
        )}
      </g>
    </svg>
  )
}
