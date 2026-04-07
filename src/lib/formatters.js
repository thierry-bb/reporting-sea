/**
 * Formate un montant en CHF (locale fr-CH)
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  // Intl.NumberFormat fr-CH produit des résultats différents entre Node.js et le browser
  // → on construit le format manuellement pour éviter l'hydration mismatch
  const num = Math.round(Number(value));
  const formatted = new Intl.NumberFormat('fr-CH').format(num);
  return `${formatted} CHF`;
}

/**
 * Formate un pourcentage. Gère les deux formats (0.042 → 4.2% et 4.2 → 4.2%)
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—';
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${normalized.toFixed(decimals)}%`;
}

/**
 * Formate un nombre avec séparateur de milliers
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-CH').format(Math.round(value));
}

/**
 * Formate une date "YYYY-MM-DD" → "Mars 2024"
 * @param {string} dateString
 * @returns {string}
 */
export function formatMonth(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' });
}

/**
 * Formate une date "YYYY-MM-DD" → "Mar. 24" (pour les axes de charts)
 * @param {string} dateString
 * @returns {string}
 */
export function formatMonthShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  const month = date.toLocaleDateString('fr-CH', { month: 'short' });
  const year = date.getFullYear().toString().slice(2);
  return `${month} ${year}`;
}

/**
 * Convertit "2024-03" → "2024-03-01" (format attendu par Supabase type date)
 * @param {string} param
 * @returns {string}
 */
export function normalizeMonth(param) {
  if (!param) return null;
  if (/^\d{4}-\d{2}$/.test(param)) return `${param}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(param)) return param;
  return null;
}

/**
 * Calcule un mois avec un offset (en mois)
 * @param {string} monthStr - "2024-03" ou "2024-03-01"
 * @param {number} offset - négatif pour reculer
 * @returns {string} - "2024-03-01"
 */
export function getMonthOffset(monthStr, offset) {
  if (!monthStr) return null;
  const normalized = normalizeMonth(monthStr.slice(0, 7));
  const date = new Date(normalized + 'T00:00:00');
  date.setMonth(date.getMonth() + offset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/**
 * Retourne le mois précédent sous forme "YYYY-MM-01"
 * @returns {string}
 */
export function getPreviousMonth() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/**
 * Calcule le delta entre deux valeurs
 * @param {number} current
 * @param {number} previous
 * @returns {{ value: number, percent: number, direction: 'up'|'down'|'neutral' }}
 */
export function calcDelta(current, previous) {
  if (current == null || previous == null) return { value: 0, percent: 0, direction: 'neutral' };
  const value = current - previous;
  const percent = previous !== 0 ? (value / Math.abs(previous)) * 100 : 0;
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  return { value, percent, direction };
}

/**
 * Calcule le CPA (coût par acquisition)
 * @param {number} cost
 * @param {number} conversions
 * @returns {number}
 */
export function calcCPA(cost, conversions) {
  if (!conversions || conversions === 0) return 0;
  return cost / conversions;
}

/**
 * Calcule le CTR (click-through rate) en pourcentage
 * @param {number} clicks
 * @param {number} impressions
 * @returns {number}
 */
export function calcCTR(clicks, impressions) {
  if (!impressions || impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

/**
 * Agrège les stats Google Ads (somme d'un tableau de campagnes)
 * @param {Array} campaigns
 * @returns {{ cost: number, clicks: number, impressions: number, conversions: number, ctr: number, cpa: number }}
 */
export function aggregateGoogleStats(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return { cost: 0, clicks: 0, impressions: 0, conversions: 0, ctr: 0, cpa: 0 };
  }
  const cost = campaigns.reduce((s, c) => s + (parseFloat(c.cost_actual) || 0), 0);
  const clicks = campaigns.reduce((s, c) => s + (parseInt(c.clicks) || 0), 0);
  const impressions = campaigns.reduce((s, c) => s + (parseInt(c.impressions) || 0), 0);
  const conversions = campaigns.reduce((s, c) => s + (parseFloat(c.conversions) || 0), 0);
  return {
    cost,
    clicks,
    impressions,
    conversions,
    ctr: calcCTR(clicks, impressions),
    cpa: calcCPA(cost, conversions),
  };
}

/**
 * Agrège les stats Meta (somme d'un tableau de campagnes)
 * @param {Array} campaigns
 * @returns {{ spend: number, clicks: number, impressions: number, reach: number, ctr: number, cpm: number, cpc: number }}
 */
export function aggregateMetaStats(campaigns) {
  if (!campaigns || campaigns.length === 0) {
    return { spend: 0, clicks: 0, impressions: 0, reach: 0, ctr: 0, cpm: 0, cpc: 0 };
  }
  const spend = campaigns.reduce((s, c) => s + (parseFloat(c.spend) || 0), 0);
  const clicks = campaigns.reduce((s, c) => s + (parseInt(c.clicks) || 0), 0);
  const impressions = campaigns.reduce((s, c) => s + (parseInt(c.impressions) || 0), 0);
  const reach = campaigns.reduce((s, c) => s + (parseInt(c.reach) || 0), 0);
  const ctr = calcCTR(clicks, impressions);
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  return { spend, clicks, impressions, reach, ctr, cpm, cpc };
}
