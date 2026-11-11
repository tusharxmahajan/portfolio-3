import { useRef } from 'react'
import iDot from '../../assets/i-dot.svg'
import ConnectorLine from './ConnectorLine.jsx'
import styles from './Hero.module.css'
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

export default function Hero() {
  const heroRef = useRef(null)
  useHeroIntro(heroRef)

  return (
    <section ref={heroRef} className={styles.hero}>
      <div className={styles.backdrop} data-anim="backdrop" aria-hidden="true" />

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
    </section>
  )
}
