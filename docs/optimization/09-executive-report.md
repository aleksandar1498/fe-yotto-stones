# 09 — Executive Report & First Implementation Proposal

> Prepared 20 Oct 2026 · Branch `feature/geo-seo-growth-optimization` · No production changes made.
> This report synthesises `00`–`08`. Read the detailed documents before approving implementation.

---

## A. Executive summary

**Current condition.** Yotto Stones has a credible offline business (workshop, 184-material catalogue, 24-month warranty, 4.9/28 Google reviews, active OLX sales) and a mature admin/order/cutlist system. The public website, however, is not functioning as an acquisition system:

1. **184 material pages and 5 category pages are effectively invisible to crawlers.** Server HTML shows “Loading materials...” / “Материалът не беше намерен...”, with no H1, no specs and no internal links. Content only appears after JavaScript + Firebase + Redux.
2. **There is no online lead capture.** The calculator is disabled (`settings/priceCalculator=false`), the contact page has no form, and “Поискай оферта” ends on a phone/email page.
3. **118 of 184 product descriptions and images are duplicated from a direct Sofia competitor** (Varovik); sampled pages show 100 % text overlap. This is an SEO/GEO and legal/reputation liability.
4. **There is no analytics or attribution** (no GA4/GTM, no GSC API, no lead source). The business cannot see what works.
5. **Trust and price signals are invisible.** 4.9/28 reviews, 24-month warranty, legal entity, 50/14 terms and OLX price anchors exist but are not on the site.

**Largest visibility opportunity.** Making the existing catalogue retrievable and unique. Yotto already has more indexed *potential* (194 sitemap URLs) than most local competitors; it is wasted by client-only rendering and copied copy. Fixing retrieval + originality is the single highest-leverage GEO/SEO move in Sofia.

**Largest conversion opportunity.** A phone-first quote form + Viber/WhatsApp/callback. The site currently has **zero online lead capture**; even a modest form connected to the existing `order_requests` admin flow converts existing and future traffic.

**Competitive position.** In Sofia, Varovik, Raimar, Stone Build, Pietra and SMG compete with server-rendered, content-rich sites, price pages, forms and reviews. In Plovdiv, Plovdiv Mramor, Monolit 1994 and Aegean Mramor own local relevance (Plovdiv Mramor even publishes `llms.txt`). Yotto is absent from commercial SERPs in the Bing-indexed web proxy and has no Plovdiv content.

**GEO advantage.** Competitors are mostly schema-lite and none publish structured, citation-ready Q&A or original production data. Yotto can differentiate with: server-rendered facts, original material/project data, transparent price ranges, verified reviews, warranty/legal clarity, and a unique **cutlist optimisation/offcut-reuse** story. Being early matters, but only with real content — not tricks.

---

## B. Top 10 opportunities

| # | Problem | Solution | Impact | Effort | Risk | Dependencies | Success metric |
|---|---|---|---|---|---|---|---|
| 1 | 184 material + 5 group pages not server-rendered; no H1/links | Additive SSR content block (name, description, specs, links, one H1); then full server split | **Very high** | M | M | Content facts | `curl` shows content; GSC indexed pages; impressions |
| 2 | No online lead capture | Phone-first quote form → existing `/api/requests`; Viber/WhatsApp/callback | **Very high** | S | L | Consent | Quote submissions, phone/Viber clicks |
| 3 | No analytics/attribution | GA4 + GTM/Consent Mode + GSC + lead source fields | High | S | L | Legal/consent | Baseline dashboard; source-tagged leads |
| 4 | 118 copied descriptions/images | Rewrite top 20 → 50 → 184; original photos/specs | **Very high** | M–L | L | Photo rights, content capacity | Unique content; AI citations; no duplicate |
| 5 | Trust assets invisible | Publish 4.9/28 reviews, 24-month warranty, legal entity, terms | High | S | L | Owner approval | Trust block live; quote start rate |
| 6 | No service/price pages for commercial intent | 5 service pages + price guide with ranges | **Very high** | M | M | Pricing approval | Rankings/impressions for “цена/плот/перваз” |
| 7 | No Sofia/Plovdiv local pages | Sofia hub + 2 city×service; Plovdiv after ops sign-off | High | M | M | Ops coverage | Local calls/leads; local pack visibility |
| 8 | Calculator disabled | Enable after validation or replace with estimate form; carry config to quote | High | M | M | Pricing correctness | Calculator completions → requests |
| 9 | Weak schema / no llms.txt | LocalBusiness/Organization + Product offers/props + Service + FAQPage; `llms.txt` | Medium–high | S | L | Content | Valid schema; AI mentions/citations |
| 10 | No projects/guides/authority | 10 case studies, 6 guides/comparisons, citations/PR | High (long-term) | L | L | Content/photos | Non-brand clicks; AI citations; assisted leads |

