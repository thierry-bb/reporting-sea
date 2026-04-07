import supabase from '@/lib/supabase';
import Header from '@/components/layout/Header';
import { Suspense } from 'react';
import styles from './settings.module.css';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }) {
  const params = await searchParams;

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('client');

  const clientId = params.client || clients?.[0]?.id;
  const currentClient = clients?.find((c) => c.id === clientId) || clients?.[0];

  return (
    <>
      <Suspense>
        <Header clients={clients || []} monthsList={[]} pageTitle="Paramètres" />
      </Suspense>

      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <h2 className={styles.title}>Paramètres client</h2>
          <p className={styles.subtitle}>Configuration et objectifs de performance</p>
        </div>

        {currentClient && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{currentClient.client}</h3>
            <div className={styles.grid}>
              <Field label="Site web" value={currentClient.site_url} />
              <Field label="Stratégie" value={currentClient.strategie} />
              <Field label="Statut" value={currentClient.actif ? 'Actif' : 'Inactif'} />
            </div>

            <div className={styles.divider} />

            <h4 className={styles.subTitle}>Objectifs Google Ads</h4>
            <div className={styles.grid}>
              <Field label="CPA cible" value={currentClient.target_cpa_google} prefix="CHF" />
              <Field label="CPA max" value={currentClient.max_cpa_google} prefix="CHF" />
              <Field label="CTR cible" value={currentClient.target_ctr_google} suffix="%" />
              <Field label="CTR min" value={currentClient.min_ctr_google} suffix="%" />
              <Field label="Budget min" value={currentClient.min_budget_google} prefix="CHF" />
            </div>

            <div className={styles.divider} />

            <h4 className={styles.subTitle}>Objectifs Meta Ads</h4>
            <div className={styles.grid}>
              <Field label="CPA cible" value={currentClient.target_cpa_meta} prefix="CHF" />
              <Field label="CPA max" value={currentClient.max_cpa_meta} prefix="CHF" />
              <Field label="CTR cible" value={currentClient.target_ctr_meta} suffix="%" />
              <Field label="CTR min" value={currentClient.min_ctr_meta} suffix="%" />
              <Field label="Budget min" value={currentClient.min_budget_meta} prefix="CHF" />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Field({ label, value, prefix, suffix }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text)' }}>
        {value != null ? `${prefix ? prefix + ' ' : ''}${value}${suffix || ''}` : '—'}
      </div>
    </div>
  );
}
