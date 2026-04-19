# Project Memory

## Core
- Strict 390px fixed-width layout (max 430px desktop). Safe-area bottom padding for modals.
- Light mode only. Forest Green (#2D6A4F) & Coral (#E8735A).
- Apple-style premium UI. No generic borders, emojis, or visible scrollbars.
- Stack: React 18, Vite, Tailwind, Supabase, Despia (native wrapper), Ionic Icons.
- 5-tab bottom navigation (Home, Triage, SOS, Community, Profile). No side drawers.
- No geographic branding. Doctor appointments are decommissioned (use Health Hubs).

## Memories
- [Interactions](mem://style/interactions) — iOS native feel, 0.95 scale-on-press, spring animations
- [Layout Constraints](mem://architecture/layout-constraints) — 390px width, safe-area-aware padding rules
- [Visual Identity](mem://style/visual-identity) — Apple-style typography, colors, shadows, and Light Mode enforcement
- [Tech Stack](mem://architecture/tech-stack) — React, Vite, Supabase, Despia, Ionic Icons, Sentry
- [Community](mem://features/community) — Gated Facebook-style grid, 5MB photo limit, isolated feeds
- [Database Security](mem://architecture/database-security) — Supabase RLS, pg_cron hourly cleanup, auth triggers
- [Production Hardening](mem://architecture/production-hardening) — Sentry tracing, Termii SMS DND channel, Despia OneSignal
- [Mobile Native Integration](mem://architecture/mobile-native-integration) — Despia-native, Identity Vault, Screen Shield, visibility locks
- [Apple Compliance](mem://architecture/compliance-apple) — Account deletion wipe, ATT prompts, in-app policies
- [Clinical Triage](mem://features/clinical-triage) — 16 categories, 25 pathways, segmented progress, A/B/C options
- [Splash Screen](mem://style/splash-screen) — Staggered reveal, radial glow, 1.3s gradient loader
- [Antenatal Records](mem://features/antenatal-records) — Weeks 4-40 timeline, no coral highlights for markers
- [Strategic Pivot](mem://project/strategic-pivot) — Doctor booking decommissioned in favor of Health Hubs directory
- [Navigation Structure](mem://navigation/structure) — Clean 5-tab bottom bar, dashboard organization
- [Top Bar](mem://navigation/top-bar) — Brand center, AI (coral) and Notifications right, no left toggles
- [SOS](mem://features/sos) — Tiered limits, Termii SMS dispatch, clean UI without warning signs
- [Baby Shower](mem://features/baby-shower) — Premium gated horizontal carousel, cash gifts
- [Gamification](mem://features/gamification) — 5-level colored progression system, referral credits
- [Health Tracker](mem://features/health-tracker) — Weeks 4-40 logging, preeclampsia/systolic >140 warnings
- [AI Chat](mem://features/ai-chat) — TopBar coral icon, 2 questions/week Basic vs Unlimited Premium
- [Premium Plan](mem://features/premium-plan) — Weekly/Monthly/Yearly pricing, PremiumGate unified UI
- [Referral System](mem://features/referral-system) — 5 premium referrals trigger 60-day premium reward
- [PWA Offline](mem://architecture/pwa-offline) — VitePWA CacheFirst static, NetworkFirst Supabase
- [Onboarding Intro](mem://features/onboarding-intro) — 3-screen parallax flow, no geographic branding
- [Health Hubs](mem://features/health-hubs) — Google Maps geolocation directory for 4 medical categories
- [User Roles](mem://architecture/user-roles) — Mum and Admin only. Health Expert decommissioned.
- [Onboarding Flow](mem://auth/onboarding-flow) — Splash to Intro to Signup. Mandatory LMP entry for new Mums.
- [Scaling & Performance](mem://architecture/scaling) — DB indexes, edge function rate limits, image compression, query caching
- [Inactivity Check-In](mem://features/inactivity-checkin) — 48h silent SMS wellness check to up to 2 emergency contacts via hourly cron
- [Observability](mem://architecture/observability) — Sentry breadcrumbs + capture across ai-chat, sos, referral-sms, support-ticket