---

## C. GEO-first strategy

**1. Essential foundations (weeks 1–4)**
- Server-render all commercial pages; one H1; crawlable internal links.
- Replace copied content on top 20 materials.
- `LocalBusiness`/`Organization` graph with NAP, hours, geo, sameAs, areaServed.
- `llms.txt` + explicit AI-crawler allow policy; keep admin/api blocked.
- GSC/GA4/lead source to measure.

**2. Content & entity (weeks 4–8)**
- Service pages + price guide + FAQs; reviews/warranty/legal.
- Unique copy for top 50 materials; Product specs/offers where real.
- Sofia hub; Plovdiv only with genuine coverage.
- Consistent NAP across GBP/OLX/directories.

**3. Experiments (weeks 8–12)**
- Answer-first blocks, comparison guides, project case studies.
- AI prompt panel monthly; iterate on cited/uncited pages.
- Sample requests, B2B/designer page, English key pages (if maintained).

**4. Long-term authority**
- Original production/cutlist data, care/installation standards, project archive, PR/citations, supplier/trade relationships.

**What not to do:** mass-generated city pages, fake reviews/ratings, keyword-stuffed schema, AI-written filler, blocking AI crawlers “for control”, or copying competitor content.

---

## D. Competitor strategy

**What they do well**
- Server-rendered, keyword-rich service pages and long-form content (Raimar, Stone Build, Plovdiv Mramor, Aegean, Slavev).
- Price pages/ranges (Slavev, Pietra, Plovdiv Mramor) capture high-intent queries.
- Reviews/projects on site (Varovik, Raimar); forms/e-commerce (Raimar, Pietra, Slavev).
- Local relevance (Plovdiv Mramor, Monolit, Aegean).

**Where they outperform Yotto**
- Retrievability, content depth, price transparency, online capture, local pages, on-site proof.

**Where they are weak**
- Schema depth (most have none), AI-answer readiness (only Plovdiv Mramor has `llms.txt`), original data, transparent pricing, mobile/alt-text hygiene, Plovdiv service+city content.

**Underserved opportunities**
- “How much does it cost?” with real ranges and cost drivers.
- “Marble vs granite/limestone vs travertine” decision content.
- “Sofia/Plovdiv + service + material + price + process” answer pages.
- Verified reviews + warranty + legal transparency at the point of quote.
- Cutlist optimisation/offcut reuse as a unique quality/value story.
- Plovdiv customers served from Sofia with honest coverage terms.

**Differentiation statement**
> “Yotto Stones — собствена работилница в София, точна разкройка с минимум фира, 184 материала, 24 месеца гаранция и 4.9★ от 28 клиенти; обслужваме София и Пловдив.”

---

## E. Conversion strategy

1. **Capture:** phone-first quote form on contact/service/material/city pages; Viber/WhatsApp/callback; photo upload; city/product context.
2. **Price confidence:** ranges + cost drivers + calculator/estimate; align with OLX.
3. **Trust:** reviews, warranty, legal entity, terms, projects, workshop photos.
4. **Speed:** auto-acknowledgement, 1-business-day SLA, named contact.
5. **Mobile:** sticky actions, short form, optimized images.
6. **Measurement:** quote start/submit, phone/Viber clicks, calculator completion, lead→offer→order.
7. **Low-traffic discipline:** sequential 4-week tests, qualitative task tests, no false significance; prioritise obvious friction.

---

## F. Technical roadmap

```
P0.1 SSR material pages (+H1/links)
P0.2 SSR group pages
P0.3 SSR /materials links
P0.4 Quote form (reuse /api/requests)
P0.5 GA4/GSC/consent/lead source
P0.6 NAP/footer/legal
P1.1 Unique copy (top 20 → 50 → all)
P1.2 Descriptive URLs + 301s
P1.3 Schema graph + llms.txt
P1.4 Service pages + price guide
P1.5 Sofia/Plovdiv pages
P1.6 Reviews/warranty/terms
P2 Images/JS/CWV, accessibility, CI/tests, cleanup
```

