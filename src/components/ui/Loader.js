import styles from './Loader.module.css';

export function Spinner({ size = 'md', centered = false }) {
  const el = <span className={`${styles.spinner} ${styles[size]}`} />;
  if (centered) return <div className={styles.center}>{el}</div>;
  return el;
}

export function Skeleton({ width, height, className }) {
  return (
    <div
      className={`${styles.skeleton} ${styles.skeletonBlock} ${className || ''}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ variant = 'wide' }) {
  return <div className={`${styles.skeleton} ${styles.skeletonText} ${styles[variant]}`} />;
}

export default Spinner;
