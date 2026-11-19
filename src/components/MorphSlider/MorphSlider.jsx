import { useId, useLayoutEffect, useRef } from 'react'
import { getLenis } from '../../hooks/useSmoothScroll.js'
import { fadingDash } from '../Hero/fadingDash.js'
import CardDetails from './CardDetails.jsx'
import { lensMap } from './lensMap.js'
import styles from './MorphSlider.module.css'
import { SLIDES } from './slides.js'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// Motion
const DRAG_FROM = 5 // px a press travels before it becomes a drag
const FLICK = 140 // ms of release speed carried on to the next card
const SIDE_SCALE = 0.06 // cards off-centre shrink by this much
const LENS = { strength: 0.048, max: 72 } // its bend, as a share of the stage's width; px cap

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Scrolls the page: through Lenis when it's running (so it glides, and stays in step), else
// natively (reduced motion: no glide).
function scrollPage(top, immediate) {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(top, { immediate })
  else window.scrollTo({ top, behavior: immediate || window.matchMedia(REDUCED_MOTION).matches ? 'auto' : 'smooth' })
}

// The connector between a card's halves while they're apart: the hero's connector line,
// stood upright — a stem down from the middle of the picture that forks, in S-curves, into
// two runs down to the details. Sizes in px; the fork squeezes as the gap gets short.
const FORK = { spread: 24, curve: 48 }

function connector(width, height) {
  const cx = width / 2
  const squeeze = Math.min(1, height / (2 * FORK.curve))
  const curve = FORK.curve * squeeze
  const forkY = (height - curve) / 2
  const fork = (side) => {
    const x = cx + side * FORK.spread * squeeze
    const mid = forkY + curve / 2
    return `C${cx} ${mid} ${x} ${mid} ${x} ${forkY + curve}V${height}`
  }
  return {
    stem: `M${cx} 0V${forkY}`,
    branches: [-1, 1].map((side) => `M${cx} ${forkY}${fork(side)}`),
    // The whole way down each side, for the pulse.
    routes: [-1, 1].map((side) => `M${cx} 0V${forkY}${fork(side)}`),
  }
}

// How the connector follows a card's arrival (`m`, 0 apart → 1 in the middle): it draws down
// from the picture as the halves part — stem, then branches — and a light pulse runs the
// length of it after. Arriving, the same in reverse.
const DRAWN_BY = 0.6 // share of the parting by which it's fully drawn
// The pulse sets off this far into the parting; its length; and from how far down the line it
// fades out, gone by the time it reaches the details.
const PULSE = { from: 0.3, dash: 0.15, fade: 0.45 }
// …drawn in 10 pieces, transparent at its tail to full at its head (fadingDash.js); each line's
// length counts as 1, and the pattern repeats every 2.15 — so one dash at a time.
const PULSE_PIECES = fadingDash(PULSE.dash, PULSE.dash + 2, 10)

/**
 * Morph slider: cards whose picture and details come together into one card in the middle,
 * and part again as it leaves — joined, while apart, by connector lines.
 *
 * Scroll-driven: when the section's top reaches the top of the screen, the slider pins there
 * (filling the screen, cards in the middle) and the page's scroll moves it — one card per
 * card-spacing of scroll — until the last card, then the page carries on. Everything else
 * moves it by scrolling the page to match: drag or flick it, swipe sideways, use the arrow
 * keys, or click a card.
 *
 * Every frame each card gets its distance from the middle, and from it `--m` (0 → 1 as it
 * arrives) and `--me` (the same, eased); the CSS turns those into the gap between picture
 * and details and the joint between them, and JS draws the connector across the gap. The
 * lens filter bends the stage's sides.
 */
