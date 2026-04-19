---
name: Inactivity Check-In Safety Net
description: 48-hour silent wellness check that SMSes up to 2 emergency contacts when a mum stops opening the app
type: feature
---

## What it does
If a mum hasn't opened TendherMom in 48+ hours, an hourly background job sends a single SMS wellness check to up to 2 of her emergency contacts (primary first). Framed as a wellness check, never medical diagnosis (WHO-safe).

Message template:
> "{FirstName} hasn't opened TendherMom in {N} day(s). Can you please check on her? She may need support. — TendherMom"

## Architecture
- **Activity tracking**: `profiles.last_active_at` updated via `touch_last_active()` SECURITY DEFINER RPC. Called from `App.tsx` AuthListener on session restore, sign-in, and `visibilitychange` (foreground returns).
- **Edge function**: `supabase/functions/inactivity-checkin/index.ts` — service-role only, scans `profiles WHERE last_active_at < now() - 48h`, fetches up to 2 SMS-enabled contacts (primary first), dispatches via Termii (DND channel).
- **Idempotency**: `inactivity_alerts` table records each dispatch (`user_id`, `contact_id`, `inactive_hours`, `status`, `error`). Function skips contacts already alerted in the past 5 days for the same user.
- **Schedule**: pg_cron `inactivity-checkin-hourly` runs at minute 15 every hour.
- **Caps**: max 200 users per cron tick, max 2 contacts per user, 5-day cooldown per contact.

## RLS
- `inactivity_alerts`: SELECT for owner (`user_id = auth.uid()`) and admins. INSERT only via service role (no public/authenticated insert policy).
- `touch_last_active()`: GRANT EXECUTE TO authenticated; only updates the caller's own row.
