# Feature: Trending Skills Explorer

**Status**: DEFER & REDESIGN  
**Date Evaluated**: 2026-06-05  
**Evaluation Method**: Multi-angle review (Product, Technical, Design, Architecture, Security)

## User Story

> "No resume handy? Enter your desired job title and we will tell you what skills are currently trending"

## Problem Statement

- **Landing page traffic**: Decent volume of visitors arriving via organic search
- **Conversion problem**: High bounce rate; users don't upload resume or search jobs
- **Root cause**: Users don't see value before committing to upload
- **Goal**: Demonstrate product value upfront to increase conversion to core feature (resume matching + portfolio recommendations)

## Proposed Solution (Initial Concept)

1. Add a new page accessible from landing page: "Explore Trending Skills"
2. User enters job title (e.g., "Data Scientist", "Backend Engineer")
3. System shows trending skills for that role (extracted from Adzuna job data)
4. CTA: "See how you match" → prompts resume upload

## Multi-Angle Evaluation

### 1. Product Perspective

**Assessment**: Tactically sound but strategically risky. Solves landing page friction but may inadvertently satisfy the "show value" need without pushing toward the real differentiator—AI scoring and portfolio recommendations.

**Key Risks**:
- Converts to wrong outcome: Users get trending skills data, bookmark it, never upload
- Cannibalizes the value prop: Becomes market research tool instead of personalized matching
- No user data collection: Can't track who's interested or personalize follow-up
- Commoditizes differentiator: LinkedIn Salary, Blind, and others already show trending skills

**Key Benefits**:
- Reduces friction moment for skeptical users
- Potential SEO benefit ("Data Scientist trending skills 2026")
- Soft landing without commitment

**Verdict**: ❌ **DEFER**  
*Addressing landing page friction without showing personalized value risks converting users away from the core product.*

---

### 2. Technical Perspective

**Assessment**: Build complexity is low but operational cost is non-trivial. Reuses existing Adzuna scraping infrastructure, but caching strategy is critical.

**Key Risks**:
- Unbounded API costs without caching (100-300 Adzuna calls/day for popular titles)
- Data freshness: Adzuna data is 14 days delayed; "trending" is stale
- Could add Claude costs if using AI to synthesize/contextualize (not worth it for free users)
- No resumeEmbedding optimization; each query independent

**Key Benefits**:
- Reuses existing infrastructure (no new APIs or contracts)
- Lightweight backend if just aggregating Adzuna results
- Highly cacheable (Redis, 24-48hr TTL)
- No Voyage embeddings needed; simpler than core flow

**Implementation Cost**: ~2-3 days (with caching)  
**Operational Cost**: Minimal if cached; 100+ requests/day without caching

**Verdict**: ✓ **BUILD** (with aggressive caching)  
*Low technical complexity IF you implement Redis caching (24-48hr TTL) and skip Claude analysis.*

---

### 3. Design Perspective

**Assessment**: Current 3-phase flow (upload → search → results) is clean and linear. Adding a 4th pre-upload page without explicit CTA creates a UX fork—users can go down either path with equal visibility, diluting the mental model.

**Key Risks**:
- Navigation ambiguity: "Try Trending Skills OR Upload Resume" splits users
- Abandons step indicator: Your step progression (1/3 → 2/3 → 3/3) is powerful; explorer sits outside it
- Flow fragmentation: If user explores skills then uploads, they hit search form, not upload—context lost
- Mobile unfriendly: Another page = more scrolling, more decision points on small screens

**Key Benefits**:
- Lowers cognitive load on landing page
- Visually separates concerns

**Verdict**: 🔄 **REDESIGN**  
*Don't make it a separate page. Integrate as a pre-upload micro-feature instead.*

**Better Design**:
1. Add collapsible "Explore Trends First" section **above** the upload form on homepage
2. Every skill card has a "See how you match" CTA that pre-fills job title and prompts upload
3. Show mini profile preview ("Upload to see your match against these roles") to hint at core feature
4. Keeps linear flow while reducing friction

---

### 4. Architecture Perspective

**Assessment**: Architecturally sound but introduces a new API pattern. Your core flow is authenticated and user-specific; this is public and cacheable. Over time, this divergence complicates operations.

