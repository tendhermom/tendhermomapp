---
name: Observability
description: Sentry breadcrumbs and exception capture across critical async edge function flows
type: feature
---

## Sentry coverage
All four async edge function calls in the client capture exceptions with feature tags and add breadcrumbs before dispatch:

| Flow | File | Breadcrumb category | Capture tags |
|------|------|---------------------|--------------|
| AI Chat (streaming SSE) | `src/screens/AIChatScreen.tsx` | `ai-chat` | `feature: ai-chat` |
| SOS dispatch | `src/screens/SOSScreen.tsx` | `sos` (warning level) | `feature: sos`, `severity: critical` |
| Referral SMS | `src/screens/ReferralScreen.tsx` | `referral` | `feature: referral-sms` |
| Support ticket | `src/screens/HelpSupportScreen.tsx` | `support` | `feature: support-ticket` |

Sentry config: 10% browser tracing, 5% session replay, 100% replay on errors. Browser-extension errors filtered out.
Edge functions log via `console.error` (Supabase function logs); they do not run Sentry SDK.
