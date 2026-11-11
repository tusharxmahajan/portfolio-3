import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import styles from './Cursor.module.css'

gsap.registerPlugin(useGSAP)

// Follow physics: each 60fps frame the dot closes 30% of its gap to the pointer and the ring
// 10% — a quick dot with a soft, trailing ring. Both chase the pointer itself.
const DOT_FOLLOW = 0.3
const RING_FOLLOW = 0.1

// Ring radius (SVG units = px, 0.5px stroke): 44px across at rest, 80px over interactive elements.
const RING_R_IDLE = 21.75
const RING_R_HOVER = 39.75

// Class on <html> that hides the system pointer while the custom cursor is running.
const HIDE_SYSTEM_POINTER = styles.active
const STATE_TWEEN = { duration: 0.5, ease: 'power1.out', overwrite: 'auto' }

// Fine pointers only; skipped for reduced motion (the system pointer is always there anyway).
const ENABLED = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

// Elements that grow the ring by default. Override per element with data-cursor:
//   "scale" (grow ring) · "hide" (fade cursor out) · "default" (no change)
const INTERACTIVE = 'a[href], button, [role="button"], label, input, select, textarea, [data-cursor]'

// "Close k of the gap per 60fps frame", independent of the actual frame rate.
const followAmount = (k, deltaMs) => 1 - Math.pow(1 - k, deltaMs / (1000 / 60))

function modeFor(target) {
  const el = target instanceof Element ? target.closest(INTERACTIVE) : null
  if (!el) return 'default'
  return el.dataset.cursor || 'scale'
}

/**
 * Custom cursor: a 4px dot plus a trailing ring, replacing the system pointer.
 * `isLightAt(x, y)` reports light backgrounds, where the cursor turns navy.
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

      gsap.set(root.current, { autoAlpha: 0 })
      gsap.set(circle.current, { attr: { r: RING_R_IDLE } })

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
          document.documentElement.classList.add(HIDE_SYSTEM_POINTER)
        }
      }

      const onOver = (e) => {
        if (started) setMode(modeFor(e.target))
      }

      const tick = (_time, deltaMs) => {
        if (!started) return
        const d = followAmount(DOT_FOLLOW, deltaMs)
        const r = followAmount(RING_FOLLOW, deltaMs)
        dotPos.x += (pointer.x - dotPos.x) * d
        dotPos.y += (pointer.y - dotPos.y) * d
        ringPos.x += (pointer.x - ringPos.x) * r
        ringPos.y += (pointer.y - ringPos.y) * r
        dot.current.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`

        const nextLight = Boolean(isLightAt?.(dotPos.x, dotPos.y))
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