**Key Risks**:
- Two API patterns: Core (authenticated, unique per user) vs. Trending Skills (public, cached, stateless)
- Database schema creep: If you want analytics on skill exploration, new schema/migrations required
- Rate limiting misalignment: Current `proxy.ts` designed for authenticated requests; needs separate bucket
- Monitoring fragmentation: Separate dashboards for trending-skills API vs. search-jobs API

**Key Benefits**:
- Stateless and infinitely scalable (no user session, no database writes)
- Easy to deprecate if doesn't drive conversions
- Reuses data pipeline (no new scrapers)

**Implementation**: Single endpoint (`/api/trending-skills?title=Data+Scientist`) that aggregates Adzuna results in-memory, caches to Redis, returns JSON

**Verdict**: ✓ **BUILD** (as pure aggregation)  
*Keep it minimal and stateless. Add to proxy.ts rate-limiter as separate bucket (100 req/min for public endpoints).*

---

### 5. Security Perspective

**Assessment**: Few new security concerns since you're not handling PII. Unauthenticated endpoint opens minor attack surface; mitigated by strict input validation and rate limiting.

**Key Risks**:
- Input injection: Job titles passed as query params need strict validation
- Scraping abuse: Malicious actors could bulk-scrape all trending skills for all titles
- Adzuna ToS: Verify their API allows republishing aggregated job data

**Key Benefits**:
- No new PII exposure (unlike core flow with resumes)
- Public data (job titles/skills already public on job boards)
- Stateless (no sessions, cookies, or auth tokens to leak)

**Mitigation**:
1. Validate job titles: Reject > 100 chars or non-alphanumeric; whitelist common titles
2. Rate-limit strictly: 1000 req/day per IP, 50 req/min per IP
3. Verify Adzuna ToS before republishing aggregated data
4. Log all requests for abuse detection

**Verdict**: ✓ **BUILD** (with input validation and strict rate limits)  
*Security risk is minimal if properly validated.*

---

## Overall Verdict: DEFER & REDESIGN

| Angle | Verdict | Key Point |
|-------|---------|-----------|
| **Product** | ❌ DEFER | Converts to wrong outcome; doesn't drive resume uploads |
| **Technical** | ✓ BUILD | Low complexity with caching; reuses infrastructure |
| **Design** | 🔄 REDESIGN | Don't make separate page; integrate into landing page as micro-feature |
| **Architecture** | ✓ BUILD | Stateless, cacheable, easy to deprecate if needed |
| **Security** | ✓ BUILD | Low risk with input validation and rate limiting |

---

## Honest Recommendation

**This is a good idea in principle but poorly scoped.**

The real problem: Users don't see **their personalized value** before uploading.  
The wrong solution: Show them generic market data (trending skills).  
The right solution: Show them **their personalized match** to dream jobs.

### Recommended Path Forward

**Phase 1: Test Micro-Feature (No New Page)**
1. Add 3 trending skills cards to the landing page showing "Currently trending for Data Scientists: Python, SQL, Machine Learning"
2. Direct CTA: "See how YOUR skills match → Upload Resume"
3. Measure conversion lift from this micro-feature
4. **Cost**: ~1 day development

**Phase 2: Full Explorer Page (Only if Phase 1 Works)**
- If micro-feature drives upload conversion, invest in full "Trending Skills Explorer" page
- Build as described in technical/architecture sections
- **Cost**: ~2-3 days development

**Phase 3: Ongoing Optimization**
- Track which job titles drive conversions
- A/B test different CTAs ("See how you match" vs "Explore opportunities")
- Consider adding sample matching score to landing page (fake resume showing "You match 72% of Data Scientist roles")

---

## Next Steps

- [ ] Discuss with team: Is the micro-feature approach better than full page?
- [ ] If yes: Design landing page iteration with trending skills cards
- [ ] Implement Phase 1 (micro-feature) and measure conversion lift
- [ ] Decide on Phase 2 based on Phase 1 results
- [ ] If building: Implement with Redis caching, strict input validation, rate limiting

---

## References

- **Evaluation date**: 2026-06-05
- **Evaluator**: Multi-agent assessment (Product Manager, Backend Engineer, UI/UX Designer, Architect, Security Reviewer)
- **Related docs**: `CLAUDE.md` (project constraints), `AGENTS.md` (implementation guidance)
