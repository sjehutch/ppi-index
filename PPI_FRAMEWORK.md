# framework.md — Political Pressure Index (PPI) Scoring Framework

This file tells Codex how to implement the **Political Pressure Index (PPI)** scoring model and the “AI wildcard” adjustment.  
Goal: produce a **0–100 score** per country per year (or quarter), plus a few sub-scores and flags that help explain *why* the score is high/low.

---

## When you’re unsure
- Choose the simplest approach that produces correct, explainable results.
- Prefer fewer inputs over more.
- Leave a short comment explaining the tradeoff.

---

## Codex-only rules (humans can ignore)
- Do not add new abstractions unless they remove real duplication.
- Keep the scoring function pure (no I/O inside it).
- Every input variable must have: name, unit, directionality, and default.
- If data is missing, use a documented fallback strategy (see “Missing data”).
- Output must include a human-readable explanation object.

---

## What we are building

### Core output
We compute, for a given `(country, year)`:

- `ppiScore` (number 0–100)
- `zone` (string): `"Stable" | "ReformPressure" | "ProtestZone" | "PreRevolutionRisk"`
- `subScores` (object): a few dimension scores (0–100 each)
- `inputsUsed` (object): the final normalized inputs (for transparency)
- `explain` (array of bullets): “Top drivers” (max 5 items)

### Zones (threshold bands)
- `0–55` = **Stable**
- `55–70` = **ReformPressure**
- `70–85` = **ProtestZone**
- `85–100` = **PreRevolutionRisk**

> Note: These are heuristics, not destiny. They represent likelihood of pressure showing up as protests/polarization and political instability.

---

## The model (simple but expandable)

### Dimensions (sub-scores)
We score 5 dimensions, each 0–100:

1) **Real Income Stress**  
2) **Youth & Labor Stress**  
3) **Housing / Cost of Living Stress**  
4) **Inequality & Fairness Stress**  
5) **Institutional Trust Stress**  

Then combine them with weights into `ppiScore`.

### Default weights (sum to 1.0)
- Income: `0.20`
- Youth/Labor: `0.20`
- Housing/CoL: `0.20`
- Inequality: `0.20`
- Trust: `0.20`

> If you want to keep it even simpler: keep equal weights unless the user asks to tune.

---

## Input variables and definitions

Each input is a *raw value* that we normalize into a 0–100 “stress score” where:
- `0` = low pressure from that factor
- `100` = high pressure from that factor

### 1) Real Income Stress
**Variable:** `realWageGrowth_3y`  
- Unit: percent change per year (inflation-adjusted wage growth averaged over last 3 years)
- Direction: **more negative = more stress**
- Example: `-1.5` is worse than `+1.0`

**Normalization suggestion (piecewise):**
- `>= +2%` → stress `0`
- `+2% to 0%` → stress `0..40` (linear)
- `0% to -2%` → stress `40..80` (linear)
- `<= -2%` → stress `100`

Optional helper input if wages data is missing:
- `realDisposableIncomeGrowth_3y` (same mapping)

### 2) Youth & Labor Stress
**Primary variable:** `youthUnemploymentRate`  
- Unit: percent (age 15–24 standard where available)
- Direction: **higher = more stress**

**Normalization suggestion:**
- `<= 8%` → `0`
- `8%..20%` → `0..70` (linear)
- `20%..30%` → `70..100` (linear)
- `>= 30%` → `100`

**Fallback variable:** `unemploymentRate` (overall unemployment)
- Use if youth is missing, but add an explanation note.

### 3) Housing / Cost of Living Stress
**Primary variable:** `housingCostShare`  
- Unit: percent of median household income spent on housing (rent or mortgage)
- Direction: **higher = more stress**

**Normalization suggestion:**
- `<= 25%` → `0`
- `25%..35%` → `0..60` (linear)
- `35%..45%` → `60..100` (linear)
- `>= 45%` → `100`

**Fallbacks (pick simplest available):**
- `rentToIncomeRatio` (same mapping)
- `homePriceToIncome` (convert to stress via a sensible mapping and comment)

### 4) Inequality & Fairness Stress
Pick one **primary** metric to keep it simple:

**Option A (recommended):** `gini`  
- Unit: 0..1 (sometimes 0..100; standardize)
- Direction: **higher = more stress**
- Mapping:
  - `<= 0.28` → `0`
  - `0.28..0.40` → `0..70`
  - `0.40..0.50` → `70..100`
  - `>= 0.50` → `100`

**Option B:** `top10Share` (top 10% income/wealth share)
- If using this, define thresholds and document them.

### 5) Institutional Trust Stress
**Variable:** `trustIndex`  
- Unit: 0..100 where 100 = high trust
- Direction: **lower trust = more stress**
- Stress = `100 - trustIndex`

If trust data is missing:
- Use a proxy: `governmentApproval`, `socialTrust`, or `ruleOfLaw` (but document which).

---

## Spark events (optional add-on)

