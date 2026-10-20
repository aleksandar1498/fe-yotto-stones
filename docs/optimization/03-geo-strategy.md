# 03 — GEO Strategy (Generative Engine Optimization)

> GEO is the primary strategic bet. It is not a trick set and cannot guarantee inclusion in AI answers. The goal is to be **retrievable, understandable, verifiable and citable** when a customer asks an AI assistant a commercial question about stone fabrication in Sofia or Plovdiv.

---

## 1. What GEO means here

AI answers are assembled from sources that can be:
1. **Crawled** (robots, HTML, status codes, sitemap),
2. **Rendered** (content in the initial HTML, not only after JS),
3. **Understood** (semantic structure, entities, schema, clear facts),
4. **Trusted** (original data, reviews, legal identity, corroboration),
5. **Cited** (unique, specific, quotable statements and pages).

Yotto currently fails **2 (rendering)** and **5 (originality)** on its 184 most valuable pages. Fixing those is the core of this strategy.

---

## 2. AI-discoverability audit

| Check | Result | Consequence |
|---|---|---|
| `robots.txt` | `User-Agent: * / Allow: / / Disallow: /admin, /api/` | AI crawlers are allowed by default |
| Named AI crawler rules | None | No deliberate policy; no accidental block |
| `llms.txt` | **404** | No curated AI index; Plovdiv Mramor already has one |
| Server-rendered material/group pages | **No** — “Loading materials...” / “Материалът не беше намерен...” | AI crawlers see no product facts |
| Crawlable internal links to materials | **No** on `/materials`; only client navbar + sitemap | Orphaned pages |
| H1 in server HTML (catalogue/contact) | **None** | Weak topical signal |
| Canonicals | Correct on sampled pages | Good |
| HTTP status / soft 404 | Unknown IDs return **200** + fallback | Index bloat/confusion |
| Sitemap | 194 URLs, 184 images; `lastModified` always “now” | Discoverable, but freshness is noisy |
| Structured data | Product (no offers), LocalBusiness (minimal), CollectionPage, Breadcrumb, Service | Partial; not answer-grade |
| Content originality | **118/184 descriptions inherited from partner Varovik (permitted); public source + 839 gallery URLs removed from RTDB 20 Oct 2026; 4/4 sampled descriptions still 100 % overlapping** | Duplicate text remains non-citable; rewrite |
| Entity clarity | “Yotto Stones” vs “Yotov Stone”; legal “Ц-М ЙОТТО ЕООД”; 3 phone numbers | Ambiguous entity |
| Answer content | No FAQ, price guide, comparisons, care/installation guides | Large content gap |

**Verdict:** the crawler door is open, but the room is empty. GEO work must start with **server rendering + unique content**, not with meta tags.

---

## 3. GEO principles for Yotto

1. **One page answers one commercial question.** A page about “подпрозоречни первази от мрамор в София” must answer size, price range, process, lead time, warranty and next step.
2. **Facts before adjectives.** Replace “лукс и елегантност” with dimensions, materials, prices, timelines, guarantees, project evidence.
3. **Every claim is verifiable.** Reviews, warranty, years, projects, certifications — link to evidence or remove.
4. **Original > aggregated.** AI engines and Google reward unique data; duplicated partner copy is still a citation liability.
5. **Entity consistency everywhere.** Same name, address, phones, description, URLs across site, GBP, OLX, directories, schema.
6. **No artificial GEO.** No fake reviews, invented prices, fake locations, cloaking or mass-generated pages.
7. **Measure or don’t claim.** AI attribution is noisy; use a fixed prompt panel + referral/lead fields, and label uncertainty.

---

## 4. AI-readable content architecture

### 4.1 Page templates

