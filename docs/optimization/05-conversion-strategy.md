# 05 — Conversion Rate Optimization (CRO)

> The business does not need “more traffic” first; it needs **a working capture path**. Today the site has no online lead form and the calculator is disabled. Fixing that is higher leverage than any design polish.

---

## 1. Conversion model

```
Discovery → Landing → Material/Service exploration → Trust → Quote request → Measurement → Offer → Order → Installation → Review/referral
```

Primary conversions:
1. **Qualified quote request** (form/calculator) — main online KPI.
2. **Phone/Viber/WhatsApp contact** — tracked click.
3. **Sample request** (premium segment).
4. Secondary: project enquiry, B2B/trade enquiry.

Offline conversion (measurement → offer → order) happens in the admin. The site must hand over a **qualified, contactable lead with context** (product, dimensions, city, photos), not just an email.

---

## 2. Current funnel audit

| Stage | Current | Problem | Fix |
|---|---|---|---|
| Landing | Generic hero, 2 CTAs | No service/city/price clarity; no proof | New H1/subhead, proof bar, 3 clear actions |
| Explore | 184 material pages, client-only | Slow/fallback, duplicated content, no service pages | SSR + unique content + service/application pages |
| Trust | Phone/email/map | 4.9/28 reviews, warranty, legal entity invisible | Trust block + reviews + warranty + legal |
| Quote | CTA → `/contact` (no form) | **Dead end**; calculator disabled | Quote form + calculator + Viber/WhatsApp |
| Measure | Offline | No source/city/product context | Form fields + UTM + CRM source |
| Respond | Manual | No SLA/response template | Auto-ack + 1-business-day SLA |
| Review | Ad hoc | Few reviews | Post-install review request |

**Observed baseline:** 3 website requests all-time in RTDB (2 approved, 1 new); 6 orders all-time. Digital volume is too low for statistical testing; focus on removing obvious friction and instrumenting.

---

## 3. Homepage recommendations

1. **H1:** „Изработка на плотове, первази и стъпала от мрамор и гранит в София“ (service + materials + city). Keep brand in title, not the H1.
2. **Subhead:** own workshop, measurement, delivery/installation, 24-month warranty, 4.9/28 reviews.
3. **Proof bar:** 4.9★ Google (28), 24-month warranty, own production, Sofia/Plovdiv coverage.
4. **Three CTAs:** „Изчисли ориентировъчна цена“ (calculator), „Поискай оферта“ (form), „Обади се / Viber“.
5. **Price anchor:** “Первази от 10–15 €/л.м.; плотове от … €/м²” with a link to the price guide (align with OLX).
6. **Process:** 4 steps with timings (замерване → оферта → производство → монтаж).
7. **Projects:** 3 real case cards (material, city, scope, photo).
8. **Reviews:** 3 verified quotes + link to Google.
9. **Materials:** server-rendered cards linking to categories (currently none in HTML).
10. **Coverage/FAQ:** Sofia, Plovdiv, nationwide; 5 FAQs.
11. **Fix:** remove competitor/third-party hotlinked images; replace with owned project/workshop photos; optimize hero (dimensions, AVIF/WebP, priority, no CLS).

---

## 4. Product / service page recommendations

**Service pages** (new): windowsills, countertops, thresholds, stairs, cladding.
- H1 with service + material + city.
- Answer block + key facts table (sizes, thickness, edges, price range, lead time, warranty).
- Price factors; 4-step process; 6 FAQs; 2–3 projects; reviews; CTA; related materials.
- Schema: `Service` + `FAQPage` + `Breadcrumb`.

**Material pages** (fix existing 184):
- One H1 (material name), unique description, specs, applications, care, price band, FAQ, related materials/projects, sample/quote CTA.
- Replace inherited material copy; add original photos/specs.
- Server-render everything; descriptive URL.

**Application pages:** kitchen, bathroom, windows, stairs, fireplace — link materials ↔ services ↔ projects.

---

## 5. Ordering / quote workflow redesign

### 5.1 Quote form (ship first)
Place on `/contact`, service pages, material pages, city pages.

Fields (minimum viable):
- Name*, phone*, city* (Sofia/Plovdiv/other), product* (windowsill/countertop/threshold/stairs/cladding/other).
- Dimensions (length/width/qty) optional at first step; material optional; note.
- Photo upload (optional, ≤5 files, 10 MB each) — helps quoting.
- Preferred contact: phone/Viber/WhatsApp/email.
- Consent checkbox (GDPR) + honeypot + rate limit.
- Submit → `/api/requests` → `order_requests` → admin “Запитвания”; show thank-you with response SLA and phone/Viber.

UX:
- Start with **phone + product + city** (3 fields), then optional details (progressive disclosure).
- Inline validation, numeric keypad, no forced 0, clear errors.
- Mobile-first; sticky submit; no account required.
- Auto-acknowledgement (SMS/Viber/email) if possible.