Spark events don’t create pressure by themselves; they **amplify** existing pressure.

Represent sparks as:
- `sparkIntensity` (0..1) for a year  
- and optionally a list of `sparkEvents[]` with `{ name, weight }`

Examples:
- pandemic shock
- war escalation
- major corruption scandal
- severe policing incident
- sudden inflation spike

### Spark amplification rule (simple)
After base `ppiScore` computed, apply:

- `ppiWithSparks = clamp( ppiScore + (sparkIntensity * sparkMaxBoost), 0, 100 )`
- default `sparkMaxBoost = 10`

If `ppiScore < 55`, cap spark boost to `+3` (low-pressure societies absorb shocks better).

---

## AI wildcard (the “future cone”)

AI can reduce pressure or raise it. We treat it as an **adjustment** that modifies *some* dimensions.

### Inputs
- `aiAdoption` (0..1) — how widespread AI is in the economy/society
- `aiNetEffect` (-1..+1) — your scenario choice:
  - `-1` = AI strongly equalizes / reduces pressure
  - `+1` = AI increases inequality / job shock / distrust
- `aiPolicyQuality` (0..1) — how good governance is around AI (safety nets, education, regulation clarity)

If these inputs are not provided:
- Default `aiAdoption = 0` before 2022, then `0.2` in 2023, `0.35` in 2024, `0.5` in 2026 (demo defaults)
- Default `aiNetEffect = 0` (neutral)
- Default `aiPolicyQuality = 0.5`

### Which dimensions AI affects (keep it explainable)
AI adjustment should affect:
- Youth & Labor (job churn)
- Inequality (distribution effects)
- Trust (misinformation / institutional trust)

**Do not** adjust everything unless asked.

### AI adjustment formula (simple)
Compute an `aiImpact` term:

- `aiImpact = aiAdoption * (aiNetEffect) * (1 - aiPolicyQuality)`

Then apply it as a score delta to selected sub-scores:

- `laborDelta = aiImpact * 15`
- `inequalityDelta = aiImpact * 12`
- `trustDelta = aiImpact * 10`

Then recompute overall score.

> Intuition: if policy quality is high, it “dampens” the negative effect.

### Output
Return:
- `ppiBase`
- `ppiWithSparks`
- `ppiAiLow` (scenario where `aiNetEffect = -1` after 2022)
- `ppiAiHigh` (scenario where `aiNetEffect = +1` after 2022)

This creates the “AI cone”.

---

## Missing data strategy (must be deterministic)

Order of preference:
1) Use the exact variable if provided.
2) Use a declared fallback variable (per-dimension).
3) Use last known value (carry forward up to 3 years).
4) Otherwise use a neutral default and mark it in `explain`.

Neutral defaults (only if nothing else works):
- wage stress: 50
- labor stress: 50
- housing stress: 50
- inequality stress: 50
- trust stress: 50

Always include `missingDataFlags` in output if any fallback was used.

---

## Scoring steps (what Codex must implement)

For each `(country, year)`:

1) Normalize each raw input into a 0–100 stress score for each dimension.
2) Compute `ppiBase = weightedSum(subScores)`
3) Apply sparks → `ppiWithSparks`
4) Apply AI adjustment → `ppiAiAdjusted`
5) Also compute AI cone:
   - `ppiAiLow` with `aiNetEffect=-1`
   - `ppiAiHigh` with `aiNetEffect=+1`
6) Determine `zone` using thresholds.
7) Build `explain` list:
   - “Top drivers” = the largest 2–3 sub-scores + any sparks/AI impacts if meaningful.

---

## Recommended TypeScript shapes

### Raw inputs (per year)
- `realWageGrowth_3y?: number`
- `youthUnemploymentRate?: number`
- `unemploymentRate?: number`
- `housingCostShare?: number`
- `gini?: number`
- `trustIndex?: number`
- `sparkIntensity?: number`
- `sparkEvents?: { name: string; weight: number }[]`
- `aiAdoption?: number`
- `aiNetEffect?: number`
- `aiPolicyQuality?: number`

### Output
- `country: string`
- `year: number`
- `ppiBase: number`
- `ppiWithSparks: number`
- `ppiAiAdjusted: number`
- `ppiAiLow?: number`
- `ppiAiHigh?: number`
- `zone: "Stable" | "ReformPressure" | "ProtestZone" | "PreRevolutionRisk"`
- `subScores: { income: number; labor: number; housing: number; inequality: number; trust: number }`
- `inputsUsed: Record<string, number>`
- `missingDataFlags: string[]`
- `explain: string[]`

---

## Testing expectations (simple)

Codex must add small tests that assert:
- Outputs clamp to `0..100`
- Zone boundaries work
- Missing data fallback works
- AI cone produces `low <= base <= high` after 2022 (when adoption > 0)

---

## Notes / Philosophy

- This is not a prophecy machine.
- It’s a **consistent thermometer**: same inputs → same score.
- The point is to compare “pressure regimes” across time and places with explainable drivers.

---