export default function MorphSlider() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const lensId = `morph-lens-${uid}`
  const root = useRef(null)
  const stageRef = useRef(null)
  const pinRef = useRef(null)
  const trackRef = useRef(null)
  const lensRef = useRef(null)
  const mapRef = useRef(null)
  const bendRef = useRef(null)

  useLayoutEffect(() => {
    const section = root.current
    const pin = pinRef.current
    const stage = stageRef.current
    const track = trackRef.current
    const lens = lensRef.current
    const map = mapRef.current
    const cards = [...track.children]
    const links = cards.map((card) => card.querySelector('a'))
    const wires = cards.map((card) => {
      const svg = card.querySelector('[data-connector]')
      const [stem, ...branches] = svg.querySelectorAll('[data-part="line"]')
      const pulses = [...svg.querySelectorAll('[data-part="pulse"]')]
      return { svg, stem, branches, pulses: pulses.map((el) => ({ el, route: +el.dataset.route })) }
    })
    const last = cards.length - 1

    const state = { pos: 0, active: 0 }
    let step = 1 // px between card centres
    let width = 1 // a card's width
    let gaps = [0, 0] // px between the halves: next to the middle; more per card further out
    let flat = -1 // the lens's flat middle, as last drawn

    // ---- Layout ----
    const measure = () => {
      const style = getComputedStyle(section)
      const px = (name) => parseFloat(style.getPropertyValue(name)) || 0
      width = cards[0].offsetWidth
      step = width + px('--spacing')
      gaps = [px('--gap'), px('--gap-far')]
      const media = cards[0].children[1].offsetHeight
      const body = Math.max(...cards.map((card) => card.lastElementChild.offsetHeight))
      // Room for the widest gaps: next to the middle, and further out.
      track.style.height = `${Math.ceil(media + body + px('--gap') + 2 * px('--gap-far'))}px`
      // The section: the pinned slider, plus the scroll that carries it from first card to last.
      section.style.height = `${Math.ceil(pin.offsetHeight + last * step)}px`
      // The lens covers exactly the stage — in px: left to itself, the filter would stretch
      // over every card, off-screen ones too, and drift as they move.
      const box = [stage.offsetWidth, stage.offsetHeight]
      for (const el of [lens, map]) {
        el.setAttribute('width', box[0])
        el.setAttribute('height', box[1])
      }
      // Gentler on narrow screens, so the neighbours peeking in at the sides stay in view.
      bendRef.current.setAttribute('scale', Math.round(Math.min(LENS.max, box[0] * LENS.strength)))
      // It's flat across the middle card and bends from just outside it, more and more
      // towards both edges — so every card bends as it travels out.
      const middle = clamp((width * 1.06) / (stage.offsetWidth || 1), 0.2, 0.92)
      if (Math.abs(middle - flat) > 0.01) {
        flat = middle
        map.setAttribute('href', lensMap(flat))
      }
    }

    // ---- Connector: drawn across a card's gap (`height`, px) for its arrival `m` ----
    const ease = (t) => t * t * (3 - 2 * t)
    const wire = ({ svg, stem, branches, pulses }, height, m) => {
      const parted = 1 - m
      const shown = height >= 1 && parted > 0
      svg.style.visibility = shown ? '' : 'hidden'
      if (!shown) return
      const paths = connector(width, height)
      // Drawn like a pen stroke from the picture: the stem first, then both branches.
      const drawn = ease(clamp(parted / DRAWN_BY, 0, 1))
      stem.setAttribute('d', paths.stem)
      stem.style.strokeDashoffset = 1 - clamp(drawn * 2, 0, 1)
      branches.forEach((branch, b) => {
        branch.setAttribute('d', paths.branches[b])
        branch.style.strokeDashoffset = 1 - clamp(drawn * 2 - 1, 0, 1)
      })
      // The pulse: its front (`run`, along the line) from the picture's edge to the details',
      // fading out over the way down.
      const run = clamp((parted - PULSE.from) / (1 - PULSE.from), 0, 1)
      const fade = 1 - ease(clamp((run - PULSE.fade) / (1 - PULSE.fade), 0, 1))
      pulses.forEach(({ el, route }) => {
        // Only while it's on its way.
        el.style.visibility = run > 0 && run < 1 ? '' : 'hidden'
        el.setAttribute('d', paths.routes[route])
        el.style.strokeDashoffset = PULSE.dash - run
        el.style.opacity = fade
      })
    }

    // ---- Render: place every card for the current position ----
    const render = () => {
      cards.forEach((card, i) => {
        const d = i - state.pos
        const far = Math.abs(d)
        const m = clamp(1 - far, 0, 1)
        const me = m * m * (3 - 2 * m)
        const beyond = clamp(far - 1, 0, 2)

        const s = card.style
        s.setProperty('--x', `${(d * step).toFixed(2)}px`)
        s.setProperty('--s', (1 - SIDE_SCALE * Math.min(far, 1)).toFixed(4))
        s.setProperty('--m', m.toFixed(4))
        s.setProperty('--me', me.toFixed(4))
        s.setProperty('--far', beyond.toFixed(4))
        s.zIndex = String(100 - Math.round(far * 10))
        card.classList.toggle(styles.active, i === state.active)
        wire(wires[i], gaps[0] * (1 - me) + gaps[1] * beyond, m)
        // Only the card in the middle takes keyboard focus for its link.
        if (links[i]) links[i].tabIndex = i === state.active ? 0 : -1
      })
    }

    // ---- Scroll: the page's scroll through the section is the slider's position ----
    const pinTop = () => section.getBoundingClientRect().top + window.scrollY // where it pins
    const update = () => {
      state.pos = clamp(-section.getBoundingClientRect().top / step, 0, last)
      state.active = Math.round(state.pos)
      render()
    }
    // To a card: scroll the page to where that card is in the middle.
    const goTo = (index) => scrollPage(pinTop() + clamp(index, 0, last) * step, false)

    // ---- Input: all of it scrolls the page ----
    let press = null
    const onDown = (event) => {
      if (event.button !== 0) return
      press = { id: event.pointerId, x: event.clientX, scroll: window.scrollY, active: state.active, dragging: false, vx: 0, lx: event.clientX, lt: event.timeStamp }
    }
    const onMove = (event) => {
      if (!press || event.pointerId !== press.id) return
      const dx = event.clientX - press.x
      if (!press.dragging) {
        if (Math.abs(dx) <= DRAG_FROM) return
        press.dragging = true
        stage.setPointerCapture(event.pointerId)
        stage.classList.add(styles.dragging)
      }
      const dt = event.timeStamp - press.lt
      if (dt > 0) press.vx = 0.8 * ((event.clientX - press.lx) / dt) + 0.2 * press.vx
      press.lx = event.clientX
      press.lt = event.timeStamp
      const top = pinTop()
      scrollPage(clamp(press.scroll - dx, top, top + last * step), true)
    }
    const onUp = (event) => {
      if (!press || event.pointerId !== press.id) return
      const { dragging, vx, active } = press
      press = null
      stage.classList.remove(styles.dragging)
      if (dragging) {
        blockClick = true
        goTo(Math.round(state.pos - (vx * FLICK) / step))
        return
      }
      // A click on a card brings it to the middle. Its link only opens once it's there.
      const card = event.target.closest('[data-index]')
      if (!card) return
      blockClick = Number(card.dataset.index) !== active
      goTo(Number(card.dataset.index))
    }
    let blockClick = false
    const onClick = (event) => {
      if (blockClick) {
        event.preventDefault()
        event.stopPropagation()
      }
      blockClick = false
    }
    const onCancel = (event) => {
      if (!press || event.pointerId !== press.id) return
      press = null
      stage.classList.remove(styles.dragging)
    }

    // Sideways swipes on a trackpad (or shift + wheel) while it's pinned move it too.
    const onWheel = (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      const top = pinTop()
      const y = window.scrollY
      if (y < top - 1 || y > top + last * step + 1) return
      event.preventDefault()
      event.stopPropagation() // Lenis (on the window) would read it as a scroll too
      const delta = event.deltaX * (event.deltaMode === 1 ? 16 : 1)
      const lenis = getLenis()
      const from = lenis ? lenis.targetScroll : y
      scrollPage(clamp(from + delta, top, top + last * step), !lenis)
    }

    const onKey = (event) => {
      const to = { ArrowLeft: state.active - 1, ArrowRight: state.active + 1, Home: 0, End: last }[event.key]
      if (to === undefined) return
      event.preventDefault()
      goTo(to)
    }

    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onCancel)
    stage.addEventListener('click', onClick, true)
    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('keydown', onKey)
    window.addEventListener('scroll', update, { passive: true })

    // The pinned slider's size (the window resizing, fonts loading) sets the section's.
    const remeasure = () => {
      measure()
      update()
    }
    const resize = new ResizeObserver(remeasure)
    resize.observe(pin)
    document.fonts?.ready.then(remeasure)
    remeasure()

    return () => {
      resize.disconnect()
      window.removeEventListener('scroll', update)
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onCancel)
      stage.removeEventListener('click', onClick, true)
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('keydown', onKey)
      section.style.removeProperty('height')
    }
  }, [])

  return (
    <section
      ref={root}
      className={styles.slider}
      aria-roledescription="carousel"
      aria-label="Highlights"
      style={{ '--lens-filter': `url(#${lensId})` }}
    >
      <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
        {/* Lens: the sides bend outwards (lensMap.js), as through the edge of a lens. */}
        <filter
          ref={lensRef}
          id={lensId}
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="0"
          height="0"
          colorInterpolationFilters="sRGB"
        >
          <feImage ref={mapRef} x="0" y="0" width="0" height="0" preserveAspectRatio="none" result="map" />
          <feDisplacementMap ref={bendRef} in="SourceGraphic" in2="map" scale="72" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Pinned to the top of the screen while the page scrolls through the section. */}
      <div ref={pinRef} className={styles.pin}>
        <div ref={stageRef} className={styles.stage} tabIndex={0} data-cursor="scale">
          <div ref={trackRef} className={styles.track}>
            {SLIDES.map(({ id, colors, ...details }, i) => (
              <article
                key={id}
                className={styles.card}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${SLIDES.length}`}
                data-index={i}
                style={{ '--c0': colors[0], '--c1': colors[1], '--c2': colors[2] }}
              >
                {/* Across the gap between the halves (drawn by JS). */}
                <svg className={styles.connector} aria-hidden="true" focusable="false" data-connector>
                  <path className={styles.line} data-part="line" pathLength="1" />
                  <path className={styles.line} data-part="line" pathLength="1" />
                  <path className={styles.line} data-part="line" pathLength="1" />
                  {[0, 1].map((route) =>
                    PULSE_PIECES.map((piece, k) => (
                      <path
                        key={`${route}-${k}`}
                        className={styles.pulse}
                        data-part="pulse"
                        data-route={route}
                        pathLength="1"
                        style={piece}
                      />
                    )),
                  )}
                </svg>
                <div className={styles.media} />
                <div className={styles.body}>
                  <CardDetails {...details} index={i} />
                </div>
              </article>
            ))}
          </div>

          {/* Both sides blur out, more towards the edge. */}
          {['edgeLeft', 'edgeRight'].map((side) => (
            <span key={side} className={`${styles.edge} ${styles[side]}`} aria-hidden="true" data-edge>
              <span />
              <span />
              <span />
              <span />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
