import { useRef } from 'react'
import HeadingLine from '../Work/HeadingLine.jsx'
import styles from './Statement.module.css'

/**
 * Between the hero and the morph slider: a one-line introduction, a nudge down to the work,
 * and under it the connector line, stepped up beneath the nudge (as under "Selected work").
 */
export default function Statement() {
  const hintRef = useRef(null)

  return (
    <section className={styles.statement} aria-label="About">
      <p className={styles.lead}>
        I&apos;m a Product Designer, with broader understanding of
        <br className={styles.break} />
        {' '}product management, frontend engineering &amp; <span className={styles.strong}>AI</span>.
      </p>
      <p ref={hintRef} className={styles.hint}>
        check out my work below
      </p>
      <HeadingLine className={styles.line} titleRef={hintRef} rise={32} />
    </section>
  )
}
