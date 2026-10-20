# 08 — 90-Day Masterplan

> Assumes a small team: 1 senior full-stack developer, 0.5 content/SEO specialist, 0.3 designer, owner/operations for pricing, coverage and approvals. Effort is indicative (person-days). Sequence is dependency-aware; do not start city/content scale before foundations and measurement.

---

## 1. Prioritisation logic

Priority = **business impact × confidence ÷ (effort + risk)**.

| Rank | Initiative | Impact | Confidence | Effort | Risk | Why now |
|---|---|---|---|---|---|---|
| 1 | Server-render 184 material + 5 group + catalogue pages, H1, internal links | 5 | 5 | M | M | Unblocks SEO, GEO and UX simultaneously |
| 2 | Quote form + Viber/WhatsApp/callback | 5 | 5 | S | L | Zero online lead capture today |
| 3 | GA4/GSC/consent/events + lead source | 4 | 5 | S | L | No baseline, no learning |
| 4 | Unique copy for top 20 materials + schema graph | 5 | 4 | M | L | Removes duplicate/citation blocker |
| 5 | Trust block (4.9/28, warranty, legal, terms) | 4 | 5 | S | L | Strong assets currently invisible |
| 6 | Service pages + price guide | 5 | 4 | M | M | Commercial intent, AI answers |
| 7 | Sofia hub + 2 city×service pages | 4 | 4 | M | M | Local visibility |
| 8 | Enable calculator / estimate flow | 5 | 4 | M | M | High-intent conversion |
| 9 | Plovdiv pages (after ops sign-off) | 4 | 3 | M | M | Expansion |
| 10 | Guides/projects/authority | 3 | 3 | L | L | Long-term GEO |

Legend: S ≤ 3 days, M 4–8 days, L 9+ days; L/M/H risk.

---

## Sprint 0 — Baseline & approvals (week 1)

**Objectives:** freeze baseline, secure access, confirm business facts, avoid rework.

**Tasks**
- Confirm production branch and create `feature/geo-seo-growth-optimization` (done).
- Obtain GSC/GA4/GBP/OLX access; record current traffic/indexing (or mark unavailable).
- Confirm: primary phone, hours, service area (Sofia + Plovdiv?), delivery/installation terms, price ranges, warranty, legal entity publication.
- Approve content ownership: replace inherited material copy; partner image permission confirmed; confirm rights to project photos.
- Approve AI-crawler policy and `llms.txt`.
- Set KPI definitions and reporting cadence (`07`).

**Deliverables:** access checklist, business-fact sheet, baseline snapshot, approved scope.
**Dependencies:** owner availability.
**Acceptance:** all facts signed off; analytics access granted; partner image permission confirmed and content replacement plan approved.
**Risk:** low. **Rollback:** none (no code).

---

## Sprint 1 — Foundations: retrieval, capture, measurement (weeks 1–3)

**Objectives:** make commercial pages readable without JS; capture leads; measure.

**Tasks**
1. **SSR material pages** (additive server content block + one H1 + specs + links) — `src/app/materials/[material_group_id]/[material_id]/page.tsx`.
2. **SSR group pages** (all material links, H1, intro) — `.../[material_group_id]/page.tsx`.
3. **SSR `/materials`** category cards/links + H1.
4. **Quote form** on `/contact` (+ embed on material pages) using `/api/requests`; thank-you + SLA.
5. **Viber/WhatsApp/callback** sticky actions + tel event tracking.
6. **GA4 + GTM/Consent Mode + GSC**; events; lead source fields in `order_requests`.
7. **Footer/NAP/legal** corrections; remove fake newsletter; working terms/privacy.
8. **`llms.txt`** + explicit AI crawler allow rules; keep `/admin`,`/api` blocked.
9. **LocalBusiness/Organization** schema enrichment (NAP, hours, geo, sameAs, areaServed).
10. **Soft-404 + sitemap lastmod** fixes (if low risk).

