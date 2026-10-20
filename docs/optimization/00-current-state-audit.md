# 00 — Current State Audit

> **Internal document.** Contains business/technical observations. Do not publish externally.
> Audit date: **20 October 2026** · Branch: `feature/geo-seo-growth-optimization` · Baseline commit: `eefbe80` (master)
> Method: repository inspection, live production fetches, RTDB aggregate reads, DuckDuckGo/Bing-index SERP checks, competitor page fetches. No analytics/GSC/GA4 API access was available.

---

## 1. Business snapshot

| Item | Finding | Evidence |
|---|---|---|
| Brand | **Yotto Stones** | `src/lib/seo/site.ts` |
| Legal entity | **Ц-М ЙОТТО ЕООД**, EIK 207239186, VAT BG207239186, MOL Силвия Александрова | RTDB `document_settings/company` |
| Address | ул. „Владимир Зограф“ 121, 1229 София | site + RTDB |
| Phones | +359 895 19 8805; +359 885 05 3680; documents also list +359 888 662 874 | site, schema, RTDB |
| Email | yottostones@gmail.com | site |
| Category | Fabrication and installation of natural/technical stone products: window sills, kitchen/bath countertops, thresholds, stairs, fireplace/wall/floor cladding | home sections, pricing engine |
| Materials | Marble, granite, limestone, onyx, travertine (+ technical stone references in competitor/structure) | `src/lib/orders/pricing.ts`, catalogue |
| Services | Measuring, cutting, edge profiles, build-up, drip grooves, cutouts, impregnation/sealing, transport, installation, removal | pricing engine, PDF terms |
| Commercial terms | 24-month warranty, 50 % advance, 14-day offer validity, 12 contract terms | RTDB `document_settings` |
| Reputation | **4.9 / 28 Google Maps reviews** (third-party scan 12 Apr 2026) | ZlatnaFirma listing |
| Marketplace | Active OLX ad (updated 19 Oct 2026), prices “limestone from 10 €/lm, marble 15 €/lm, granite 25 €/lm”, free Sofia delivery for combined orders | OLX ad 141630371 |
| Geography | Sofia base; claims delivery “в цяла България” in competitor copy; **no Plovdiv presence or content** | site + GBP/address |

**Business model:** lead-generation / made-to-measure fabrication, not e-commerce. The economic unit is a measured, quoted and installed project. The website currently captures **no online leads** (see §7).

---

## 2. Stack & architecture

| Layer | Finding |
|---|---|
| Framework | Next.js **15.1.11**, App Router, React 18, TypeScript |
| Styling | Tailwind 3, Relume components, Framer Motion, Embla/Slick carousels |
| Rendering | Hybrid: home and content are mostly client components but statically rendered; catalogue group/detail pages are **client-rendered after mount** (critical – §3) |
| Data | Firebase RTDB (public catalogue + private orders/requests), Firebase Auth, Firebase Storage |
| Server | Next route handlers (`/api/quote`, `/api/quote/options`, `/api/requests`, `/api/chat`), `firebase-admin` for protected writes |
| Hosting | Vercel (`Server: Vercel`, `X-Vercel-Cache: HIT`, HSTS, ISR prerender) |
| Fonts | `next/font` self-hosted Exo 2 (good) |
| Images | `next/image` used selectively; most catalogue/hero/home images are plain `<img>`; Firebase Storage remote pattern configured |
| Analytics | **No GA4 / GTM / Clarity / Meta pixel.** `@vercel/speed-insights` dependency present; no access to reports |
| CI/CD | **No `.github` workflows.** Deployment appears to be Vercel Git integration |
| Tests | Vitest: 37 tests in `src/lib/cutlist`, `src/lib/orders` (pricing/search). **No tests for public pages, APIs, SEO, forms** |
| Docs | README is create-next-app boilerplate |

Notable dead/duplicate code: a full duplicate tree under **`src/src/`** (old app copy), `next-sitemap` dependency unused (App Router `sitemap.ts` is used), legacy `src/lib/utils/seo*.js`, `src/components/common/Seo.jsx`.

---

## 3. Route inventory & rendering (critical)

Sitemap: **194 URLs** = 5 static + 5 category + **184 material detail pages** (`/materials/{group}/{material}`), 184 sitemap images.

Live server-HTML observations (20 Oct 2026):

