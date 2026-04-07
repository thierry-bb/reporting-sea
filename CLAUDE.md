# Dashboard Reporting — Contexte Projet

## Vue d'ensemble
Dashboard interactif construit en **Next.js** pour visualiser et piloter des données stockées dans **Supabase**, alimentées par des workflows **n8n**.

Le backend (n8n + Supabase) est déjà opérationnel. Ce repo couvre uniquement la couche front-end / dashboard.

## Stack technique
- **Framework** : Next.js 14+ (App Router)
- **Langage** : JavaScript (pas TypeScript)
- **Styling** : CSS Modules (pas de Tailwind)
- **Data** : Supabase JS Client (`@supabase/supabase-js`)
- **Charts** : Recharts (léger, composable, React-native)
- **Déploiement** : Vercel via GitHub

## Architecture
```
dashboard-project/
├── CLAUDE.md                  # Ce fichier — contexte pour Claude Code
├── .env.local                 # Variables Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
├── .gitignore
├── package.json
├── next.config.mjs
├── jsconfig.json              # Alias @ → src/
│
├── src/
│   ├── app/
│   │   ├── layout.js          # Layout racine (sidebar + header)
│   │   ├── page.js            # Page d'accueil → redirect /dashboard
│   │   ├── globals.css        # Variables CSS, reset, tokens design
│   │   │
│   │   └── dashboard/
│   │       ├── page.js        # Vue principale — KPIs + graphiques
│   │       ├── page.module.css
│   │       ├── [slug]/        # Sous-pages dynamiques si besoin
│   │       │   └── page.js
│   │       └── settings/
│   │           └── page.js    # Config / filtres persistants
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.js
│   │   │   ├── Sidebar.module.css
│   │   │   ├── Header.js
│   │   │   └── Header.module.css
│   │   │
│   │   ├── dashboard/
│   │   │   ├── KpiCard.js         # Carte métrique individuelle
│   │   │   ├── KpiCard.module.css
│   │   │   ├── ChartContainer.js  # Wrapper responsive pour graphiques
│   │   │   ├── ChartContainer.module.css
│   │   │   ├── DataTable.js       # Tableau de données avec tri/filtre
│   │   │   └── DataTable.module.css
│   │   │
│   │   └── ui/
│   │       ├── Button.js
│   │       ├── Button.module.css
│   │       ├── Select.js
│   │       ├── Select.module.css
│   │       ├── Loader.js
│   │       └── Loader.module.css
│   │
│   ├── lib/
│   │   ├── supabase.js        # Client Supabase (singleton)
│   │   └── formatters.js      # Helpers : dates, nombres, devises
│   │
│   └── hooks/
│       ├── useSupabaseQuery.js    # Hook custom fetch + cache + error
│       └── useDateRange.js        # Hook filtre période
│
└── public/
    └── favicon.ico
```

## Conventions de code
- **Composants** : PascalCase, un fichier JS + un .module.css par composant
- **Fonctions / variables** : camelCase
- **CSS** : CSS Modules uniquement, variables dans globals.css
- **Imports** : utiliser l'alias `@/` pour `src/`
- **Pas de TypeScript** — JavaScript pur, JSDoc si besoin de documenter
- **Pas de `"use client"` inutile** — ne l'ajouter que quand le composant utilise des hooks ou des events

## Connexion Supabase
```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default supabase;
```

## Patterns clés
- **Data fetching** : Server Components par défaut, `useSupabaseQuery` pour les filtres dynamiques côté client
- **Realtime** : Supabase Realtime si besoin de live updates (n8n pousse des données en continu)
- **Filtres** : Période (7j / 30j / custom) partagée via URL search params
- **Responsive** : Mobile-first, sidebar collapsible sur petit écran

## Design tokens (globals.css)
```css
:root {
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-surface-hover: #242836;
  --color-border: #2a2e3a;
  --color-text: #e4e4e7;
  --color-text-muted: #71717a;
  --color-accent: #6366f1;
  --color-accent-hover: #818cf8;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

## Ce que n8n alimente dans Supabase

### Table centrale
- `clients` — liste des clients avec configs (target_cpa, max_cpa, target_ctr, min_ctr, min_budget pour Google/Meta/LinkedIn, IDs plateformes, logo_url, strategie)

### Google Ads
- `google_ads_monthly_stats` — stats mensuelles par campagne (client_id, report_month, campaign_id, campaign_name, advertising_channel_type, impressions, clicks, conversions, cost_micros, cost_actual, ctr)
- `client_google_ads_campaigns` — mapping client ↔ campaign_id Google (client_id, google_ads_campaign_id, campaign_name)

### Meta Ads
- `meta_campaigns` — stats mensuelles par campagne (client_id, report_month, campaign_id, campaign_name, spend, impressions, clicks, reach, frequency, cpc, cpm, cpp, ctr_total, inline_link_clicks, thru_plays, page_likes, purchase_count, purchase_value)
- `meta_actions` — actions détaillées par campagne (campaign_id, client_id, report_month, action_type, action_value)
- `client_meta_ads_campaigns` — mapping client ↔ campaign_id Meta (client_id, meta_campaign_id, campaign_name)

### GA4
- `ga4_overview` — vue mensuelle (client_id, report_month, sessions, engaged_sessions, engagement_rate, total_users, new_users)
- `ga4_traffic_sources` — sources de trafic (client_id, report_month, source_medium, users)
- `ga4_top_pages` — top pages (client_id, report_month, rank, page_url, page_views)
- `ga4_countries` — top pays (client_id, report_month, rank, country, sessions)

### Google Search Console
- `gsc_top_queries` — top requêtes (client_id, report_month, rank, query, clicks, impressions, ctr, position)

### Vue agrégée (SQL View)
- `global_monthly_reporting` — consolide Meta + Google spend par client/mois (client_id, report_month, meta_spend, google_spend, total_ads_spend)

## Commandes
```bash
npm run dev      # Dev local → http://localhost:3000
npm run build    # Build production
npm run lint     # ESLint
```

## Notes pour Claude Code
- Toujours lire ce fichier en premier pour comprendre le contexte
- Proposer des composants réutilisables plutôt que du code dupliqué
- Privilégier la lisibilité au clever code
- Garder les requêtes Supabase dans les Server Components quand possible
- Nommer les branches de façon descriptive : `feat/kpi-cards`, `fix/chart-responsive`
