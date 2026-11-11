import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { GRADIENT_SIZE } from './gradient.js'

gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin)

// Gradient ease: starts from rest, peaks around a third of the way in, then spends the
// rest of the time decelerating so the colour bands glide into place.
CustomEase.create('glowSettle', '0.5,0,0.2,1')

// Intro timing, in seconds. Retime the whole sequence from here.
const T = {
  gradient: 4, // colours travel out from the centre and settle
  headlineLead: 2, // headline starts this long before the gradient finishes settling
  headline: 2,
  headlineStagger: 0.6,
  lines: 2,
  meta: 1,
  metaStagger: 0.24,
  overlap: 0.6, // after the gradient, each step starts this much before the previous one ends
}

const BLUR = 'blur(16px)'

const DESKTOP = '(min-width: 1120px)'
const TABLET_UP = '(min-width: 640px)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// Meta blocks appear in reading order: Z-pattern on the grid layouts, top-to-bottom when stacked.
const META_ORDER_GRID = ['hi', 'links', 'work', 'previously']
const META_ORDER_STACK = ['hi', 'work', 'previously', 'links']

// Start once the web fonts are in, so the headline doesn't swap fonts mid-fade.
function whenFontsReady(timeoutMs = 1500) {
  if (!document.fonts?.load) return Promise.resolve()
  const loaded = Promise.all([
    document.fonts.load('400 56px "Google Sans Flex"'),
    document.fonts.load('400 40px "Azeret Mono"'),
  ])
  const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs))
  return Promise.race([loaded, timeout]).catch(() => {})
}

/**
 * Hero intro: gradient grows from its centre → headline blur-in (overlapping the gradient's
 * settle) → connector lines draw → meta fade-in.
 * Elements are found by data attributes inside `scope`:
 *   data-anim="backdrop" | "headline" | "line", and data-meta="<key>" for the meta blocks.
 * Without JS, or with reduced motion, the hero simply renders in its final state.
 */
export function useHeroIntro(scope) {
  useGSAP(
    () => {
      if (window.matchMedia(REDUCED_MOTION).matches) return

      const q = gsap.utils.selector(scope)
      const backdrop = q('[data-anim="backdrop"]')[0]
      const headlines = q('[data-anim="headline"]')
      const lines = q('[data-anim="line"]')
      const stems = lines.map((svg) => svg.querySelector('[data-part="stem"]'))
      const branches = lines.flatMap((svg) => [...svg.querySelectorAll('[data-part="branch"]')])
      const metaOrder = window.matchMedia(TABLET_UP).matches ? META_ORDER_GRID : META_ORDER_STACK
      const metas = metaOrder.map((key) => q(`[data-meta="${key}"]`)[0])
      const showLines = window.matchMedia(DESKTOP).matches

      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          // Hand back to the static CSS: no lingering filters, clips or inline styles.
          gsap.set([backdrop, ...headlines, ...stems, ...branches, ...metas], { clearProps: 'all' })
        },
      })

      // 1. Gradient: its size grows from 0, so every colour band travels out from the
      //    gradient's centre to its final position. Starts from rest, settles gently.
      tl.fromTo(
        backdrop,
        { '--glow-size': '0%' },
        { '--glow-size': GRADIENT_SIZE, duration: T.gradient, ease: 'glowSettle' },
      )

      // 2. During the gradient's final settle: headline lines fade in out of a blur.
      tl.fromTo(
        headlines,
        { opacity: 0, filter: BLUR },
        {
          opacity: 1,
          filter: 'blur(0px)',
          duration: T.headline,
          stagger: T.headlineStagger,
          ease: 'power2.out',
        },
        `-=${T.headlineLead}`,
      )

      // 3. Connector lines are drawn like a pen stroke, outward from the headline: the stem
      //    first, then both S-curve branches together. Each segment's duration is its
      //    path length, so the pen moves at one constant speed through the fork; a single
      //    ease over the whole stroke then gives it a smooth start and finish.
      if (showLines) {
        const draw = gsap
          .timeline({ paused: true })
          .fromTo(
            stems,
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: stems[0].getTotalLength(), ease: 'none' },
          )
          .fromTo(
            branches,
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: branches[0].getTotalLength(), ease: 'none' },
          )
        tl.add(
          draw.tweenFromTo(0, draw.duration(), { duration: T.lines, ease: 'sine.inOut' }),
          `-=${T.overlap}`,
        )
      }

      // 4. Meta blocks fade in one by one.
      tl.fromTo(
        metas,
        { opacity: 0 },
        { opacity: 1, duration: T.meta, stagger: T.metaStagger, ease: 'power1.out' },
        `-=${T.overlap}`,
      )

      let cancelled = false
      whenFontsReady().then(() => {
        if (!cancelled) tl.play()
      })

      return () => {
        cancelled = true
      }
    },
    { scope },
  )
}
