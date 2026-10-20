# 02 — Competitive Intelligence: Sofia & Plovdiv

> Observed **20 October 2026** from live public pages, DuckDuckGo HTML (Bing index) and competitor sitemaps/robots. Page metrics are snapshots, not ranking data. Ratings are analyst judgements (1–5) for prioritisation, not formal audit scores.

---

## 1. Method & limitations

- Fetched homepages and key service pages; parsed title, meta description, canonical, H1s, JSON-LD, word count, images/alt, forms, prices/FAQ/blog signals, city mentions.
- Ran Bulgarian buyer-intent queries on DuckDuckGo (Bing index) because Google/Perplexity/ChatGPT interfaces were blocked (403/consent) in this environment.
- Did not access paid SEO tools, backlink databases, GSC, or AI answer engines. No claim is made about exact rankings, traffic or backlinks.
- AI answers vary by platform, location, personalisation and time; see the manual protocol in `03-geo-strategy.md`.

---

## 2. Competitor map

### Sofia — direct
| Competitor | Positioning (observed) | Evidence |
|---|---|---|
| **Гранити Левенти / varovik-granit.com** | Raw-material partner/importer + fabricator (supplies Yotto; also sells finished products); granite, marble, limestone, travertine, technical stone; projects, blog, reviews | Sofia, ул. „Чепинско шосе“ 80; 10+ years claimed; 46 images (13 no alt); 1 H1; no schema; blog/projects/reviews |
| **Raimar / raimar.bg** | Family business 30+ years; garden/outdoor + stone; 700+ products; e-commerce, samples, showroom | Sofia showroom (ул. Борис Арсов 9), production Kresna; 5,913 words home; 2 H1s; 39 H2s; 204 links; FAQ + blog + 2 forms; free samples |
| **Stone Build / stonebuild.bg** | Kitchen countertops, own production in Sofia; heavy long-form SEO | 24,644 words on the granite-countertop page; 184 images (74 no alt); 2 H1s; no schema; blog/price mentions |
| **SMG Stone / stilmramorigranit.com** | Premium stone fabrication since 2005 | 696 words; 1 H1; `Organization` + `WebSite` schema; 24 images; no price/FAQ/blog/form |
| **Pietra / pietra.bg** | Stone marketplace/importer, 50+ manufacturers; design + installation | Sofia; e-commerce; 3,080 words home; 198 images; 4 H1s; no schema; prices |
| **Assemblix / assemblix.bg** | Kitchen countertop production/installation | Appears in countertop SERPs; service page |
| **Yotto Stones** | Fabricator, 184 materials, order/cutlist tooling | 184 material pages, **client-rendered only**; no form/calculator; no blog/FAQ/prices; 118 descriptions inherited from partner (public refs removed 20 Oct 2026) |

### Plovdiv — direct
| Competitor | Positioning | Evidence |
|---|---|---|
| **Plovdiv Mramor / plovdivmramor.com** | Importer/fabricator; granite, marble, travertine, technical stone; local SEO | Plovdiv (registration Pazardzhik); 4,824 words on granite countertops; 1 H1; 8 “Пловдив” mentions; **publishes `llms.txt`**; form; prices |
| **Monolit 1994 / monolit1994.com** | Own production of marble/granite products | Plovdiv, Рогошко шосе 51; 4,427 words; **no H1**; no schema; FAQ/blog; no form |
| **Aegean Mramor / aegeanmramor.com** | Importer/manufacturer of marble, granite, travertine, technical stone | Plovdiv, бул. „Асеновградско шосе“ 4004; 9,281 words; H1 “Начало”; **no meta description**; no schema; no form |
| **Lorita / lorita-bg.com** | Technical-stone countertops (adjacent) | Appears in Plovdiv countertop SERPs |

### Adjacent / regional
- **Slavev Stone / slavevstone.com** — Blagoevgrad; 10,376 words home; `Organization` schema; 62 images all with alt; price pages, projects, 3 forms. Competes for Sofia/Plovdiv leads via content and price pages.
- **Pametnik.net / emstonebg.com** — memorials; adjacent (same material, different intent).
- **Marketplaces:** OLX (Yotto’s active ad), alo.bg, Bauhaus, Daibau directory.
- **Brand collision:** **Yotov Stone / yotovstone.com** (ЙОТОВ СТОУН ЕАД, Mezdra) — B2B limestone quarry, multilingual, strong domain. Not a Sofia/Plovdiv countertop fabricator, but name-confusable in brand and English queries.

---

## 3. Observed page metrics (20 Oct 2026)

