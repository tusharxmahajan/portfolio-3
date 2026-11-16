import gsap from 'gsap'
import { useId, useLayoutEffect, useRef } from 'react'
import { getLenis } from '../../hooks/useSmoothScroll.js'
import { lensMap } from './lensMap.js'
import styles from './MorphSlider.module.css'
import { SLIDES } from './slides.js'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// Motion
const DRAG_FROM = 5 // px a press travels before it becomes a drag
const FLICK = 140 // ms of release speed carried on to the next card
const SIDE_SCALE = 0.06 // cards off-centre shrink by this much
const PULL_RATE = 0.3 // per frame: how quickly a leaving card's strands stretch thin
const LANDED = 0.97 // melt at which a card has landed, and wobbles
const WOBBLE = { decay: 0.13, hz: 4, length: 0.45 } // s, Hz, s
const LENS = { strength: 0.048, max: 72 } // its bend, as a share of the stage's width; px cap

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Scrolls the page: through Lenis when it's running (so it glides, and stays in step), else
// natively (reduced motion: no glide).
function scrollPage(top, immediate) {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(top, { immediate })
  else window.scrollTo({ top, behavior: immediate || window.matchMedia(REDUCED_MOTION).matches ? 'auto' : 'smooth' })
}

// The strands' blobs, fixed per card: a few drips hanging from the picture and rises
// growing from the text card, roughly in pairs (so they meet and bridge the gap), plus a
// stray droplet or two that never reach across. All in shares of the card's width/melt.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeBlobs(seed) {
  const random = seeded(seed * 7919 + 17)
  const between = (min, max) => min + (max - min) * random()
  const blobs = []
  const bridges = 2 + Math.round(random())
  for (let b = 0; b < bridges; b++) {
    const x = (b + 0.5) / bridges + between(-0.08, 0.08)
    const t = between(0.05, 0.45) // how far into the melt it starts reaching
    blobs.push({ kind: 'drip', x: x + between(-0.03, 0.03), w: between(0.1, 0.24), t, k: between(2.5, 3.5), cap: between(1.05, 1.25) })
    blobs.push({ kind: 'rise', x: x + between(-0.03, 0.03), w: between(0.13, 0.27), t: t + between(0, 0.05), k: between(2.4, 3.8), cap: between(1.05, 1.25) })
  }
  const strays = 1 + Math.round(random())
  for (let s = 0; s < strays; s++) {
    blobs.push({ kind: random() < 0.5 ? 'drip' : 'rise', x: between(0.15, 0.85), w: between(0.09, 0.14), t: between(0.2, 0.35), k: between(2.1, 2.5), cap: between(0.55, 0.65) })
  }
  return blobs
}

const BLOBS = SLIDES.map((_, i) => makeBlobs(i + 1))

/**
 * Morph slider: cards whose picture and words melt into one card in the middle and pull
 * apart again as it leaves.
 *
 * Scroll-driven: when the section's top reaches the top of the screen, the slider pins there
 * (filling the screen, cards in the middle) and the page's scroll moves it — one card per
 * card-spacing of scroll — until the last card, then the page carries on. Everything else moves it by scrolling the page to match: drag or
 * flick it, swipe sideways, use the arrow keys, or click a card.
 *
 * Every frame each card gets its distance from the middle, and from it `--m` (0 → 1 as it
 * arrives) and `--me` (the same, eased); the CSS turns those into the gap between picture
 * and details, the joint between them, and the strands' reach. The goo filter melts the
 * strands — and the two halves — together; the lens filter bends the stage's sides.
 */
