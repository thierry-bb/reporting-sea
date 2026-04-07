--
-- PostgreSQL database dump
--

\restrict ZkBdGgMAnxHHI5EgclQcq7JHyjhoOs3oLBjWybmwIpiMy8Wwu3fbtL8j5HiPRPr

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: client_google_ads_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_google_ads_campaigns (
    id integer NOT NULL,
    client_id uuid NOT NULL,
    google_ads_campaign_id text NOT NULL,
    campaign_name text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.client_google_ads_campaigns OWNER TO postgres;

--
-- Name: client_google_ads_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.client_google_ads_campaigns ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.client_google_ads_campaigns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: client_meta_ads_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_meta_ads_campaigns (
    id integer NOT NULL,
    client_id uuid NOT NULL,
    meta_campaign_id text NOT NULL,
    campaign_name text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.client_meta_ads_campaigns OWNER TO postgres;

--
-- Name: client_meta_ads_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.client_meta_ads_campaigns ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.client_meta_ads_campaigns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    client text NOT NULL,
    site_url text,
    actif boolean,
    google_ads_customer_id text,
    strategie text,
    logo_url text,
    target_cpa_google bigint,
    max_cpa_google bigint,
    target_ctr_google bigint,
    min_ctr_google bigint,
    min_budget_google bigint,
    target_cpa_meta bigint,
    max_cpa_meta bigint,
    target_ctr_meta bigint,
    min_ctr_meta bigint,
    min_budget_meta bigint,
    target_cpa_linkedin bigint,
    max_cpa_linkedin bigint,
    target_ctr_linkedin bigint,
    min_ctr_linkedin bigint,
    min_budget_linkedin bigint,
    meta_campagne_id text,
    linkedin_id text,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: ga4_countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ga4_countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid,
    report_month date NOT NULL,
    rank integer,
    country text,
    sessions integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ga4_countries OWNER TO postgres;

--
-- Name: ga4_overview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ga4_overview (
    id integer NOT NULL,
    client_id uuid NOT NULL,
    report_month date NOT NULL,
    sessions integer DEFAULT 0,
    engaged_sessions integer DEFAULT 0,
    engagement_rate numeric,
    total_users integer DEFAULT 0,
    new_users integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ga4_overview OWNER TO postgres;

--
-- Name: ga4_overview_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ga4_overview ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ga4_overview_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ga4_top_pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ga4_top_pages (
    id integer NOT NULL,
    client_id uuid NOT NULL,
    report_month date NOT NULL,
    rank integer NOT NULL,
    page_url text NOT NULL,
    page_views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ga4_top_pages OWNER TO postgres;

--
-- Name: ga4_top_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ga4_top_pages ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ga4_top_pages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ga4_traffic_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ga4_traffic_sources (
    id integer NOT NULL,
    client_id uuid NOT NULL,
    report_month date NOT NULL,
    source_medium text NOT NULL,
    users integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ga4_traffic_sources OWNER TO postgres;

--
-- Name: ga4_traffic_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ga4_traffic_sources ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ga4_traffic_sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: google_ads_monthly_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.google_ads_monthly_stats (
    id integer NOT NULL,
    client_id uuid NOT NULL,
    report_month date NOT NULL,
    campaign_id text NOT NULL,
    campaign_name text,
    advertising_channel_type text,
    impressions bigint DEFAULT 0,
    clicks bigint DEFAULT 0,
    conversions numeric DEFAULT 0,
    cost_micros bigint DEFAULT 0,
    cost_actual numeric GENERATED ALWAYS AS (((cost_micros)::numeric / 1000000.0)) STORED,
    ctr numeric,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.google_ads_monthly_stats OWNER TO postgres;

--
-- Name: meta_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meta_campaigns (
    id integer NOT NULL,
    campaign_name text NOT NULL,
    spend numeric,
    impressions bigint,
    clicks integer,
    platform text,
    date_start date,
    date_stop date,
    client_id uuid,
    report_month date,
    created_at timestamp with time zone DEFAULT now(),
    campaign_id bigint,
    reach integer DEFAULT 0,
    frequency numeric(10,4) DEFAULT 0,
    cpc numeric(10,6) DEFAULT 0,
    cpm numeric(10,6) DEFAULT 0,
    cpp numeric(10,6) DEFAULT 0,
    ctr_total numeric(10,6) DEFAULT 0,
    inline_link_clicks integer DEFAULT 0,
    thru_plays integer DEFAULT 0,
    page_likes integer DEFAULT 0,
    purchase_count integer DEFAULT 0,
    purchase_value numeric(12,2) DEFAULT 0
);


ALTER TABLE public.meta_campaigns OWNER TO postgres;

--
-- Name: global_monthly_reporting; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.global_monthly_reporting AS
 WITH meta_totals AS (
         SELECT meta_campaigns.client_id,
            meta_campaigns.report_month,
            sum(meta_campaigns.spend) AS meta_spend
           FROM public.meta_campaigns
          GROUP BY meta_campaigns.client_id, meta_campaigns.report_month
        ), google_totals AS (
         SELECT google_ads_monthly_stats.client_id,
            google_ads_monthly_stats.report_month,
            sum(google_ads_monthly_stats.cost_actual) AS google_spend
           FROM public.google_ads_monthly_stats
          GROUP BY google_ads_monthly_stats.client_id, google_ads_monthly_stats.report_month
        )
 SELECT COALESCE(m.client_id, g.client_id) AS client_id,
    COALESCE(m.report_month, g.report_month) AS report_month,
    COALESCE(m.meta_spend, (0)::numeric) AS meta_spend,
    COALESCE(g.google_spend, (0)::numeric) AS google_spend,
    (COALESCE(m.meta_spend, (0)::numeric) + COALESCE(g.google_spend, (0)::numeric)) AS total_ads_spend
   FROM (meta_totals m
     FULL JOIN google_totals g ON (((m.client_id = g.client_id) AND (m.report_month = g.report_month))));


ALTER VIEW public.global_monthly_reporting OWNER TO postgres;

--
-- Name: google_ads_monthly_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.google_ads_monthly_stats ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.google_ads_monthly_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: gsc_top_queries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gsc_top_queries (
    id integer NOT NULL,
    client_id uuid NOT NULL,
    report_month date NOT NULL,
    rank integer NOT NULL,
    query text NOT NULL,
    clicks integer DEFAULT 0,
    impressions integer DEFAULT 0,
    ctr numeric(10,4) DEFAULT 0,
    "position" numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gsc_top_queries OWNER TO postgres;

--
-- Name: gsc_top_queries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gsc_top_queries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gsc_top_queries_id_seq OWNER TO postgres;

--
-- Name: gsc_top_queries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gsc_top_queries_id_seq OWNED BY public.gsc_top_queries.id;


--
-- Name: meta_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meta_actions (
    id integer NOT NULL,
    campaign_id bigint,
    action_type text NOT NULL,
    action_value numeric,
    client_id uuid,
    report_month date,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.meta_actions OWNER TO postgres;

--
-- Name: meta_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.meta_actions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.meta_actions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: meta_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.meta_campaigns ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.meta_campaigns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: gsc_top_queries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gsc_top_queries ALTER COLUMN id SET DEFAULT nextval('public.gsc_top_queries_id_seq'::regclass);


--
-- Name: client_google_ads_campaigns client_google_ads_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_google_ads_campaigns
    ADD CONSTRAINT client_google_ads_campaigns_pkey PRIMARY KEY (id);


--
-- Name: client_meta_ads_campaigns client_meta_ads_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_meta_ads_campaigns
    ADD CONSTRAINT client_meta_ads_campaigns_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: ga4_countries ga4_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_countries
    ADD CONSTRAINT ga4_countries_pkey PRIMARY KEY (id);


--
-- Name: ga4_countries ga4_countries_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_countries
    ADD CONSTRAINT ga4_countries_unique UNIQUE (client_id, report_month, rank);


--
-- Name: ga4_overview ga4_overview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_overview
    ADD CONSTRAINT ga4_overview_pkey PRIMARY KEY (id);


--
-- Name: ga4_top_pages ga4_top_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_top_pages
    ADD CONSTRAINT ga4_top_pages_pkey PRIMARY KEY (id);


--
-- Name: ga4_traffic_sources ga4_traffic_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_traffic_sources
    ADD CONSTRAINT ga4_traffic_sources_pkey PRIMARY KEY (id);


--
-- Name: google_ads_monthly_stats google_ads_monthly_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_ads_monthly_stats
    ADD CONSTRAINT google_ads_monthly_stats_pkey PRIMARY KEY (id);


--
-- Name: gsc_top_queries gsc_top_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gsc_top_queries
    ADD CONSTRAINT gsc_top_queries_pkey PRIMARY KEY (id);


--
-- Name: meta_actions meta_actions_campaign_id_action_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meta_actions
    ADD CONSTRAINT meta_actions_campaign_id_action_type_key UNIQUE (campaign_id, action_type);


--
-- Name: meta_actions meta_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meta_actions
    ADD CONSTRAINT meta_actions_pkey PRIMARY KEY (id);


--
-- Name: meta_campaigns meta_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meta_campaigns
    ADD CONSTRAINT meta_campaigns_pkey PRIMARY KEY (id);


--
-- Name: meta_campaigns meta_campaigns_unique_entry; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meta_campaigns
    ADD CONSTRAINT meta_campaigns_unique_entry UNIQUE (client_id, report_month, campaign_id, platform);


--
-- Name: client_google_ads_campaigns unique_client_campaign; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_google_ads_campaigns
    ADD CONSTRAINT unique_client_campaign UNIQUE (client_id, google_ads_campaign_id);


--
-- Name: google_ads_monthly_stats unique_gads_monthly; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_ads_monthly_stats
    ADD CONSTRAINT unique_gads_monthly UNIQUE (client_id, report_month, campaign_id);


--
-- Name: gsc_top_queries unique_gsc_query_rank; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gsc_top_queries
    ADD CONSTRAINT unique_gsc_query_rank UNIQUE (client_id, report_month, rank);


--
-- Name: meta_actions unique_meta_actions_monthly_v2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meta_actions
    ADD CONSTRAINT unique_meta_actions_monthly_v2 UNIQUE (client_id, report_month, campaign_id, action_type);


--
-- Name: client_meta_ads_campaigns unique_meta_client_campaign; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_meta_ads_campaigns
    ADD CONSTRAINT unique_meta_client_campaign UNIQUE (client_id, meta_campaign_id);


--
-- Name: ga4_top_pages unique_monthly_page_rank; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_top_pages
    ADD CONSTRAINT unique_monthly_page_rank UNIQUE (client_id, report_month, rank);


--
-- Name: ga4_overview unique_overview_per_month; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_overview
    ADD CONSTRAINT unique_overview_per_month UNIQUE (client_id, report_month);


--
-- Name: ga4_traffic_sources unique_source_per_month; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_traffic_sources
    ADD CONSTRAINT unique_source_per_month UNIQUE (client_id, report_month, source_medium);


--
-- Name: idx_gsc_queries_client_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gsc_queries_client_month ON public.gsc_top_queries USING btree (client_id, report_month);


--
-- Name: client_google_ads_campaigns client_google_ads_campaigns_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_google_ads_campaigns
    ADD CONSTRAINT client_google_ads_campaigns_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_meta_ads_campaigns client_meta_ads_campaigns_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_meta_ads_campaigns
    ADD CONSTRAINT client_meta_ads_campaigns_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: ga4_countries ga4_countries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ga4_countries
    ADD CONSTRAINT ga4_countries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: google_ads_monthly_stats google_ads_monthly_stats_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_ads_monthly_stats
    ADD CONSTRAINT google_ads_monthly_stats_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: gsc_top_queries gsc_top_queries_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gsc_top_queries
    ADD CONSTRAINT gsc_top_queries_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: meta_actions meta_actions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meta_actions
    ADD CONSTRAINT meta_actions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: meta_campaigns meta_campaigns_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meta_campaigns
    ADD CONSTRAINT meta_campaigns_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: client_google_ads_campaigns; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.client_google_ads_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: client_meta_ads_campaigns; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.client_meta_ads_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: ga4_countries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ga4_countries ENABLE ROW LEVEL SECURITY;

--
-- Name: ga4_overview; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ga4_overview ENABLE ROW LEVEL SECURITY;

--
-- Name: ga4_top_pages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ga4_top_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: ga4_traffic_sources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ga4_traffic_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: google_ads_monthly_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.google_ads_monthly_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: meta_actions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.meta_actions ENABLE ROW LEVEL SECURITY;

--
-- Name: meta_campaigns; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: TABLE client_google_ads_campaigns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.client_google_ads_campaigns TO anon;
GRANT ALL ON TABLE public.client_google_ads_campaigns TO authenticated;
GRANT ALL ON TABLE public.client_google_ads_campaigns TO service_role;


--
-- Name: SEQUENCE client_google_ads_campaigns_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.client_google_ads_campaigns_id_seq TO anon;
GRANT ALL ON SEQUENCE public.client_google_ads_campaigns_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.client_google_ads_campaigns_id_seq TO service_role;


--
-- Name: TABLE client_meta_ads_campaigns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.client_meta_ads_campaigns TO anon;
GRANT ALL ON TABLE public.client_meta_ads_campaigns TO authenticated;
GRANT ALL ON TABLE public.client_meta_ads_campaigns TO service_role;


--
-- Name: SEQUENCE client_meta_ads_campaigns_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.client_meta_ads_campaigns_id_seq TO anon;
GRANT ALL ON SEQUENCE public.client_meta_ads_campaigns_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.client_meta_ads_campaigns_id_seq TO service_role;


--
-- Name: TABLE clients; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;


--
-- Name: TABLE ga4_countries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ga4_countries TO anon;
GRANT ALL ON TABLE public.ga4_countries TO authenticated;
GRANT ALL ON TABLE public.ga4_countries TO service_role;


--
-- Name: TABLE ga4_overview; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ga4_overview TO anon;
GRANT ALL ON TABLE public.ga4_overview TO authenticated;
GRANT ALL ON TABLE public.ga4_overview TO service_role;


--
-- Name: SEQUENCE ga4_overview_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.ga4_overview_id_seq TO anon;
GRANT ALL ON SEQUENCE public.ga4_overview_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.ga4_overview_id_seq TO service_role;


--
-- Name: TABLE ga4_top_pages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ga4_top_pages TO anon;
GRANT ALL ON TABLE public.ga4_top_pages TO authenticated;
GRANT ALL ON TABLE public.ga4_top_pages TO service_role;


--
-- Name: SEQUENCE ga4_top_pages_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.ga4_top_pages_id_seq TO anon;
GRANT ALL ON SEQUENCE public.ga4_top_pages_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.ga4_top_pages_id_seq TO service_role;


--
-- Name: TABLE ga4_traffic_sources; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ga4_traffic_sources TO anon;
GRANT ALL ON TABLE public.ga4_traffic_sources TO authenticated;
GRANT ALL ON TABLE public.ga4_traffic_sources TO service_role;


--
-- Name: SEQUENCE ga4_traffic_sources_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.ga4_traffic_sources_id_seq TO anon;
GRANT ALL ON SEQUENCE public.ga4_traffic_sources_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.ga4_traffic_sources_id_seq TO service_role;


--
-- Name: TABLE google_ads_monthly_stats; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.google_ads_monthly_stats TO anon;
GRANT ALL ON TABLE public.google_ads_monthly_stats TO authenticated;
GRANT ALL ON TABLE public.google_ads_monthly_stats TO service_role;


--
-- Name: TABLE meta_campaigns; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.meta_campaigns TO anon;
GRANT ALL ON TABLE public.meta_campaigns TO authenticated;
GRANT ALL ON TABLE public.meta_campaigns TO service_role;


--
-- Name: TABLE global_monthly_reporting; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.global_monthly_reporting TO anon;
GRANT ALL ON TABLE public.global_monthly_reporting TO authenticated;
GRANT ALL ON TABLE public.global_monthly_reporting TO service_role;


--
-- Name: SEQUENCE google_ads_monthly_stats_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.google_ads_monthly_stats_id_seq TO anon;
GRANT ALL ON SEQUENCE public.google_ads_monthly_stats_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.google_ads_monthly_stats_id_seq TO service_role;


--
-- Name: TABLE gsc_top_queries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.gsc_top_queries TO anon;
GRANT ALL ON TABLE public.gsc_top_queries TO authenticated;
GRANT ALL ON TABLE public.gsc_top_queries TO service_role;


--
-- Name: SEQUENCE gsc_top_queries_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.gsc_top_queries_id_seq TO anon;
GRANT ALL ON SEQUENCE public.gsc_top_queries_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.gsc_top_queries_id_seq TO service_role;


--
-- Name: TABLE meta_actions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.meta_actions TO anon;
GRANT ALL ON TABLE public.meta_actions TO authenticated;
GRANT ALL ON TABLE public.meta_actions TO service_role;


--
-- Name: SEQUENCE meta_actions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.meta_actions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.meta_actions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.meta_actions_id_seq TO service_role;


--
-- Name: SEQUENCE meta_campaigns_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.meta_campaigns_id_seq TO anon;
GRANT ALL ON SEQUENCE public.meta_campaigns_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.meta_campaigns_id_seq TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict ZkBdGgMAnxHHI5EgclQcq7JHyjhoOs3oLBjWybmwIpiMy8Wwu3fbtL8j5HiPRPr

