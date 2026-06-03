# Pre-Launch Checklist

## ✅ Done

- **Replaced LinkedIn scraper** — Adzuna (official API) + optional JSearch. Removed deprecated LinkedIn scraper.
- **Rate limiting** — Upstash Redis proxy enforces per-IP limits (50 parses / 100 searches / 200 card expands per hour). Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars.
- **Privacy Policy** — live at `/privacy`. Discloses use of Anthropic, Voyage AI, Adzuna, JSearch.
- **Terms of Service** — live at `/terms`. Covers acceptable use, AI disclaimer, no warranty.
- **Server-side file size enforcement** — 10 MB hard limit + file type check in parse-resume route.
- **Cloudflare Turnstile CAPTCHA** — blocks bot searches. One-time verification per session. Requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` env vars.
- **Logo & favicon** — indigo-to-violet gradient **R** mark. Auto-generates 32×32 favicon and 180×180 Apple icon.
- **Buy Me a Coffee widget** — floating button in bottom-right (jsanders) + footer link.
- **Search progress bar** — time-aware progress indicator for 20–30s searches with stage labels (Job boards → Ranking → AI scoring → Done).
- **Sentry error monitoring** — auto-captures client and server errors. Routed through your server to bypass ad blockers.

---

## 🚨 Must-do before launch (manual steps)

### Cost Alerts
Set spending limits and alerts in each API dashboard before traffic hits:

| Service | Dashboard | What to set |
|---|---|---|
| Anthropic | console.anthropic.com → Settings → Limits | Monthly spend limit + email alert |
| Voyage AI | dash.voyageai.com | Usage alert |
| RapidAPI (JSearch) | rapidapi.com → My Apps | Overage protection |
| Adzuna | developer.adzuna.com | Monitor daily call count |
| Upstash | console.upstash.com | Bandwidth alert |

---

## ⚠️ Should have before launch

### Mobile Responsiveness
The current layout was built desktop-first. Test on a phone before going public.

### GDPR / Cookie Compliance
If serving EU users, you need a cookie banner. The privacy policy is in place but a consent banner may be required depending on jurisdiction.

---

## 📋 Nice to have post-launch

- User accounts (save resumes, search history, bookmarked jobs)
- Analytics (Vercel Analytics is built-in and privacy-friendly)
- Caching job results so repeat searches for the same query don't re-hit APIs
- A feedback button
- Re-enable Google Drive resume import (component already built)