### 5.2 Calculator
- Re-enable only after business validation of pricing and the “enabled” flag; add a clear “ориентировъчна цена” disclaimer.
- Show range + what affects it; CTA “Поискай точна оферта” carries the configuration into the form.
- Track `calculator_start`, `quote_shown`, `quote_requested`.
- If pricing cannot be public, replace with a 3-step “price estimate by phone/Viber” form.

### 5.3 Contact channels
- Sticky mobile actions: Call, Viber, WhatsApp, Quote.
- Click-to-call with event tracking.
- “Callback in 15 minutes” request during business hours (if operationally true).
- Response-time promise and named contact.

### 5.4 Trust at the point of submission
- 4.9/28 reviews, 24-month warranty, legal entity, address, “your data is used only to prepare the quote”, no spam.

---

## 6. Trust & credibility (CRO)

- Publish the 4.9/28 rating with source and date; 6–12 verified quotes.
- Warranty page: 24 months, what is covered/excluded, care requirements.
- Terms: 50 % advance, 14-day offer, measurement/installation conditions (from the 12 document terms).
- Legal identity: Ц-М ЙОТТО ЕООД, EIK/VAT, address, MOL.
- Workshop/production photos, machinery, team (with consent).
- Project case studies with scope/dimensions/duration.
- Delivery/installation coverage and lead times.
- Fix footer: correct copyright/entity, NAP, real newsletter or remove it, working terms link.
- Replace external hotlinked images with owned assets.

---

## 7. Mobile

- Sticky bottom bar: Call · Viber · Quote.
- Short form (phone-first), large tap targets, numeric keyboards, no horizontal scroll.
- Hero/catalogue images optimized (AVIF/WebP, dimensions, lazy below fold).
- Internal link cards with descriptive labels.
- Test on mid-range Android/4G; target LCP < 2.5 s, CLS < 0.1, INP < 200 ms.

---

## 8. Experiment backlog

| # | Hypothesis | Audience / pages | Change | Primary metric | Guardrails | Impact | Effort | Measurement |
|---|---|---|---|---|---|---|---|---|
| E1 | A visible quote form will create online leads where none exist | All visitors; contact + service/material pages | 3-field phone-first form → `/api/requests` | Quote submissions | Spam rate, page speed | 5 | 2 | GA4 events + CRM |
| E2 | Viber/WhatsApp reduce contact friction | Mobile, Sofia/Plovdiv | Sticky contact bar + click tracking | Contact clicks | Bounce | 4 | 1 | Event tracking |
| E3 | Price ranges increase qualified enquiries | Material/service/city pages | Price band + cost drivers | Quote starts | Misleading-price complaints | 5 | 2 | GA4 + sales feedback |
| E4 | Clear service+city H1 improves comprehension | Home | New H1/subhead/proof | Scroll depth, CTA click | Bounce | 3 | 1 | Sequential pre/post |
| E5 | Reviews + warranty increase trust | Home, service, contact | Trust block + verified reviews | Form start rate | None | 4 | 1 | Sequential |
| E6 | Calculator increases engagement/leads | Material pages | Enable calculator + carry config to form | Quote requests | Support load, pricing errors | 5 | 3 | Event funnel |
| E7 | Samples attract premium clients | Material pages | “Заяви мостра” | Sample requests | Cost per sample | 2 | 2 | Form source |
| E8 | Projects improve confidence | Home/service | 6–12 case studies | Quote requests | None | 4 | 3 | GA4 |
| E9 | Fewer fields increase completion | Quote form | Phone-first, progressive fields | Completion rate | Lead quality | 4 | 2 | Form analytics |
| E10 | Coverage clarity captures Plovdiv | Plovdiv pages | Delivery/installation terms | Plovdiv leads | Operational strain | 3 | 2 | City field |

### Low-traffic testing rules
- Do **not** run classic A/B tests with 3 requests/month; results will be noise.
- Use **sequential before/after** (4-week blocks), qualitative task tests, sales-call reviews, and micro-conversions (CTA clicks, form starts).
- Report uncertainty; never claim statistical significance without power.
- Prioritise fixes with obvious friction (no form, no prices, invisible trust) before micro-optimisation.

---

## 9. CRO roadmap

**Week 1–2 (ship):** quote form + Viber/WhatsApp/callback + trust block + footer/NAP fix + GA4 events.
**Week 3–4:** enable calculator (or replace with estimate form) + price guide + homepage H1/proof.
**Week 5–8:** service pages, price ranges, reviews on site, 3 projects, sample request.
**Week 9–12:** iterate on form completion, add Plovdiv pages after operational sign-off, test projects/FAQ placement.

**Primary KPI:** qualified quote requests per month (tracked by city/product/source). Secondary: phone/Viber clicks, calculator completion, sample requests, lead-to-offer rate, offer-to-order rate.
