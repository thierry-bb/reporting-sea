'use client';

import { useState, useTransition } from 'react';
import ReactMarkdown from 'react-markdown';
import { upsertAnalysisClient } from './analysisActions';
import styles from './page.module.css';

export default function AnalysisEditor({ clientText, agenceText, clientId, reportMonth, isAdmin, variant }) {
  const isHighlight = variant === 'highlight';
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(clientText || '');
  const [savedText, setSavedText] = useState(clientText || '');
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    setText(savedText);
    setEditing(true);
    setError(null);
  }

  function handleCancel() {
    setText(savedText);
    setEditing(false);
    setError(null);
  }

  function handleSave() {
    const previous = savedText;
    setSavedText(text);
    setEditing(false);

    startTransition(async () => {
      try {
        await upsertAnalysisClient(clientId, reportMonth, text);
      } catch (err) {
        setSavedText(previous);
        setText(previous);
        setError('Erreur lors de la sauvegarde.');
      }
    });
  }

  return (
    <>
      <div className={isHighlight ? styles.analysisCardHighlight : styles.analysisCard}>
        <div className={styles.analysisTitleRow}>
          <div>
            {isHighlight && <p className={styles.analysisHighlightLabel}>Point clés du mois</p>}
            {!isHighlight && <h2 className={styles.analysisTitle}>Analyse globale</h2>}
          </div>
          {isAdmin && !editing && (
            <button className={styles.analysisEditBtn} onClick={handleEdit}>
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <>
            <textarea
              className={styles.analysisTextarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Rédigez l'analyse en markdown…"
              rows={8}
            />
            {error && <p className={styles.analysisError}>{error}</p>}
            <div className={styles.analysisActions}>
              <button
                className={styles.analysisSaveBtn}
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button
                className={styles.analysisCancelBtn}
                onClick={handleCancel}
                disabled={isPending}
              >
                Annuler
              </button>
            </div>
          </>
        ) : (
          savedText
            ? <div className={styles.analysisAgenceBody}><div className={styles.analysisSummary}><ReactMarkdown>{savedText}</ReactMarkdown></div></div>
            : <p className={styles.analysisEmpty}>Aucune analyse disponible.</p>
        )}
      </div>

      {agenceText && (
        <div className={`${styles.analysisCard} ${styles.analysisAgence}`}>
          <h2 className={styles.analysisTitle}>Recommandation interne pour l&apos;agence</h2>
          <div className={styles.analysisAgenceBody}>
            <div className={styles.analysisSummary}><ReactMarkdown>{agenceText}</ReactMarkdown></div>
          </div>
        </div>
      )}
    </>
  );
}
