'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import styles from './TabBar.module.css';

const DEFAULT_TABS = [
  { id: 'overview', label: 'Overview',        color: null },
  { id: 'google',   label: 'Google Ads',      color: 'blue' },
  { id: 'meta',     label: 'Meta Ads',        color: 'pink' },
  { id: 'ga4',      label: 'GA4',             color: 'yellow' },
  { id: 'gsc',      label: 'Search Console',  color: null },
];

export default function TabBar({ activeTab = 'overview', tabs }) {
  const TABS = tabs || DEFAULT_TABS;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleTab(tabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <nav className={styles.tabBar}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''} ${tab.color ? styles[tab.color] : ''}`}
          onClick={() => handleTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
