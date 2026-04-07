import styles from './KpiCard.module.css';

const ArrowUp = () => (
  <svg className={styles.deltaArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ArrowDown = () => (
  <svg className={styles.deltaArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * Carte KPI individuelle
 * @param {string} label
 * @param {string|number} value - Valeur déjà formatée
 * @param {{ value: number, percent: number, direction: 'up'|'down'|'neutral' }} delta
 * @param {string} deltaLabel - Ex: "vs mois précédent"
 * @param {'accent'|'positive'|'info'|'warning'|'danger'} color
 * @param {ReactNode} icon
 * @param {boolean} invertDelta - true pour les métriques où "down" est bon (ex: CPA)
 * @param {boolean} loading
 */
export default function KpiCard({
  label,
  value,
  delta,
  deltaLabel = 'vs mois précédent',
  color = 'accent',
  icon,
  invertDelta = false,
  loading = false,
}) {
  return (
    <div className={styles.card}>
      <div className={`${styles.accentLine} ${styles[color]}`} />

      <div className={styles.header}>
        <span className={styles.label} data-print-label>{label}</span>
        {icon && (
          <div className={`${styles.iconWrapper} ${styles[color]}`}>
            {icon}
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className={styles.skeletonValue} />
          <div className={styles.footer}>
            <div className={styles.skeletonDelta} />
          </div>
        </>
      ) : (
        <>
          <div className={styles.value}>{value ?? '—'}</div>

          {delta && (
            <div className={styles.footer}>
              <span className={`${styles.delta} ${styles[delta.direction]} ${invertDelta ? styles.inverted : ''}`}>
                {delta.direction === 'up' && <ArrowUp />}
                {delta.direction === 'down' && <ArrowDown />}
                {Math.abs(delta.percent).toFixed(1)}%
              </span>
              <span className={styles.deltaLabel}>{deltaLabel}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
