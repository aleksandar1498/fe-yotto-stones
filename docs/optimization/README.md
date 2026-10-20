# Website Growth, GEO & Conversion — Strategy Pack

> **Status: research complete; implementation NOT started. Awaiting approval.**
> Branch: `feature/geo-seo-growth-optimization` · Baseline: `eefbe80` (master) · Audit date: **20 October 2026**
> These are internal strategy documents. Do not publish externally; they contain business metrics and competitive observations.

---

## Documents

| File | What it covers |
|---|---|
| [`00-current-state-audit.md`](./00-current-state-audit.md) | Stack, routes, rendering, SEO/GEO readiness, catalogue, lead flow, analytics, performance, security, code quality |
| [`01-customer-journey-analysis.md`](./01-customer-journey-analysis.md) | Personas (hypotheses), journey stages, friction by page, trust audit, prioritised CRO fixes, research gaps |
| [`02-competitive-intelligence.md`](./02-competitive-intelligence.md) | Sofia/Plovdiv competitors, observed page metrics, SERP proxy, GEO comparison, opportunity matrix, sources/confidence |
| [`03-geo-strategy.md`](./03-geo-strategy.md) | AI-discoverability audit, content architecture, entity/schema plan, answer content, `llms.txt`, AI-crawler policy, GEO measurement |
| [`04-local-seo-strategy.md`](./04-local-seo-strategy.md) | Sofia/Plovdiv keyword intent, location page architecture, GBP, reviews, NAP/citations, Bulgarian terminology |
| [`05-conversion-strategy.md`](./05-conversion-strategy.md) | Funnel audit, homepage/service pages, quote workflow, trust, mobile, experiment backlog, low-traffic testing |
| [`06-technical-refactor-plan.md`](./06-technical-refactor-plan.md) | P0/P1/P2 changes with problem/solution/benefit/risk/files/tests/rollback |
| [`07-measurement-framework.md`](./07-measurement-framework.md) | GA4/GSC/GTM, consent, event taxonomy, lead source, KPI tree, reporting, privacy |
| [`08-90-day-masterplan.md`](./08-90-day-masterplan.md) | Six sprints, dependencies, effort, acceptance criteria, measurement, rollback |
| [`09-executive-report.md`](./09-executive-report.md) | Executive summary, top 10 opportunities, GEO-first sequence, competitor/conversion/technical strategy, risks, first PR |

---

## Five findings that drive the plan

1. **The 184 material pages + 5 category pages are not server-rendered.** Live HTML shows “Loading materials...” / “Материалът не беше намерен...”, with no H1, specs or internal links. AI crawlers cannot retrieve the catalogue.
2. **There is no online lead capture.** The calculator is disabled (`settings/priceCalculator=false`), `/contact` has no form, and “Поискай оферта” dead-ends at phone/email.
3. **118/184 material descriptions originated from raw-material partner `varovik-granit.com`**, and the images are used with permission. The public `sourceUrl`/`sourceImageUrl` fields and **839 gallery URLs** were removed from Firebase on **20 Oct 2026**. The descriptions are still duplicated text, so original copy remains a GEO priority.
4. **No analytics/attribution.** No GA4/GTM, no GSC API, no lead source field. Traffic, rankings, CVR and AI referrals are unknown — not zero.
5. **Strong trust assets are invisible.** 4.9/28 Google reviews, 24-month warranty, 50 % advance/14-day offer, legal entity and an active OLX price anchor exist but are not on the site.

---

## What is already strong

- 184-material catalogue, live slab inventory, pricing engine, cutlist optimiser, admin Kanban/request inbox, PDF documents.
- Clean catalogue metadata, canonical/OG, sitemap/robots, product/breadcrumb schema (partial).
- Vercel hosting, HSTS, self-hosted fonts, AVIF/WebP config.
- Clear legal/commercial terms and a real Sofia workshop.

---

## Recommended next step

Approve **PR 1 — GEO retrieval foundation** (`09`, section I):
- additive server-rendered material content + one H1 + internal links,
- `llms.txt`,
- enriched `LocalBusiness`/`Organization` schema,
- SSR acceptance checks.

Then proceed with catalogue links/soft-404s (PR 2) and lead capture + analytics (PR 3). No production changes have been made.

---

## Evidence & limitations

- Live fetches of Yotto and competitor pages, RTDB aggregates, DuckDuckGo (Bing index) SERPs, `llms.txt`/robots checks.
- Google Search Console, GA4, CrUX/PSI, ChatGPT/Perplexity/Google AI interfaces were **not accessible**; AI visibility is therefore represented by a manual prompt protocol (`03`), not measured answers.
- All competitor metrics are snapshots, not rankings. Confidence levels are stated in each document.
