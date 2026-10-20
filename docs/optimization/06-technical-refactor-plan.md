# 06 — Technical Refactor Plan

> Scope: changes needed to support GEO/SEO/CRO without destabilising the working admin/order/cutlist system. All work stays on `feature/geo-seo-growth-optimization`. No production deploy without approval.

---

## 1. Architecture summary (as-is)

- Next.js 15 App Router; public pages mix server `page.tsx` with client-only data components.
- Catalogue data: Firebase RTDB `group_materials` (public read), loaded client-side via Redux `useMaterialsLoader` (`onValue`).
- Admin/orders: Firebase Auth + RTDB + `firebase-admin` route handlers; stable and tested.
- Public APIs: `/api/quote`, `/api/quote/options`, `/api/requests` (rate-limited, consent), `/api/chat` (disabled by default).
- SEO: metadata/canonical/OG, `robots.ts`, `sitemap.ts`, JSON-LD helpers, admin `noindex`.
- Hosting: Vercel; ISR `revalidate = 3600` on catalogue pages.
- Tests: 37 Vitest tests (cutlist/pricing/search); no public-page/API/SEO tests.
- No analytics, CI, or error monitoring.

---

## 2. P0 — foundations (must ship first)

### P0.1 Server-render catalogue content (material detail)

**Problem:** `/materials/{id}/{id}` returns only “Материалът не беше намерен...” in SSR; content mounts after Redux + Firebase. No H1/links/specs for crawlers; slow first paint.

**Recommended first fix (low risk):**
- In `src/app/materials/[material_group_id]/[material_id]/page.tsx` (already a server component with `group`/`material`), render a server-side content block **before** `<MaterialDetailClient />`:
  - `<h1>{materialName} – {group.name}</h1>`
  - description, origin/surface/sizes, applications, price band (if approved), warranty, key facts.
  - links: category, related materials, services, contact/quote.
- Change the client `PageHeader` on this page so it no longer renders an `<h1>` (or remove it), preventing duplicate H1.
- Keep the client component for the image gallery/animations/calculator; it becomes an enhancement, not the only content.

**Cleaner follow-up (medium risk):** move all presentational content to server components and pass data as props; keep only interactive widgets client-side (`MaterialGallery`, `PriceCalculator`). Remove the initial Redux dependency for first paint.

**Benefits:** indexable/AI-readable 184 pages; H1; internal links; better LCP/UX.
**Risk:** low for the additive block; medium for the full split.
**Files:** `src/app/materials/**`, `src/components/pages/materials/MaterialDetailClient.tsx`, `MaterialDetailPremium.jsx`, `PageHeader.jsx`.
**Tests:** `curl` SSR contains H1/name/description/links; no duplicate H1; hydration no errors; Lighthouse.
**Rollback:** remove the additive block / restore PageHeader.

### P0.2 Server-render group pages + internal links

**Problem:** `/materials/{group}` SSR is “Loading materials...”; only 6 items after “Load more”; no H1.
**Fix:** in the group `page.tsx`, render server-side:
- H1 (group name + “мрамор/гранит…”), intro, all material cards/links (name, image, alt), applications, CTA.
- Keep client filtering/trending as progressive enhancement.
**Files:** `src/app/materials/[material_group_id]/page.tsx`, `MaterialGroupClient.tsx`.
**Acceptance:** SSR includes all group material links; one H1; no “Loading materials...” for valid groups.
**Risk:** low–medium (large groups; paginate server-side if needed).

### P0.3 Server-render `/materials` category links

**Problem:** no crawlable material links; no H1.
**Fix:** render 5 category cards/links + intro in `MaterialsOverview` server-side (split into server shell + client enhancements). Add H1.
**Files:** `src/app/materials/page.tsx`, `MaterialsOverview.tsx`, `Materials.jsx`.
**Risk:** low.

### P0.4 Contact / quote capture

