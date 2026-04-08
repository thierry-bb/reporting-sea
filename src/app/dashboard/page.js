import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import supabase from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import {
  formatCurrency, formatPercent, formatNumber, formatMonth,
  normalizeMonth, getMonthOffset, getPreviousMonth,
  calcDelta,
  aggregateGoogleStats,
} from '@/lib/formatters';
import KpiCard from '@/components/dashboard/KpiCard';
import ChartContainer from '@/components/dashboard/ChartContainer';
import Header from '@/components/layout/Header';
import SpendTrendChart from './SpendTrendChart';
import TrafficSourceChart from './TrafficSourceChart';
import GoogleCampaignsTable from './GoogleCampaignsTable';
import MetaPlatformTable from './MetaPlatformTable';
import MetaActionsTable from './MetaActionsTable';
import MetaCampaignsTable from './MetaCampaignsTable';
import MetaInsightsCharts from './MetaInsightsCharts';
import GoogleConversionsTable from './GoogleConversionsTable';
import TopPagesTable from './TopPagesTable';
import Ga4EventsTable from './Ga4EventsTable';
import GscQueriesTable from './GscQueriesTable';
import LinkedInCampaignsTable from './LinkedInCampaignsTable';
import PrintButton from '@/components/dashboard/PrintButton';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

// Clients utilisant des tables dédiées (préfixées)
const CLIENT_TABLE_PREFIX = {
  'HEG':  'heg_',
  'Yneo': 'yneo_',
};

