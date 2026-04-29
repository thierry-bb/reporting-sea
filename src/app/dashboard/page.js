import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import supabase from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import {
  formatCurrency, formatPercent, formatNumber, formatMonth,
  normalizeMonth, getMonthOffset, getPreviousMonth,
  calcDelta,
  aggregateGoogleStats,
} from '@/lib/formatters';
import KpiCard from '@/components/dashboard/KpiCard';
import ChartContainer from '@/components/dashboard/ChartContainer';
import Header from '@/components/layout/Header';
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
import LinkedInEventsTable from './LinkedInEventsTable';

import AnalysisEditor from './AnalysisEditor';
import PrintButton from '@/components/dashboard/PrintButton';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';


export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;

  // --- Auth ---
  const supabaseAuth = await createSupabaseServerClient();
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login');

  const role = user.user_metadata?.role || 'client';
  const userClientId = user.user_metadata?.client_id;

  // --- Charger les clients actifs ---
  const { data: clients } = await supabase
    .from('clients')
    .select('id, client, logo_url, actif, target_cpa_google, max_cpa_google, target_ctr_google, min_ctr_google, target_cpa_meta, max_cpa_meta, target_ctr_meta, min_ctr_meta, has_google_ads, has_meta, has_ga4, has_gsc, has_linkedin')
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

  // --- Plateformes actives selon le client ---
  const hasGoogleAds = currentClient.has_google_ads ?? true;
  const hasMeta      = currentClient.has_meta       ?? true;
  const hasGA4       = currentClient.has_ga4        ?? true;
  const hasGSC       = currentClient.has_gsc        ?? true;
  const hasLinkedIn  = currentClient.has_linkedin   ?? false;
  const linkedInOnly = hasLinkedIn && !hasGoogleAds && !hasMeta;

  // --- Résoudre le mois sélectionné ---
  const rawMonth = params.month;
  const selectedMonth = normalizeMonth(rawMonth) || getPreviousMonth();
  const previousMonth = getMonthOffset(selectedMonth, -1);

  // --- Onglets selon les plateformes actives ---
  const tabs = [
    { id: 'overview', label: 'Overview', color: null },
    ...(hasGoogleAds ? [{ id: 'google',   label: 'Google Ads',     color: 'blue'   }] : []),
    ...(hasMeta      ? [{ id: 'meta',     label: 'Meta Ads',       color: 'pink'   }] : []),
    ...(hasGA4       ? [{ id: 'ga4',      label: 'GA4',            color: 'yellow' }] : []),
    ...(hasGSC       ? [{ id: 'gsc',      label: 'Search Console', color: null     }] : []),
    ...(hasLinkedIn  ? [{ id: 'linkedin', label: 'LinkedIn',       color: 'green'  }] : []),
  ];
  const validTabs = tabs.map((t) => t.id);
  const activeTab = validTabs.includes(params.tab) ? params.tab : 'overview';

  // --- Si params manquants, rediriger avec les bons params ---
  if (!params.client || !params.month) {
    let monthShort = selectedMonth.slice(0, 7);

    // Pour un client : chercher le mois le plus récent avec des données
    if (role === 'client' && !params.month) {
      const monthTable = linkedInOnly ? 'linkedin_ads_overview' : 'global_monthly_reporting';
      const { data: latestRow } = await supabase
        .from(monthTable)
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
    { data: linkedInEvents },
  ] = await Promise.all([
    !linkedInOnly ? supabaseAuth.from('global_monthly_reporting').select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle() : Promise.resolve({ data: null }),
    !linkedInOnly ? supabaseAuth.from('global_monthly_reporting').select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle() : Promise.resolve({ data: null }),
    hasGA4 ? supabaseAuth.from('ga4_overview').select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle() : Promise.resolve({ data: null }),
    hasGA4 ? supabaseAuth.from('ga4_overview').select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle() : Promise.resolve({ data: null }),
    hasGoogleAds ? supabaseAuth.from('google_ads_monthly_stats').select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth) : Promise.resolve({ data: [] }),
    hasGoogleAds ? supabaseAuth.from('google_ads_monthly_stats').select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth) : Promise.resolve({ data: [] }),
    hasMeta ? supabaseAuth.from('meta_campaigns').select('campaign_name, platform, impressions, reach, clicks, page_likes, spend, ctr_total, purchase_count, purchase_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth) : Promise.resolve({ data: [] }),
    hasGSC  ? supabaseAuth.from('gsc_top_queries').select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(20) : Promise.resolve({ data: [] }),
    hasGA4  ? supabaseAuth.from('ga4_traffic_sources').select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth) : Promise.resolve({ data: [] }),
    hasGA4  ? supabaseAuth.from('ga4_top_pages').select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('rank').limit(10) : Promise.resolve({ data: [] }),
    linkedInOnly
      ? supabaseAuth.from('linkedin_ads_overview').select('report_month').eq('client_id', currentClient.id).order('report_month', { ascending: false }).limit(24)
      : supabaseAuth.from('ga4_overview').select('report_month').eq('client_id', currentClient.id).order('report_month', { ascending: false }).limit(24),
    hasGoogleAds ? supabaseAuth.from('google_ads_conversions_monthly').select('campaign_name, conversion_name, conversions').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('conversions', { ascending: false }) : Promise.resolve({ data: [] }),
    hasMeta ? supabaseAuth.from('meta_actions').select('action_type, action_value').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('action_value', { ascending: false }) : Promise.resolve({ data: [] }),
    supabaseAdmin.from('ai_analyses').select('summary, analyse_global_client, analyse_global_agence').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle(),
    hasMeta ? supabaseAuth.from('meta_insights').select('breakdown_type, breakdown_value, impressions, percentage').eq('client_id', currentClient.id).eq('report_month', selectedMonth) : Promise.resolve({ data: [] }),
    hasLinkedIn ? supabaseAuth.from('linkedin_ads_overview').select('*').eq('client_id', currentClient.id).eq('report_month', selectedMonth).maybeSingle() : Promise.resolve({ data: null }),
    hasLinkedIn ? supabaseAuth.from('linkedin_ads_campaigns').select('campaign_name, campaign_id, status, objective, impressions, clicks, conversions, cost_chf, conv_value_chf').eq('client_id', currentClient.id).eq('report_month', selectedMonth) : Promise.resolve({ data: [] }),
    hasGA4  ? supabaseAuth.from('ga4_events_report').select('event_name, event_count, total_users').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('event_count', { ascending: false }) : Promise.resolve({ data: [] }),
    hasMeta ? supabaseAuth.from('meta_campaigns').select('impressions, reach, clicks, page_likes, spend, platform, purchase_count, purchase_value').eq('client_id', currentClient.id).eq('report_month', previousMonth) : Promise.resolve({ data: [] }),
    hasLinkedIn ? supabaseAuth.from('linkedin_ads_overview').select('*').eq('client_id', currentClient.id).eq('report_month', previousMonth).maybeSingle() : Promise.resolve({ data: null }),
    hasLinkedIn ? supabaseAuth.from('linkedin_ads_events').select('conversion_name, conversions').eq('client_id', currentClient.id).eq('report_month', selectedMonth).order('conversions', { ascending: false }) : Promise.resolve({ data: [] }),
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

  // Total Spend (inclut LinkedIn si applicable)
  const totalSpend     = (globalCurrent?.total_ads_spend || 0) + (hasLinkedIn ? (linkedInOverview?.total_cost_chf || 0) : 0);
  const totalSpendPrev = (globalPrev?.total_ads_spend    || 0) + (hasLinkedIn ? (linkedInOverviewPrev?.total_cost_chf || 0) : 0);
  const totalSpendDelta = calcDelta(totalSpend || null, totalSpendPrev || null);

  // Deltas LinkedIn
  const liImpressionsDelta  = calcDelta(linkedInOverview?.total_impressions,   linkedInOverviewPrev?.total_impressions);
  const liClicksDelta        = calcDelta(linkedInOverview?.total_clicks,        linkedInOverviewPrev?.total_clicks);
  const liConversionsDelta   = calcDelta(linkedInOverview?.total_conversions,   linkedInOverviewPrev?.total_conversions);
  const liFollowsDelta       = calcDelta(linkedInOverview?.total_follows,       linkedInOverviewPrev?.total_follows);
  const liCostDelta          = calcDelta(linkedInOverview?.total_cost_chf,      linkedInOverviewPrev?.total_cost_chf);
  const liConvValueDelta     = calcDelta(linkedInOverview?.total_conv_value_chf,linkedInOverviewPrev?.total_conv_value_chf);
  const liCtrDelta           = calcDelta(linkedInOverview?.global_ctr_percent,  linkedInOverviewPrev?.global_ctr_percent);
  const liRoasDelta          = calcDelta(linkedInOverview?.global_roas,         linkedInOverviewPrev?.global_roas);

  // Agrégats Meta conversions / ROAS
  function aggMetaConversions(rows) {
    let purchases = 0, value = 0, spend = 0;
    for (const r of (rows || [])) {
      purchases += Number(r.purchase_count) || 0;
      value     += Number(r.purchase_value) || 0;
      spend     += Number(r.spend)          || 0;
    }
    return { purchases, value, roas: spend > 0 ? value / spend : null };
  }
  const metaConvCur  = aggMetaConversions(metaCampaigns);
  const metaConvPrev = aggMetaConversions(metaCampaignsPrev);

  // Conversions overview
  const googleConvCur  = googleAgg.conversions || null;
  const googleConvPrev = googleAggPrev.conversions || null;
  const liConvCur      = linkedInOverview?.total_conversions  ?? null;
  const liConvPrev     = linkedInOverviewPrev?.total_conversions ?? null;
  const totalConvCur   = (googleConvCur || 0) + (metaConvCur.purchases || 0) + (hasLinkedIn ? (liConvCur || 0) : 0) || null;
  const totalConvPrev  = (googleConvPrev || 0) + (metaConvPrev.purchases || 0) + (hasLinkedIn ? (liConvPrev || 0) : 0) || null;

  const totalConvDelta   = calcDelta(totalConvCur,          totalConvPrev);
  const googleConvDelta2 = calcDelta(googleConvCur,         googleConvPrev);
  const metaConvDelta    = calcDelta(metaConvCur.purchases, metaConvPrev.purchases);
  const liConvDelta2     = calcDelta(liConvCur,             liConvPrev);

  // ROAS overview (Google ROAS non disponible → '—')
  const googleRoasCur  = googleAgg.roas;
  const googleRoasPrev = googleAggPrev.roas;
  const metaRoasCur    = metaConvCur.roas;
  const metaRoasPrev   = metaConvPrev.roas;
  const liRoasCur      = linkedInOverview?.global_roas  ?? null;
  const liRoasPrev     = linkedInOverviewPrev?.global_roas ?? null;
  // Total ROAS = (google_value + meta_value + li_value) / totalSpend
  const totalRevCur  = (googleAgg.conversionsValue || 0) + (metaConvCur.value || 0) + (hasLinkedIn ? (linkedInOverview?.total_conv_value_chf || 0) : 0);
  const totalRevPrev = (googleAggPrev.conversionsValue || 0) + (metaConvPrev.value || 0) + (hasLinkedIn ? (linkedInOverviewPrev?.total_conv_value_chf || 0) : 0);
  const totalRoasCur  = totalSpend     > 0 ? totalRevCur  / totalSpend     : null;
  const totalRoasPrev = totalSpendPrev > 0 ? totalRevPrev / totalSpendPrev : null;

  const totalRoasDelta  = calcDelta(totalRoasCur,   totalRoasPrev);
  const googleRoasDelta = calcDelta(googleRoasCur,  googleRoasPrev);
  const metaRoasDelta2  = calcDelta(metaRoasCur,    metaRoasPrev);
  const liRoasDelta2    = calcDelta(liRoasCur,      liRoasPrev);

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
            {linkedInOnly ? (
              /* Stryker : LinkedIn uniquement */
              <>
                <section className={styles.kpiGrid}>
                  <KpiCard
                    label="LinkedIn Ads Spend"
                    value={formatCurrency(linkedInOverview?.total_cost_chf)}
                    delta={liCostDelta}
                    color="linkedin"
                    invertDelta
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>}
                  />
                  <KpiCard
                    label="Impressions"
                    value={formatNumber(linkedInOverview?.total_impressions)}
                    delta={liImpressionsDelta}
                    color="linkedin"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  />
                  <KpiCard
                    label="Clics"
                    value={formatNumber(linkedInOverview?.total_clicks)}
                    delta={liClicksDelta}
                    color="linkedin"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1"/></svg>}
                  />
                  <KpiCard
                    label="Conversions"
                    value={formatNumber(linkedInOverview?.total_conversions)}
                    delta={liConversionsDelta}
                    color="linkedin"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>}
                  />
                </section>
                <section className={styles.kpiGrid}>
                  <KpiCard
                    label="ROAS"
                    value={liRoasCur != null ? `×${Number(liRoasCur).toFixed(2)}` : '—'}
                    delta={liRoasDelta2}
                    color="linkedin"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  />
                  <KpiCard
                    label="CTR"
                    value={linkedInOverview?.global_ctr_percent != null ? formatPercent(linkedInOverview.global_ctr_percent) : '—'}
                    delta={liCtrDelta}
                    color="linkedin"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                  />
                </section>
              </>
            ) : (
              /* Autres clients : overview complet */
              <>
                <section className={styles.kpiGrid}>
                  <KpiCard
                    label="Total Ads Spend"
                    value={formatCurrency(hasLinkedIn ? totalSpend : globalCurrent?.total_ads_spend)}
                    delta={hasLinkedIn ? totalSpendDelta : spendDelta}
                    color="neutral"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
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
                  {hasLinkedIn ? (
                    <KpiCard
                      label="LinkedIn Ads Spend"
                      value={formatCurrency(linkedInOverview?.total_cost_chf)}
                      delta={liCostDelta}
                      color="linkedin"
                      invertDelta
                      icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>}
                    />
                  ) : (
                    <KpiCard
                      label="Sessions GA4"
                      value={formatNumber(ga4Current?.sessions)}
                      delta={sessionsDelta}
                      color="positive"
                      icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                    />
                  )}
                </section>

                {/* Ligne Conversions */}
                <section className={styles.kpiGrid}>
                  <KpiCard
                    label="Total Conversions"
                    value={formatNumber(totalConvCur)}
                    delta={totalConvDelta}
                    color="neutral"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>}
                  />
                  <KpiCard
                    label="Conversions Google"
                    value={formatNumber(googleConvCur)}
                    delta={googleConvDelta2}
                    color="info"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>}
                  />
                  <KpiCard
                    label="Conversions Meta"
                    value={formatNumber(metaConvCur.purchases)}
                    delta={metaConvDelta}
                    color="accent"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>}
                  />
                  {hasLinkedIn && (
                    <KpiCard
                      label="Conversions LinkedIn"
                      value={formatNumber(liConvCur)}
                      delta={liConvDelta2}
                      color="linkedin"
                      icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>}
                    />
                  )}
                </section>

                {/* Ligne ROAS */}
                <section className={styles.kpiGrid}>
                  <KpiCard
                    label="ROAS Total"
                    value={totalRoasCur != null ? `×${totalRoasCur.toFixed(2)}` : '—'}
                    delta={totalRoasDelta}
                    color="neutral"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  />
                  <KpiCard
                    label="ROAS Google"
                    value={googleRoasCur != null ? `×${googleRoasCur.toFixed(2)}` : '—'}
                    delta={googleRoasDelta}
                    color="info"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>}
                  />
                  <KpiCard
                    label="ROAS Meta"
                    value={metaRoasCur != null ? `×${metaRoasCur.toFixed(2)}` : '—'}
                    delta={metaRoasDelta2}
                    color="accent"
                    icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>}
                  />
                  {hasLinkedIn && (
                    <KpiCard
                      label="ROAS LinkedIn"
                      value={liRoasCur != null ? `×${Number(liRoasCur).toFixed(2)}` : '—'}
                      delta={liRoasDelta2}
                      color="linkedin"
                      icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>}
                    />
                  )}
                </section>

                <AnalysisEditor
                  key={`${currentClient.id}-${selectedMonth}`}
                  clientText={aiAnalysis?.analyse_global_client}
                  agenceText={role === 'agency' ? aiAnalysis?.analyse_global_agence : null}
                  clientId={currentClient.id}
                  reportMonth={selectedMonth}
                  isAdmin={role === 'agency'}
                />
              </>
            )}
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
            <LinkedInEventsTable rows={linkedInEvents || []} />
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