| Page | Words | H1s | JSON-LD | Images / no-alt | Price | FAQ | Blog | Forms | City mentions |
|---|---:|---:|---|---|---|---|---|---|---|
| varovik-granit.com | 1,503 | 1 | none | 46 / 13 | yes | yes | yes | 1 | Sofia 2 |
| raimar.bg | 5,913 | 2 | BreadcrumbList | 15 / 5 | yes | yes | yes | 2 | Sofia 4 |
| stonebuild.bg/granit page | 24,644 | 2 | none | 184 / 74 | yes | no | yes | 1 | Sofia 2 |
| pietra.bg | 3,080 | 4 | none | 198 / 17 | yes | no | no | 2 | Sofia 2 |
| stilmramorigranit.com | 696 | 1 | Organization, WebSite | 24 / 0 | no | no | no | 0 | Sofia 1 |
| plovdivmramor.com/granit | 4,824 | 1 | none | 3 / 1 | yes | no | no | 1 | Plovdiv 8 |
| monolit1994.com | 4,427 | 0 | none | 10 / 0 | no | yes | yes | 0 | Plovdiv (contacts) |
| aegeanmramor.com | 9,281 | 1 (“Начало”) | none | 38 / 3 | yes | no | yes | 0 | Plovdiv 1 |
| slavevstone.com | 10,376 | 1 | Organization | 62 / 0 | yes | no | no | 3 | Blagoevgrad |
| **yottostones-bg.com (home)** | 2,496 | 1 | LocalBusiness, WebSite | 13 / 1 | no | no | no | 0 | Sofia in meta |
| **yottostones-bg.com/materials/1/1 (SSR)** | ~466 chars | **0** | Product+Breadcrumb (metadata) | 3 / 1 | no | no | no | 0 | — |

> Yotto’s 184 material pages are the outlier: the server HTML contains “Материалът не беше намерен...”; after hydration there are 2 H1s and ~1,482 characters of text.

---

## 4. Search visibility (proxy)

DuckDuckGo HTML (Bing index), Bulgarian locale, 20 Oct 2026:

| Query | Prominent domains | Yotto present? |
|---|---|---|
| `первази от мрамор София` | Bauhaus, Raimar, Slavev Stone, OLX, Graniten Pametnik, alo.bg, Varovik | **No** |
| `гранитни плотове София` | Stone Build, Pietra, OLX, SMG Stone, Slavev Stone, Pametnik, EM Stone, Varovik, Daibau, Assemblix | **No** |
| `гранитни плотове Пловдив` | Plovdiv Mramor, Monolit 1994, alo.bg, OLX, Lorita, Aegean Mramor, Pietra, Facebook | **No** |
| `Yotto Stones София` | Yotto homepage, `/materials/1`, Yotov Stone, Cybo, ibusiness, polomap, ZlatnaFirma, directmap | **Yes** — only 2 site URLs |
| `site:yottostones-bg.com` | — | **No results returned** |

**Interpretation (confidence: medium):**
- Brand demand exists (directory listings, GBP, OLX), but organic product discovery is effectively absent in the Bing-indexed web.
- Competitors with server-rendered service pages and price content dominate commercial queries.
- Google may index more pages via JS rendering; GSC access is required to confirm. The AI/GEO risk remains regardless (see `03`).

---

## 5. GEO / AI-readiness comparison

| Signal | Yotto | Varovik | Raimar | Stone Build | Plovdiv Mramor | Slavev |
|---|---|---|---|---|---|---|
| Server-rendered product/service content | **No (184 pages)** | Yes | Yes | Yes | Yes | Yes |
| Descriptive keyword URLs | **No** (`/materials/1/1`) | Yes (`/kuhnenski-plotove...`) | Yes | Yes | Yes | Yes |
| `llms.txt` | **404** | 404 | 404 | 404 | **200 (All in One SEO)** | 404 |
| AI crawler access | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| Product/Organization schema | Product (no offers), LocalBusiness | None | Breadcrumb only | None | None | Organization |
| Long-form buying content | No | Moderate | Strong | Very strong | Strong | Strong |
| Price transparency | No | Partial | Partial | Partial | Yes | Yes |
| Reviews on site | **No** (4.9/28 off-site) | Yes | Yes (Google links) | No | No | No |
| FAQ | No | Yes | Yes | No | No | No |

**Conclusion:** robots are not the bottleneck; **retrievability and originality are**. Yotto’s content is both invisible (client-only) and duplicated (inherited from partner Varovik). Plovdiv Mramor is the only observed local adopter of `llms.txt`; others rely on server-rendered pages, long-form content and schema-lite structures.

---

## 6. Competitive strengths / weaknesses

