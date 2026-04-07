import { Skeleton } from '@/components/ui/Loader';
import styles from './page.module.css';

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Skeleton height={32} width={200} />
        <Skeleton height={24} width={120} />
      </div>

      <section className={styles.kpiGrid}>
        {Array(4).fill(null).map((_, i) => (
          <Skeleton key={i} height={120} />
        ))}
      </section>

      <div className={styles.twoCol}>
        <Skeleton height={340} />
        <Skeleton height={340} />
      </div>

      <div className={styles.twoCol}>
        <Skeleton height={300} />
        <Skeleton height={300} />
      </div>

      <Skeleton height={320} />
      <Skeleton height={260} />
    </div>
  );
}
