import { useRef } from 'react'
import Ticker from '../Ticker/Ticker.jsx'
import HeadingLine from './HeadingLine.jsx'
import { PROJECTS } from './projects.js'
import styles from './Work.module.css'

// Media scroll as a ticker from tablet up; on phones they stack.
const MEDIA_TICKER = '(min-width: 640px) and (prefers-reduced-motion: no-preference)'

export default function Work() {
  const headingRef = useRef(null)

  return (
    <section className={styles.work} aria-labelledby="work-heading">
      {/* Marks the header's place in the flow; its scroll position drives the header's
          shrink (see Work.module.css). */}
      <div className={styles.headerStart} aria-hidden="true" />

      {/* Title over a connector line that runs the full width, raised beneath the title —
          one block, which sticks to the top of the screen. */}
      <header className={styles.header}>
        <h2 ref={headingRef} id="work-heading" className={styles.heading}>
          Selected work
        </h2>
        <HeadingLine className={styles.headingLine} titleRef={headingRef} fill="var(--color-white)" />
      </header>

      <div className={styles.inner}>
        <ol className={styles.list}>
          {/* Empty 800px slot ahead of the projects. */}
          <li className={styles.placeholder} aria-hidden="true" />
          {PROJECTS.map((project) => (
            <li key={project.id}>
              <Project {...project} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// tag, year and capabilities are optional — leave them out of a project to hide them.
function Project({ id, tag, title, year, description, capabilities = [], href, media }) {
  return (
    <article id={id} className={styles.project} aria-labelledby={`${id}-title`}>
      {tag && <p className={styles.tag}>{tag}</p>}
      <h3 id={`${id}-title`} className={styles.title}>
        {title}
        {year && <span className={styles.year}>({year})</span>}
      </h3>

      <div className={styles.summary}>
        <p className={styles.description}>{description}</p>
        <a className={styles.cta} href={href} data-cursor="scale">
          <span className={styles.ctaLabel} data-surface="dark">
            Have a look
          </span>
        </a>
      </div>

      {capabilities.length > 0 && (
        <ul className={styles.capabilities}>
          {capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      )}

      {/* The whole strip opens the case study too; keyboard users get the button above. */}
      <a className={styles.mediaLink} href={href} tabIndex={-1} aria-label={`${title} case study`}>
        <Ticker className={styles.media} groupClassName={styles.mediaGroup} when={MEDIA_TICKER}>
          {media.map(({ src, width, height, alt }) => (
            <img
              key={src}
              className={styles.card}
              src={src}
              alt={alt}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
            />
          ))}
        </Ticker>
      </a>
    </article>
  )
}
