# Resumio-AI Project Instructions

## Overview
Resumio-AI is a Next.js 15 web application that helps job seekers find compatible roles and get personalized portfolio project recommendations. Users upload resumes, search live job listings, receive AI-powered match scores, and get GitHub project ideas tailored to each job.

**Domain:** https://myresumio.app

## Architecture & Tech Stack
- **Frontend:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **AI/ML:** Claude API (Haiku for fast ops, Sonnet for complex), Voyage AI embeddings
- **Job Sources:** Adzuna API (official, max_days_old=14), optional JSearch (disabled due to cost)
- **Infrastructure:** Upstash Redis (rate limiting), Cloudflare Turnstile (CAPTCHA), Vercel (hosting)
- **Data Parsing:** pdf-parse v2 (class-based API: `new PDFParse({data: Uint8Array})`)

## Key Constraints & Decisions

### API & Rate Limiting
- **Claude:** Haiku for scoring (fast), Sonnet for complex analysis. Use prompt caching with `cache_control: ephemeral` for resume text.
- **Voyage AI:** Uses direct HTTP fetch (SDK had ESM issues). Implements exponential backoff on 429 (1s/2s/4s retry). Falls back to graceful degradation (skip ranking, show toast + badge).
- **Adzuna:** Official API with app_id/app_key. Always use `max_days_old=14` to filter stale postings. Append "remote"/"hybrid" to job titles for location-based searches (API doesn't recognize these as location filters).
- **Upstash Redis:** Per-IP rate limits: 50 parse-resume/hr, 100 search-jobs/hr, 200 job-recs/hr. Returns 429 with retry headers.

### Resume & Embedding Workflow
- Resume embedding happens at **upload time** (not on every search) to avoid Voyage rate limiting.
- Resume text, embedding, and profile (seniority/skills/targetRoles/industries) are cached in browser state.
- Profile is extracted via `extractResumeProfile()` and passed to Claude scoring for context.
- Resume text is sent to Claude with ephemeral cache_control for cost savings.

### Job Scoring & Performance
- **Initial search:** Fast scoring via `scoreJobsFast()` (Haiku) returns: score, breakdown (skills/experience/domain/requirements), matchReason, matchedSkills, strengths, gaps, missingSkills.
- **Lazy expand:** Portfolio projects loaded on first card expand via `getJobDetails()` to reduce initial latency.
- **Semantic ranking:** Embed all jobs, rank by cosine similarity to resume embedding, take top 10, then score. If Voyage fails: skip ranking, take first 10, show status badge + toast.

### UI/UX Patterns
- **Three-phase flow:** Upload → Search → Results. Logo/header is a button that calls `reset()` (clears all state).
- **Results hint:** "Click any card to see your score analysis and recommended project ideas to add to your portfolio." (prominent, left-justified).
- **Job cards:** Expandable with "View/Hide Analysis" button. Two tabs: "Score Analysis" (default, shows breakdown bars + matched skills) and "Project Ideas" (lazy-loaded recommendations).
- **Ranking feedback:** Toast notification (amber, 3s auto-dismiss) + persistent badge ("AI-ranked" or "default order") when ranking skipped.
- **File input:** Always in DOM (not in phase conditional) so "Change resume" button works from any phase. Input value cleared after each upload/error.

### Mobile & SEO
- **Responsive:** Grid layout `sm:grid-cols-2` for job cards on desktop, single column on mobile.
- **SEO metadata:** Title, description, keywords, OpenGraph tags (social sharing), Twitter card, JSON-LD WebApplication schema.
- **OG image:** Auto-generated `/og-image.png` (1200x630) for social previews.

## What NOT to Do
- **LinkedIn scraper:** Removed due to ToS violations. Don't re-add it.
- **JSearch:** Disabled by default (too expensive at $25/mo). Only enable if user explicitly requests via env var.
- **Skipping rankings silently:** Always provide feedback (badge + toast) when ranking degrades.
- **Storing resume server-side:** Resume text/embedding stay in-session or browser only.
- **Generic file icons:** Removed LinkedIn/JSearch source badges from job cards.
- **Ambiguous portfolio recs:** Label as "AI-recommended projects to build and showcase" (not just portfolio projects).
- **Month-long projects:** Portfolio projects must be 3-7 days completable, not months-long endeavors.

## Performance Targets
- Resume upload (parse + embed + profile): ~7-8 seconds
- Job search (search + rank + score): ~20-30 seconds
- Card expand (lazy load project recs): ~2-3 seconds

## Testing Checklist Before Launch
- [x] Resume upload (PDF + .txt)
- [x] Multi-title comma-separated search
- [x] Remote/Hybrid location handling
- [x] Location autocomplete with specific cities
- [x] Turnstile CAPTCHA verification
- [x] Rate limiting (per-IP, multiple endpoints)
- [x] Voyage 429 graceful degradation with visible feedback
- [x] Score breakdown consistency (initial vs expanded)
- [x] Portfolio project recommendations (3 projects, 3-7 days scope)
- [x] Privacy Policy & Terms of Service pages
- [x] SEO metadata & schema markup
- [ ] Mobile responsiveness (manual testing)
- [ ] GDPR/cookie compliance (if serving EU users)

## Decision Framework

When evaluating requests, consider these perspectives before responding:

### 1. Product & User Value
- **Is this a real user problem?** (not a solution looking for a problem)
- **Does it align with Resumio-AI's core mission?** (job matching + portfolio recommendations)
- **What's the user benefit?** (faster search, better scores, clearer recommendations)
- **What's the cost to users?** (complexity, time, privacy, rate limits)
- **Priority:** Core features > nice-to-haves > optimization > brand

### 2. Technical Feasibility & Debt
- **Can we build it with current stack?** (Claude, Voyage, Adzuna, Next.js)
- **Will it increase API costs significantly?** (Claude calls, Voyage embeddings, Redis)
- **Does it add technical debt?** (complexity, maintenance burden, dependencies)
- **Can we ship it in a reasonable time?** (MVP vs gold-plating)
- **Priority:** Low-cost + low-debt wins > expensive features > deep refactors (unless blocking)

### 3. Design & User Experience
- **Is it intuitive?** (users understand without explanation)
- **Does it follow existing patterns?** (consistent with current UI)
- **Is it visually clean?** (not cluttered, maintains design system)
- **Works on mobile?** (responsive, touch-friendly)
- **Accessibility:** Keyboard nav, screen readers, color contrast
- **Priority:** Clarity > visual polish > animation

### 4. Architecture & Scalability
- **Does it fit the current architecture?** (client upload → search → results flow)
- **Will it scale as usage grows?** (rate limits, caching, parallelization)
- **Does it create new failure points?** (dependencies on external APIs, timeouts)
- **Can we monitor it?** (errors, performance, cost)
- **Priority:** Simple solutions > elegant but complex

### 5. Security & Privacy
- **Does it leak user data?** (resume storage, IP tracking, third-party sharing)
- **Are credentials handled safely?** (env vars, no hardcoding, API secrets)
- **Can it be abused?** (rate limiting, CAPTCHA, input validation)
- **Is it compliant?** (Privacy Policy, Terms, GDPR if needed)
- **Priority:** Security non-negotiable > privacy > compliance

### Decision Template

When you ask a question, I'll evaluate it like this:

**Your request:** "Add feature X / fix bug Y / improve Z"

**Product angle:** Why this matters to users  
**Technical angle:** How we build it, cost-benefit  
**Design angle:** How it looks, feels, integrates  
**Architecture angle:** Does it fit cleanly, scale well  
**Security angle:** Any risks or gotchas  

**Recommendation:** Prioritized approach (what to do first, what to defer)

### Example
**Request:** "Add dark mode toggle to the app"

- **Product:** Nice-to-have, not critical (Tailwind already dark by default)
- **Technical:** Low cost, simple localStorage toggle
- **Design:** Adds UI clutter (another button in header)
- **Architecture:** Clean feature, no scaling issues
- **Security:** No security risk

**Recommendation:** Low priority. If you want it, it's straightforward, but focus on [core features first].

---

See AGENTS.md for Next.js specific guidance.
