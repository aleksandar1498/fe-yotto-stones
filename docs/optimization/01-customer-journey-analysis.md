# 01 — Customer Journey & Conversion Friction

> Hypotheses are explicitly labelled. No customer interviews, recordings or analytics were available at audit time (20 Oct 2026). Validate before major redesigns.

---

## 1. Who buys, and why (personas — hypotheses)

| # | Persona | Core need | Triggers / search behaviour (BG) | Trust concerns | Typical objection | Preferred contact |
|---|---|---|---|---|---|---|
| 1 | **Sofia homeowner / renovator** | Window sills, kitchen countertop, thresholds; correct measure, fair price, clean installation | “первази от мрамор цена”, “плот за кухня гранит”, “подпрозоречни первази София” | Will measurements be right? Hidden costs? Will they show up? | “Твърде скъпо / не знам колко ще излезе” | Phone, Viber, quick quote |
| 2 | **Premium / design-led homeowner** | Unique stone, craftsmanship, exclusivity, material authenticity | Material names, “луксозен плот”, Instagram, designer referral | Is the stone real/unique? Will the result match the sample? | “Мога ли да видя материала и предишни проекти?” | Showroom, designer, WhatsApp |
| 3 | **Interior designer / architect** | Reliable fabricator, accurate drawings, samples, schedule, trade terms | “производител на плотове София”, “доставчик на мрамор”, referrals | Will they execute my design precisely? | “Работят ли с чужди проекти и чертежи?” | Email, phone, dedicated contact |
| 4 | **Kitchen studio / contractor** | Volume, repeatability, cutlist accuracy, installation coordination | “плотове от камък на едро”, “производство на плотове” | Capacity, deadlines, damage/rework | “Могат ли да поемат обем и срокове?” | Phone, direct B2B |
| 5 | **Plovdiv / regional customer** | Local supplier, delivery/installation, service | “мрамор Пловдив”, “гранитни плотове Пловдив”, “первази Пловдив” | Distance, after-sales support | “Работите ли в Пловдив? Кой ще дойде на замерване?” | Phone, Viber |
| 6 | **Urgent / small job** (threshold, single sill) | Fast answer, availability, rough price | “праг от гранит”, “перваз от мрамор цена” | Will they take a small order? | “Минимална поръчка?” | Phone/WhatsApp |

**Primary segment for the next 90 days:** persona 1 + 5 (Sofia/Plovdiv, windowsills/countertops/thresholds), with persona 3 as the highest-value repeat channel. Personas 2/4 matter for positioning and case studies but should not drive the first sprint.

---

## 2. Current journey, stage by stage

| Stage | What the customer experiences today | Friction | Business consequence |
|---|---|---|---|
| **Trigger / discovery** | Google/AI, referrals, OLX, Instagram. Website is practically absent from commercial SERPs; OLX ad ranks and shows prices. | No organic/AI visibility; brand collision with “Yotov Stone” | Demand leaks to competitors/marketplaces |
| **Landing** | Full-screen stone slideshow, H1 “Изберете качество и елегантност за вашия дом”, two CTAs (“Научи повече”, “Свържи се”). | Value proposition is generic; no city, no services, no price cue, no proof | Visitor cannot answer “why you?” in 5 seconds |
| **Exploration** | Material grid (client-rendered), category pages, material detail. Services are only a text block on home; no service pages. | 184 material pages show a loading/fallback state until JS + catalogue load; no H1; duplicated descriptions; no product/service landing pages | High bounce, low perceived professionalism |
| **Comparison** | No prices, no lead times, no case studies, no reviews, no warranty, no delivery/installation details. | Cannot compare on value; must call to learn basics | Price-sensitive users leave; serious users call with low confidence |
| **Trust** | Phone/email/address/map. 4.9/28 Google reviews exist **off-site**; 24-month warranty and 12 contract terms exist **only in PDFs**; legal entity not shown. | Trust is invisible at the moment of decision | Lower quote-request rate, more price-only calls |
| **Decision / quote** | “Поискай оферта” → `/contact` → phone/email. Calculator is **disabled**; no form, no callback, no Viber/WhatsApp, no upload. | Highest friction point: user must compose an email or call during working hours | **Zero online lead capture** |
| **Order** | Offline: measurement, quote, 50 % advance, production, installation. Admin tooling is solid. | No online confirmation/status, but acceptable for custom fabrication | No loss here; post-quote follow-up is manual |
| **Post-order** | PDF terms, 24-month warranty. No care guide, no review request flow, no referral programme. | Missed retention/review generation | 28 reviews only; growth depends on new demand |

---

## 3. Conversion friction audit by page

### Homepage
- H1 is emotional, not descriptive: no “первази, плотове, стъпки от мрамор и гранит в София”.
- No above-the-fold proof: years, projects, reviews, warranty, workshop.
- No price anchor or “how it works in 4 steps” near the CTA.
- Materials grid and “most valued” carousel load from Redux; initial HTML has no material cards/links.
- 28 images after hydration; hero uses two full-screen Firebase images with no dimensions → LCP/CLS risk.
- “Научи повече” scrolls to an about section; “Свържи се” goes to a contact page without a form.
- External hotlinked images (competitor/third-party) undermine credibility and control.

### `/materials`
- No H1 in server HTML; the catalogue grid is client-only; **no crawlable links to the 5 categories or 184 materials**.
- Intro copy is generic; no filtering by application (kitchen, bathroom, stairs, façade) or city.
- Cards on home use `alt="Relume placeholder image 1"`.