**Problem:** no form; calculator disabled; CTA dead-end.
**Fix:** add a reusable `QuoteForm` (server-compatible client component) used on `/contact`, service/material/city pages; submit to existing `/api/requests`; show success + SLA; track events.
**Fields:** name, phone, city, product, optional dimensions/material/photos, preferred channel, consent, honeypot.
**Files:** new `src/components/public/QuoteForm.tsx`; `src/app/contact/page.tsx`; `src/app/api/requests/route.ts` (extend source/fields carefully); admin RequestsPanel already consumes `order_requests`.
**Risk:** medium (validation, spam, PII); reuse existing rate limit/consent.
**Tests:** API contract, validation, spam/honeypot, mobile, consent.

### P0.5 Analytics + consent

**Problem:** no GA4/GSC/attribution.
**Fix:** GA4 via GTM or `next/script` with Consent Mode v2; events; server-side lead source; GSC verification; UTM conventions; no PII.
**Files:** `src/app/layout.tsx`, new `src/lib/analytics.ts`, consent provider, `/api/requests`.
**Risk:** low–medium (privacy); see `07`.

### P0.6 Fix entity/NAP/footer

**Problem:** “© AS Tech”, fake newsletter, no NAP, 3 phones.
**Fix:** correct copyright/legal name, NAP, working terms/privacy links, remove or implement newsletter; align schema.
**Files:** `Footer1.jsx`, `Contact14.jsx`, `src/lib/seo/site.ts`, `document_settings` data.
**Risk:** low.

---

## 3. P1 — visibility, structure, trust

| # | Change | Problem | Solution | Benefit | Risk | Files |
|---|---|---|---|---|---|---|
| P1.1 | Unique material copy | 118/184 copied from Varovik | Rewrite 150–300 words per material; specs, applications, care; original photos | GEO citations, uniqueness, legal safety | Content effort | catalogue data, material pages |
| P1.2 | Descriptive URLs | `/materials/1/1` | Add slugs (`/materials/mramor/verde`), 301 old URLs, sitemap/canonical update | Keyword relevance, shareability | Medium (redirects/indexing) | `page.tsx`, `sitemap.ts`, `next.config.ts` |
| P1.3 | Schema graph | Thin/missing offers/FAQ/entity | LocalBusiness/Organization upgrade, Product + `additionalProperty`/`offers` (real), Service, FAQPage, AggregateRating (visible reviews) | Rich results, AI understanding | Low–medium | `src/lib/seo/**`, pages |
| P1.4 | `llms.txt` + crawler policy | 404; no policy | Add route/static file; explicit allow groups; keep admin/api blocked | AI discoverability | Low | `src/app/llms.txt/route.ts` or `public/llms.txt`, `robots.ts` |
| P1.5 | H1 discipline | Missing/duplicate H1 | One H1 per page; demote group H1 on material pages | Semantics/SEO | Low | material/group/contact components |
| P1.6 | Soft 404 | Unknown IDs 200 | `notFound()` for unknown material/group; keep cached-new fallback only if needed | Index hygiene | Low | catalogue pages |
| P1.7 | Sitemap accuracy | `lastModified=now` | Use real `updatedAt`/content dates; exclude noindex/soft 404 | Freshness signal | Low | `sitemap.ts` |
| P1.8 | Reviews/warranty block | Trust invisible | Verified reviews + warranty/legal terms on site | CRO + schema | Low | new components, contact/service pages |
| P1.9 | Price guide | No price transparency | Ranges aligned with OLX/pricing engine; cost drivers | High-intent SEO/CRO | Medium (business validation) | new pages |
| P1.10 | Service/city pages | No commercial landing pages | 5 service pages + Sofia/Plovdiv hubs + city×service | Local/GEO capture | Medium | new routes |

---

## 4. P2 — performance, quality, hygiene

### P2.1 Images
- Replace competitor/third-party hotlinks with owned assets.
- Use `next/image` (or `<img>` with `srcset/sizes/width/height`) for hero, catalogue, projects.
- Hero: one optimized LCP image (AVIF/WebP, `priority`, explicit dimensions), not two full-screen client-only slides.
- Fix alts: home material cards (`Relume placeholder image 1`), navbar dropdown images.
- Lazy-load below fold; avoid layout shift.