| URL | SSR body | H1 in HTML | Hydrated H1s | Notes |
|---|---|---|---|---|
| `/` | ~2,496 words, content present | 1 (“Изберете качество и елегантност…”) | 1 | Generic H1; no service/city |
| `/materials` | ~1,492 chars, intro present | **0** | 1 (client PageHeader) | **No crawlable material links**; catalogue grid is client/Redux |
| `/materials/1` | ~470 chars, only **“Loading materials...”** | **0** | 1 | No material links in HTML |
| `/materials/1/1` | ~466 chars, only **“Материалът не беше намерен...”** | **0** | **2** (“МРАМОР” + “Верде”) | Product content, specs and calculator mount client-side |
| `/contact` | little content | **0** | 1 | Contact block and map are client-rendered; **no form** |
| `/edges`, `/privacy-policy` | content present | 1 | 1 | Best-rendered pages |

**Root cause:** `MaterialDetailClient` / `MaterialGroupClient` wait for the Redux catalogue (`useMaterialsLoader` → Firebase `onValue`), returning a loading/fallback state during SSR. `PageHeader` is imported with `dynamic(..., { ssr:false })`, so its H1/breadcrumbs never exist in server HTML.

**Impact:** the 184 commercially important pages are effectively empty to crawlers that do not execute JavaScript (most AI crawlers; many search/bot fetches). Google may render JS, but rendering is deferred and unreliable at this scale. URL IDs are also non-descriptive (`/materials/1/1`), losing keyword relevance.

---

## 4. SEO implementation

**Present and working**
- Per-page `metadata`/`generateMetadata` with titles, descriptions, canonical, OpenGraph/Twitter.
- `robots.ts`: allow all except `/admin`, `/api/`; sitemap declared.
- `sitemap.ts`: static + category + 184 detail URLs + images; `revalidate = 3600`.
- `metadataBase`, `lang="bg"`, viewport, theme color, manifest, favicons.
- Admin is `noindex, nofollow` (`src/app/admin/layout.tsx`).
- Google site-verification file present (`public/googlee3e0834704a307ab.html`).
- Structured data present:
  - `LocalBusiness` + `WebSite` (layout/home)
  - `Product` + `BreadcrumbList` on material detail
  - `CollectionPage` + `ItemList` + `BreadcrumbList` on catalogue
  - `ContactPage`, `Service` (edges), `BreadcrumbList`.
- Vercel HSTS; `poweredByHeader: false`.

**Gaps**
- **No server-rendered product content** (§3); no H1 in SSR on catalogue/contact.
- **Two H1s** on hydrated material pages (group + material).
- Material URLs use IDs, not keyword slugs.
- Product schema has **no `offers`** (price/availability/currency) and no `additionalProperty` (origin, surface, thickness, sizes), so it is weak for answer engines/merchant surfaces.
- `LocalBusiness` is minimal: no `priceRange`, `openingHours`, `geo`, `hasMap`, `sameAs`, `foundingDate`, `aggregateRating`.
- No `Organization` with `sameAs`, no `FAQPage`, no `Service`/`OfferCatalog` for services, no location pages.
- `sitemap` sets `lastModified = now` for every URL on every generation; freshness signal is meaningless.
- Unknown material IDs return **200 + fallback** (soft 404), not `notFound()`.
- No hreflang (site is BG-only; acceptable now, but blocks English AI/export queries).
- No content for high-intent commercial queries (price, comparison, city, “how to choose”, installation, care).

**Indexation baseline (proxy):** DuckDuckGo (Bing index) `site:yottostones-bg.com` returned **no results**; a brand query returned only the homepage and `/materials/1`. Commercial queries returned competitors, not Yotto (see `02-competitive-intelligence.md`). Google indexing was not accessible; treat as a signal, not proof.

---

## 5. GEO readiness

