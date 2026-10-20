# 07 — Analytics, Attribution & Business KPIs

> Current reality: **no GA4, GTM, GSC API, CRM attribution or AI-referral tracking**. The order database has no marketing source field. Measurement must be built before performance claims can be made.

---

## 1. What exists today

| Source | Available? | Notes |
|---|---|---|
| Google Analytics 4 | **No** | No `gtag`, GTM, or analytics script in production HTML |
| Google Tag Manager | **No** | — |
| Google Search Console | Verified file present (`public/googlee3e0834704a307ab.html`), **no API access** | Indexing/queries not audited |
| Vercel Speed Insights | Dependency present (`@vercel/speed-insights`), **no report access** | Verify script loads in production |
| Order/request database (RTDB) | Yes (admin) | 6 orders all-time; 3 requests; no source field |
| Google Business Profile | Exists (map/GBP; 4.9/28 via third-party scan) | Insights not audited |
| OLX | Active ad with prices | Platform insights not audited |
| AI referrals | **No measurement** | Referrers often stripped |
| CRM | No dedicated CRM; admin orders/requests | No lead source/lost-reason fields |
| Consent | Cookie banner + provider | Accept/decline only; no granular categories |

**Baseline status:** traffic, organic share, rankings, CVR, revenue-by-channel and AI mentions are **unknown**, not zero. Do not present estimates as facts.

---

## 2. Target measurement architecture

```
Visitor
  ├── GA4 (consent-gated) ──> events, pages, source/medium, city
  ├── GSC ──> queries, impressions, clicks, indexing, CWV
  ├── GBP Insights ──> calls, directions, messages, website clicks
  ├── OLX insights ──> views, messages, calls
  └── On-site events ──> quote form, calculator, phone/Viber/WhatsApp

Lead (order_requests)
  ├── source / medium / campaign / landing page / referrer
  ├── city, product, dimensions, preferred channel
  └── server event: lead_created (no PII)

Order (orders)
  ├── source inherited from lead or manual
  ├── status timeline (offer → won/lost)
  └── server events: order_created, order_completed
```

**Recommended stack:** GA4 + GTM (or `next/script` if GTM is not needed), Consent Mode v2, GSC, GBP Insights, Vercel Speed Insights/CrUX, Looker Studio dashboard. Avoid adding tools that will not be maintained.

---

## 3. Event taxonomy

| Event | Trigger | Parameters (no PII) | Destination |
|---|---|---|---|
| `view_item_list` | `/materials` / group view | list_name, items_count | GA4 |
| `view_item` | material page view | material_id, group, material_name | GA4 |
| `view_service` | service/city page | service, city | GA4 |
| `calculator_start` | first calculator interaction | material_id, page | GA4 |
| `calculator_quote` | estimate rendered | material_id, range_bucket | GA4 |
| `quote_form_start` | first field focus | page_type, city | GA4 |
| `quote_form_submit` | successful POST | product, city, source | GA4 + server |
| `quote_form_error` | validation/API error | error_type | GA4 |
| `phone_click` | `tel:` click | page_type, city | GA4 |
| `viber_click` / `whatsapp_click` | deep-link click | page_type | GA4 |
| `sample_request` | sample form submit | material_id | GA4 |
| `project_view` | case study view | project_id, material | GA4 |
| `review_click` | Google reviews link | page_type | GA4 |
| `lead_created` | server: `/api/requests` success | product, city, source (hashed IDs only) | GA4 Measurement Protocol / warehouse |
| `order_created` | admin saveOrder | order_id (internal), source | Server/warehouse |
| `order_completed` | status delivered/installed | order_id, value_bucket | Server/warehouse |

**Rules:** no names, phones, emails, addresses or free-text notes in analytics; hash internal IDs if needed; deduplicate; one `quote_form_submit` per submission; server events are the source of truth for leads/orders.

---

## 4. Lead source & attribution

Add to `order_requests` (or a parallel `lead_meta` node):
- `source`, `medium`, `campaign`, `content`, `term` (UTM).
- `landingPage`, `referrer` (host only, no query PII).
- `city`, `product`, `preferredChannel`.
- `gclid`/`fbclid` only if legally/operationally required; otherwise omit.
- `firstTouchAt`, `lastTouchAt` if a multi-touch model is desired.

UTM conventions:
- GBP: `utm_source=google&utm_medium=gbp&utm_campaign=local`
- OLX: `utm_source=olx&utm_medium=marketplace`
- Directories: `utm_source=cybo|ibusiness|zlatnafirma&utm_medium=directory`
- AI tests: `utm_source=ai&utm_medium=referral&utm_campaign=prompt-panel` (only for links you control; AI referrers usually strip UTMs).
- Email/Viber: consistent `utm_source=viber&utm_medium=outbound`.

