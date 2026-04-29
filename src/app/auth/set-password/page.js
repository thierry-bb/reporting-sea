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
    // Check for errors in the URL hash (e.g. expired link)
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.slice(1));
      const desc = params.get('error_description');
      setLinkError(desc ? desc.replace(/\+/g, ' ') : 'Lien invalide ou expiré.');
      return;
    }

    const supabase = createSupabaseBrowserClient();

    // If the hash contains an access_token from an invite/recovery link,
    // the Supabase client may have already processed it before this effect runs.
    // In that case getSession() returns the freshly-created session — safe to use.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashType = hashParams.get('type');
    if (hashParams.get('access_token') && (hashType === 'invite' || hashType === 'recovery')) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
        return;
      }
    }

    // Fallback: listen for the SIGNED_IN / PASSWORD_RECOVERY event in case
    // the token hasn't been processed yet when this effect runs.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
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
