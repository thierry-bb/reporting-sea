import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import supabase from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  formatCurrency, formatPercent, formatNumber, formatMonth,
  normalizeMonth, getMonthOffset, getPreviousMonth,
  calcDelta,
  aggregateGoogleStats, aggregateMetaStats,
} from '@/lib/formatters';
import KpiCard from '@/components/dashboard/KpiCard';
import ChartContainer from '@/components/dashboard/ChartContainer';
import TrafficSourceChart from '@/app/dashboard/TrafficSourceChart';
import GoogleCampaignsTable from '@/app/dashboard/GoogleCampaignsTable';
import GoogleConversionsTable from '@/app/dashboard/GoogleConversionsTable';
import MetaPlatformTable from '@/app/dashboard/MetaPlatformTable';
import MetaInsightsCharts from '@/app/dashboard/MetaInsightsCharts';
import MetaActionsTable from '@/app/dashboard/MetaActionsTable';
import TopPagesTable from '@/app/dashboard/TopPagesTable';
import GscQueriesTable from '@/app/dashboard/GscQueriesTable';
import LinkedInCampaignsTable from '@/app/dashboard/LinkedInCampaignsTable';
import AutoPrint from './AutoPrint';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const CLIENT_TABLE_PREFIX = {
  'HEG':   'heg_',
  'Yneo':  'yneo_',
  'Ifage': 'ifage_',
};

const LINKEDIN_CLIENTS = ['HEG'];

