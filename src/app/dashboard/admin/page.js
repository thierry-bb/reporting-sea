import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import supabase from '@/lib/supabase';
import Header from '@/components/layout/Header';
import InviteForm from './InviteForm';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  const role = user?.user_metadata?.role || 'client';

  if (role !== 'agency') redirect('/dashboard');

  const { data: clients } = await supabase
    .from('clients')
    .select('id, client')
    .order('client');

  return (
    <>
      <Suspense>
        <Header clients={[]} monthsList={[]} pageTitle="Paramètres généraux" />
      </Suspense>

      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <h2 className={styles.title}>Paramètres généraux</h2>
          <p className={styles.subtitle}>Administration et gestion des accès</p>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Inviter un client</h3>
          <p className={styles.cardDesc}>
            Un e-mail d&apos;invitation sera envoyé. Le compte sera automatiquement associé au client sélectionné.
          </p>
          <InviteForm clients={clients || []} />
        </div>
      </main>
    </>
  );
}