export default function MorphSlider() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const gooId = `morph-goo-${uid}`
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
    const last = cards.length - 1
    const reduced = window.matchMedia(REDUCED_MOTION)

    const state = { pos: 0, active: 0 }
    const memory = cards.map(() => ({ m: 0, me: 0, at: 0, pull: 0, toward: 0 }))
    let step = 1 // px between card centres
    let flat = -1 // the lens's flat middle, as last drawn

    // ---- Layout ----
    const measure = () => {
      const style = getComputedStyle(section)
      const px = (name) => parseFloat(style.getPropertyValue(name)) || 0
      const width = cards[0].offsetWidth
      step = width + px('--spacing')
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

    // ---- Wobble: a card squashes and stretches for a moment as it lands ----
    const wobbles = new Map()
    const wobbleTick = () => {
      const now = performance.now()
      wobbles.forEach(({ amount, start }, card) => {
        const t = (now - start) / 1000
        const j = t >= WOBBLE.length ? 0 : amount * Math.exp(-t / WOBBLE.decay) * Math.sin(2 * Math.PI * WOBBLE.hz * t)
        card.style.setProperty('--j', j.toFixed(5))
        if (t >= WOBBLE.length) wobbles.delete(card)
      })
      if (!wobbles.size) gsap.ticker.remove(wobbleTick)
    }
    const wobble = (card, amount) => {
      if (!wobbles.size) gsap.ticker.add(wobbleTick)
      wobbles.set(card, { amount, start: performance.now() })
    }

    // ---- Render: place every card for the current position ----
    const render = () => {
      const now = performance.now()
      cards.forEach((card, i) => {
        const d = i - state.pos
        const far = Math.abs(d)
        const m = clamp(1 - far, 0, 1)
        const me = m * m * (3 - 2 * m)
        const mem = memory[i]

        // Leaving: its strands stretch thinner and further before they snap.
        if (m < mem.m - 1e-4) mem.toward = 1
        else if (m > mem.m + 1e-4) mem.toward = 0
        mem.pull += (mem.toward - mem.pull) * PULL_RATE
        if (m <= 0 || m >= 1) mem.pull = mem.toward = 0

        // Landing: wobble, harder the faster it came in.
        if (!reduced.matches && mem.at && mem.me < LANDED && me >= LANDED) {
          const speed = ((me - mem.me) / Math.max(1, now - mem.at)) * 1000
          wobble(card, Math.min(0.032, 0.012 + speed * 0.004))
        }
        mem.m = m
        mem.me = me
        mem.at = now

        const s = card.style
        s.setProperty('--x', `${(d * step).toFixed(2)}px`)
        s.setProperty('--s', (1 - SIDE_SCALE * Math.min(far, 1)).toFixed(4))
        s.setProperty('--m', m.toFixed(4))
        s.setProperty('--me', me.toFixed(4))
        s.setProperty('--pull', mem.pull.toFixed(4))
        s.setProperty('--far', clamp(far - 1, 0, 2).toFixed(4))
        s.zIndex = String(100 - Math.round(far * 10))
        // The goo filter only where there's melting to do (and on a hovered neighbour, in
        // CSS): mid-melt, or strands still stretching as it leaves.
        card.classList.toggle(styles.melting, (m > 0 && m < 1) || mem.pull > 0.001)
        card.classList.toggle(styles.near, far < 1.5)
        card.classList.toggle(styles.active, i === state.active)
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
      gsap.ticker.remove(wobbleTick)
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
      style={{ '--goo-filter': `url(#${gooId})`, '--lens-filter': `url(#${lensId})` }}
    >
      <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
        {/* Goo: blur everything (the half-transparent blobs counted as solid), then cut it
            back to a sharp edge — blobs that overlap flow into one shape. The card's solid
            parts go back on top, crisp. */}
        <filter id={gooId} colorInterpolationFilters="sRGB">
          <feComponentTransfer in="SourceGraphic" result="whole">
            <feFuncA type="linear" slope="2" />
          </feComponentTransfer>
          <feGaussianBlur in="whole" stdDeviation="9" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10.5" result="goo" />
          <feComponentTransfer in="SourceGraphic" result="solid">
            <feFuncA type="linear" slope="10" intercept="-9" />
          </feComponentTransfer>
          <feComposite in="solid" in2="goo" operator="over" />
        </filter>

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
            {SLIDES.map(({ id, tags, year, title, summary, role, outcome, href, colors }, i) => (
              <article
                key={id}
                className={styles.card}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${SLIDES.length}`}
                data-index={i}
                style={{ '--c0': colors[0], '--c1': colors[1], '--c2': colors[2] }}
              >
                <div className={styles.goo} aria-hidden="true">
                  {BLOBS[i].map(({ kind, x, w, t, k, cap }, j) => (
                    <span
                      key={j}
                      className={kind === 'drip' ? styles.drip : styles.rise}
                      style={{ '--bx': x, '--w': w, '--t': t, '--k': k, '--cap': cap }}
                    />
                  ))}
                </div>
                <div className={styles.media} />
                <div className={styles.body}>
                  <p className={`${styles.label} ${styles.meta}`}>
                    <span>{tags}</span>
                    <span>{year}</span>
                  </p>
                  <p className={styles.title}>{title}</p>
                  <p className={styles.summary}>{summary}</p>
                  <dl className={styles.facts}>
                    <div>
                      <dt className={styles.label}>Role</dt>
                      <dd className={styles.factValue}>{role}</dd>
                    </div>
                    <div>
                      <dt className={styles.label}>Outcome</dt>
                      <dd className={`${styles.factValue} ${styles.outcome}`}>{outcome}</dd>
                    </div>
                  </dl>
                  {href ? (
                    <a className={styles.link} href={href} draggable={false}>
                      Open case study →
                    </a>
                  ) : (
                    <span className={styles.link}>Open case study →</span>
                  )}
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