export default async function PrintPage({ searchParams }) {
  const params = await searchParams;

  // Auth
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login');

  // Client
  const { data: clients } = await supabase
    .from('clients')
    .select('id, client, logo_url, target_cpa_google, max_cpa_google, target_cpa_meta, max_cpa_meta')
    .eq('actif', true)
    .order('client');

  if (!clients || clients.length === 0) redirect('/dashboard');

  const clientId = params.client || clients[0].id;
  const currentClient = clients.find((c) => c.id === clientId) || clients[0];

  const tablePrefix = CLIENT_TABLE_PREFIX[currentClient.client] || '';
  const hasLinkedIn = LINKEDIN_CLIENTS.includes(currentClient.client);

  // Mois
  const selectedMonth = normalizeMonth(params.month) || getPreviousMonth();
  const previousMonth = getMonthOffset(selectedMonth, -1);
  const sixMonthsAgo = getMonthOffset(selectedMonth, -5);

  // Fetches parallèles
  const [
    { data: globalCurrent },
    { data: globalPrev },
    { data: ga4Current },
    { data: ga4Prev },
    { data: googleStats },
    { data: metaCampaigns },
    { data: metaPurchases },
    { data: gscQueries },
    { data: trafficSources },
    { data: topPages },
    { data: trendData },
    { data: googleConversions },
    { data: metaActions },
    { data: aiAnalysis },
    { data: metaInsights },
    { data: linkedInOverview },
    { data: linkedInCampaigns },
    { data: googleStatsPrev },
    { data: metaCampaignsPrev },
    { data: linkedInOverviewPrev },
  ] = await Promise.all([
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle(),
    supabase.from(`${tablePrefix}ga4_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    supabase.from(`${tablePrefix}ga4_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle(),
    supabase.from(`${tablePrefix}google_ads_monthly_stats`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}meta_campaigns`).select('platform, impressions, reach, clicks, page_likes, spend, purchase_value, purchase_count').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}meta_actions`).select('action_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth).eq('action_type', 'purchase'),
    supabase.from(`${tablePrefix}gsc_top_queries`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(20),
    supabase.from(`${tablePrefix}ga4_traffic_sources`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}ga4_top_pages`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(10),
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('report_month, google_spend, meta_spend, total_ads_spend').eq('client_id', currentClient.id).gte('report_month', sixMonthsAgo).lte('report_month', selectedMonth).order('report_month'),
    supabase.from(`${tablePrefix}google_ads_conversions_monthly`).select('campaign_name, conversion_name, conversions').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('conversions', { ascending: false }),
    supabase.from(`${tablePrefix}meta_actions`).select('action_type, action_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('action_value', { ascending: false }),
    supabase.from(`${tablePrefix}ai_analyses`).select('summary').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    supabase.from(`${tablePrefix}meta_insights`).select('breakdown_type, breakdown_value, impressions, percentage').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    hasLinkedIn
      ? supabase.from(`${tablePrefix}linkedin_ads_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle()
      : Promise.resolve({ data: null }),
    hasLinkedIn
      ? supabase.from(`${tablePrefix}linkedin_ads_campaigns`).select('campaign_name, campaign_id, status, objective, impressions, clicks, conversions, cost_chf, conv_value_chf').eq('client_id', currentClient.id).eq('report_month', selectedMonth)
      : Promise.resolve({ data: [] }),
    supabase.from(`${tablePrefix}google_ads_monthly_stats`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth),
    supabase.from(`${tablePrefix}meta_campaigns`).select('platform, impressions, reach, clicks, page_likes, spend, purchase_value, purchase_count').eq('client_id', currentClient.id).eq('report_month', previousMonth),
    hasLinkedIn
      ? supabase.from(`${tablePrefix}linkedin_ads_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Calculs — mois courant
  const googleAgg = aggregateGoogleStats(googleStats || []);
  const metaAgg   = aggregateMetaStats(metaCampaigns || []);
  const purchases = (metaPurchases || []).reduce((s, a) => s + (parseFloat(a.action_value) || 0), 0);

  // Calculs — mois précédent
  const googleAggPrev = aggregateGoogleStats(googleStatsPrev || []);
  const metaAggPrev   = aggregateMetaStats(metaCampaignsPrev || []);

  // Deltas — Spend
  const spendDelta    = calcDelta(globalCurrent?.total_ads_spend, globalPrev?.total_ads_spend);
  const googleDelta   = calcDelta(globalCurrent?.google_spend,    globalPrev?.google_spend);
  const metaDelta     = calcDelta(globalCurrent?.meta_spend,      globalPrev?.meta_spend);
  const liSpendDelta  = calcDelta(linkedInOverview?.total_cost_chf, linkedInOverviewPrev?.total_cost_chf);

  // Deltas — GA4
  const sessionsDelta        = calcDelta(ga4Current?.sessions,          ga4Prev?.sessions);
  const engagedSessionsDelta = calcDelta(ga4Current?.engaged_sessions,  ga4Prev?.engaged_sessions);
  const engagementRateDelta  = calcDelta(ga4Current?.engagement_rate,   ga4Prev?.engagement_rate);
  const usersDelta           = calcDelta(ga4Current?.total_users,       ga4Prev?.total_users);
  const newUsersDelta        = calcDelta(ga4Current?.new_users,         ga4Prev?.new_users);

  // Conversions
  const metaPurchaseCount     = (metaCampaigns || []).reduce((s, c) => s + (Number(c.purchase_count) || 0), 0);
  const metaPurchaseCountPrev = (metaCampaignsPrev || []).reduce((s, c) => s + (Number(c.purchase_count) || 0), 0);
  const totalConv     = (googleAgg.conversions || 0) + metaPurchaseCount     + (linkedInOverview?.total_conversions     || 0);
  const totalConvPrev = (googleAggPrev.conversions || 0) + metaPurchaseCountPrev + (linkedInOverviewPrev?.total_conversions || 0);

  // Deltas — Conversions
  const totalConvDelta  = calcDelta(totalConv,              totalConvPrev);
  const googleConvDelta = calcDelta(googleAgg.conversions,  googleAggPrev.conversions);
  const metaConvDelta   = calcDelta(metaPurchaseCount,      metaPurchaseCountPrev);
  const liConvDelta     = calcDelta(linkedInOverview?.total_conversions, linkedInOverviewPrev?.total_conversions);

  // Deltas — Google Ads KPIs
  const googleClicksDelta = calcDelta(googleAgg.clicks,      googleAggPrev.clicks);
  const googleImpDelta    = calcDelta(googleAgg.impressions,  googleAggPrev.impressions);
  const googleCPADelta    = calcDelta(googleAgg.cpa,          googleAggPrev.cpa);

  // ROAS
  const googleConvValue = googleAgg.conversionsValue || 0;
  const metaConvValue   = metaAgg.value || purchases || 0;
  const liConvValue     = linkedInOverview?.total_conv_value_chf || 0;
  const totalSpend      = (globalCurrent?.total_ads_spend || 0) + (hasLinkedIn ? (linkedInOverview?.total_cost_chf || 0) : 0);
  const googleRoas      = googleAgg.cost > 0   ? googleConvValue / googleAgg.cost  : null;
  const metaRoas        = metaAgg.spend > 0    ? metaConvValue  / metaAgg.spend   : null;
  const liRoas          = linkedInOverview?.global_roas ?? null;
  const totalRoas       = totalSpend > 0 ? (googleConvValue + metaConvValue + liConvValue) / totalSpend : null;

  // Deltas — ROAS
  const googleConvValuePrev = googleAggPrev.conversionsValue || 0;
  const metaConvValuePrev   = (metaCampaignsPrev || []).reduce((s, c) => s + (parseFloat(c.purchase_value) || 0), 0);
  const liConvValuePrev     = linkedInOverviewPrev?.total_conv_value_chf || 0;
  const totalSpendPrev      = (globalPrev?.total_ads_spend || 0) + (hasLinkedIn ? (linkedInOverviewPrev?.total_cost_chf || 0) : 0);
  const googleRoasPrev = googleAggPrev.cost > 0    ? googleConvValuePrev / googleAggPrev.cost  : null;
  const metaRoasPrev   = metaAggPrev.spend > 0     ? metaConvValuePrev  / metaAggPrev.spend   : null;
  const liRoasPrev     = linkedInOverviewPrev?.global_roas ?? null;
  const totalRoasPrev  = totalSpendPrev > 0 ? (googleConvValuePrev + metaConvValuePrev + liConvValuePrev) / totalSpendPrev : null;
  const googleRoasDelta = calcDelta(googleRoas, googleRoasPrev);
  const metaRoasDelta   = calcDelta(metaRoas,   metaRoasPrev);
  const liRoasDelta     = calcDelta(liRoas,      liRoasPrev);
  const totalRoasDelta  = calcDelta(totalRoas,   totalRoasPrev);

  return (
    <div className={styles.page}>
      {/* Styles inline — s'appliquent à l'écran ET en PDF, sans @media print */}
      <style>{`
        body { background: #ffffff !important; }
        /* Supprimer backdrop-filter — cause texte invisible dans Chrome PDF */
        *, *::before, *::after {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
        /* Titres de sections */
        [data-print-title] {
          color: #1a1a1a !important;
        }
        /* Labels KPI */
        [data-print-label] {
          color: #555555 !important;
        }
        /* En-têtes colonnes table */
        [data-print-th] {
          color: #555555 !important;
          background: #dde0e5 !important;
        }
        table thead {
          position: static !important;
        }
      `}</style>
      <Suspense><AutoPrint /></Suspense>

      {/* Bouton fermer — masqué à l'impression */}
      <button className={styles.closeBtn} onClick={undefined}>
        <a href={`/dashboard?client=${currentClient.id}&month=${selectedMonth.slice(0, 7)}`}>
          ← Retour au dashboard
        </a>
      </button>

      {/* ── COVER ── */}
      <div className={styles.cover}>
        <div className={styles.coverLeft}>
          {currentClient.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentClient.logo_url} alt={currentClient.client} className={styles.coverLogo} />
          ) : (
            <h1 className={styles.coverClient}>{currentClient.client}</h1>
          )}
        </div>
        <div className={styles.coverRight}>
          <p className={styles.coverLabel}>Rapport mensuel</p>
          <p className={styles.coverPeriod}>{formatMonth(selectedMonth)}</p>
          <p className={styles.coverAgency}>
            Agence BB Switzerland
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BBS-logo-100px.webp" alt="BBS" className={styles.coverAgencyLogo} />
          </p>
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      <div className={styles.sectionFirst}>
        <h2 className={styles.sectionTitle}>Vue d'ensemble</h2>

        {/* Ligne Spend */}
        <div className={styles.kpiGrid}>
          <KpiCard label="Total Ads Spend"  value={formatCurrency(hasLinkedIn ? totalSpend : globalCurrent?.total_ads_spend)} delta={spendDelta}   color="neutral" />
          <KpiCard label="Google Ads Spend" value={formatCurrency(globalCurrent?.google_spend)}   delta={googleDelta}  color="info" />
          <KpiCard label="Meta Ads Spend"   value={formatCurrency(globalCurrent?.meta_spend)}     delta={metaDelta}    color="accent" />
          {hasLinkedIn
            ? <KpiCard label="LinkedIn Ads Spend" value={formatCurrency(linkedInOverview?.total_cost_chf)} delta={liSpendDelta} color="linkedin" />
            : <KpiCard label="Sessions GA4"       value={formatNumber(ga4Current?.sessions)}      delta={sessionsDelta} color="positive" />
          }
        </div>

        {/* Ligne Conversions */}
        <div className={styles.kpiGrid}>
          <KpiCard label="Total Conversions"    value={formatNumber(totalConv)}               delta={totalConvDelta}  color="neutral" />
          <KpiCard label="Conversions Google"   value={formatNumber(googleAgg.conversions)}   delta={googleConvDelta} color="info" />
          <KpiCard label="Conversions Meta"     value={formatNumber(metaPurchaseCount)}        delta={metaConvDelta}   color="accent" />
          {hasLinkedIn && <KpiCard label="Conversions LinkedIn" value={formatNumber(linkedInOverview?.total_conversions)} delta={liConvDelta} color="linkedin" />}
        </div>

        {/* Ligne ROAS */}
        <div className={styles.kpiGrid}>
          <KpiCard label="ROAS Total"    value={totalRoas  != null ? `×${totalRoas.toFixed(2)}`  : '—'} delta={totalRoasDelta}  color="neutral" />
          <KpiCard label="ROAS Google"   value={googleRoas != null ? `×${googleRoas.toFixed(2)}` : '—'} delta={googleRoasDelta} color="info" />
          <KpiCard label="ROAS Meta"     value={metaRoas   != null ? `×${metaRoas.toFixed(2)}`   : '—'} delta={metaRoasDelta}   color="accent" />
          {hasLinkedIn && <KpiCard label="ROAS LinkedIn" value={liRoas != null ? `×${Number(liRoas).toFixed(2)}` : '—'} delta={liRoasDelta} color="linkedin" />}
        </div>

        <PrintAnalysisBlock analysis={aiAnalysis} />
      </div>

      {/* ── GOOGLE ADS ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Google Ads</h2>
        <div className={styles.kpiGrid5}>
          <KpiCard label="Spend"        value={formatCurrency(globalCurrent?.google_spend)} delta={googleDelta}      color="info" />
          <KpiCard label="Clics"        value={formatNumber(googleAgg.clicks)}              delta={googleClicksDelta} color="info" />
          <KpiCard label="Impressions"  value={formatNumber(googleAgg.impressions)}         delta={googleImpDelta}    color="info" />
          <KpiCard label="Conversions"  value={formatNumber(googleAgg.conversions)}         delta={googleConvDelta}   color="info" />
          <KpiCard label="Coût / conv." value={formatCurrency(googleAgg.cpa)}               delta={googleCPADelta}    color="info" invertDelta />
        </div>
        <GoogleCampaignsTable rows={googleStats || []} />
        <GoogleConversionsTable rows={googleConversions || []} />
      </div>

      {/* ── META ADS ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Meta Ads</h2>
        <MetaPlatformTable rows={metaCampaigns || []} />
        <MetaInsightsCharts rows={metaInsights || []} />
        <MetaActionsTable rows={metaActions || []} />
      </div>

      {/* ── GA4 ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>GA4</h2>
        <div className={styles.kpiGrid5}>
          <KpiCard label="Sessions"            value={formatNumber(ga4Current?.sessions)}          delta={sessionsDelta}        color="positive" />
          <KpiCard label="Sessions engagées"   value={formatNumber(ga4Current?.engaged_sessions)}  delta={engagedSessionsDelta} color="positive" />
          <KpiCard label="Taux d'engagement"   value={ga4Current?.engagement_rate != null ? formatPercent(ga4Current.engagement_rate) : '—'} delta={engagementRateDelta} color="positive" />
          <KpiCard label="Nouveaux utilis."    value={formatNumber(ga4Current?.new_users)}         delta={newUsersDelta}        color="positive" />
          <KpiCard label="Total utilisateurs"  value={formatNumber(ga4Current?.total_users)}       delta={usersDelta}           color="positive" />
        </div>
        <div className={styles.twoCol}>
          <ChartContainer title="Sources de trafic" height={280}>
            <TrafficSourceChart data={trafficSources || []} />
          </ChartContainer>
          <TopPagesTable rows={topPages || []} />
        </div>
      </div>

      {/* ── GSC (si pas HEG) ── */}
      {!hasLinkedIn && gscQueries && gscQueries.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Search Console</h2>
          <GscQueriesTable rows={gscQueries} subtitle={`${gscQueries.length} requêtes — ${formatMonth(selectedMonth)}`} />
        </div>
      )}

      {/* ── LINKEDIN (HEG uniquement) ── */}
      {hasLinkedIn && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>LinkedIn</h2>
          <div className={styles.kpiGrid}>
            <KpiCard label="Impressions" value={formatNumber(linkedInOverview?.total_impressions)} delta={calcDelta(linkedInOverview?.total_impressions, linkedInOverviewPrev?.total_impressions)} color="linkedin" />
            <KpiCard label="Clics"       value={formatNumber(linkedInOverview?.total_clicks)}      delta={calcDelta(linkedInOverview?.total_clicks,      linkedInOverviewPrev?.total_clicks)}      color="linkedin" />
            <KpiCard label="Conversions" value={formatNumber(linkedInOverview?.total_conversions)} delta={liConvDelta}  color="linkedin" />
            <KpiCard label="Follows"     value={formatNumber(linkedInOverview?.total_follows)}     delta={calcDelta(linkedInOverview?.total_follows,     linkedInOverviewPrev?.total_follows)}     color="linkedin" />
          </div>
          <div className={styles.kpiGrid}>
            <KpiCard label="Coût total"  value={formatCurrency(linkedInOverview?.total_cost_chf)}      delta={liSpendDelta} color="linkedin" />
            <KpiCard label="Conv. Value" value={formatCurrency(linkedInOverview?.total_conv_value_chf)} delta={calcDelta(linkedInOverview?.total_conv_value_chf, linkedInOverviewPrev?.total_conv_value_chf)} color="linkedin" />
            <KpiCard label="CTR"         value={linkedInOverview?.global_ctr_percent != null ? `${Number(linkedInOverview.global_ctr_percent).toFixed(2)}%` : '—'} delta={calcDelta(linkedInOverview?.global_ctr_percent, linkedInOverviewPrev?.global_ctr_percent)} color="linkedin" />
            <KpiCard label="ROAS"        value={linkedInOverview?.global_roas != null ? `×${Number(linkedInOverview.global_roas).toFixed(2)}` : '—'} delta={liRoasDelta} color="linkedin" />
          </div>
          <LinkedInCampaignsTable rows={linkedInCampaigns || []} />
        </div>
      )}
    </div>
  );
}

function PrintAnalysisBlock({ analysis }) {
  if (!analysis?.summary) return null;
  return (
    <div className={styles.analysisCard}>
      <h3 className={styles.analysisHeadline}>Analyse globale</h3>
      <p className={styles.analysisSummary}>{analysis.summary}</p>
    </div>
  );
}

function TargetProgress({ label, actual, target, max, formatFn, invertGood = false }) {
  const ratio = target > 0 ? (actual / target) * 100 : 0;
  const cappedRatio = Math.min(ratio, 100);
  let status = 'good';
  if (invertGood) {
    if (ratio > 100 && max && actual > max) status = 'danger';
    else if (ratio > 100) status = 'warning';
  } else {
    if (ratio < 70) status = 'danger';
    else if (ratio < 90) status = 'warning';
  }
  const barColor = status === 'good' ? 'var(--color-positive)' : status === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)';
  return (
    <div className={styles.targetItem}>
      <div className={styles.targetHeader}>
        <span>{label}</span>
        <span>{formatFn(actual)} / {formatFn(target)} cible</span>
      </div>
      <div className={styles.progressBar}>
        <div style={{ width: `${cappedRatio}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