**A. Service + city page** (e.g., `/sofia/podprozorechni-pervazi`)
- H1: „Подпрозоречни первази от мрамор и гранит в София“
- 40–60-word answer block: what, materials, sizes, price range, lead time, warranty, next step.
- Key facts table: materials, thickness, max length, edge profiles, measurement, delivery, installation, warranty, payment.
- Price band + what affects it (material, thickness, edge, length, complexity).
- 4-step process with timings.
- 6–8 FAQs (visible + FAQPage schema).
- 3 project examples (real photos, dimensions, location, duration).
- Reviews (verified) + Google link.
- Internal links: materials, related services, Plovdiv page, price guide, contact/quote.
- CTA: quote form, phone, Viber/WhatsApp.

**B. Material page** (replace `/materials/1/1`)
- H1: grade + material type (e.g., „Верде – мрамор“); remove the duplicate group H1.
- Answer block: what it is, best uses, appearance, durability, care, price band (if publishable), availability.
- Facts: origin, surface, thickness options, slab sizes, applications, indoor/outdoor, slip resistance (if known), lead time.
- Unique 150–300-word expert description (replace inherited copy).
- “Where it works” (kitchen, bathroom, sills, stairs, fireplace, façade).
- “What affects the price”.
- FAQ (4–6).
- Related materials (same colour family / use case).
- Projects using this material.
- CTA: request a sample / quote.
- Schema: Product + Offer (if price/availability real) + Breadcrumb.

**C. Guide / comparison** (e.g., „Мрамор или гранит за кухненски плот“)
- H1 question, direct answer, decision table, cost ranges, pros/cons, maintenance, local availability, FAQ, CTA.
- Cite Yotto’s own project data and process; do not copy competitor articles.

**D. City hub** (`/lokacii/sofia`, `/lokacii/plovdiv`)
- Coverage, delivery/installation, local projects, local reviews, local lead times, local contact, service links.
- Only verified facts; do not imply a Plovdiv office if none exists. State “обслужваме Пловдив от София” if true and confirm with the owner.

### 4.2 Semantic HTML rules
- Exactly **one H1 per page**; H2 per section; H3 for sub-questions.
- Primary content in the **server-rendered HTML**, not behind client fetch.
- Descriptive `<title>`, meta description, canonical, OG.
- Tables for specs/prices; lists for steps; no text embedded in images.
- Internal links with descriptive anchor text (not “виж още”).
- Language `bg-BG`; if English pages are added, `hreflang`.

### 4.3 URL architecture
Current: `/materials/1/1` (no keywords). Recommended (with 301s):
- `/materials/mramor/verde` or `/materials/verde-mramor`
- `/uslugi/podprozorechni-pervazi`
- `/uslugi/kuhnenski-plotove`
- `/uslugi/stapala`
- `/uslugi/pragove`
- `/lokacii/sofia`, `/lokacii/plovdiv`
- `/sofia/podprozorechni-pervazi`, `/plovdiv/kuhnenski-plotove`
Preserve old URLs with 301; update sitemap/canonicals.

---

## 5. Entity optimization

### 5.1 Canonical entity record (use everywhere)
```
Yotto Stones (brand)
Ц-М ЙОТТО ЕООД (legal)
EIK 207239186 · VAT BG207239186
ул. „Владимир Зограф“ 121, 1229 София, България
+359 895 19 8805 · +359 885 05 3680 · yottostones@gmail.com
www.yottostones-bg.com
Google Business Profile: [CID/place URL]
```
Decide **one primary phone** (GBP) and list the others as secondary. Remove or reconcile +359 888 662 874 unless it is the sales line.

### 5.2 Consistency checklist
- Website footer/contact/schema `Organization`/`LocalBusiness`.
- Google Business Profile (name, category, address, phones, hours, services, photos, description, booking link).
- OLX seller profile (name, address, phones).
- Cybo, ibusiness.bg, ZlatnaFirma, polomap, directmap — correct/claim.
- Facebook/Instagram/LinkedIn/YouTube (add `sameAs` where real).
- Email signatures and PDFs (legal name, VAT, address).

### 5.3 Brand-collision handling
“Yotov Stone” (Mezdra) is a different B2B quarry. Use consistent “Yotto Stones” + “Ц-М ЙОТТО ЕООД” + Sofia address; add `disambiguatingDescription` in schema and an “About” paragraph that distinguishes the brand; target “Yotto Stones София” and material+service queries rather than the ambiguous “Yotov”.

