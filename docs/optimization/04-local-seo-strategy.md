# 04 — Local SEO Strategy: Sofia & Plovdiv

> Priority: **Sofia first, Plovdiv second**. Plovdiv expansion must be confirmed operationally (measurement, delivery, installation, after-sales) before publishing local promises. Do not imply a Plovdiv office unless one exists.

---

## 1. Local search intent map

### Sofia (primary)
| Intent | Bulgarian queries (examples) | Latin variants | Landing page |
|---|---|---|---|
| Transactional / local | первази от мрамор София; подпрозоречни первази София; цена перваз мрамор София | pervazi mramor sofia; podprozorechni pervazi | `/sofia/podprozorechni-pervazi` |
| Transactional | кухненски плотове София; гранитни плотове София; плот от естествен камък София; цена плот гранит | kuhnenski plotove sofia; granitni plotove | `/sofia/kuhnenski-plotove` |
| Transactional | стъпала от мрамор София; мраморни стъпала цена; прагове от гранит София | stapala mramor; pragove granit | `/sofia/stapala`, `/sofia/pragove` |
| Commercial investigation | фирма за мрамор и гранит София; производител на плотове София; работилница за камък София | firma mramor sofia | `/lokacii/sofia` |
| Informational | мрамор или гранит за плот; как се импрегнира варовик; колко струва плот от камък | — | guides |

### Plovdiv (secondary)
| Intent | Bulgarian queries | Landing page |
|---|---|---|
| Local transactional | гранитни плотове Пловдив; мраморни плотове Пловдив; первази от мрамор Пловдив | `/plovdiv/kuhnenski-plotove`, `/plovdiv/podprozorechni-pervazi` |
| Local commercial | фирма за мрамор Пловдив; производител на плотове Пловдив; стъпала от мрамор Пловдив | `/lokacii/plovdiv` |
| Informational | цена плот от гранит Пловдив; монтаж на плот Пловдив | price guide + Plovdiv FAQ |

### National / broad
- изработка на изделия от естествен камък; плотове от камък; варовик; травертин; оникс; облицовки; каминни облицовки.
- English (future): marble countertops Sofia; granite countertops Bulgaria; stone window sills; custom stone fabrication Bulgaria.

**Rule:** every commercial page must answer a specific product + application + location + next step. Do not create city pages by swapping the city name.

---

## 2. Current local footprint

| Signal | Status | Action |
|---|---|---|
| Google Business Profile | Exists (map embed; 4.9/28 via ZlatnaFirma scan) | Claim/verify; audit categories, hours, services, photos, Q&A, messaging |
| Primary category | Unknown | Test closest categories: Stone supplier / Countertop store / Kitchen remodeler / Masonry contractor |
| NAP consistency | 3 phones; site footer has no NAP; “© AS Tech” | Choose primary phone; publish full NAP in footer + schema; correct all listings |
| Local pages | None | Build Sofia + Plovdiv hubs and city×service pages |
| Plovdiv content | **None** | Build only after operational confirmation |
| Reviews on site | None | Embed verified reviews; link to Google |
| Legal identity | Only in PDFs | Publish on contact/about/footer |
| Directory citations | Cybo, ibusiness, ZlatnaFirma (Gold Firm 2025/2026), polomap, directmap, OLX | Claim/correct; add sameAs |
| Brand collision | “Yotov Stone” (Mezdra) | Disambiguate; target “Yotto Stones София” |
| Schema areaServed | “BG” only | Add Sofia + Plovdiv + nationwide |
| GBP/website UTM | None | Add UTM to GBP website link |

---

## 3. Location page architecture

Adopt a shallow, stable structure (301 old URLs):

```
/lokacii/sofia
/lokacii/plovdiv
/sofia/podprozorechni-pervazi
/sofia/kuhnenski-plotove
/sofia/stapala
/sofia/pragove
/plovdiv/podprozorechni-pervazi
/plovdiv/kuhnenski-plotove
/uslugi/podprozorechni-pervazi        (national service page)
/uslugi/kuhnenski-plotove
/materials/...                         (catalogue, unchanged role)
```

**City hub content (minimum 700–1,000 words + proof):**
- H1: „Изделия от естествен камък в София“ / „… в Пловдив“.
- Coverage statement: workshop location, delivery area, measurement area, installation area.
- Services with links + price ranges (where publishable).
- 3 local projects (photos, material, dimensions, duration) — Sofia now; Plovdiv only when real.
- Local reviews (verified) and Google link.
- Lead times and process, including travel/measurement fees if any.
- NAP + map + hours + contact.
- FAQ (5–8 local questions).
- Schema: `LocalBusiness` (Sofia) / `Service` with `areaServed` (Plovdiv), `BreadcrumbList`.

**City×service page (minimum 600–900 words):**
- H1: service + material + city.
- Answer block (what, sizes, price range, lead time, warranty).
- Local proof (project/review).
- Price factors, process, FAQ, CTA.
- Internal links to material pages, guide, city hub, quote.

**Anti-thin-page rules**
- No page without unique local facts or proof.
- No fake addresses, offices, maps or reviews.
- No auto-generated city×service combinations until the core pages perform.
- If Plovdiv is served from Sofia, say so explicitly (travel time, measurement fee, installation window).