// Clients avec onglet LinkedIn (à la place de GSC)
const LINKEDIN_CLIENTS = ['HEG'];

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;

  // --- Auth ---
  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login');

  const role = user.user_metadata?.role || 'agency';
  const userClientId = user.user_metadata?.client_id;

  // --- Charger les clients actifs ---
  const { data: clients } = await supabase
    .from('clients')
    .select('id, client, logo_url, actif, target_cpa_google, max_cpa_google, target_ctr_google, min_ctr_google, target_cpa_meta, max_cpa_meta, target_ctr_meta, min_ctr_meta')
    .eq('actif', true)
    .order('client');

  if (!clients || clients.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.noClient}>
          <svg className={styles.noClientIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p>Aucun client actif trouvé.</p>
        </div>
      </div>
    );
  }

  // --- Résoudre le client sélectionné ---
  const clientId = role === 'client' ? userClientId : (params.client || clients[0].id);
  const currentClient = clients.find((c) => c.id === clientId) || clients[0];

  // --- Préfixe de tables selon le client ---
  const tablePrefix = CLIENT_TABLE_PREFIX[currentClient.client] || '';
  const hasLinkedIn = LINKEDIN_CLIENTS.includes(currentClient.client);

  // --- Résoudre le mois sélectionné ---
  const rawMonth = params.month;
  const selectedMonth = normalizeMonth(rawMonth) || getPreviousMonth();
  const previousMonth = getMonthOffset(selectedMonth, -1);
  const sixMonthsAgo = getMonthOffset(selectedMonth, -5);

  // --- Onglets selon le client ---
  const validTabs = ['overview', 'google', 'meta', 'ga4', 'gsc', ...(hasLinkedIn ? ['linkedin'] : [])];
  const activeTab = validTabs.includes(params.tab) ? params.tab : 'overview';

  const tabs = [
    { id: 'overview', label: 'Overview',       color: null },
    { id: 'google',   label: 'Google Ads',     color: 'blue' },
    { id: 'meta',     label: 'Meta Ads',       color: 'pink' },
    { id: 'ga4',      label: 'GA4',            color: 'yellow' },
    ...(!hasLinkedIn ? [{ id: 'gsc', label: 'Search Console', color: null }] : []),
    ...(hasLinkedIn ? [{ id: 'linkedin', label: 'LinkedIn', color: 'green' }] : []),
  ];

  // --- Si params manquants, rediriger avec les bons params ---
  if (!params.client || !params.month) {
    let monthShort = selectedMonth.slice(0, 7);

    // Pour un client : chercher le mois le plus récent avec des données
    if (role === 'client' && !params.month) {
      const { data: latestRow } = await supabase
        .from(`${tablePrefix}global_monthly_reporting`)
        .select('report_month')
        .eq('client_id', currentClient.id)
        .order('report_month', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestRow?.report_month) {
        monthShort = latestRow.report_month.slice(0, 7);
      }
    }

    redirect(`/dashboard?client=${currentClient.id}&month=${monthShort}&tab=${activeTab}`);
  }

  // --- Fetches parallèles ---
  const [
    { data: globalCurrent },
    { data: globalPrev },
    { data: ga4Current },
    { data: ga4Prev },
    { data: googleStats },
    { data: googleStatsPrev },
    { data: metaCampaigns },
    { data: gscQueries },
    { data: trafficSources },
    { data: topPages },
    { data: trendData },
    { data: monthsList },
    { data: googleConversions },
    { data: metaActions },
    { data: aiAnalysis },
    { data: metaInsights },
    { data: linkedInOverview },
    { data: linkedInCampaigns },
    { data: ga4Events },
    { data: metaCampaignsPrev },
    { data: linkedInOverviewPrev },
  ] = await Promise.all([
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle(),
    supabase.from(`${tablePrefix}ga4_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    supabase.from(`${tablePrefix}ga4_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle(),
    supabase.from(`${tablePrefix}google_ads_monthly_stats`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}google_ads_monthly_stats`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth),
    supabase.from(`${tablePrefix}meta_campaigns`).select('campaign_name, platform, impressions, reach, clicks, page_likes, spend, ctr_total, purchase_count, purchase_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}gsc_top_queries`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(20),
    supabase.from(`${tablePrefix}ga4_traffic_sources`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth),
    supabase.from(`${tablePrefix}ga4_top_pages`).select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(10),
    supabase.from(`${tablePrefix}global_monthly_reporting`).select('report_month, google_spend, meta_spend, total_ads_spend').eq('client_id', currentClient.id).gte('report_month', sixMonthsAgo).lte('report_month', selectedMonth).order('report_month'),
    supabase.from(`${tablePrefix}ga4_overview`).select('report_month').eq('client_id', currentClient.id).order('report_month', { ascending: false }).limit(24),
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
    supabase.from(`${tablePrefix}ga4_events_report`).select('event_name, event_count, total_users').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('event_count', { ascending: false }),
    supabase.from(`${tablePrefix}meta_campaigns`).select('impressions, reach, clicks, page_likes, spend, platform').eq('client_id', currentClient.id).eq('report_month', previousMonth),
    hasLinkedIn
      ? supabase.from(`${tablePrefix}linkedin_ads_overview`).select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // --- Calculs agrégés ---
  const googleAgg = aggregateGoogleStats(googleStats || []);
  const googleAggPrev = aggregateGoogleStats(googleStatsPrev || []);
  const googleCtrDelta = calcDelta(googleAgg.ctr, googleAggPrev.ctr);
  const googleClicksDelta = calcDelta(googleAgg.clicks, googleAggPrev.clicks);
  const googleImpressionsDelta = calcDelta(googleAgg.impressions, googleAggPrev.impressions);
  const googleConversionsDelta = calcDelta(googleAgg.conversions, googleAggPrev.conversions);
  const googleCpaDelta = calcDelta(googleAgg.cpa, googleAggPrev.cpa);
  // Deltas globaux
  const spendDelta = calcDelta(globalCurrent?.total_ads_spend, globalPrev?.total_ads_spend);
  const googleDelta = calcDelta(globalCurrent?.google_spend, globalPrev?.google_spend);
  const metaDelta = calcDelta(globalCurrent?.meta_spend, globalPrev?.meta_spend);
  const sessionsDelta = calcDelta(ga4Current?.sessions, ga4Prev?.sessions);
  const engagedSessionsDelta = calcDelta(ga4Current?.engaged_sessions, ga4Prev?.engaged_sessions);
  const engagementRateDelta = calcDelta(ga4Current?.engagement_rate, ga4Prev?.engagement_rate);
  const newUsersDelta = calcDelta(ga4Current?.new_users, ga4Prev?.new_users);
  const usersDelta = calcDelta(ga4Current?.total_users, ga4Prev?.total_users);

  // Deltas Meta par plateforme
  function aggMetaByPlatform(rows) {
    const map = {};
    for (const r of (rows || [])) {
      const k = (r.platform || '').toLowerCase();
      if (!map[k]) map[k] = { impressions: 0, reach: 0, clicks: 0, page_likes: 0, spend: 0 };
      map[k].impressions += Number(r.impressions) || 0;
      map[k].reach       += Number(r.reach)       || 0;
      map[k].clicks      += Number(r.clicks)      || 0;
      map[k].page_likes  += Number(r.page_likes)  || 0;
      map[k].spend       += Number(r.spend)       || 0;
    }
    return map;
  }
  const metaAggCur  = aggMetaByPlatform(metaCampaigns);
  const metaAggPrev = aggMetaByPlatform(metaCampaignsPrev);

  // Deltas LinkedIn
  const liImpressionsDelta  = calcDelta(linkedInOverview?.total_impressions,   linkedInOverviewPrev?.total_impressions);
  const liClicksDelta        = calcDelta(linkedInOverview?.total_clicks,        linkedInOverviewPrev?.total_clicks);
  const liConversionsDelta   = calcDelta(linkedInOverview?.total_conversions,   linkedInOverviewPrev?.total_conversions);
  const liFollowsDelta       = calcDelta(linkedInOverview?.total_follows,       linkedInOverviewPrev?.total_follows);
  const liCostDelta          = calcDelta(linkedInOverview?.total_cost_chf,      linkedInOverviewPrev?.total_cost_chf);
  const liConvValueDelta     = calcDelta(linkedInOverview?.total_conv_value_chf,linkedInOverviewPrev?.total_conv_value_chf);
  const liCtrDelta           = calcDelta(linkedInOverview?.global_ctr_percent,  linkedInOverviewPrev?.global_ctr_percent);
  const liRoasDelta          = calcDelta(linkedInOverview?.global_roas,         linkedInOverviewPrev?.global_roas);

  // Mois disponibles pour le sélecteur
  const availableMonths = (monthsList || []).map((r) => r.report_month);

  return (
    <>
      <Suspense>
        <Header
          clients={clients}
          monthsList={availableMonths}
          pageTitle="Dashboard"
          activeTab={activeTab}
          role={role}
          tabs={tabs}
        />
      </Suspense>

      <main className={styles.page}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div className={styles.clientInfo}>
            {currentClient.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentClient.logo_url} alt={currentClient.client} className={styles.clientLogoFull} />
            ) : (
              <h2 className={styles.clientName}>{currentClient.client}</h2>
            )}
          </div>
          <div className={styles.pageHeaderRight}>
            <div className={styles.periodBadge}>{formatMonth(selectedMonth)}</div>
            <PrintButton />
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <section className={styles.kpiGrid}>
              <KpiCard
                label="Total Ads Spend"
                value={formatCurrency(globalCurrent?.total_ads_spend)}
                delta={spendDelta}
                color="neutral"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
              />
              <KpiCard
                label="Google Ads Spend"
                value={formatCurrency(globalCurrent?.google_spend)}
                delta={googleDelta}
                color="info"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>}
              />
              <KpiCard
                label="Meta Ads Spend"
                value={formatCurrency(globalCurrent?.meta_spend)}
                delta={metaDelta}
                color="accent"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>}
              />
              <KpiCard
                label="Sessions GA4"
                value={formatNumber(ga4Current?.sessions)}
                delta={sessionsDelta}
                color="positive"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              />
            </section>

            <div className={styles.twoCol}>
              <ChartContainer title="Évolution du budget" subtitle="6 derniers mois" height={300}>
                <SpendTrendChart data={trendData || []} />
              </ChartContainer>
              <AnalysisBlock analyses={aiAnalysis || []} />
            </div>
          </>
        )}

        {/* ── GOOGLE ADS ── */}
        {activeTab === 'google' && (
          <>
            <section className={styles.kpiGrid6}>
              <KpiCard label="Spend Google" value={formatCurrency(globalCurrent?.google_spend)} delta={googleDelta} color="info" />
              <KpiCard label="CTR" value={googleAgg.ctr > 0 ? `${googleAgg.ctr.toFixed(2)}%` : '—'} delta={googleCtrDelta} color="info" />
              <KpiCard label="Clics" value={formatNumber(googleAgg.clicks)} delta={googleClicksDelta} color="info" />
              <KpiCard label="Impressions" value={formatNumber(googleAgg.impressions)} delta={googleImpressionsDelta} color="info" />
              <KpiCard label="Conversions" value={formatNumber(googleAgg.conversions)} delta={googleConversionsDelta} color="info" />
              <KpiCard label="Coût / conv." value={formatCurrency(googleAgg.cpa)} delta={googleCpaDelta} color="info" invertDelta />
            </section>
            <GoogleCampaignsTable rows={googleStats || []} />
            <GoogleConversionsTable rows={googleConversions || []} />
          </>
        )}

        {/* ── META ADS ── */}
        {activeTab === 'meta' && (
          <>
            <MetaPlatformTable rows={metaCampaigns || []} prevRows={metaCampaignsPrev || []} />
            <MetaCampaignsTable rows={metaCampaigns || []} />
            <MetaInsightsCharts rows={metaInsights || []} />
            <MetaActionsTable rows={metaActions || []} />
          </>
        )}

        {/* ── GA4 ── */}
        {activeTab === 'ga4' && (
          <>
            <section className={styles.kpiGrid5}>
              <KpiCard label="Sessions"             value={formatNumber(ga4Current?.sessions)}          delta={sessionsDelta}       color="positive" />
              <KpiCard label="Sessions engagées"    value={formatNumber(ga4Current?.engaged_sessions)}  delta={engagedSessionsDelta} color="positive" />
              <KpiCard label="Taux d'engagement"    value={ga4Current?.engagement_rate != null ? formatPercent(ga4Current.engagement_rate) : '—'} delta={engagementRateDelta} color="positive" />
              <KpiCard label="Nouveaux utilisateurs" value={formatNumber(ga4Current?.new_users)}        delta={newUsersDelta}        color="positive" />
              <KpiCard label="Total utilisateurs"   value={formatNumber(ga4Current?.total_users)}       delta={usersDelta}           color="positive" />
            </section>
            <div className={styles.twoColEqual}>
              <TopPagesTable rows={topPages || []} />
              <Ga4EventsTable rows={ga4Events || []} />
            </div>
            <ChartContainer title="Sources de trafic" height={280}>
              <TrafficSourceChart data={trafficSources || []} />
            </ChartContainer>
          </>
        )}

        {/* ── LINKEDIN ── */}
        {activeTab === 'linkedin' && (
          <>
            <section className={styles.kpiGrid}>
              <KpiCard label="Impressions" value={formatNumber(linkedInOverview?.total_impressions)}  delta={liImpressionsDelta}  color="linkedin" />
              <KpiCard label="Clics"       value={formatNumber(linkedInOverview?.total_clicks)}       delta={liClicksDelta}        color="linkedin" />
              <KpiCard label="Conversions" value={formatNumber(linkedInOverview?.total_conversions)}  delta={liConversionsDelta}   color="linkedin" />
              <KpiCard label="Follows"     value={formatNumber(linkedInOverview?.total_follows)}      delta={liFollowsDelta}       color="linkedin" />
            </section>
            <section className={styles.kpiGrid}>
              <KpiCard label="Coût total"  value={formatCurrency(linkedInOverview?.total_cost_chf)}       delta={liCostDelta}      color="linkedin" invertDelta />
              <KpiCard label="Conv. Value" value={formatCurrency(linkedInOverview?.total_conv_value_chf)}  delta={liConvValueDelta} color="linkedin" />
              <KpiCard label="CTR"         value={linkedInOverview?.global_ctr_percent != null ? `${Number(linkedInOverview.global_ctr_percent).toFixed(2)}%` : '—'} delta={liCtrDelta}  color="linkedin" />
              <KpiCard label="ROAS"        value={linkedInOverview?.global_roas != null ? `×${Number(linkedInOverview.global_roas).toFixed(2)}` : '—'}               delta={liRoasDelta} color="linkedin" />
            </section>
            <LinkedInCampaignsTable rows={linkedInCampaigns || []} />
          </>
        )}

        {/* ── GSC ── */}
        {activeTab === 'gsc' && (
          <GscQueriesTable
            rows={gscQueries || []}
            subtitle={`${gscQueries?.length || 0} requêtes — ${formatMonth(selectedMonth)}`}
          />
        )}
      </main>
    </>
  );
}

const PLATFORM_LABELS = {
  google_ads: 'Google Ads',
  meta: 'Meta Ads',
  ga4: 'GA4',
  gsc: 'Search Console',
};

function AnalysisBlock({ analyses }) {
  if (!analyses || analyses.length === 0) {
    return (
      <div className={styles.analysisCard}>
        <p className={styles.analysisEmpty}>Aucune analyse disponible pour ce mois.</p>
      </div>
    );
  }

  return (
    <div className={styles.analysisCard}>
      {analyses.map((item) => {
        const { headline, key_message, summary } = item.analysis_json || {};
        const platformLabel = PLATFORM_LABELS[item.platform] || item.platform;
        return (
          <div key={item.platform} className={styles.analysisSection}>
            <span className={styles.analysisPlatformBadge}>{platformLabel}</span>
            {headline && <h3 className={styles.analysisHeadline}>{headline}</h3>}
            {key_message && (
              <div className={styles.analysisKeyMessage}>
                <svg className={styles.analysisIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p>{key_message}</p>
              </div>
            )}
            {summary && <p className={styles.analysisSummary}>{summary}</p>}
          </div>
        );
      })}
    </div>
  );
}
