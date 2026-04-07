import styles from './ChartContainer.module.css';

export default function ChartContainer({
  title,
  subtitle,
  children,
  actions,
  height = 280,
  loading = false,
  empty = false,
  emptyMessage = 'Aucune donnée disponible',
}) {
  return (
    <div className={styles.container}>
      {(title || subtitle || actions) && (
        <div className={styles.header}>
          <div className={styles.titles}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}

      <div className={styles.chartArea} style={{ height }}>
        {loading ? (
          <div className={styles.skeletonChart} style={{ height }} />
        ) : empty ? (
          <div className={styles.empty} style={{ height }}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-4 4 4 4-8" />
            </svg>
            <span>{emptyMessage}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