---

## 4. Google Business Profile (GBP)

**Must verify/complete**
- Business name exactly **Yotto Stones** (no keyword stuffing).
- Primary category + 2–4 secondary categories (stone supplier, countertop store, kitchen remodeler, masonry contractor — choose by actual services).
- Address: ул. „Владимир Зограф“ 121, 1229 София; pin accuracy.
- Service areas: Sofia, Plovdiv (only if served), nearby municipalities.
- Phones: primary +359 895 19 8805; secondary numbers only if answered.
- Hours, website with UTM, appointment/quote link, messaging.
- Services & products with descriptions and price ranges (aligned with OLX/site).
- 20+ photos: workshop, CNC/bridge saw, slabs, finished projects, team, showroom, before/after.
- Q&A: seed 8–12 real questions (price, lead time, delivery, warranty, materials, measurement).
- Posts monthly: project, material, offer, guide.
- Reviews: respond to all; ask every customer post-install; never gate/fake.
- UTM: `?utm_source=google&utm_medium=gbp&utm_campaign=local`.

**Tracking:** calls, direction requests, website clicks, messages, bookings; compare monthly.

---

## 5. Reviews strategy (ethical)

- Request after installation via Viber/SMS/email with a direct Google review link.
- QR card in the workshop/invoice; no incentives, no gating, no fake reviews.
- Respond within 48h; use owner responses to add facts (warranty, materials).
- Publish 6–12 verified reviews on site with name/date/source; add `AggregateRating`/`Review` schema **only** for visible reviews.
- Target +2–4 reviews/month; 50+ in 12 months; monitor rating and keywords in reviews (materials/services).
- Use review themes in content (“клиентите често питат…”), without inventing quotes.

---

## 6. NAP, citations & entity cleanup

| Platform | Action |
|---|---|
| Google Business Profile | Claim/verify, complete, UTM, reviews |
| OLX seller | Align name/phones/address/prices; link to site |
| Cybo / ibusiness.bg / ZlatnaFirma / polomap / directmap | Claim/correct name, address, phones, website, hours |
| Facebook / Instagram | Complete profiles, same NAP, link site, add to `sameAs` |
| Daibau / alo.bg / local directories | Only legitimate listings; consistent NAP |
| Supplier/brand directories | Where permitted; no paid link schemes |
| PDFs/email signatures | Legal name, VAT, address, phones |

**Primary phone decision:** publish one primary number (GBP/site/schema), list secondary numbers as “sales/workshop”. Remove or reconcile +359 888 662 874 unless it is actively used.

**Brand disambiguation:** add an About paragraph and schema `disambiguatingDescription`: “Yotto Stones (Ц-М ЙОТТО ЕООД) е работилница за изделия от естествен камък в София; не е свързана с „ЙОТОВ СТОУН“ АД (Mezdra).”

---

## 7. Bulgarian language & terminology

Use natural Bulgarian as customers search, not literal translations.

| Concept | Use | Avoid |
|---|---|---|
| Window sill | подпрозоречен перваз / перваз | “прозоречна дъска” |
| Countertop | кухненски плот / плот за баня | “работен плот” alone |
| Threshold | праг | “прагче” (diminutive) |
| Stair tread | стъпало | “стъпенка” |
| Edge | ръб / чело / кант | “борд” for edges |
| Chamfer | фаска | “скос” alone |
| Rounding | заобляне / R обработка | “закръгляне” |
| Build-up | подлепка | “удебеляване” alone |
| Drip groove | водооткапващ канал | “жлеб” alone |
| Impregnation | импрегниране / запечатка | “покритие” |
| Cutting plan | разкрой | “рязка” |
| Waste | фира | “отпадък” (use both with context) |
| Slab | плоча | “плоча” for tiles too — qualify |
| Installation | монтаж | “поставяне” |
| Measurement | замерване | “измерване” (less commercial) |

Include Latin transliterations in meta/URLs for users who type “mramor”, “granit”, “pervazi”, “plot”.

---

## 8. Local link & authority opportunities

- Architects, interior designers, kitchen studios, construction contractors, property managers — real partnerships/collaborations.
- Material suppliers/brands (if they publish partner lists).
- Local business associations, craft/industry directories, trade shows.
- Local media/PR: unique projects, cutlist optimisation, restoration/craft stories.
- Community projects, sponsorships, workshops (only if genuine).
- No paid link networks, fake guest posts or directory spam.

---

## 9. Local measurement

| KPI | Source | Baseline |
|---|---|---|
| GBP calls / directions / messages / website clicks | GBP Insights | Not available — set up |
| Local landing page sessions & quote starts | GA4 | None |
| “Sofia”/“Plovdiv” query impressions/clicks | GSC | No access |
| Local pack visibility (grid) | Manual rank grid / tool | Not measured |
| Reviews count/rating/response rate | GBP | 4.9 / 28 (third-party scan) |
| Form/phone leads by city | Lead source field, tel events | 3 requests all-time (RTDB) |
| Cost per lead (if ads later) | Ads + CRM | N/A |

**Order of operations:** publish NAP/GBP fixes → install analytics → launch Sofia hub + 2 Sofia service pages → measure 4 weeks → launch Plovdiv hub only after operational sign-off → iterate.
