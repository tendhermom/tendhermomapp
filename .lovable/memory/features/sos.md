---
name: SOS Emergency Alerts
description: SOS dispatch via Termii, phone normalization, sender ID/route status, rate limits
type: feature
---

SOS alerts dispatch through the `send-sos` edge function (Termii v3 API, `https://v3.api.termii.com/api/sms/send`).

Rules:
- Termii rejects `+` prefixes and local `0...` formats — all numbers are normalized server-side to `234...` digits-only before sending (`normalizeNgPhone`).
- SMS tries the `dnd` route first, falls back once to `generic`; a contact is only counted as notified when Termii confirms acceptance.
- Failures return the real Termii rejection reason in the 502 `detail` field; the SOS screen shows it in the error toast.
- Free for everyone: abuse-guard rate limit 10 alerts / 10 min, max 5 contacts. Voice channel is marked unsupported. WhatsApp needs a Termii device configured (`from` must be the device name).

Account status (2026-08-22): Termii API key valid, balance ~₦2,800. Sender ID `TendherMom` had never been registered — approval requested via the sender-id API (Termii account manager to confirm). Termii also reported "Route not configured ... route=GENERIC" — SMS routes must be enabled on the workspace (dashboard or account manager) before delivery succeeds.