---

## 6. Structured data strategy

Implement a single graph per page. Only describe visible content. No fabricated ratings/prices.

### 6.1 LocalBusiness / Organization
```json
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndGardenStore"],
  "@id": "https://www.yottostones-bg.com/#business",
  "name": "Yotto Stones",
  "legalName": "Ц-М ЙОТТО ЕООД",
  "taxID": "207239186",
  "vatID": "BG207239186",
  "url": "https://www.yottostones-bg.com",
  "logo": "…/logo.svg",
  "image": "…",
  "description": "Изработка и монтаж на изделия от естествен камък – плотове, первази, стъпала, прагове и облицовки.",
  "telephone": "+359895198805",
  "email": "yottostones@gmail.com",
  "address": { "@type": "PostalAddress", "streetAddress": "ул. „Владимир Зограф“ 121", "postalCode": "1229", "addressLocality": "София", "addressCountry": "BG" },
  "geo": { "@type": "GeoCoordinates", "latitude": 42.7297118, "longitude": 23.2787518 },
  "hasMap": "https://maps.google.com/?cid=…",
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "09:00", "closes": "17:00" }],
  "areaServed": [{ "@type": "City", "name": "София" }, { "@type": "City", "name": "Пловдив" }, { "@type": "Country", "name": "България" }],
  "priceRange": "€€",
  "sameAs": ["https://www.google.com/maps/…", "https://www.facebook.com/…", "https://www.instagram.com/…"],
  "foundingDate": "…",
  "knowsLanguage": ["bg", "en"]
}
```
Add `aggregateRating`/`review` **only** when verified reviews are visible on the page.

### 6.2 Product (material page)
- Keep `Product` + `BreadcrumbList`.
- Add `additionalProperty` for origin, surface, thickness, slab sizes, application.
- Add `offers` only with a real price/range and availability; otherwise omit (do not fake).
- Add `isRelatedTo`/`subjectOf` for guides/projects.

### 6.3 Service pages
`Service` with `serviceType`, `provider` (`@id` business), `areaServed` (Sofia/Plovdiv), `offers` (price range if real), `hasOfferCatalog` for service variants.

### 6.4 FAQPage
Use only where the questions/answers are visible and non-promotional. 4–8 per page. Do not mass-generate.

### 6.5 WebSite + SearchAction
Add if a public site search exists; otherwise keep `WebSite` only.

**Validation:** Schema Markup Validator + Google Rich Results Test; separate “valid schema” from “eligible for a Google rich result”. Record in CI/manual checklist.

---

## 7. Answer-oriented content plan

### 7.1 Priority question map

| Customer question (BG) | Intent | Page | Evidence Yotto can provide | CTA |
|---|---|---|---|---|
| Колко струва подпрозоречен перваз от мрамор? | Transactional | Price guide + service page | OLX anchor 15 €/lm; material/edge variables | Quote form |
| Мрамор или гранит за кухненски плот? | Commercial investigation | Comparison guide | Material properties, real projects, care | Sample/quote |
| Кои фирми правят плотове от камък в София? | Local commercial | Sofia hub | Address, reviews, projects, warranty | Quote |
| Къде да поръчам гранитни плотове в Пловдив? | Local transactional | Plovdiv hub | Delivery/installation coverage, local projects | Quote |
| Как се измерва и монтира каменен плот? | Informational | Process guide | 4-step process, installation checklist | Quote |
| Колко издържа импрегнирането на варовик? | Informational | Care guide | Product knowledge, warranty | Contact |
| Каква е разликата между варовик и травертин? | Comparison | Guide | Specs, photos, use cases | Sample |
| Може ли плот от камък с мивка и котлон? | Product question | Countertop page FAQ | Cutout options/pricing | Quote |
| Какви размери первази правите? | Spec | Service page FAQ | Max length/thickness, profiles | Quote |
| Работите ли извън София? | Local | Coverage page | Sofia/Plovdiv/nationwide | Quote |