### Where competitors outperform Yotto
- **Server-rendered, indexable service pages** with keyword URLs (all).
- **Long-form buying content** (Raimar, Stone Build, Plovdiv Mramor, Aegean, Slavev).
- **Price pages / ranges** (Slavev, Pietra, Plovdiv Mramor) — high-intent queries.
- **Reviews/projects on site** (Varovik, Raimar) vs Yotto’s off-site 4.9/28.
- **Forms/e-commerce** (Raimar, Pietra, Slavev) vs Yotto’s phone-only.
- **FAQ/guides** (Raimar, Varovik) vs none.
- **Plovdiv local relevance** (Plovdiv Mramor, Monolit, Aegean) — Yotto has zero.

### Where competitors are weak
- **Schema depth:** Varovik, Stone Build, Pietra, Plovdiv Mramor, Monolit, Aegean have **no JSON-LD**; SMG/Slavev only Organization. A correct LocalBusiness + Product/Offer + Service + FAQ graph is a differentiator.
- **AI-answer readiness:** only Plovdiv Mramor has `llms.txt`; no competitor publishes structured, citation-ready Q&A or original data.
- **Price clarity:** most hide prices or use “при запитване”; ranges and calculators are rare.
- **Content freshness/duplication:** many sites recycle manufacturer copy; original project data and verified specs are scarce.
- **Mobile/technical debt:** large image-heavy pages (Stone Build 184 images, Pietra 198), missing alt text (Varovik 13, Stone Build 74), multiple H1s.
- **Plovdiv service content:** local pages are material/category pages, not “service + city + price + process” answers.

### Yotto’s defensible advantages (under-exploited)
1. **Own production + cutlist optimisation** (deterministic 2D cutting stock, offcut reuse) — unique technical proof.
2. **4.9 / 28 Google reviews** — stronger social proof than most competitors show.
3. **24-month warranty, 50 % advance, 14-day offer, 12 written terms** — explicit risk reduction.
4. **184-material catalogue** (breadth) and live inventory/slab stock.
5. **Existing OLX price anchor** (limestone 10 €/lm, marble 15 €/lm, granite 25 €/lm) and free Sofia delivery on combined orders.
6. **Admin/order engine** that can support instant quotes, lead routing and production transparency.

---

## 7. Opportunity matrix

| Opportunity | Evidence | Yotto advantage | Effort | Impact |
|---|---|---|---|---|
| **Make 184 pages server-rendered + unique** | All competitors’ product pages are retrievable; Yotto’s are not | Catalogue breadth + own production | M | **Very high** |
| **Price guidance / calculator** | OLX ad already publishes 10/15/25 €/lm; competitors with price pages rank | Existing pricing engine + OLX anchor | M | **Very high** |
| **Plovdiv service pages** | Plovdiv queries return only local competitors; Yotto absent | Sofia production + delivery capability | M | High |
| **Reviews + warranty + legal trust block** | 4.9/28 and 24-month warranty exist but are invisible | Stronger proof than most | S | High |
| **Original technical content** (cutlist optimisation, offcuts, installation) | No competitor explains this | Unique | S–M | High (GEO citations) |
| **FAQ / buying guides** | Raimar/Varovik have some; most don’t | Material expertise | M | High |
| **Project case studies** | Varovik/Raimar show projects; Yotto doesn’t | Real projects exist in admin/photos | M | High |
| **Schema graph** | Most competitors have none | Can leapfrog technically | S | Medium–high |
| **`llms.txt` + answer blocks** | Only Plovdiv Mramor has llms.txt | First-mover in Sofia | S | Medium (strategic) |
| **English/export pages** | Yotov Stone dominates English brand; Yotto absent | None today | M | Medium (long-term) |

---

## 8. Sources, dates & confidence

| Finding | Source | Date | Confidence |
|---|---|---|---|
| Page metrics / schema / H1 / word counts | Live fetches of competitor pages | 20 Oct 2026 | High (snapshot) |
| SERP presence/absence | DuckDuckGo HTML (Bing index), BG | 20 Oct 2026 | Medium (single engine/day) |
| Yotto 4.9/28 reviews | ZlatnaFirma company page (Google Maps aggregation; scan 12 Apr 2026) | 12 Apr 2026 | Medium — verify in GBP |
| Yotto OLX prices | OLX ad 141630371 | 19 Oct 2026 | High |
| Yotto descriptions originated from partner Varovik | RTDB history + live comparison; public source/gallery refs removed 20 Oct 2026; 4 samples still 100 % token overlap | 20 Oct 2026 | High |
| Competitor addresses/locations | Competitor contact pages | 20 Oct 2026 | High |
| `llms.txt` presence | Direct HTTP checks | 20 Oct 2026 | High |
| AI answer visibility | Not directly accessible (403/consent) | 20 Oct 2026 | **Not measured** |

**Do not treat the 1–5 ratings as rankings.** They are a prioritisation aid based on observed page evidence, not a keyword-tracking dataset.
