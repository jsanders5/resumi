# Agent-Specific Guidance

## Next.js 15 App Router
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### Key Points for Resumio-AI
- **App Router (not Pages Router):** All routes in `app/` directory. Use `layout.tsx` for shared UI.
- **Server Components by default:** Use `'use client'` only for interactive components (forms, state, event listeners).
- **Metadata API:** Use `export const metadata: Metadata = { ... }` in layout.tsx (not `<Head>`).
- **API Routes:** Create in `app/api/*/route.ts` with POST/GET handlers.
- **Streaming & SearchProgress:** SearchProgress component uses fake time-based progress (not actual request tracking).

### Resumio-AI Patterns
- **Client-only logic:** Main page (upload/search/results flow), JobCard expansion, LocationInput autocomplete.
- **Server API routes:** `/api/parse-resume`, `/api/search-jobs`, `/api/job-recs` handle Claude calls and job scraping.
- **Middleware:** `proxy.ts` provides rate-limiting middleware (wraps fetch requests, checks Redis).
- **Type safety:** Use `@/lib/types.ts` for Job, ScoredJob, JobDetails, ScoreBreakdown.

## PDF Parsing
- **pdf-parse v2:** Uses class-based API, not function-based.
  ```typescript
  // ✓ Correct
  const parsed = await new PDFParse({ data: Uint8Array }).getText();
  
  // ✗ Wrong (old v1 API)
  const parsed = await pdfParse(buffer);
  ```

## Claude API Usage
- **Resume caching:** Always use `cache_control: { type: 'ephemeral' }` on system prompt containing resume text.
- **Model selection:**
  - Haiku: Fast scoring, profile extraction, portfolio recs (lower cost)
  - Sonnet: Complex analysis, detailed breakdowns (if needed)
- **JSON parsing:** Always include `extractJson()` helper to strip markdown fences from Claude responses.
- **Max tokens:** Set conservatively (e.g., 2048 for scoring, 1024 for recs) to avoid truncation.

## Voyage AI Embeddings
- **No SDK:** Use direct HTTP fetch to `https://api.voyageai.com/v1/embeddings`.
- **Retry logic:** Exponential backoff (1s → 2s → 4s) on 429, then fail gracefully.
- **Batch embedding:** `embedBatch()` for multiple texts, but watch rate limits on high volumes.
- **Similarity:** Use cosine similarity (`dot(a,b) / (|a| * |b|)`) for ranking.

## Adzuna API
- **Endpoint:** `https://api.adzuna.com/v1/api/jobs/us/search/1`
- **Auth:** app_id and app_key in query params (not headers).
- **Filtering:** Always set `max_days_old=14` to avoid stale postings.
- **Location handling:** Adzuna doesn't recognize "remote"/"hybrid" as location filters. Instead, append to job title: `"Software Engineer remote"`.
- **Results:** Returns ~10 jobs per query with salary_min/max.

## Turnstile CAPTCHA
- **Only if enabled:** Check `NEXT_PUBLIC_TURNSTILE_SITE_KEY` before rendering widget.
- **Verification:** POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with secret key and response token.
- **Reset on "Start over":** Clear `turnstileToken` and `turnstileVerified` state.

## Rate Limiting (Upstash)
- **Middleware:** `proxy.ts` intercepts fetch calls to `/api/parse-resume`, `/api/search-jobs`, `/api/job-recs`.
- **Tracking:** Per IP (x-forwarded-for header), sliding window (1 hour).
- **Limits:**
  - 50 parse-resume/hr (resume uploads)
  - 100 search-jobs/hr (job searches)
  - 200 job-recs/hr (card expansions)
- **Response:** 429 with `Retry-After` header.

## Error Handling & Graceful Degradation
- **Voyage 429:** Skip semantic ranking, take first 10 jobs, show toast + badge. Don't fail hard.
- **Missing embeddings:** Still score jobs, just without ranking.
- **API timeouts:** Catch errors, show user-friendly messages (not raw errors).

## Styling & Components
- **Colors:** Slate-950 (bg), Indigo-500/600 (primary), Emerald (success), Amber (warning), Rose (error).
- **Grid:** Job cards use `grid gap-4 sm:grid-cols-2` (2-column on desktop, 1 on mobile).
- **Icons:** lucide-react (not GitHub from lucide — use GitBranch instead).
- **Accessibility:** All interactive elements have proper labels, keyboard navigation works.

## Common Gotchas
1. **File input value clearing:** Must clear `fileInputRef.current.value = ''` after upload, or second upload won't trigger onChange.
2. **Resume profile missing:** Always pass `resumeProfile` to Claude scoring, or recommendations lack context.
3. **Turnstile token stale:** Reset token when navigating back to search, or next search fails.
4. **Max tokens too low:** JSON responses get truncated mid-string. Use 2048+ for multi-job scoring.
5. **Voyage rate limiting:** Embed at upload time (once), not on every search.
6. **Remote/Hybrid locations:** Must append to job title, not use as location filter.

## Debugging
- **Console logs:** Added to file input onChange to track file selection.
- **Network tab:** Check for 429s from Voyage, 400s from Turnstile, 413s from file size.
- **Sentry:** Error monitoring is set up in layout.tsx (jsanders project).
- **Rate limit headers:** Look for `X-RateLimit-Remaining` headers in responses.

## Deployment
- **Vercel:** Connected to GitHub repo, auto-deploys on push.
- **Environment variables:** Set in Vercel dashboard:
  - `ANTHROPIC_API_KEY`
  - `VOYAGE_API_KEY`
  - `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`
  - `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - `JSEARCH_API_KEY` (optional, disabled)
- **Build:** `npm run build` locally before pushing. Check for TS errors.
- **Domain:** myresumio.app (update DNS at registrar).
