# Rooftop Solar India — tools

Free calculators that tell an Indian homeowner what rooftop solar costs them,
what the government pays, and what they save — for their state, city and DISCOM.

**Phase 0 of [the spec](./rooftop-solar-tools-spec.txt): shipped.**

- Numbers engine — subsidy, state top-ups, cost curve, generation for 100
  cities, tariffs, loans, net-metering rules, sizing, 25-year savings
- T1 subsidy calculator, T2 bill-to-size, T3 savings & payback, T5 loan EMI
- Server-rendered WhatsApp/OG result cards + short share links
- 36 state subsidy pages, 40 city price pages, all statically generated
- Lead capture with enforced consent, into a Google Sheet
- English only. Eight languages are Phase 1.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values you have
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build; prerenders all 92 pages |
| `npm test` | Engine test suite (65 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

### Environment

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URLs, sitemap URLs, OG image URLs, `wa.me` links. Unset, the build reads the host's own address (Netlify `URL`/`DEPLOY_PRIME_URL`, Vercel `VERCEL_URL`) and falls back to the Netlify site — resolved in `next.config.ts` so server and browser agree |
| `NEXT_PUBLIC_ALLOW_INDEXING` | to launch | `"true"` opens the site to crawlers. Off by default: `robots.txt` disallows everything, pages carry `noindex`, the sitemap is empty |
| `NEXT_PUBLIC_GOATCOUNTER` | no | GoatCounter endpoint; defaults to the project's own. Loaded only on the production deploy |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | no | Forces analytics on/off; otherwise follows the deploy context |
| `NEXT_PUBLIC_GA_ID` | no | Optional GA4. GoatCounter is what actually runs; setting this makes `/privacy` incomplete |
| `SHEETS_WEBHOOK_URL` | in production | Apps Script web app; see `scripts/leads-apps-script.gs`. `/api/lead` returns 503 rather than dropping a lead silently |

#### Wiring up lead capture

1. Deploy `scripts/leads-apps-script.gs` as a Google Apps Script **Web app** — `Execute as: Me`, **`Who has access: Anyone`**.
2. Put the resulting `/exec` URL in `SHEETS_WEBHOOK_URL` on the host, then **trigger a redeploy** — Netlify bakes env vars in at build time.
3. Confirm with a real POST; `{"ok":true,"persisted":true}` plus a new sheet row means it is live.

The two failure modes, both of which look identical from the browser:

| Symptom | Cause |
|---|---|
| `503 Lead capture is not configured.` | `SHEETS_WEBHOOK_URL` not visible to the function — unset, or set without a redeploy |
| `502 Could not record that.` | The webhook itself rejected the call. Check the function log: a 403 means the Apps Script deployment is not set to `Anyone` |

`/api/lead` inspects the Apps Script response *body*, not just its status, because Apps Script answers `200` with `{ok:false}` when its own `doPost` fails. Trusting the status alone would show the user "Done" while the lead was dropped.

### Deployment

Hosted on Netlify at [rooftopsolarindia.netlify.app](https://rooftopsolarindia.netlify.app). Netlify's free plan permits commercial projects; Vercel's Hobby plan does not, and this product monetises through installer and bank referrals from day one.

**The site is deliberately noindexed until the domain is settled.** `NEXT_PUBLIC_ALLOW_INDEXING` is the single switch. The reasoning is in `src/lib/site.ts`: the ranking moat is a programmatic inventory compounding authority on one hostname, and being indexed under a temporary `*.netlify.app` address turns launch into a migration.

## Architecture

### The numbers engine is the product

Everything numeric lives in `src/data/solar-engine` and nothing else computes.
A landing page's headline, the FAQ answer three sections below it, and the
calculator embedded on the same page all call the same functions — which is the
only way they stay consistent as the data changes.

```
src/data/solar-engine/
  index.ts        re-exports + ENGINE_VERSION + the estimate disclaimer
  types.ts        every shape, with the spec section each one implements
  subsidy.ts      central CFA, GHS/RWA rate, state top-ups, BPL, income ceilings
  cost.ts         installed-cost curve, state adjustment, add-ons
  generation.ts   kWh/kWp by city, 12 monthly factors per region, CO2/trees
  tariffs.ts      slab billing, bill→units inversion, slab-aware offset value
  net-metering.ts export valuation: retail 1:1, banking charges, APPC, lapse
  loans.ts        bank table, EMI, collateral-free cap
  sizing.ts       bill→kW, roof→kW, standard sizes, sanctioned-load cap
  savings.ts      25-year projection, payback
  format.ts       Indic formatting — lakh/crore, never 100k
  sources.ts      every source URL, keyed
  tables/         the data: states, cities, top-ups, discoms, regions, rules
```

Two design decisions worth knowing before you edit it:

**Every figure is dated and graded.** Records carry `lastVerified` and
`confidence`. `approximate` renders a visible badge next to the number on the
site. Quoting an exhausted state scheme is the fastest way to lose a reader, so
the trust furniture is structural rather than editorial. See
[VERIFY.md](./VERIFY.md) for what is still an estimate and why.

**Bill savings and export income are different money.** Self-consumed units are
priced by recomputing the bill without them, so they erase the top slabs first.
Under net metering, exports net 1:1 — but only against units the household still
buys, and those sit in the *lower* slabs by then, so they are priced the same
way rather than at the pre-solar marginal rate. Only genuine surplus beyond
annual consumption is settled at APPC, or lapses in Bihar and Odisha. Under net
billing (UP, Tamil Nadu) nothing nets and every exported unit is bought at APPC.

That distinction is not pedantry. It is the difference between a Chennai
household appearing to save more than its entire bill and the site telling it
the truth: an 11.6-year payback, because Tamil Nadu gives 100 free units and
buys exports at wholesale. The test suite encodes both invariants.

### Rendering

Next.js 15 App Router, static-first. All 92 pages prerender; the only dynamic
routes are `/api/og`, `/api/lead` and `/r/[token]`. Tool prefill is read from
the query string on the *client*, inside a Suspense boundary, so the pages
themselves stay static — the LCP budget is 1.5s on 4G and this niche is
mobile-first on cheap bandwidth.

Charts are hand-written inline SVG with no chart library and no client JS. The
interaction layer is native `<title>` tooltips plus an adjacent table view, so
the data is reachable without hover or color.

### Share loop

`/api/og` renders result cards (1200×630 for link previews, 1080×1080 for
WhatsApp) from query params alone, so they are CDN-cacheable and need no
database. Short links encode the whole session inside the token
(`/r/{base64url}`), which means a shared link never 404s and reopens the tool
prefilled to the sender's city.

### Lead capture

`/api/lead` enforces the two product rules from the spec rather than trusting
the UI: nothing is accepted without explicit consent, and the consent text plus
timestamp are stored with the lead. No OTP in Phase 0 — rows carry
`phoneVerified: false` so the CRM can tell them apart once MSG91 lands.

## Adding a language (Phase 1)

`src/i18n/en.ts` holds every user-facing string for the tools and cards, with
`{name}` placeholders in ICU's simple-argument style. Adding a language is: add
`src/i18n/<lang>.ts`, install `next-intl`, move the routes under `/[lang]/`, and
self-host the Noto Sans subsets. Numbers stay Indic-formatted in every language.
No component hardcodes English.

## What is deliberately not here

T4 roof estimator, T6 city generation tool, T7 DISCOM navigator and T14
eligibility quiz are Phase 1. T10 vendor directory, T11 bill-upload OCR are
Phase 2. T9 society calculator and T12 underperformance checker are Phase 3.
The engine already carries the data several of them need — roof-area maths, per
state net-metering rules with consumer-facing gotchas, and the GHS/RWA subsidy
rate — so those tools are UI work, not data work.