### `/materials/{group}`
- Server HTML: “Loading materials...”. No material cards, no H1.
- Only 6 items per “Зареди още”; crawlers never see the rest.
- Random header image (`Math.random`) → unstable visuals.

### `/materials/{group}/{material}`
- Server HTML: “Материалът не беше намерен...”. No name, description, specs or links.
- After hydration: two H1s (group + material), short copied description, origin/surface/sizes (when present), CTA “Запитване за този материал” → `/contact`.
- No price range, stock/lead time, samples, delivery, installation, care, comparison, FAQ, related materials, projects.
- 118/184 descriptions are duplicated from Varovik; images are copies.

### `/contact`
- No H1 in server HTML; no form; no callback request; no Viber/WhatsApp; no department contacts; no hours; no response-time promise.
- Map iframe only; phone links are the only conversion path.
- Legal entity, warranty and terms are not linked here.

### Global
- Footer: “© 2026 AS Tech” (wrong company), fake newsletter (`console.log`), no NAP, “Условия за ползване” → `/privacy-policy#data-usage`.
- Navbar: no direct “Калкулатор/Цени” link; material dropdown images lack alt; phone number small and low-contrast.
- English fragments (“Loading materials...”) in a Bulgarian experience.
- Unknown material IDs show a fallback message with HTTP 200 (soft 404).

---

## 4. Trust & credibility audit

| Asset | Exists? | Surfaced on site? | Recommendation |
|---|---|---|---|
| 4.9 / 28 Google reviews | Yes | **No** | Show rating + 3–6 verified quotes; add `AggregateRating` only with visible reviews; link to Google |
| 24-month warranty | Yes (document terms) | **No** | Publish a warranty page and a short badge near CTAs |
| 50 % advance, 14-day offer | Yes | **No** | Publish payment/offer terms |
| Legal entity, EIK, VAT | Yes | **No** (only PDFs) | Show in footer/contacts and `Organization` schema |
| Workshop / own production | Claimed implicitly | Not demonstrated | Photos, capacity, machinery, cutlist optimisation story |
| Project portfolio | No dedicated section | No | 6–12 real projects with material, location, scope, photos |
| Samples | Not offered online | No | “Заяви безплатна мостра” (Sofia/Plovdiv) |
| Delivery/installation coverage | Not stated | No | Sofia + Plovdiv + nationwide table with lead times |
| Team | No | No | Names/roles/experience (with consent) |
| Certifications / memberships | Unknown | No | Only if real and verifiable |

**Key insight:** the strongest trust assets already exist but are invisible. This is a content/CRO problem, not a credibility problem.

---

## 5. Mobile & accessibility friction

- Hero and catalogue rely on large images and client-side data; slow 4G users may see loading/fallback text.
- Phone CTA is present but small; no sticky call/Viber button.
- No mobile-friendly quote form (none exists).
- Navbar dropdowns are hover/click driven; mobile menu works but nested interactions are non-semantic.
- Missing/duplicate H1s, placeholder alts, low-contrast phone link, icon-only controls.
- No `prefers-reduced-motion` handling for Framer/Slick animations.

---

## 6. Prioritised conversion fixes

Scoring: impact 1–5, effort 1–5 (1 = low effort), confidence 1–5.

| # | Change | Impact | Effort | Confidence | Notes |
|---|---|---|---|---|---|
| C1 | **Add a real quote form** (name, phone, city, product, dimensions, qty, material, photo upload, consent) on `/contact` and material pages | 5 | 2 | 5 | Reuse `/api/requests` + admin inbox; no new backend concept |
| C2 | **Enable the calculator** (after validating pricing/flags) or replace it with a “rough price” form | 5 | 2 | 4 | Currently `settings/priceCalculator=false`; needs business sign-off |
| C3 | Add **Viber/WhatsApp + callback** buttons | 4 | 1 | 5 | Bulgarian market expectation; track clicks |
| C4 | Publish **price guidance** (“от X €/л.м.”) aligned with the OLX ad | 5 | 2 | 4 | High-intent queries; avoid misleading ranges |
| C5 | Surface **4.9/28 reviews + warranty + legal entity** | 4 | 1 | 5 | Trust at decision point |
| C6 | Rewrite homepage H1/value prop for services + Sofia/Plovdiv | 4 | 1 | 4 | SEO + clarity |
| C7 | Add **project/case gallery** with 6–12 real projects | 4 | 3 | 4 | Also GEO citations |
| C8 | Add **delivery/installation coverage** page/table | 3 | 1 | 4 | Plovdiv expansion |
| C9 | Fix footer (entity, NAP, terms, newsletter) | 2 | 1 | 5 | Hygiene/trust |
| C10 | Add **material sample request** | 3 | 2 | 3 | Premium segment |

**Do first:** C1 + C3 + C5 (fast, low risk, immediate lead capture/trust), then C2/C4 after business validation.

---

## 7. Research needed before scaling

1. **8–12 customer interviews** (recent buyers, Sofia/Plovdiv; windowsills/countertops).
2. **5 designer/kitchen-studio interviews** (B2B requirements, trade terms).
3. **Sales-call review**: 20 recent inbound calls — first questions, objections, lost reasons.
4. **Lost-quote analysis**: last 20 quotes, win/loss reason, response time.
5. **GBP insights**: calls, direction requests, messages, search queries.
6. **On-site qualitative**: 5–10 moderated mobile task tests (“find a granite countertop price and request a quote”).
7. **Analytics baseline** once GA4/GSC are installed (see `07`).

Until then, treat personas and funnel volumes as hypotheses. The low digital volume (6 orders / 3 requests in RTDB) means A/B tests are not viable in the next quarter; use sequential changes and qualitative validation.
