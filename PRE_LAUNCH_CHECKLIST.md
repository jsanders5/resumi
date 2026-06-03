# Pre-Launch Checklist

## ✅ Done

- **Replaced LinkedIn scraper** — Adzuna (official API) and JSearch are now the primary sources. LinkedIn is no longer used.
- **Rate limiting** — Upstash Redis proxy enforces per-IP limits (5 parses / 10 searches / 20 card expands per hour). Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars.
- **Privacy Policy** — live at `/privacy`. Discloses use of Anthropic, Voyage AI, Adzuna, JSearch.
- **Terms of Service** — live at `/terms`. Covers acceptable use, AI disclaimer, no warranty.
- **Server-side file size enforcement** — 10 MB hard limit + file type check in parse-resume route.

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

### Authentication or CAPTCHA
Either require sign-in (NextAuth with Google/GitHub is fast to add) or add a CAPTCHA to the search form to block bots.

### Error Monitoring
Sentry catches production errors you'd otherwise never know about.

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