### 7.2 Content brief template (per page)
1. Customer problem in one sentence.
2. Target query/prompt (BG + EN).
3. Direct answer (40–60 words) + key facts.
4. Evidence: own data, project, review, legal term.
5. Internal links (materials, services, city, guide, quote).
6. Conversion action.
7. Author/reviewer and date.
8. Uniqueness check: no competitor copy; original data.

### 7.3 Content inventory to build (first 12 weeks)
- 5 service pages (windowsills, countertops, thresholds, stairs, cladding/other).
- 5 application pages (kitchen, bathroom, windows, stairs, fireplace).
- 2 city hubs (Sofia, Plovdiv) + 4 city×service pages.
- Price guide (materials, edges, cutouts, installation) with ranges.
- 6 guides/comparisons (marble vs granite, limestone vs travertine, care, measurement, installation, cutouts).
- 10 project case studies.
- 184 material pages: unique 150–300-word copy, specs, FAQs, related links (start with top 20 by demand/stock).
- FAQ hub (30–50 real questions).

---

## 8. Citation-worthiness & authority

Publish things only Yotto can say:
- **Cutlist optimisation**: how slabs are nested, offcut reuse, 2-axis bridge-saw constraints, yield/offcut metrics per project (no client-confidential data).
- **Material provenance**: supplier/origin, slab sizes, surface/finish, batch variation policy.
- **Installation & measurement standards**: tolerances, substrate, expansion gaps, sealing/care.
- **Warranty & terms**: 24 months, 50 % advance, 14-day offer, what is covered/excluded.
- **Projects**: real photos, material, dimensions, location (with permission), duration, challenges.
- **Reviews**: verified Google reviews (with attribution) + count/rating.
- **Price transparency**: ranges and cost drivers; update quarterly.
- **People**: founder/workshop expertise (only with consent).

Third-party corroboration (legitimate, no fake):
- GBP, OLX, Cybo/ibusiness/ZlatnaFirma (claim and correct).
- Supplier/brand pages (if permitted), local architecture/design directories, trade associations, material brands.
- Local media/PR about projects or craftsmanship.
- Guest guides for interior/renovation publications.

---

## 9. `llms.txt` proposal

Serve `https://www.yottostones-bg.com/llms.txt` (static or route) with a concise, factual map. Example structure:

```
# Yotto Stones (Ц-М ЙОТТО ЕООД)
> Изработка и монтаж на изделия от естествен камък в София и Пловдив: кухненски и банкови плотове, подпрозоречни первази, прагове, стъпала, облицовки. Собствено производство, 24 месеца гаранция.

## Company
- Legal name: Ц-М ЙОТТО ЕООД, EIK 207239186
- Address: ул. „Владимир Зограф“ 121, 1229 София
- Phones: +359 895 19 8805, +359 885 05 3680
- Email: yottostones@gmail.com
- GBP: https://maps.google.com/?cid=…
- OLX: https://www.olx.bg/…

## Services
- [Подпрозоречни первази](https://…/uslugi/podprozorechni-pervazi): мрамор, гранит, варовик; дължина до …; цена от … €/л.м.
- [Кухненски плотове](…): гранит, мрамор, оникс; цена от … €/м²; монтаж.
- [Прагове](…), [Стъпала](…), [Облицовки](…)

## Materials
- [Мрамор](…), [Гранит](…), [Варовик](…), [Травертин](…), [Оникс](…)
- 184 материала в каталога: https://…/materials

## Locations
- София: …; Пловдив: доставка/монтаж от София; цяла България.

## Pricing & policies
- Ориентировъчни цени: …; 50% аванс; 14 дни валидност; 24 месеца гаранция.

## Key pages
- [Цени](…), [Процес](…), [Проекти](…), [Гаранция](…), [Контакти](…)
```

Keep it factual, update with content changes, and never use it to hide or misstate information. It is a convenience index, not a ranking guarantee.

