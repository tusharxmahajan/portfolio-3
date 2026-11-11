import { useId } from 'react'

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
 */
export default function ConnectorLine(props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fadeId = `connector-fade-${uid}`
  const maskId = `connector-mask-${uid}`

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
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="-1"
          width="446"
          height="34.75"
          style={{ maskType: 'alpha' }}
        >
          <rect x="0" y="-1" width="446" height="34.75" fill={`url(#${fadeId})`} />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`} opacity="0.2" stroke="#fff" strokeWidth="0.75">
        <path data-part="stem" d="M446 16.375H280" />
        <path data-part="branch" d="M280 16.375C264 16.375 264 0.375 248 0.375H0" />
        <path data-part="branch" d="M280 16.375C264 16.375 264 32.375 248 32.375H0" />
      </g>
    </svg>
  )
}