| Signal | Status | Assessment |
|---|---|---|
| AI crawler access (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`) | Allowed by default (`User-Agent: * Allow: /`) | Positive, but no deliberate policy |
| `llms.txt` | **404** | Missing; Plovdiv Mramor already publishes one |
| Server-rendered content | **Fails on 184 product pages + 5 category pages** | Critical blocker |
| Crawlable internal links to materials | **No** on `/materials`; only navbar dropdown (client) and sitemap | Critical blocker |
| Structured data | Product/category/breadcrumb present; no offers/FAQ/Organization | Partial |
| Content uniqueness | **118/184 material descriptions and images sourced from `varovik-granit.com`**; sampled 4 pages: 100 % token overlap | Critical: duplicate, non-citable content |
| Entity clarity | Brand “Yotto Stones” vs “Yotov Stone” (Mezdra B2B quarry); legal name “Ц-М ЙОТТО ЕООД”; 3 phone numbers | Weak/ambiguous |
| Third-party corroboration | Google 4.9/28, Cybo, ibusiness, ZlatnaFirma, OLX | Exists but not linked/claimed on site |
| AI referral measurement | None (no analytics/UTM/referrer tracking) | Missing |
| Answer-oriented content | No FAQ, pricing guide, comparisons, care guides, projects | Missing |

**Verdict:** robots are open, but AI engines cannot retrieve the product content that would make Yotto citable. The content that does exist is duplicated from a stronger competitor. GEO is currently **not competitive despite permissive robots**.

---

## 6. Content & catalogue

- 5 material groups, **184 materials**. Images hosted in Firebase Storage.
- 118 materials carry `sourceUrl`/`sourceImageUrl`; **all 236 references point to `varovik-granit.com`**. Examples: Verde, Tasos Gold, Volokas, Krit — exact description substring + 100 % token overlap.
- This creates: duplicate-content risk, no unique citation value, copyright/reputation risk, and a structural dependency on a direct Sofia competitor.
- Home content: generic “quality and elegance” messaging, 7 product categories (windowsills, countertops, fireplace, stairs, thresholds, wall/floor cladding, other), 4-step process, materials grid, contact block. **No prices, no cases, no reviews, no team/workshop evidence, no guarantees.**
- External hotlinks: About background from `granitmar.bg`; two offering images + one process image from `marmogranito.it`. Third-party/competitor assets; legal and performance risk.
- Footer: **“© 2026 AS Tech”** (wrong legal entity), newsletter form is a `console.log` stub, no NAP/phone/address in footer, “Условия за ползване” points to `/privacy-policy#data-usage`.
- Material overview cards use `alt="Relume placeholder image 1"`; navbar dropdown images have no alt.
- English UI fragments leak (“Loading materials...”).

---

## 7. Lead / order workflow

- Public calculator exists (`PriceCalculator`) but **is disabled**: RTDB `settings/priceCalculator = false`; `/api/quote/options` returns `{enabled:false}` and the component renders `null`.
- The only request form (`/api/requests`) lives **inside the calculator**; with the calculator off, there is **no online lead form anywhere**.
- `/contact` has phone, email, address, Google map — **no form, no callback request, no WhatsApp/Viber**.
- Main CTA “Поискай оферта” → `/contact` → dead end (phone/email only).
- Admin flow is mature: Kanban orders, request inbox, pricing engine, cutlist optimizer, PDFs. The gap is **acquisition → capture**, not order management.
- Chatbot code exists but is disabled (`CHATBOT_ENABLED !== "1"`); it uses OpenAI + Supabase and logs weak-context questions; would need consent/privacy review before enabling.
- RTDB rules: only the admin UID can read/write orders/requests; catalogue is public read. Sound.

**Internal demand snapshot (RTDB, 20 Oct 2026):** 6 orders all-time (3 active, 3 history), 3 website requests (2 approved, 1 new). This is a very low digital lead volume and makes short-term A/B testing statistically invalid.

---

## 8. Analytics & baseline

| Metric | Status |
|---|---|
| Organic sessions / branded vs non-branded | **Unavailable** (no GA4/GSC access) |
| Impressions / CTR / rankings | **Unavailable** (GSC verified file exists but no API access) |
| Indexed pages | Proxy only: DDG `site:` returned none; brand SERP showed 2 site URLs |
| Conversion rate / leads / revenue by channel | **Unavailable**; order DB has no source/attribution field |
| AI referral sessions | **Unavailable** |
| Core Web Vitals | PSI API rate-limited (429) during audit; no CrUX/Speed Insights access |
| Mobile vs desktop | Unavailable |
| Geography | Unavailable |

**Implication:** the first measurement milestone is instrumentation, not optimisation. Without GA4/GSC/server-side events, no recommendation can be validated causally.

---

## 9. Performance & UX signals

- Home (desktop, live): 56 requests, ~536 KB transfer observed (some cached/cross-origin sizes hidden), 28 images after hydration, DOMContentLoaded ~183 ms, load ~3.7 s. Indicative only.
- Hero: two full-screen Firebase images in a client-only Slick slider (`ssr:false`), plain `<img>`, no `width/height` → LCP/CLS risk.
- Many client components (Redux, Framer Motion, Embla/Slick) on above-the-fold content; material pages fetch the entire catalogue client-side before rendering.
- Positive: self-hosted font, AVIF/WebP config, ISR, Vercel cache, `preconnect` to Firebase Storage, image `sizes` in some places.
- Accessibility: missing H1s, two H1s, placeholder alts, icon-only controls with some aria labels, focus states present in admin; public nav uses non-semantic nested interactive elements (button containing link/phone).

---

## 10. Security, privacy, operations

- Admin `noindex` + auth guard; DB rules restrict private nodes to one UID; Storage rules file exists.
- Headers: HSTS (Vercel), X-Frame-Options, nosniff; **no CSP, Referrer-Policy, Permissions-Policy**.
- Consent banner exists (accept/decline) but no granular categories; `CookieSettingsProvider` available.
- No analytics currently, so consent risk is low today; it becomes critical when GA4 is added.
- No error monitoring (Sentry etc.), no CI, `eslint.ignoreDuringBuilds: true`.
- Secrets are in `.env.local` (not committed); no service-account key in repo observed.

---

## 11. Code quality & maintainability

- Clean separation of pricing/cutlist logic and tests; admin features are well structured.
- Public marketing layer is the weak part: duplicated `src/src` tree, legacy SEO helpers, mixed JS/TS, `any` in catalogue components, direct Redux `useSelector` without typed hooks, ad-hoc data fetching.
- No tests for: SSR output, metadata, sitemap, schema, forms, API contracts, redirects.
- No documented architecture, deployment or content-operations runbook.

---

## 12. Critical findings (ranked)

**P0 — blocks visibility and/or leads**
1. **184 material pages + 5 category pages are not server-rendered** (fallback/loading HTML, no H1, no internal links).
2. **No online lead capture**: calculator disabled, contact page has no form, CTA dead-ends.
3. **118 product descriptions/images duplicated from a direct competitor** (Varovik).
4. **No analytics/attribution** (GA4/GSC/events), so no baseline or learning loop.

**P1 — high impact**
5. Missing/duplicate H1s; non-descriptive material URLs.
6. No price transparency / FAQ / comparison / project content.
7. Weak LocalBusiness/Product schema (no offers, hours, geo, sameAs, aggregateRating).
8. No Plovdiv content or service-area pages; NAP inconsistencies (3 phones, wrong copyright).
9. No `llms.txt`; no deliberate AI-crawler policy.
10. Trust assets (4.9/28 reviews, 24-month warranty, 12 terms, own cutlist optimisation) not surfaced.

**P2 — hygiene**
11. External/competitor image hotlinks; wrong alts; hero LCP/CLS risks.
12. Dead `src/src` tree; unused deps; no CI; no public-page tests.
13. Soft-404s for unknown materials; sitemap `lastModified` always “now”.
14. Missing security headers; email-only/neutral privacy contact.

---

## 13. Evidence & limitations

- Live fetches: `https://www.yottostones-bg.com` (home, `/materials`, `/materials/1`, `/materials/1/1`, `/contact`, `/edges`, `/privacy-policy`, `/robots.txt`, `/sitemap.xml`), 20 Oct 2026.
- RTDB aggregates: catalogue (184 materials, 118 source URLs), document settings, order/request counts.
- Competitor pages fetched 20 Oct 2026 (see `02`).
- DuckDuckGo HTML (Bing index) used as an index proxy because Google/Perplexity/ChatGPT interfaces were blocked in this environment. AI-answer visibility could not be directly measured; a manual protocol is defined in `03`.
- No GA4/GSC/CrUX/PSI data. No customer interviews or session recordings yet.
- Third-party review data (4.9/28) is from ZlatnaFirma’s 12 Apr 2026 scan; verify in GBP.

---

## Appendix — key files

| Area | Files |
|---|---|
| Global metadata/schema | `src/app/layout.tsx`, `src/lib/seo/site.ts`, `src/components/seo/JsonLd.tsx` |
| Catalogue pages | `src/app/materials/**`, `src/components/pages/materials/MaterialDetailClient.tsx`, `MaterialGroupClient.tsx`, `MaterialsOverview.tsx`, `MaterialDetailPremium.jsx` |
| Header/footer | `src/components/common/Navbar9.jsx`, `Footer1.jsx`, `PageHeader.jsx`, `Contact14.jsx` |
| Calculator/leads | `src/components/pages/materials/PriceCalculator.tsx`, `src/app/api/quote/**`, `src/app/api/requests/route.ts` |
| Data | `src/hooks/useMaterialsLoader.js`, `src/lib/firebase.js`, RTDB |
| SEO infra | `src/app/robots.ts`, `src/app/sitemap.ts`, `next.config.ts` |
| Admin/order engine | `src/lib/orders/**`, `src/components/admin/**` |
