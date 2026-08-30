---
name: SOS Emergency Alerts
description: SOS dispatch via Termii, phone normalization, sender ID/route status, rate limits
type: feature
---

SOS alerts dispatch through the `send-sos` edge function (Termii v3 API, `https://v3.api.termii.com/api/sms/send`).

Rules:
- Termii rejects `+` prefixes and local `0...` formats — all numbers are normalized server-side to `234...` digits-only before sending (`normalizeNgPhone`).
- A send only counts as delivered when Termii returns a `message_id`; the alert log records sender, route and message id.
- Sender/route ladder: `TendherMom`/dnd → `TendherMom`/generic → `N-Alert`/dnd → `N-Alert`/generic. First accepted wins.
- Free for everyone: abuse-guard rate limit 10 alerts / 10 min, max 5 contacts. Voice unsupported; WhatsApp needs a Termii device.
- The client no longer writes its own `emergency_alerts` row — the edge function is the single source of truth.
- `termii-status` edge function (admin-only) returns live balance, sender IDs and recent message delivery statuses.

Account status (verified 2026-08-30): sender ID `TendherMom` status **active**, balance ~₦2,720. Recent messages send on the `generic` route with statuses Sent/Delivered; number 2349114577624 is repeatedly **Rejected** by its carrier (recipient-side/DND issue, not app code). The dnd route is not enabled on the workspace.
