---
name: Scaling & Performance
description: Database indexes, rate limiting, image compression, query caching for production scale
type: feature
---

## Database Indexes
All high-volume tables have composite indexes on common query patterns:
- community_posts: (channel, created_at DESC) with partial index on is_hidden=false
- post_comments: (post_id, created_at)
- post_likes: unique (post_id, user_id) — prevents duplicate likes
- health_metrics: (user_id, recorded_at DESC)
- notifications: partial index on unread only
- rate_limits: (user_id, action, created_at DESC)

## Edge Function Rate Limiting
- ai-chat: 20 requests / 10 minutes per user (via check_rate_limit)
- send-sos: free=1/month, premium=10/10min (already had this)
- send-referral-sms: 10 invites / hour per user

## Image Compression
Client-side compression via src/lib/imageCompression.ts before upload:
- Avatars: max 400px, 85% quality, target <200KB
- Community photos: max 1200px, 80% quality, target <500KB

## Query Caching
In-memory cache (src/lib/queryCache.ts) with TTL:
- Profile lookups cached 5 minutes to avoid N+1 on community feeds
- Stale-while-revalidate pattern available

## Infrastructure (requires user action)
- Upgrade Lovable Cloud instance size for more DB connections
- Load testing should be done externally with k6/Artillery
