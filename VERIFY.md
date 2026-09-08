# Data verification backlog

The spec calls subsidy-data staleness the number-one trust risk (§12) and asks
for real effort on tariffs in Phase 0 (§2.5). This file is the honest ledger of
what is sourced and what is still an estimate, so nothing quietly hardens into
"the number we've always used".

Every figure in `src/data/solar-engine` carries `lastVerified` and
`confidence: "verified" | "approximate"`. `approximate` renders a visible badge
on the site. **Do not upgrade a figure to `verified` without pasting the primary
source URL into `sources.ts` and citing the document you read.**

---

## Blocking before a real launch

### 1. Tariff slabs — the big one
Ten states have slab tables (`SLAB_STATES` in `tables/discoms.ts`). They are
**composite all-in energy rates**, reverse-calibrated so the effective rate at
typical consumption matches the three anchors the spec quotes: Mumbai ~Rs 8,
DGVCL Gujarat ~Rs 5.5, KSEB slab 5 = Rs 8.10. They are **not** transcribed from
the SERC tariff orders.

For each of MERC, GERC, UPERC, RERC, KERC, TNERC, TSERC, DERC, KSERC and MPERC:
- [ ] Pull the current domestic LT tariff order.
- [ ] Transcribe the slab boundaries and energy charges exactly.
- [ ] Record wheeling charges separately if the DISCOM bills them separately —
      the current tables fold them into the energy rate, which is why a slab
      rate here may not match the order line for line.
- [ ] Confirm the fixed charge basis (flat vs per kW of sanctioned load).
- [ ] Confirm the electricity duty percentage.
- [ ] Confirm the APPC rate used for net-billing exports.

The 26 remaining states and UTs use a **single flat average effective rate**
(`FLAT_RATE_DISCOMS`). That is enough to size a system, not to predict a bill.
The city pages say so where it applies.

### 2. State top-ups
- [ ] Gujarat / GEDA — confirm Rs 10,000 flat for 1-10 kW is still live and
      still automatic after the central DBT.
- [ ] UP / UPNEDA — confirm Rs 15,000/kW to a Rs 30,000 cap, and the separate
      application requirement.
- [ ] Rajasthan / RRECL — confirm the 1-2 kW and 3 kW+ bands, the BPL
      enhancement, and **whether this year's budget is still open**.
- [ ] Haryana / HAREDA — amount is modelled as `varies: true` with no rupee
      figure. Find the current notification and the exact income ceiling.
- [ ] Delhi — generation incentive is modelled at Rs 2.50/kWh (range 2-3) for
      24 months. Confirm the rate, the eligibility window and the DISCOM
      claim process.
- [ ] MP / MPUVN — modelled as `varies: true`. Find the income bands.
- [ ] Re-check `NO_TOP_UP_STATES`: absence is asserted on the site, so a state
      that quietly launched a scheme is a wrong statement, not just a gap.

### 3. Costs
- [ ] `STATE_COST_ADJUSTMENT` has only the two factors the spec gives (Gujarat
      −5%, Delhi +8%). Every other state defaults to 0%. Pull the rest from the
      cost-benchmark source, or drop the mechanism and say costs are national.
- [ ] Re-check the anchor curve against live vendor quotes; module prices move.

### 4. Loans
- [ ] SBI 7.15%, Canara 7.30%, Union 7.35% are from the spec and marked
      verified. Re-check quarterly — these are floating.
- [ ] Bank of Baroda and Indian Bank rates are **guesses at 7.40%**, marked
      approximate because the spec lists the banks without rates. Get the real
      rates or remove the rows.

### 5. Generation
- [ ] The nine city figures the spec quotes verbatim are used exactly. The
      other 91 are placed inside their state/region band, which is a judgement
      call, not a measurement. Spot-check against the MNRE Solar Atlas.
- [ ] Uttarakhand, Himachal Pradesh and J&K are **not in the spec's state
      table** at all. Dehradun 1450, Haridwar 1480, Shimla 1500, Jammu 1500 and
      Srinagar 1400 are extrapolations. Source them properly.
- [ ] Known internal inconsistency in the spec itself: §2.4 puts the "Jaipur
      belt" at ~1,650 kWh/kWp but the city list says Jaipur = 1,700. We use
      1,700 (the explicit city figure). Resolve which is right.
- [ ] Ahmedabad (1575) and Gandhinagar (1580) sit above both Gujarat bands in
      the spec table, because central/north Gujarat is in neither. Confirm.
- [ ] Monthly profiles are calibrated to exactly two anchors — Mumbai July at
      ~37% of March, Jaipur July at ~58%. The other six regional profiles are
      shaped by hand. Replace with real monthly irradiance data.

### 6. Net metering
- [ ] Verified from the spec: Gujarat's Rs 1.5/kWh banking charge, UP and Tamil
      Nadu being net billing, Maharashtra's effective 999 kW cap, Bihar and
      Odisha annual lapse.
- [ ] Every other state uses defaults (net metering, annual settlement, surplus
      paid at APPC) and is marked approximate. Work through the SERC
      regulations state by state; this materially changes savings.
- [ ] `capKw` is null nearly everywhere. Residential caps are usually tied to
      sanctioned load — encode the real rule per state.

---

## Recurring, once live

- **Quarterly:** full pass over state top-ups and tariffs. Schemes pause when
  the annual budget runs out; that is normal and must be reflected via
  `status: "paused" | "exhausted"`, not left as `active`.
- **Automated:** diff the subsidy text on pmsuryaghar.gov.in against
  `subsidy.ts` and alert on drift (spec §10 refresh plan). Not built yet.
- **On every data change:** bump `ENGINE_VERSION` and revalidate the
  programmatic pages so cached HTML and cached OG cards do not disagree with the
  calculators.

## How to change a number

1. Edit the table in `src/data/solar-engine/tables/`.
2. Update `lastVerified` and `confidence`, and add the source to `sources.ts`.
3. Add or update an assertion in `__tests__/engine.test.ts` if the figure is one
   the spec pins (the suite deliberately encodes the spec's own worked examples,
   so a silent drift in Gujarat's Rs 88,000 headline fails the build).
4. Bump `ENGINE_VERSION` in `src/data/solar-engine/index.ts`.
