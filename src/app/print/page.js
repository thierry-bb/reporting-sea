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
import SpendTrendChart from '@/app/dashboard/SpendTrendChart';
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
  'HEG':  'heg_',
  'Yneo': 'yneo_',
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
  ] = await Promise.all([
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle(),
    supabase.from(`${tablePrefix}ga4_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    supabase.from(`${tablePrefix}ga4_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle(),
    supabase.from(`${tablePrefix}google_ads_monthly_stats`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}meta_campaigns`).select('platform, impressions, reach, clicks, page_likes, spend, purchase_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}meta_actions`).select('action_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth).eq('action_type', 'purchase'),
    supabase.from(`${tablePrefix}gsc_top_queries`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(20),
    supabase.from(`${tablePrefix}ga4_traffic_sources`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}ga4_top_pages`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(10),
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('report_month, google_spend, meta_spend, total_ads_spend').eq('client_id', currentClient.id).gte('report_month', sixMonthsAgo).lte('report_month', selectedMonth).order('report_month'),
    supabase.from(`${tablePrefix}google_ads_conversions_monthly`).select('campaign_name, conversion_name, conversions').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('conversions', { ascending: false }),
    supabase.from(`${tablePrefix}meta_actions`).select('action_type, action_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('action_value', { ascending: false }),
    supabase.from(`${tablePrefix}ai_analyses`).select('platform, analysis_json').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}meta_insights`).select('breakdown_type, breakdown_value, impressions, percentage').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    hasLinkedIn
      ? supabase.from(`${tablePrefix}linkedin_ads_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle()
      : Promise.resolve({ data: null }),
    hasLinkedIn
      ? supabase.from(`${tablePrefix}linkedin_ads_campaigns`).select('campaign_name, campaign_id, status, objective, impressions, clicks, conversions, cost_chf, conv_value_chf').eq('client_id', currentClient.id).eq('report_month', selectedMonth)
      : Promise.resolve({ data: [] }),
  ]);

  // Calculs
  const googleAgg = aggregateGoogleStats(googleStats || []);
  const metaAgg = aggregateMetaStats(metaCampaigns || []);
  const purchases = (metaPurchases || []).reduce((s, a) => s + (parseFloat(a.action_value) || 0), 0);

  const spendDelta = calcDelta(globalCurrent?.total_ads_spend, globalPrev?.total_ads_spend);
  const googleDelta = calcDelta(globalCurrent?.google_spend, globalPrev?.google_spend);
  const metaDelta = calcDelta(globalCurrent?.meta_spend, globalPrev?.meta_spend);
  const sessionsDelta = calcDelta(ga4Current?.sessions, ga4Prev?.sessions);
  const usersDelta = calcDelta(ga4Current?.total_users, ga4Prev?.total_users);

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
          color: #ffffff !important;
        }
        /* Labels KPI */
        [data-print-label] {
          color: #cccccc !important;
        }
        /* En-têtes colonnes table */
        [data-print-th] {
          color: #cccccc !important;
          background: #1f2022 !important;
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
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Vue d'ensemble</h2>
        <div className={styles.kpiGrid}>
          <KpiCard label="Total Ads Spend"  value={formatCurrency(globalCurrent?.total_ads_spend)} delta={spendDelta}   color="neutral" />
          <KpiCard label="Google Ads Spend" value={formatCurrency(globalCurrent?.google_spend)}    delta={googleDelta}  color="info" />
          <KpiCard label="Meta Ads Spend"   value={formatCurrency(globalCurrent?.meta_spend)}      delta={metaDelta}    color="accent" />
          <KpiCard label="Sessions GA4"     value={formatNumber(ga4Current?.sessions)}             delta={sessionsDelta} color="positive" />
        </div>
        <ChartContainer title="Évolution du budget" subtitle="6 derniers mois" height={280}>
          <SpendTrendChart data={trendData || []} />
        </ChartContainer>
        {aiAnalysis && aiAnalysis.length > 0 && (
          <AnalysisBlock analyses={aiAnalysis} />
        )}
      </div>

      {/* ── GOOGLE ADS ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Google Ads</h2>
        <div className={styles.kpiGrid5}>
          <KpiCard label="Spend"        value={formatCurrency(globalCurrent?.google_spend)} delta={googleDelta} color="info" />
          <KpiCard label="Clics"        value={formatNumber(googleAgg.clicks)}              color="info" />
          <KpiCard label="Impressions"  value={formatNumber(googleAgg.impressions)}         color="info" />
          <KpiCard label="Conversions"  value={formatNumber(googleAgg.conversions)}         color="info" />
          <KpiCard label="Coût / conv." value={formatCurrency(googleAgg.cpa)}              color="info" />
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
          <KpiCard label="Sessions"            value={formatNumber(ga4Current?.sessions)}          delta={sessionsDelta} color="positive" />
          <KpiCard label="Sessions engagées"   value={formatNumber(ga4Current?.engaged_sessions)}  color="positive" />
          <KpiCard label="Taux d'engagement"   value={ga4Current?.engagement_rate != null ? formatPercent(ga4Current.engagement_rate) : '—'} color="positive" />
          <KpiCard label="Nouveaux utilis."    value={formatNumber(ga4Current?.new_users)}         delta={usersDelta} color="positive" />
          <KpiCard label="Total utilisateurs"  value={formatNumber(ga4Current?.total_users)}       color="positive" />
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
            <KpiCard label="Impressions" value={formatNumber(linkedInOverview?.total_impressions)} color="linkedin" />
            <KpiCard label="Clics"       value={formatNumber(linkedInOverview?.total_clicks)}      color="linkedin" />
            <KpiCard label="Conversions" value={formatNumber(linkedInOverview?.total_conversions)} color="linkedin" />
            <KpiCard label="Follows"     value={formatNumber(linkedInOverview?.total_follows)}     color="linkedin" />
          </div>
          <div className={styles.kpiGrid}>
            <KpiCard label="Coût total"  value={formatCurrency(linkedInOverview?.total_cost_chf)}      color="linkedin" />
            <KpiCard label="Conv. Value" value={formatCurrency(linkedInOverview?.total_conv_value_chf)} color="linkedin" />
            <KpiCard label="CTR"         value={linkedInOverview?.global_ctr_percent != null ? `${Number(linkedInOverview.global_ctr_percent).toFixed(2)}%` : '—'} color="linkedin" />
            <KpiCard label="ROAS"        value={linkedInOverview?.global_roas != null ? `×${Number(linkedInOverview.global_roas).toFixed(2)}` : '—'} color="linkedin" />
          </div>
          <LinkedInCampaignsTable rows={linkedInCampaigns || []} />
        </div>
      )}
    </div>
  );
}

const PLATFORM_LABELS = {
  google_ads: 'Google Ads',
  meta: 'Meta Ads',
  ga4: 'GA4',
  gsc: 'Search Console',
};

function AnalysisBlock({ analyses }) {
  return (
    <div className={styles.analysisCard}>
      {analyses.map((item) => {
        const { headline, key_message, summary } = item.analysis_json || {};
        const platformLabel = PLATFORM_LABELS[item.platform] || item.platform;
        return (
          <div key={item.platform} className={styles.analysisSection}>
            <span className={styles.analysisBadge}>{platformLabel}</span>
            {headline && <h3 className={styles.analysisHeadline}>{headline}</h3>}
            {key_message && <p className={styles.analysisKeyMessage}>{key_message}</p>}
            {summary && <p className={styles.analysisSummary}>{summary}</p>}
          </div>
        );
      })}
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
