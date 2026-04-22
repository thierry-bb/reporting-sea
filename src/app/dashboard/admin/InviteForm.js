'use client';

import { useState, useTransition } from 'react';
import { inviteClient } from './adminActions';
import styles from './page.module.css';

export default function InviteForm({ clients }) {
  const [email, setEmail] = useState('');
  const [clientId, setClientId] = useState(clients?.[0]?.id || '');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await inviteClient(email, clientId);
        setSuccess(true);
        setEmail('');
      } catch (err) {
        setError(err.message || "Erreur lors de l'envoi de l'invitation.");
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="invite-email">
          Adresse e-mail
        </label>
        <input
          id="invite-email"
          type="email"
          required
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@exemple.com"
          disabled={isPending}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="invite-client">
          Client associé
        </label>
        <select
          id="invite-client"
          required
          className={styles.input}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          disabled={isPending}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.client}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}
      {success && <p className={styles.successMsg}>Invitation envoyée avec succès.</p>}

      <button type="submit" className={styles.submitBtn} disabled={isPending}>
        {isPending ? "Envoi en cours…" : "Envoyer l'invitation"}
      </button>
    </form>
  );
}
