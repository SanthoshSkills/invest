# Customizable Sector & Overall Scrip Selection Controls

A quantitative portfolio diversification control allowing users to configure both the maximum scrip selection limit per sector and the total overall portfolio ceiling. Controls will be accessible directly in the Capital Settings Modal and as live interactive controls in the Candidate Screener view.

## User Review & Critical Decisions

> [!IMPORTANT]
> In Phase 1, you confirmed the following configuration:
> - **Control Placement**: Dual-surface access—both inside the **Capital Settings modal** (`SeedFundModal`) and inline within the **Candidate Screener view** (`App.tsx` Route 2).
> - **Concentration Rule**: Cap scrips per sector with an overall portfolio ceiling, prioritizing top-ranked Val-Mo scores while preventing single-sector clustering (e.g. max 1, 2, or 3 per sector, up to $N$ total scrips).

---

## 1. Overview & Core Concept

### What It Does
The feature introduces two interactive concentration parameters to the Value-Momentum screening engine:
1. **Overall Portfolio Scrip Ceiling ($N_{overall}$)**: Defines the target count of qualified scrips selected for paper trading and capital deployment (default: 5, range: 3 to 15, or All).
2. **Per-Sector Concentration Cap ($M_{sector}$)**: Limits the maximum number of scrips that can be selected from any single macro sector (e.g. 1 per sector for maximum diversification, 2 for balanced growth, 3, or Unlimited).

When candidates are ranked by their composite Val-Mo score (0–100), the selection engine greedily accepts the highest-scoring stocks while enforcing the sector quota. Once a sector reaches its limit, subsequent scrips from that sector are classified as **"Reserve / Sector Capped"** rather than silently discarded, giving the investor total transparency into opportunity cost.

### Target Audience & Persona
Systematic investors who want to balance high-conviction factor momentum with strict risk diversification, preventing over-exposure to a single outperforming sector (like Power & Capital Goods).

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Adjusting Limits via Screener Toolbar (Route 2)**:
   - In Route 2 ("Strategic Model Candidates"), a new **Concentration & Selection Controls** bar appears directly above the candidate cards.
   - User adjusts:
     - **Overall Limit**: Interactive stepper or segmented pills (`3 | 5 | 7 | 10 | All`).
     - **Max / Sector**: Segmented toggle (`1 Max (Strict) | 2 Max (Balanced) | 3 Max | Unlimited`).
   - The candidate grid immediately updates:
     - **Primary Selected**: Highlighted with an emerald border and "Primary Model Selection (#1 to #N)" badge.
     - **Reserve / Capped**: Displayed with subtle amber/slate styling and an explicit tag (e.g. "Sector Cap Reached: 2/2 in Capital Goods").
2. **Configuring Limits via Capital Settings Modal (`SeedFundModal`)**:
   - The modal gains a dedicated **Sector & Portfolio Diversification** section.
   - Two linked sliders:
     - Target Portfolio Size: 3 to 15 stocks.
     - Maximum Scrips Per Sector: 1 to 4 or Unlimited.
   - Instant calculation preview: shows the effective lot size per stock and minimum capital allocation based on the selected count.
   - Saving persists the configuration across the app (`capitalConfig`).

### Visual Identity & Theme
- **Surfaces**: Consistent dark slate theme (`bg-slate-900/80`, `border-slate-800`), matching the terminal visual language.
- **Badges & Indicators**:
  - `Selected (#k)`: Emerald (`bg-emerald-500/10 text-emerald-300 border-emerald-500/30`).
  - `Sector Capped`: Amber (`bg-amber-500/10 text-amber-300 border-amber-500/30`).
  - `Above Ceiling`: Slate (`bg-slate-800 text-slate-400 border-slate-700`).
- **Typography**: Strict tabular numerals (`font-mono tabular-nums`) for counts, quotas, and share lots.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Greedy Val-Mo Ranking with Sector Quota**
  - *Chosen Approach*: Sort Tier-5 qualified candidates by descending Val-Mo score. Admit scrips until $N_{overall}$ is filled or $M_{sector}$ is reached for that sector.
  - *Why*: Ensures the absolute highest-conviction ideas are picked first while strictly preventing sector concentration risk.
- **Decision 2: Dual-Surface State Synchronization**
  - *Chosen Approach*: Store `maxScripsOverall` and `maxScripsPerSector` in `capitalConfig`, shared between `SeedFundModal` and `App.tsx`.
  - *Why*: Changing the slider on the screener immediately updates capital lot sizing calculations, and vice versa.
- **Decision 3: Transparent Reserve List Display**
  - *Chosen Approach*: Do not hide sector-capped scrips; render them in a secondary "Reserve Candidates" section with clear explanation.
  - *Why*: In systematic trading, knowing which stock is on deck if a leading holding triggers a stop-loss is critical.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CapitalConfig State                           │
│  { baseCapital, monthlyInflow, targetStockCount, maxScripsPerSector }  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         ┌──────────▼──────────┐          ┌──────────▼──────────┐
         │    SeedFundModal    │          │  Candidate Screener │
         │  (Capital Settings) │          │     (Route 2 UI)    │
         └──────────┬──────────┘          └──────────┬──────────┘
                    │                                │
                    └───────────────┬────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │   Sector-Capped Allocator   │
                     │  1. Sort by Val-Mo Score    │
                     │  2. Enforce M/sector cap    │
                     │  3. Enforce N total ceiling │
                     └──────────────┬──────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│ Primary Selected Basket   │               │ Reserve / Capped Scrips   │
│ (Allocated Lot Shares)    │               │ (Waiting for rotation)    │
└───────────────────────────┘               └───────────────────────────┘
```

### Data Model Updates
```typescript
export interface CapitalConfig {
  baseCapital: number;
  monthlyInflow: number;
  targetLiquidBufferPct: number;
  targetStockCount: number;
  minPositionSize: number;
  maxScripsPerSector: number; // 1 | 2 | 3 | 0 (0 = Unlimited)
}
```

### Component State & Handler Mapping
- `App.tsx`:
  - `capitalConfig`: Add `maxScripsPerSector: 2` (default 2 per sector, 5 total).
  - `classifiedCandidates`: Memoized computation returning `{ selectedScrips, cappedScrips, reserveScrips }`.
  - Inline controls in Route 2: Steppers and segmented buttons modifying `capitalConfig`.
- `SeedFundModal.tsx`:
  - New input row for "Sector Concentration Cap" with visual indicators.
