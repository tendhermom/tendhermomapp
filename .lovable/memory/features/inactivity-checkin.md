---
name: Inactivity Check-In Safety Net
description: Two-tier inactivity safety net — 24h gentle self check-in push, 48h SMS escalation to up to 2 emergency contacts
type: feature
---

## What it does
Two-tier silent safety net based on `profiles.last_active_at`:

1. **24h–47h inactive (Tier 1, self)**: A gentle in-app notification ("We miss you 💚, tap to check in") is inserted into `notifications` for the mum. Push delivery flows through OneSignal listeners on her device. Cooldown: ~20h between self pings.
2. **48h+ inactive (Tier 2, escalate)**: Sends a single SMS wellness check to up to 2 emergency contacts (primary first), framed as a wellness check, not medical diagnosis (WHO-safe). Cooldown: 5 days per contact.

Tier 2 SMS template:
> "{FirstName} hasn't opened TendherMom in {N} day(s). Can you please check on her? She may need support. — TendherMom"

## Architecture
- **Activity tracking**: `profiles.last_active_at` updated via `touch_last_active()` SECURITY DEFINER RPC. Called from `App.tsx` AuthListener on session restore, sign-in, and `visibilitychange` (foreground returns).
- **Edge function**: `supabase/functions/inactivity-checkin/index.ts` — service-role only. Pulls anyone inactive ≥ 24h, then branches:
  - <48h → insert into `notifications` (channel `self-push`)
  - ≥48h → fetch up to 2 SMS-enabled contacts, dispatch via Termii (DND channel) (channel `sms`)
- **Idempotency**: `inactivity_alerts` records every dispatch with `channel` (`self-push` | `sms`). Tier 1 cooldown = 20h per user; Tier 2 cooldown = 5 days per contact.
- **Schedule**: pg_cron `inactivity-checkin-hourly` runs at minute 15 every hour.
- **Caps**: max 200 users per cron tick, max 2 contacts per user.

## RLS
- `inactivity_alerts`: SELECT for owner (`user_id = auth.uid()`) and admins. INSERT only via service role.
- `notifications`: INSERT only via service role; user can SELECT/UPDATE/DELETE her own rows.
- `touch_last_active()`: GRANT EXECUTE TO authenticated; only updates the caller's own row.

## Onboarding capture
The Signup form captures phone (`+234XXXXXXXXXX`) alongside name/email/password. The phone is stored in `auth.users.raw_user_meta_data` and copied to `profiles.phone` by the `handle_new_user` trigger, so contacts (and future SMS to the mum herself) can use it without an extra onboarding step.
