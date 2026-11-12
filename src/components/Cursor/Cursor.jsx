import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import styles from './Cursor.module.css'

gsap.registerPlugin(useGSAP)

// Follow physics: each 60fps frame the dot closes 30% of its gap to the pointer and the ring
// 10% — a quick dot with a soft, trailing ring. Both chase the pointer itself.
const DOT_FOLLOW = 0.3
const RING_FOLLOW = 0.1

const DOT_SIZE = 4

// Ring radius (SVG units = px, 0.5px stroke): 44px across at rest, 80px over interactive elements.
const RING_R_IDLE = 21.75
const RING_R_HOVER = 39.75
const STATE_TWEEN = { duration: 0.5, ease: 'power1.out', overwrite: 'auto' }

// Over text links the dot morphs into an underline: 1px thick, 2px below the baseline.
// The baseline sits DESCENT_EM above the bottom of the link's box (Google Sans Flex).
const UNDERLINE_THICKNESS = 1
const UNDERLINE_GAP = 2
const DESCENT_EM = 0.286
const MORPH_IN = { duration: 0.5, ease: 'power3.out', overwrite: true }
const MORPH_OUT = { duration: 0.4, ease: 'power3.out', overwrite: true }
const LEAVE_GRACE = 0.1 // seconds; lets the underline glide across the gap between adjacent links

// Class on <html> that hides the system pointer while the custom cursor is running.
const HIDE_SYSTEM_POINTER = styles.active

// Fine pointers only; skipped for reduced motion (the system pointer is always there anyway).
const ENABLED = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

// Elements that grow the ring by default. Override per element with data-cursor:
//   "scale" (grow ring) · "hide" (fade cursor out) · "default" (no change)
const INTERACTIVE = 'a[href], button, [role="button"], label, input, select, textarea, [data-cursor]'

// "Close k of the gap per 60fps frame", independent of the actual frame rate.
const followAmount = (k, deltaMs) => 1 - Math.pow(1 - k, deltaMs / (1000 / 60))
const lerp = (a, b, t) => a + (b - a) * t

function modeFor(target) {
  const el = target instanceof Element ? target.closest(INTERACTIVE) : null
  if (!el) return 'default'
  return el.dataset.cursor || 'scale'
}

// Text links get the underline. Links that set any data-cursor mode (e.g. pill buttons
// with data-cursor="scale") opt out.
function underlineLinkFor(target) {
  const link = target instanceof Element ? target.closest('a[href]') : null
  if (!link || link.dataset.cursor) return null
  return link.textContent.trim() ? link : null
}

// Elements marked data-surface="dark" (e.g. a dark button on the white page) keep the
// cursor white, whatever the background behind them.
function isOnDarkSurface(target) {
  return target instanceof Element && Boolean(target.closest('[data-surface="dark"]'))
}

// Underline geometry for a link, in viewport px: centre x/y and width.
function underlineGeometry(link, fontSize) {
  const box = link.getBoundingClientRect()
  const baseline = box.bottom - DESCENT_EM * fontSize
  return {
    x: box.left + box.width / 2,
    y: baseline + UNDERLINE_GAP + UNDERLINE_THICKNESS / 2,
    w: box.width,
  }
}

/**
 * Custom cursor: a 4px dot plus a trailing ring, replacing the system pointer. Over text
 * links the dot morphs into the link's underline. `isLightAt(x, y)` reports light
 * backgrounds, where the cursor turns navy.
 */
