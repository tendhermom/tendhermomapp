---
name: Scaling & Performance
description: Database indexes, rate limiting, image compression, query caching, public views for production scale
type: feature
---

## Database Indexes
All high-volume tables have composite indexes on common query patterns:
- community_posts: (channel, created_at DESC) WHERE is_hidden=false; (user_id, created_at DESC)
- post_comments: (post_id, created_at)
- post_likes: UNIQUE (post_id, user_id) — prevents duplicate likes
- reactions: (post_id)
- health_metrics: (user_id, recorded_at DESC)
- triage_sessions: (user_id, created_at DESC)
- notifications: partial (user_id, created_at DESC) WHERE read=false
- rate_limits: (user_id, action, created_at DESC)
- baby_shower_posts: (created_at DESC)
- referrals: (referrer_id, status)
- emergency_contacts: (user_id)
- user_roles: (user_id, role)

## Privacy-Safe Public Views
Cross-user reads MUST use these views, never the underlying tables:
- `public_profiles` — id, full_name, avatar_url, current_stage only (hides email, phone, lmp_date, due_date, plus_* subscription fields)
- `baby_shower_posts_public` — excludes account_number, account_name, bank_name (financial data is owner-only)

Used by communityStore.ts (post + comment author lookups), ModerationScreen (user names), BabyShowerScreen (public feed merged with owner-side bank data).

## RLS Hardening
- All mutation policies scoped to `authenticated` role (not `public`)
- profiles: SELECT only for owner or admin
- community_points: no direct INSERT/UPDATE — must go through award_community_points() SECURITY DEFINER
- Storage uploads to community-images and baby-shower-images require (storage.foldername(name))[1] = auth.uid()::text

## Edge Function Rate Limiting
- ai-chat: 20 requests / 10 minutes per user (via check_rate_limit)
- send-sos: free=1/month, premium=10/10min
- send-referral-sms: 10 invites / hour per user
- pg_cron job 'cleanup-rate-limits-hourly' runs cleanup_rate_limits() at minute 0 every hour

## Image Compression
Client-side compression via src/lib/imageCompression.ts before upload:
- Avatars: max 400px, 85% quality, target <200KB
- Community photos: max 1200px, 80% quality, target <500KB

## Query Caching
In-memory cache (src/lib/queryCache.ts) with TTL — profile lookups cached 5 minutes.

## Auth Hardening
- HIBP leaked-password protection: ENABLED
- Email auto-confirm: DISABLED (users must verify)
- Anonymous signups: DISABLED