Dependencies: business facts/pricing/photo rights → SSR/content → local pages → calculator/CRO → authority.

---

## G. Measurement strategy

- GA4 + GTM/Consent Mode v2, GSC, GBP/OLX insights, server-side lead/order events, lead source fields.
- KPI tree: leads/orders/revenue; quote conversion; non-brand clicks/indexed pages; AI mentions/citations; CWV.
- AI prompt panel: 10 fixed BG/EN prompts, 3 runs each, monthly, recorded with platform/date/location.
- Baseline is currently mostly unknown; set process targets first, outcome targets after 4–8 weeks.
- No PII in analytics; document retention/access; consent-aware.

---

## H. Risk assessment

| Risk | Type | Impact | Mitigation |
|---|---|---|---|
| Copied Varovik content/images | Legal/reputational/SEO | High | Replace before promotion; confirm rights; keep old copy only until replacement approved |
| SSR refactor breaks catalogue UX | Technical | High | Additive server block first; feature flag; QA visual/functional; rollback |
| Low traffic makes testing unreliable | Commercial | Medium | Sequential tests, qualitative research, micro-conversions; no false claims |
| Price publication creates commitment | Commercial | Medium | Publish ranges + “окончателна оферта след замерване”; validate with owner |
| Plovdiv overpromise | Operational/reputational | High | Only after ops sign-off; state service model honestly |
| Brand collision with Yotov Stone | Entity/SEO | Medium | Disambiguation, consistent NAP, target “Yotto Stones София” |
| Analytics/consent non-compliance | Legal | High | Consent Mode v2, legal review, no PII |
| Content programme stalls | Execution | High | Top 20/50 first, templates, owner review cadence |
| Calculator/support load | Operational | Medium | Estimate disclaimer, FAQ, response SLA, monitor |
| Fake reviews/schema overreach | Reputational | High | Only verified/visible data; no invented ratings/prices |

---

## I. First implementation proposal (smallest high-impact, low-risk)

### PR 1 — “GEO retrieval foundation” (recommended first)
**Goal:** make the highest-value pages readable and citable **without changing routing, pricing, calculator or admin**.

**Changes**
1. In material detail `page.tsx`, render a server-side content block above the existing client component:
   - one `<h1>` (material + type),
   - description, origin/surface/thickness/sizes, applications, warranty,
   - links to category, related materials, services, contact.
2. Demote/remove the group H1 from the client `PageHeader` on this page (one H1 only).
3. Add `public/llms.txt` with factual business/service/material/location summary.
4. Enrich `LocalBusiness`/`Organization` JSON-LD (NAP, hours, geo, sameAs, areaServed) using approved facts.
5. Add an automated `curl` check (script/test) asserting SSR contains name/description/H1/links for a sample of material pages.

**Why this first**
- It directly addresses the biggest GEO/SEO blocker (184 pages).
- Additive, reversible, and independent of pricing/calculator/CRM decisions.
- It produces measurable signals (GSC indexing/impressions) within weeks.

**Out of scope for PR 1:** URL slugs, content rewrite of all 184, quote form, calculator, city pages, design changes.

**Acceptance**
- `curl` of 5 random material pages returns material name, unique description, specs, at least 3 internal links and exactly one H1.
- No visual regression after hydration; no duplicate H1.
- `llms.txt` returns 200; schema validates; admin `noindex` unchanged.
- `npm run build`, `tsc`, tests, lint pass; rollback is a single commit revert.

### PR 2 — “Catalogue links & soft-404 hygiene”
- Server-render `/materials` category links and group material lists; fix H1s; `notFound()` for invalid IDs; accurate sitemap `lastModified`.

### PR 3 — “Lead capture & measurement”
- Quote form → `/api/requests`; Viber/WhatsApp/callback; GA4/GSC/consent; lead source fields. Separate PR because it touches PII/analytics and needs legal sign-off.

**Approval gates**
1. Business facts/pricing/photo rights confirmed.
2. PR 1 reviewed + approved.
3. Analytics/consent reviewed.
4. Plovdiv operational sign-off before any Plovdiv page.

**Expected outcome after 90 days (process, not guaranteed revenue):**
- 100 % of commercial pages server-rendered with one H1 and internal links.
- A working online lead path with source/city/product data.
- Unique content for top 20–50 materials; price/service/trust pages live.
- GSC indexing and AI prompt-panel baseline established; decision-making based on data, not assumptions.