**Deliverables:** deployable PR(s); before/after `curl` evidence; analytics dashboard v1; lead form live.
**Files:** catalogue pages/components, `src/lib/seo/site.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, new `QuoteForm`, `layout.tsx`, `Footer1.jsx`, `Contact14.jsx`.
**Dependencies:** business facts, consent/legal.
**Effort:** 12–16 dev days + 3 content days.
**Risk:** medium (SSR refactor). **Rollback:** feature-flag new server block; revert per PR.
**Acceptance**
- `curl` of a material/group page shows name, description, specs, links and exactly one H1.
- Quote form creates an `order_requests` entry visible in admin; consent stored; spam blocked.
- GA4 records page/CTA/form events; GSC verified; no PII.
**Measurement:** baseline vs post: indexed pages, quote submissions, phone/Viber clicks, CWV.

---

## Sprint 2 — GEO content & entity (weeks 4–6)

**Objectives:** replace duplicate content; become answer-grade.

**Tasks**
1. Rewrite **top 20 materials** (150–300 words each) + specs/applications/care; original photos where possible.
2. Add **5 service pages** (windowsills, countertops, thresholds, stairs, cladding) with price factors, process, FAQ.
3. Add **price guide** aligned with OLX/pricing engine (ranges only).
4. Publish **trust block**: 4.9/28 reviews, 24-month warranty, legal entity, 50/14 terms.
5. **Schema**: Product `additionalProperty`/`offers` where real; `Service`; `FAQPage`; `AggregateRating` only with visible reviews.
6. Internal linking: materials ↔ services ↔ price guide ↔ projects.
7. Start **project case studies** (3).
8. Replace external/competitor hotlinked images on home.

**Deliverables:** updated pages/data, validated schema, content briefs for remaining materials.
**Files:** catalogue data/`group_materials`, material/group pages, new service routes, `src/lib/seo/**`, media assets.
**Dependencies:** Sprint 1 SSR; owner-approved prices/claims; photo rights.
**Effort:** 10 dev/content days + content writing.
**Risk:** medium (content quality/legal).
**Acceptance:** no inherited/duplicated Varovik text on updated pages; schema valid; service pages answer price/process/FAQ; reviews visible.
**Measurement:** GSC impressions/clicks for “цена/плот/перваз” queries; AI prompt panel mentions/citations (manual).

---

## Sprint 3 — Local Sofia & Plovdiv (weeks 6–8)

**Objectives:** win local commercial queries; prepare Plovdiv.

**Tasks**
1. **Sofia hub** `/lokacii/sofia` + 2 city×service pages (windowsills, countertops).
2. **Plovdiv hub** + 1–2 city×service pages **only after operational sign-off**; state service model honestly.
3. GBP completion: categories, services, products, photos, Q&A, posts, UTM link, review responses.
4. NAP cleanup: Cybo, ibusiness, ZlatnaFirma, polomap, directmap, OLX, social profiles; `sameAs`.
5. Reviews: post-install request flow; publish 6–12 verified reviews.
6. Local schema: `areaServed`, `LocalBusiness`, `Service`; breadcrumbs.
7. Local links: 3–5 genuine partners (designer/kitchen studio/contractor).

**Deliverables:** city hubs, service pages, GBP checklist, citation corrections, review widget.
**Dependencies:** Sprint 2 content, ops confirmation for Plovdiv, photo assets.
**Effort:** 8–10 days.
**Risk:** medium (thin/duplicate city pages; operational overpromise).
**Acceptance:** city pages have unique local proof and NAP; no fake office; GBP complete; citations consistent.
**Measurement:** GBP calls/directions, Sofia/Plovdiv query impressions, city-tagged leads.

---

## Sprint 4 — Conversion & UX (weeks 8–10)

**Objectives:** convert existing traffic; remove friction.

**Tasks**
1. Homepage: H1/value prop, proof bar, 3 CTAs, price anchor, process, 3 projects, reviews, FAQ, coverage.
2. **Calculator**: enable after validation (or replace with estimate form); carry configuration to quote form; disclaimer.
3. Form optimization: phone-first, progressive fields, inline validation, photo upload, city/product.
4. Mobile: sticky Call/Viber/Quote, tap targets, image optimization.
5. Trust: warranty page, terms page, legal entity, care guide.
6. Sample request (premium).
7. Sequential measurement of quote start→submit.

**Deliverables:** new home, calculator/estimate, optimized form, warranty/terms pages.
**Dependencies:** Sprint 1 form, Sprint 2 trust/price, engineering validation.
**Effort:** 10–12 days.
**Risk:** medium (calculator expectations, support load).
**Acceptance:** form completion measurable; calculator leads carry context; LCP/CLS budgets met; no duplicate events.
**Measurement:** quote starts/submits, calculator completions, phone/Viber clicks, lead quality.

---

## Sprint 5 — Authority & content depth (weeks 10–12)

**Objectives:** become citable; cover buying questions.

**Tasks**
1. 6 guides/comparisons (marble vs granite, limestone vs travertine, price, measurement, installation, care).
2. Unique copy for **top 50 materials**; internal links to services/projects.
3. 10 project case studies with specs/photos/timelines.
4. FAQ hub (30–50 real questions) + consistent FAQ schema.
5. PR/citations: local media/industry, supplier/brand pages, associations; no paid links.
6. English key pages (services + Sofia/Plovdiv) with hreflang — only if maintenance is realistic.
7. GEO prompt panel iteration; update `llms.txt`.

**Deliverables:** guides, projects, top-50 content, citations.
**Dependencies:** Sprint 2–4.
**Effort:** 12–15 days + content.
**Risk:** medium (content volume/quality).
**Acceptance:** original, source-backed content; no keyword stuffing; AI prompt panel shows improvements/mentions.
**Measurement:** AI mentions/citations, organic non-brand clicks, assisted leads.

---

## Sprint 6 — Validation & next quarter (week 13)

**Objectives:** prove what worked; fix regressions.

**Tasks**
1. Technical regression: SSR output, schema validity, sitemap/robots, CWV, forms/API.
2. GSC Pages/Coverage/Queries; GA4 funnel; GBP/OLX; lead quality.
3. AI prompt panel comparison vs baseline.
4. Content refresh/redirect audit; remove soft 404s.
5. Retrospective; next-quarter roadmap.

**Deliverables:** performance report, issue list, next-quarter plan.
**Acceptance:** no P0 regressions; KPI dashboard current; decisions documented.
**Risk:** low.

---

## 2. Dependencies & sequencing

```
Sprint 0 approvals
   ↓
Sprint 1 SSR + form + analytics + llms/schema base
   ↓
Sprint 2 unique content + services + trust + schema
   ↓
Sprint 3 local pages + GBP/citations (Plovdiv after ops)
   ↓
Sprint 4 CRO + calculator + mobile
   ↓
Sprint 5 authority/content depth + English (optional)
   ↓
Sprint 6 validation
```

Do not launch Plovdiv pages before: operational sign-off, unique local proof, quote form + trust + analytics in place.

---

## 3. Resourcing & budget (indicative)

| Role | Allocation | Notes |
|---|---|---|
| Senior full-stack | 1.0 FTE × 13 weeks | SSR, form, analytics, schema, calculator, QA |
| Content/SEO | 0.5 FTE | Unique copy, service/guide pages, GBP, reviews |
| Designer | 0.3 FTE | Home/service/trust components, image direction |
| Owner/ops | 4–6 h/week | Prices, coverage, approvals, project photos, reviews |
| Tools | GA4/GSC free; GBP free; Looker Studio free; optional rank tracker/CrUX | Avoid tool sprawl |

**Content production estimate:** 184 materials × 150–300 words is a multi-month programme; start with top 20/50 by demand and stock, template the rest, and review quarterly.

---

## 4. Measurement & acceptance summary

| Sprint | Primary KPI | Guardrail |
|---|---|---|
| 1 | SSR commercial pages 100 %; first leads via form | No order/admin regressions; no PII |
| 2 | Indexed pages; price/service query impressions | No duplicate/copied content; schema validity |
| 3 | Local calls/directions; city-tagged leads | No thin/fake location pages |
| 4 | Quote starts/submits; calculator completion | LCP/CLS budgets; support load |
| 5 | AI mentions/citations; non-brand clicks | Content quality/legal |
| 6 | Lead→offer→order rates; stability | Regressions fixed |

---

## 5. Rollback principles

- Ship in small PRs; feature-flag risky UI (new SSR block, calculator, form).
- Keep old URLs with 301s; monitor GSC for 4 weeks.
- Database changes additive (`source` fields) and nullable; no destructive migrations.
- Content changes reversible via version control; keep the old copy until replacements are approved.
- Analytics can be disabled via consent/flag if misconfigured.
- No production deploy without explicit owner approval; no merge without review.
