'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import styles from './page.module.css';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    // Handle error from Supabase (e.g. expired link)
    if (hashParams.get('error')) {
      const desc = hashParams.get('error_description');
      setLinkError(desc ? desc.replace(/\+/g, ' ') : 'Lien invalide ou expiré.');
      return;
    }

    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');

    if (!accessToken || !(hashType === 'invite' || hashType === 'recovery')) {
      setLinkError('Lien d\'invitation manquant ou invalide.');
      return;
    }

    // Directly set the session from the tokens in the URL hash.
    // This is more reliable than waiting for onAuthStateChange events,
    // which may not fire when using @supabase/ssr's createBrowserClient.
    const supabase = createSupabaseBrowserClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data: { session }, error }) => {
        if (error) {
          setLinkError(error.message);
        } else if (session) {
          setSessionReady(true);
        }
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  if (linkError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/agence-bb-logo.webp" alt="Agence BB" className={styles.logo} />
          </div>
          <h1 className={styles.title}>Lien expiré</h1>
          <p className={styles.error}>{linkError}</p>
          <p className={styles.subtitle}>Contactez l&apos;agence pour recevoir un nouveau lien d&apos;invitation.</p>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className={styles.page}>
        <p className={styles.checking}>Vérification du lien d&apos;invitation…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/agence-bb-logo.webp" alt="Agence BB" className={styles.logo} />
        </div>

        <h1 className={styles.title}>Créer votre mot de passe</h1>
        <p className={styles.subtitle}>Choisissez un mot de passe pour accéder au dashboard.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirm">Confirmer le mot de passe</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              className={styles.input}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Enregistrement…' : 'Créer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