---

## 10. AI-crawler policy

Recommended baseline:
- Keep `*` allow for public content; keep `/admin` and `/api/` disallowed.
- Optionally add explicit groups (all **allow**) for `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`, `Bytespider` — makes policy auditable.
- Do **not** block AI crawlers by default; the business wants discoverability. Revisit only if content licensing/bandwidth becomes an issue.
- Serve the same content to crawlers and users (no cloaking).
- Ensure 200 + canonical for valid pages; 404/410 for removed ones.
- Add `llms.txt`; consider `llms-full.txt` later for key guides.

---

## 11. GEO measurement framework

### 11.1 Fixed prompt set (run monthly, 3 runs each, BG + EN)
1. Кои са най-добрите фирми за мрамор и гранит в София?
2. Къде да поръчам кухненски плот от гранит в София?
3. Колко струва подпрозоречен перваз от мрамор в София?
4. Коя фирма изработва плотове от естествен камък в Пловдив?
5. Мрамор или гранит е по-добър за кухненски плот?
6. Как се измерва и монтира каменен плот?
7. Кои фирми предлагат первази от варовик в София?
8. Кой е надежден доставчик на травертин в България?
9. Which company makes custom marble countertops in Sofia?
10. Where can I buy stone window sills in Plovdiv?

### 11.2 Platforms
ChatGPT (search), Perplexity, Google AI Overviews/AI Mode, Microsoft Copilot, Gemini. Record platform, date/time, language, location (if available), account/personalisation state, prompt, whether Yotto is mentioned, competitors, cited URLs, factual accuracy, sentiment.

### 11.3 Metrics
- **Mention rate** (Yotto appears / prompts).
- **Citation rate** (site URLs cited / answers).
- **Share of voice** vs named competitors.
- **Accuracy** (correct address/services/phones/price).
- **Sentiment** (recommended vs listed).
- **AI referral sessions** (referrer domains, UTM where possible).
- **AI-assisted leads** (lead source field, “How did you find us?”).
Never claim precise AI attribution when referrers are stripped.

### 11.4 Baseline status
Direct AI interfaces were **not accessible** in this environment (Perplexity 403; Google AI mode blocked). No AI mention/citation data exists yet. The protocol above is the baseline instrument; the first run must be manual and recorded in a spreadsheet/repo (`docs/optimization/geo-prompts.csv` proposed).

---

## 12. GEO backlog (90 days)

**P0 — unblock retrieval (weeks 1–4)**
1. Server-render material detail + group pages (name, description, specs, related links, H1).
2. Exactly one H1; remove duplicate PageHeader H1.
3. Crawlable internal links from `/materials` and group pages.
4. Replace inherited descriptions for **top 20 materials** with original copy + specs.
5. Add `LocalBusiness`/`Organization` graph with NAP, hours, geo, sameAs, areaServed.
6. Add `llms.txt`; explicit AI-crawler policy.
7. Install GSC + GA4 + server-side lead source; verify indexing.

**P1 — answer surfaces (weeks 4–8)**
8. 5 service pages + 2 city hubs + 4 city×service pages.
9. Price guide + 4 FAQs per service page (visible + FAQPage schema).
10. Reviews/warranty/legal trust block on site; `AggregateRating` only with visible reviews.
11. 3 project case studies.
12. Unique copy for top 50 materials; Product `additionalProperty`/`offers` where real.
13. `Product`/`Service`/`FAQPage` validation in CI/manual checklist.

**P2 — authority (weeks 8–12)**
14. All 184 materials unique; related links.
15. 6 guides/comparisons, 10 projects.
16. Third-party citations/PR/directories; claim/correct listings.
17. English key pages (services + Sofia/Plovdiv) with hreflang.
18. Monthly prompt panel + iteration; content refresh cadence.

**Acceptance for P0:** `curl` of a material page returns the material name, unique description, specs and internal links **without JavaScript**; one H1; `llms.txt` 200; GSC shows pages discovered/indexed; schema validates.
