import { useCallback, useLayoutEffect, useRef } from 'react'
import iDot from '../../assets/i-dot.svg'
import Ticker from '../Ticker/Ticker.jsx'
import ConnectorLine from './ConnectorLine.jsx'
import { bandThrough } from './gradient.js'
import styles from './Hero.module.css'
import { LOGOS } from './logos.js'
import { useHeroIntro } from './useHeroIntro.js'

const LINKS = [
  { label: 'Resume', href: 'https://drive.google.com/file/d/155wBiHG6luw6vYtf-omzOU-cB0NCHOEw/view' },
  { label: 'Email', href: 'mailto:tusharxmahajan@gmail.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tusharxmahajan/' },
]

const FOCUS_AREAS = ['B2B SaaS', 'heavy data', 'complex workflows']

function isExternal(href) {
  return href.startsWith('http')
}

// The horizon's hit area: everything outside the ellipse where its colour starts (86% of
// the gradient's radius), in the element's own 0–1 units. Inside it the horizon is fully
// transparent, so pointer events pass through to the hero.
const R = 0.86 * 1.0378
const HORIZON_HIT = `M0 0H1V1H0Z M${0.5 - R} -0.0378a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`

// Publishes the hero's height as --hero-h: the backdrop and horizon take the same size, and
// a hero taller than the viewport scrolls until its bottom is in view before it holds still.
function useHeroHeight(ref) {
  useLayoutEffect(() => {
    const root = document.documentElement
    const update = () => root.style.setProperty('--hero-h', `${ref.current.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--hero-h')
    }
  }, [ref])
}

const FLAT = { y: 0, angle: 0 }

// The path the logos travel along: the gradient's colour band through their row, which runs
// parallel to its bottom curve (see bandThrough). Measured from the hero's box and the row's
// place in it, and again whenever the hero or anything in it resizes.
function useLogoPath(heroRef) {
  const band = useRef(null)

  useLayoutEffect(() => {
    const hero = heroRef.current
    const ticker = hero.querySelector('[data-anim="logos"]')
    const logo = ticker.querySelector('img')
    const measure = () => {
      const box = hero.getBoundingClientRect()
      // The row runs along the ticker's bottom edge (the space above is room for the curve).
      const row = ticker.getBoundingClientRect().bottom - logo.offsetHeight / 2 - box.top
      band.current = bandThrough(box.width, box.height, row)
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (const el of [hero, ...hero.children]) observer.observe(el)
    return () => observer.disconnect()
  }, [heroRef])

  return useCallback((x) => band.current?.(x) ?? FLAT, [])
}

/**
 * Hero, in three layers that share one box:
 *   backdrop  the radial gradient — scrolls with the page
 *   section   the content — sticky, so it holds still
 *   horizon   the gradient's bottom curve — scrolls with the backdrop, above the content,
 *             so as the gradient moves up its curve envelops the content
 */
export default function Hero() {
  const heroRef = useRef(null)
  const backdropRef = useRef(null)
  const horizonRef = useRef(null)
  useHeroHeight(heroRef)
  useHeroIntro(heroRef, { backdropRef, horizonRef })
  const logoPath = useLogoPath(heroRef)

  return (
    <>
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.band}>
          <h1 className={styles.title}>
            <span className={styles.headline} data-anim="headline">
              I dez
              <span className={styles.dotted}>
                i
                <img className={styles.dot} src={iDot} width="8" height="8" alt="" aria-hidden="true" />
              </span>
              ne for humans
            </span>
            <span className={styles.tagline} data-anim="headline">
              &amp; for machines
            </span>
          </h1>

          <div className={`${styles.meta} ${styles.hi}`} data-meta="hi">
            <p className={styles.label}>hi</p>
            <p className={styles.body}>I’m Tushar Mahajan</p>
          </div>

          <div className={`${styles.meta} ${styles.work}`} data-meta="work">
            <p className={styles.label}>worked across</p>
            <p className={styles.body}>enterprise spends, finances, and operations space</p>
            <p className={`${styles.body} ${styles.row} ${styles.tags}`}>
              {FOCUS_AREAS.map((area, i) => (
                // Separator travels with the tag after it, so a line never ends on "·".
                <span key={area} className={styles.tag}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {area}
                </span>
              ))}
            </p>
          </div>

          <div className={`${styles.meta} ${styles.end} ${styles.previously}`} data-meta="previously">
            <p className={styles.label}>previously</p>
            <p className={`${styles.body} ${styles.row} ${styles.role}`}>
              <span>Senior Product Designer at</span>
              <span>Dice</span>
            </p>
            <p className={styles.body}>4 yrs of exp</p>
          </div>

          <nav
            className={`${styles.meta} ${styles.end} ${styles.links}`}
            aria-label="Links"
            data-meta="links"
          >
            <p className={styles.label}>links</p>
            <ul className={`${styles.body} ${styles.row} ${styles.linkList}`}>
              {LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    className={styles.link}
                    href={href}
                    {...(isExternal(href) && { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`${styles.line} ${styles.lineLeft}`} aria-hidden="true">
            <ConnectorLine data-anim="line" />
          </div>
          <div className={`${styles.line} ${styles.lineRight}`} aria-hidden="true">
            <ConnectorLine data-anim="line" />
          </div>
        </div>

        {/* The logos travel along the gradient's curve. */}
        <Ticker
          className={styles.logos}
          groupClassName={styles.logoGroup}
          speed={16}
          path={logoPath}
          data-anim="logos"
        >
          {LOGOS.map(({ name, src, width, height }) => (
            <img
              key={name}
              className={styles.logo}
              src={src}
              alt={name}
              width={width}
              height={height}
              decoding="async"
            />
          ))}
        </Ticker>
      </section>

      <div ref={backdropRef} className={styles.backdrop} data-anim="backdrop" aria-hidden="true" />

      {/* The gradient's bottom curve, moving up with the backdrop over the still content and
          enveloping it; the next section follows straight on. */}
      <div ref={horizonRef} className={styles.horizon} data-anim="horizon" aria-hidden="true">
        <svg width="0" height="0" focusable="false">
          <clipPath id="horizon-hit" clipPathUnits="objectBoundingBox">
            <path clipRule="evenodd" d={HORIZON_HIT} />
          </clipPath>
        </svg>
      </div>
    </>
  )
}
