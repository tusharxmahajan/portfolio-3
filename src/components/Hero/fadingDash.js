const round = (n) => Math.round(n * 10000) / 10000

/**
 * A dash that fades along its length, for the connector lines' light pulses: fully
 * transparent at its tail, more opaque step by step, full at its head.
 *
 * SVG can't vary a stroke's opacity along a dash, so the dash is drawn as `pieces` short
 * dashes laid end to end — one path each, all with the same `d` — each a step more opaque
 * than the one behind it. Each piece's dash array sets it in its place within the dash and
 * keeps the pattern's `period`, so one dash offset moves them all together, exactly as it
 * would move a plain `dash`-long dash repeating every `period`.
 *
 * Returns each piece's style, tail first. Draw them with butt caps: every pattern starts
 * with a zero-length dash, which round caps would show as a dot.
 */
export function fadingDash(dash, period, pieces) {
  const piece = dash / pieces
  return Array.from({ length: pieces }, (_, k) => ({
    strokeDasharray: `0 ${round(k * piece)} ${round(piece)} ${round(period - (k + 1) * piece)}`,
    strokeOpacity: round((k + 1) / pieces),
  }))
}
