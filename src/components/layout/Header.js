'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { normalizeMonth, formatMonth } from '@/lib/formatters';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import TabBar from '@/components/dashboard/TabBar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import styles from './Header.module.css';

export default function Header({ clients = [], monthsList = [], pageTitle = 'Dashboard', activeTab = 'overview', role = 'agency', tabs }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const currentClient = searchParams.get('client') || '';
  const currentMonth = searchParams.get('month') || '';

  const updateParam = useCallback((key, value) => {
    window.dispatchEvent(new Event('nav:start'));
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <header className={styles.header}>
      <button
        className={styles.hamburger}
        onClick={() => window.dispatchEvent(new Event('sidebar:toggle'))}
        aria-label="Menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
        <TabBar activeTab={activeTab} tabs={tabs} />
      </div>

      <div className={styles.center}>
        {/* Client selector — masqué pour les logins clients */}
        {role !== 'client' && (
          <div className={styles.selectGroup}>
            <span className={styles.label}>Client</span>
            <select
              value={currentClient}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  window.open('https://tally.so/r/0QjPBA', '_blank');
                } else {
                  updateParam('client', e.target.value);
                }
              }}
              style={{
                background: 'var(--color-surface-solid)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
                padding: '6px 10px',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} style={{ background: 'var(--color-surface-solid)' }}>
                  {c.client}
                </option>
              ))}
              <option value="__new__" style={{ background: 'var(--color-surface-solid)', color: 'var(--color-accent)' }}>
                + Ajout d&apos;un nouveau client
              </option>
            </select>
          </div>
        )}

        {/* Month selector */}
        <div className={styles.selectGroup}>
          <span className={styles.label}>Période</span>
          <select
            value={currentMonth}
            onChange={(e) => updateParam('month', e.target.value)}
            style={{
              background: 'var(--color-surface-solid)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              padding: '6px 10px',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {monthsList.map((m) => {
              const normalized = normalizeMonth(m);
              return (
                <option key={m} value={m.slice(0, 7)} style={{ background: 'var(--color-surface-solid)' }}>
                  {formatMonth(normalized)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className={styles.right}>
        <ThemeToggle />
        <div className={styles.badge}>
          <div className={styles.dot} />
          Live
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
}