export default function Cursor({ isLightAt }) {
  const root = useRef(null)
  const dot = useRef(null)
  const ring = useRef(null)
  const circle = useRef(null)

  useGSAP(
    () => {
      if (!window.matchMedia(ENABLED).matches) return

      const pointer = { x: 0, y: 0 }
      const dotPos = { x: 0, y: 0 }
      const ringPos = { x: 0, y: 0 }
      let started = false
      let mode = null
      let light = null
      let onDarkSurface = false

      // Underline morph: m blends dot (0) → underline (1). When moving straight from one link
      // to another, the underline slides from a snapshot of where it was (p: 0 → 1).
      const morph = { m: 0 }
      const slide = { p: 1 }
      let link = null
      let linkFontSize = 0
      let slideFrom = null
      let size = { w: DOT_SIZE, h: DOT_SIZE }

      gsap.set(root.current, { autoAlpha: 0 })
      gsap.set(circle.current, { attr: { r: RING_R_IDLE } })

      const currentUnderline = () => {
        const to = underlineGeometry(link, linkFontSize)
        if (!slideFrom || slide.p >= 1) return to
        return {
          x: lerp(slideFrom.x, to.x, slide.p),
          y: lerp(slideFrom.y, to.y, slide.p),
          w: lerp(slideFrom.w, to.w, slide.p),
        }
      }

      const setUnderline = (next) => {
        if (!next) {
          if (link) gsap.to(morph, { m: 0, ...MORPH_OUT, delay: LEAVE_GRACE })
          return
        }
        if (next !== link) {
          if (link && morph.m > 0.01) {
            slideFrom = currentUnderline()
            slide.p = 0
            gsap.to(slide, { p: 1, ...MORPH_IN })
          } else {
            slideFrom = null
            slide.p = 1
          }
          link = next
          linkFontSize = parseFloat(getComputedStyle(next).fontSize)
        }
        gsap.to(morph, { m: 1, ...MORPH_IN })
      }

      const setMode = (next) => {
        if (next === mode) return
        mode = next
        gsap.to(circle.current, { attr: { r: next === 'scale' ? RING_R_HOVER : RING_R_IDLE }, ...STATE_TWEEN })
        gsap.to(root.current, { autoAlpha: next === 'hide' ? 0 : 1, ...STATE_TWEEN })
      }

      const onMove = (e) => {
        pointer.x = e.clientX
        pointer.y = e.clientY
        if (!started) {
          // Appear where the pointer is, instead of flying in from the corner, and only
          // now hide the system pointer — so there's always one pointer on screen.
          started = true
          Object.assign(dotPos, pointer)
          Object.assign(ringPos, pointer)
          setMode(modeFor(e.target))
          setUnderline(underlineLinkFor(e.target))
          document.documentElement.classList.add(HIDE_SYSTEM_POINTER)
        }
      }

      const onOver = (e) => {
        if (!started) return
        setMode(modeFor(e.target))
        setUnderline(underlineLinkFor(e.target))
        onDarkSurface = isOnDarkSurface(e.target)
      }

      const tick = (_time, deltaMs) => {
        if (!started) return
        const d = followAmount(DOT_FOLLOW, deltaMs)
        const r = followAmount(RING_FOLLOW, deltaMs)
        dotPos.x += (pointer.x - dotPos.x) * d
        dotPos.y += (pointer.y - dotPos.y) * d
        ringPos.x += (pointer.x - ringPos.x) * r
        ringPos.y += (pointer.y - ringPos.y) * r

        // Dot shape: a 4px circle, blending into the link's underline as m → 1.
        let x = dotPos.x
        let y = dotPos.y
        let w = DOT_SIZE
        let h = DOT_SIZE
        if (morph.m > 0 && link) {
          const u = currentUnderline()
          x = lerp(x, u.x, morph.m)
          y = lerp(y, u.y, morph.m)
          w = lerp(w, u.w, morph.m)
          h = lerp(h, UNDERLINE_THICKNESS, morph.m)
        }
        const dotEl = dot.current
        dotEl.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`
        if (w !== size.w || h !== size.h) {
          dotEl.style.width = `${w}px`
          dotEl.style.height = `${h}px`
          size = { w, h }
        }
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`

        const nextLight = !onDarkSurface && Boolean(isLightAt?.(x, y))
        if (nextLight !== light) {
          light = nextLight
          root.current.classList.toggle(styles.light, light)
        }
      }

      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerover', onOver, { passive: true })
      gsap.ticker.add(tick)

      return () => {
        window.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerover', onOver)
        gsap.ticker.remove(tick)
        document.documentElement.classList.remove(HIDE_SYSTEM_POINTER)
      }
    },
    { scope: root, dependencies: [isLightAt] },
  )

  return (
    <div ref={root} className={styles.cursor} aria-hidden="true">
      <div ref={ring} className={styles.ring}>
        <svg width="80" height="80" viewBox="0 0 80 80" overflow="visible">
          <circle ref={circle} cx="40" cy="40" r={RING_R_IDLE} />
        </svg>
      </div>
      <div ref={dot} className={styles.dot} />
    </div>
  )
}
