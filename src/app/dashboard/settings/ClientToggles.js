'use client';

import { useState, useTransition } from 'react';
import { updateClientToggle } from './actions';
import styles from './settings.module.css';

const TOGGLES = [
  { field: 'has_google_ads', label: 'Google Ads' },
  { field: 'has_meta',       label: 'Meta Ads' },
  { field: 'has_linkedin',   label: 'LinkedIn' },
  { field: 'has_ga4',        label: 'GA4' },
  { field: 'has_gsc',        label: 'Search Console' },
];

export default function ClientToggles({ clientId, initialValues }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isPending, startTransition] = useTransition();

  function handleToggle(field) {
    const newValue = !values[field];
    const previous = values[field];

    setValues((v) => ({ ...v, [field]: newValue }));
    setErrors((e) => ({ ...e, [field]: null }));

    startTransition(async () => {
      try {
        await updateClientToggle(clientId, field, newValue);
      } catch (err) {
        console.error('Toggle update error:', err?.message);
        setValues((v) => ({ ...v, [field]: previous }));
        setErrors((e) => ({ ...e, [field]: 'Erreur' }));
      }
    });
  }

  return (
    <div className={styles.toggleList}>
      {TOGGLES.map(({ field, label }) => (
        <div key={field} className={styles.toggleRow}>
          <span className={styles.toggleLabel}>{label}</span>
          <div className={styles.toggleRight}>
            {errors[field] && (
              <span className={styles.toggleError}>{errors[field]}</span>
            )}
            <button
              role="switch"
              aria-checked={values[field]}
              className={`${styles.toggleTrack} ${values[field] ? styles.toggleOn : ''}`}
              onClick={() => handleToggle(field)}
              disabled={isPending}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