### P2.2 JavaScript & rendering
- Reduce client-side catalogue fetch for first paint (server props).
- Defer carousels/animations; avoid importing Slick/Embla on critical path where possible.
- Keep Redux for admin/live updates; consider React Query/server props for public catalogue.
- Audit heavy deps (`@babylonjs/*`, `puppeteer`, `cheerio`) — ensure server/build-only; remove unused.

### P2.3 Accessibility
- One H1; landmark regions; labels for inputs; alt text; keyboard focus; contrast; `prefers-reduced-motion`; aria-live for quote form status.
- Semantic nav (avoid button-wrapping-link/phone).

### P2.4 Security/headers
- Add CSP (report-only first), Referrer-Policy, Permissions-Policy; keep HSTS/XFO/nosniff.
- Validate uploads (type/size), rate limits, sanitize errors.
- Ensure no PII in analytics; consent-aware.

### P2.5 Code quality
- Delete duplicate `src/src` tree and legacy `utils/seo*.js` if unused.
- Remove unused deps (`next-sitemap`, unused AI/build deps) after verification.
- Enable ESLint in build once clean; add CI (lint, tsc, test, build).
- Add tests for SSR output/metadata/sitemap/robots/schema/API validation.
- Add error monitoring (Sentry or Vercel logs) and uptime checks.
- Document architecture/content operations.

### P2.6 Performance budgets
- LCP < 2.5 s (mobile 4G), CLS < 0.1, INP < 200 ms.
- JS transferred on first load: target reduction vs current baseline (measure in CI).
- Image budget per page; no > 200 KB hero; lazy below fold.
- Use Lighthouse CI or Vercel Speed Insights + CrUX after traffic grows.

---

## 5. Delivery sequence & dependencies

```
Analytics/consent ─┬─> measure baseline
                   │
P0.1 SSR material ─┼─> P0.2 group ─> P0.3 catalogue ─> P1.2 slugs ─> P1.7 sitemap
P0.6 NAP/footer ───┤
P0.4 quote form ───┼─> P1.8 trust ─> P1.9 price guide ─> P1.10 service/city
P1.1 unique copy ──┘
P1.3 schema ───────┘
P1.4 llms/robots ──┘
```

**Do not** launch city pages before SSR/content/trust/quote capture exist; otherwise they create thin pages and paid/organic traffic lands on dead ends.

---

## 6. Risk register (technical)

| Risk | Likelihood | Impact | Mitigation | Rollback |
|---|---|---|---|---|
| SSR refactor breaks interactive catalogue | Medium | High | Additive server block first; feature flag; visual/functional QA | Revert block/PR |
| Duplicate content removal delays launch | High | Medium | Prioritise top 20 materials; template + review | Keep old until replacement approved |
| URL changes lose rankings | Medium | High | 301 map, sitemap, canonical, GSC monitoring 4 weeks | Revert redirects |
| Schema overreach (fake offers/ratings) | Low | High | Only visible/real data; validation | Remove markup |
| Analytics/consent non-compliance | Medium | High | Consent Mode v2, legal review, no PII | Disable tags |
| Form spam | High | Medium | Honeypot, rate limit, validation, moderation | Disable endpoint/fields |
| Performance regression from SSR/large pages | Medium | Medium | Budgets, Lighthouse, image limits | Revert/optimize |
| Admin/order regression | Low | High | No changes to order engine without tests; isolate PRs | Revert PR |

---

## 7. Definition of done (technical)

- `curl` (no JS) returns meaningful content, one H1, canonical, internal links for every commercial page.
- Valid JSON-LD; no fabricated data; Rich Results eligible where claimed.
- `llms.txt` 200; `robots.txt` intentional; sitemap accurate; 404s for removed pages.
- Quote form creates an `order_requests` entry and appears in admin; consent stored; spam protected.
- GA4 events + GSC verified; no PII; consent respected.
- LCP/CLS/INP within budget on mobile; no layout shift from images.
- Tests + CI green; docs updated; rollback path documented.
