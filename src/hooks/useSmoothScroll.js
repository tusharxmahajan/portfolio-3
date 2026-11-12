import gsap from 'gsap'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * Lenis smooth scrolling for the page, driven from GSAP's ticker so scrolling and the
 * GSAP animations (intro, tickers, cursor) update in the same frame.
 * In-page anchor links (#project-id) glide too. Skipped for reduced motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION).matches) return

    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1, // share of the remaining distance covered each frame (higher = snappier)
      wheelMultiplier: 0.5, // scroll distance per wheel tick, relative to native
      anchors: { offset: -48 },
    })
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])
}