AI referral detection:
- Referrer hosts: `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `www.google.com` (AI Mode hard to separate).
- Treat as **assisted/direct** unless the lead confirms; survey question: “Как ни намерихте?” with options (Google, AI assistant, OLX, Instagram, referral, other).

---

## 5. KPI framework

### Business outcomes
| KPI | Definition | Baseline | Target approach |
|---|---|---|---|
| Qualified leads | `lead_created` with valid phone + product | 3 requests all-time (RTDB) | Set after 4 weeks of instrumentation |
| Completed orders | `order_completed` | 6 orders all-time | Process target, not invented % |
| Revenue | sum of completed order totals | Internal only | Report internally; do not publish |
| CAC / revenue per visitor | spend ÷ leads; revenue ÷ sessions | Unknown | After 8–12 weeks |
| Quote→order rate | won quotes ÷ sent quotes | Unknown | Add lost-reason field |

### Conversion
| KPI | Definition | Baseline |
|---|---|---|
| Quote form start→submit | submits ÷ starts | 0 (no form) |
| Calculator start→request | requests ÷ starts | 0 (disabled) |
| Phone/Viber click rate | clicks ÷ sessions | Unknown |
| Lead response time | first reply − lead created | Not measured |
| Form abandonment | 1 − submit/start | Unknown |

### Visibility
| KPI | Definition | Baseline |
|---|---|---|
| Non-branded organic clicks | GSC query filter | Unknown |
| Indexed commercial pages | GSC Pages report | Proxy: DDG site: none; 194 sitemap URLs |
| Local pack visibility | grid/GBP | Unknown |
| AI mention rate | fixed prompt panel | Not measured |
| AI citation rate | cited URLs / prompts | Not measured |
| Review count/rating | GBP | 4.9 / 28 (third-party scan) |

### Technical
| KPI | Definition | Baseline |
|---|---|---|
| Core Web Vitals | CrUX/Speed Insights | Not accessible (PSI 429) |
| Server-rendered commercial pages | `curl` checks | **0/189** |
| Schema validity | validator | Partial |
| Crawl errors / soft 404s | GSC | Unknown |
| Indexing health | GSC | Unknown |

**Targets:** first set **process targets** (e.g., 100 % of commercial pages server-rendered; quote form live; GA4/GSC verified; 20 prompt runs/month). Only set outcome targets after 4–8 weeks of reliable data.

---

## 6. Reporting cadence

- **Weekly (15 min):** leads, calls/clicks, form errors, site uptime, new reviews.
- **Monthly (1 h):** GSC queries/pages, organic clicks, GBP/OLX, AI prompt panel, conversion funnel, content shipped.
- **Quarterly:** strategy review, content ROI, competitive re-audit, KPI targets.

Dashboard (Looker Studio): traffic/source, top landing pages, quote funnel, city/product split, CWV, GSC queries, GBP actions, reviews.

---

## 7. Data quality & privacy

- Consent Mode v2; no analytics cookies before consent (or cookieless pings); document legal basis.
- No PII in event parameters, URLs, or third-party tools.
- Server-side retention: leads/orders stay in RTDB (admin-only); export aggregates only.
- Spam protection: honeypot + rate limit (already in `/api/requests`); monitor bot submissions.
- Deduplicate leads/orders; test events in debug mode before launch.
- Document data owners, access, retention, deletion process (GDPR).
- If AI/chatbot is enabled later: explicit consent, data-flow review (OpenAI/Supabase), retention and opt-out.

---

## 8. Implementation checklist (first 2 weeks)

1. Create GA4 property + data stream; GTM container (or direct tag).
2. Consent Mode v2 + banner categories (analytics/marketing); test accept/decline.
3. Add `phone_click`, `viber_click`, `whatsapp_click`, `quote_form_*`, `calculator_*`.
4. Add lead source fields to `order_requests`; populate from UTM/referrer/landing page.
5. Server event `lead_created` (no PII) + dashboard counter.
6. Verify GSC property; submit `sitemap.xml`; monitor Pages/Queries/CWV.
7. GBP: enable messaging/booking; add UTM website link; record baseline insights.
8. OLX: record views/messages/calls baseline; add UTM to site link if allowed.
9. Set up Looker Studio dashboard and weekly alert for form/API errors.
10. Run first AI prompt panel manually; store results with conditions.

**Acceptance:** a test lead from each channel appears once in GA4 and once in admin, with correct source/city/product; no PII in analytics; consent respected.
