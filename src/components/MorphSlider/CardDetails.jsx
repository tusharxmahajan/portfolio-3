import styles from './CardDetails.module.css'

// The case study link: a real link once the card has an `href`; until then it looks the same
// but goes nowhere. `cursor` opts button-like links out of the text-link cursor underline.
function CaseLink({ href, className, cursor, surface, children }) {
  if (!href) return <span className={className}>{children}</span>
  return (
    <a className={className} href={href} draggable={false} data-cursor={cursor} data-surface={surface}>
      {children}
    </a>
  )
}

/**
 * A slider card's details (its lower half), in one of six layouts — `layout`, from slides.js:
 *   classic   tags and year · title · summary · role and outcome in two columns · text link
 *   metric    the outcome as a big figure first · title · role · pill button
 *   numbered  the card's number in a rail beside compact details
 *   chips     tags as chips · title · summary · role and outcome as rows · text link
 *   minimal   outcome badge · title · summary · role and year beside a round arrow button
 *   footer    tags · title · summary · role and outcome · a full-width link bar along the foot
 */
export default function CardDetails({ layout, index, tags, year, title, summary, role, metric, metricLabel, href }) {
  const tagLine = tags.join(' · ')
  const outcome = `${metric} ${metricLabel}`

  switch (layout) {
    case 'metric':
      return (
        <>
          <p className={`${styles.label} ${styles.meta} ${styles.spread}`}>
            <span>{tagLine}</span>
            <span>{year}</span>
          </p>
          <p className={styles.metric}>{metric}</p>
          <p className={styles.note}>{metricLabel}</p>
          <p className={`${styles.titleSmall} ${styles.ruled}`}>{title}</p>
          <p className={styles.note}>{role}</p>
          <CaseLink href={href} className={styles.pill} cursor="scale">
            Open case study →
          </CaseLink>
        </>
      )

    case 'numbered':
      return (
        <div className={styles.numbered}>
          <p className={styles.index}>{String(index + 1).padStart(2, '0')}</p>
          <div>
            <p className={`${styles.label} ${styles.meta}`}>
              <span>{tagLine}</span>
              <span>{year}</span>
            </p>
            <p className={styles.titleSmall}>{title}</p>
            <p className={styles.note}>{summary}</p>
            <p className={styles.byline}>
              {role} <span aria-hidden="true">·</span> <strong>{outcome}</strong>
            </p>
            <CaseLink href={href} className={styles.textLink}>
              Open case study →
            </CaseLink>
          </div>
        </div>
      )

    case 'chips':
      return (
        <>
          <div className={styles.chipRow}>
            <ul className={styles.chips}>
              {tags.map((tag) => (
                <li key={tag} className={styles.chip}>
                  {tag}
                </li>
              ))}
            </ul>
            <span className={styles.label}>{year}</span>
          </div>
          <p className={styles.title}>{title}</p>
          <p className={styles.summary}>{summary}</p>
          <dl className={styles.rows}>
            <div className={styles.row}>
              <dt className={styles.label}>Role</dt>
              <dd>{role}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>Outcome</dt>
              <dd className={styles.strong}>{outcome}</dd>
            </div>
          </dl>
          <CaseLink href={href} className={`${styles.textLink} ${styles.end}`}>
            Open case study →
          </CaseLink>
        </>
      )

    case 'minimal':
      return (
        <>
          <p className={styles.badge}>{outcome}</p>
          <p className={styles.title}>{title}</p>
          <p className={styles.summary}>{summary}</p>
          <div className={styles.footRow}>
            <p className={styles.note}>
              {role} <span aria-hidden="true">·</span> {year}
            </p>
            <CaseLink href={href} className={styles.round} cursor="scale">
              <span className={styles.srOnly}>Open case study</span>
              <span aria-hidden="true">→</span>
            </CaseLink>
          </div>
        </>
      )

    case 'footer':
      return (
        <>
          <p className={`${styles.label} ${styles.meta}`}>
            <span>{tagLine}</span>
            <span>{year}</span>
          </p>
          <p className={styles.title}>{title}</p>
          <p className={styles.summary}>{summary}</p>
          <dl className={styles.inlineFacts}>
            <div>
              <dt className={styles.label}>Role</dt>
              <dd className={styles.factValue}>{role}</dd>
            </div>
            <div>
              <dt className={styles.label}>Outcome</dt>
              <dd className={`${styles.factValue} ${styles.strong}`}>{outcome}</dd>
            </div>
          </dl>
          <CaseLink href={href} className={styles.bar} cursor="scale" surface="dark">
            <span>Open case study</span>
            <span aria-hidden="true">→</span>
          </CaseLink>
        </>
      )

    default: // classic
      return (
        <>
          <p className={`${styles.label} ${styles.meta}`}>
            <span>{tagLine}</span>
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
              <dd className={`${styles.factValue} ${styles.strong}`}>{outcome}</dd>
            </div>
          </dl>
          <CaseLink href={href} className={styles.textLink}>
            Open case study →
          </CaseLink>
        </>
      )
  }
}
