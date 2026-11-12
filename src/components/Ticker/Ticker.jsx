import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import styles from './Ticker.module.css'

gsap.registerPlugin(useGSAP)

const MOTION_OK = '(prefers-reduced-motion: no-preference)'

/**
 * Endless horizontal ticker: the items scroll left at a constant `speed` (px/s) and loop
 * seamlessly — a hidden copy follows the first set, and each lap the track jumps back by
 * exactly one set's width.
 *
 * Runs only while the `when` media query matches (by default: whenever motion is allowed)
 * and pauses while off-screen. When it isn't running, the copy is hidden and the items
 * sit still; the consumer lays them out by styling its root with `:not([data-running])`.
 * Set the gap between items with the `--ticker-gap` custom property.
 *
 * `path` (optional) bends the row into a curve. It's called every frame for each item with
 * `x`, the item's centre in px from the ticker's centre line (negative = left), and returns
 * `{ y, angle }`: how far to move the item down (px) and turn it (degrees, clockwise) so it
 * sits on the curve, along its slope. Items keep their horizontal motion, so they travel
 * along the curve. The ticker clips its items, so give it room for the curve (padding).
 * Pass a stable function — a new one restarts the ticker.
 */
export default function Ticker({
  children,
  speed = 32,
  when = MOTION_OK,
  path,
  className = '',
  groupClassName = '',
  ...rest
}) {
  const root = useRef(null)
  const track = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(when, () => {
        const el = root.current
        const group = track.current.firstElementChild
        // Both sets' items, for `path`.
        const items = path ? [...track.current.children].flatMap((set) => [...set.children]) : []
        let centres = [] // each item's centre, px from the track's left edge
        let middle = 0 // the ticker's centre line, px from its left edge
        let tween = null
        let visible = true

        // Put every item on the path at its current position.
        const bend = () => {
          const shift = gsap.getProperty(track.current, 'x') - middle
          items.forEach((item, i) => {
            const { y, angle } = path(centres[i] + shift)
            item.style.transform = `translateY(${y}px) rotate(${angle}deg)`
          })
        }

        // (Re)build the loop for the current set width, keeping its place in the lap.
        const build = () => {
          const lap = group.getBoundingClientRect().width
          if (!lap) return
          const progress = tween ? tween.progress() : 0
          tween?.kill()
          tween = gsap.fromTo(
            track.current,
            { x: 0 },
            {
              x: -lap,
              duration: lap / speed,
              ease: 'none',
              repeat: -1,
              paused: !visible,
              onUpdate: path && bend,
            },
          )
          tween.progress(progress)

          if (path) {
            // Layout positions: unaffected by the track's motion or the items' own bend.
            centres = items.map((item) => item.offsetLeft + item.offsetWidth / 2)
            middle = el.clientWidth / 2
            bend()
          }
        }

        el.dataset.running = ''
        build()

        // Images loading in, or a breakpoint changing their size, changes the lap; the
        // ticker's own width moves the path's centre line.
        const resize = new ResizeObserver(build)
        resize.observe(group)
        if (path) resize.observe(el)

        const onScreen = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
          if (visible) tween?.play()
          else tween?.pause()
        })
        onScreen.observe(el)

        return () => {
          resize.disconnect()
          onScreen.disconnect()
          tween?.kill()
          gsap.set(track.current, { clearProps: 'transform' })
          items.forEach((item) => item.style.removeProperty('transform'))
          delete el.dataset.running
        }
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [speed, when, path] },
  )

  return (
    <div ref={root} className={`${styles.ticker} ${className}`} {...rest}>
      <div ref={track} className={styles.track}>
        <div className={`${styles.group} ${groupClassName}`}>{children}</div>
        <div className={`${styles.group} ${styles.clone} ${groupClassName}`} aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </div>
  )
}
