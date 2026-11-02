# Val-Mo Score & Status Customization with Weekly Factor Contribution

Interactive filtering controls for minimum Val-Mo score and qualification status, accompanied by inline dual-colored split bars that visualize the exact percentage contribution of Value factors versus Momentum factors at the weekly level.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections in Phase 1:
> - **Display Format**: Inline dual-color split bar with percentage labels (e.g., `Val 48% | Mo 52%`) rendered directly within the table's Val-Mo Score cell and candidate cards.
> - **Filter Controls**: Interactive **Minimum Val-Mo Score slider** plus **Status segmented buttons** (`All | Tier 5 Qualified | Watchlist | Disqualified`) positioned above the scrip table and screener.

---

## 1. Overview & Core Concept

### What It Does
The Value-Momentum (Val-Mo) methodology synthesizes fundamental margin of safety with technical trend confirmation:
1. **Weekly Value Factor Contribution (%)**:
   - Historical P/E discount relative to 5-year median ($\sigma$-distance).
   - PEG ratio quality ($< 1.0\times$ premium bonus).
   - Balance sheet strength (3-Year ROCE $> 16\%$, low Debt-to-Equity $< 0.5\times$).
2. **Weekly Momentum Factor Contribution (%)**:
   - 3-Month Mansfield Relative Strength (RS-3M vs. Nifty 500 benchmark).
   - Price position relative to ascending 50-DMA and 200-DMA.
   - Institutional delivery volume expansion ($> 1.5\times$ 30-day baseline).

This feature explicitly computes and renders the percentage weight of Value vs. Momentum for each scrip, allowing users to see at a glance whether a score is value-driven (deep margin of safety) or momentum-driven (relative strength breakout), while giving complete control to filter by score thresholds and qualification tiers.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Filtering by Val-Mo Score & Status**:
   - In Route 1 (Sector Hierarchy table) and Route 2 (Model Candidates), users find:
     - **Min Val-Mo Score Slider**: Interactive range from 0 to 95 with quick presets (`All (0)`, `Baseline (70)`, `High (80)`, `Elite (90)`).
     - **Status Segmented Control**: `All Types`, `Tier 5 Qualified`, `Watchlist`, and `Disqualified` buttons with live constituent counts.
2. **Reading the Weekly Contribution Split Bar**:
   - In the table's `VAL-MO SCORE` column, the single green bar is replaced with an elegant dual-tone segmented bar:
     - **Left Segment (Value)**: Cyan/Purple tint (`bg-cyan-500`) with text `Val 48%`.
     - **Right Segment (Momentum)**: Emerald tint (`bg-emerald-400`) with text `Mo 52%`.
   - Hovering displays precise point contribution (e.g., `Value: 44.2 pts | Momentum: 47.8 pts | Weekly Factor Split`).
3. **Status Column Enhancements**:
   - Status badge displays qualification tier with clear color coding and hover criteria explanation.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic Weekly Factor Decomposition**
  - *Chosen Approach*: Derive Value and Momentum sub-scores deterministically from existing quantitative scrip metrics (P/E discount + ROCE + D/E for Value; RS Mansfield + 50-DMA slope + Volume for Momentum).
  - *Why*: Ensures 100% mathematical fidelity to `RESEARCH.md` without requiring external black-box computations.
- **Decision 2: Inline Dual-Bar vs Tooltip-Only**
  - *Chosen Approach*: Render the split bar inline inside the table row so the user can scan factor balance across 20+ scrips simultaneously without clicking or hovering.
- **Decision 3: Unified Filter State across Hierarchy & Screener**
  - *Chosen Approach*: Add `minValMoScore` and `statusFilter` to state, making it accessible in the table filter toolbar and persistent across tab navigations.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Filter & Allocation State                       │
│  { minValMoScore: 0..95, statusFilter: 'all'|'tier5'|'watchlist' }     │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
         ┌──────────▼──────────┐          ┌──────────▼──────────┐
         │  Route 1: Hierarchy │          │  Route 2: Candidates│
         │  Scrip Data Table   │          │  Model Pick Cards   │
         └──────────┬──────────┘          └──────────┬──────────┘
                    │                                │
                    └───────────────┬────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │   Weekly Factor Evaluator   │
                     │  Value Sub-Score (0-50 pts) │
                     │  Momentum Sub-Score (0-50)  │
                     │  Split % = Val / Total      │
                     └──────────────┬──────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│ Inline Dual Split Bar     │               │ Filtered Result Table     │
│ [Val: 48%  |  Mo: 52%]    │               │ Matching Scrips & Counts  │
└───────────────────────────┘               └───────────────────────────┘
```

### Data Model Additions
```typescript
export interface ValMoFactorBreakdown {
  valueScore: number;       // e.g. 44.2
  momentumScore: number;    // e.g. 47.8
  valuePct: number;         // e.g. 48%
  momentumPct: number;      // e.g. 52%
}
```

### Component State Mapping
- `minValMoScore`: Number state (default: 0).
- `statusFilter`: `'all' | 'Tier 5 Qualified' | 'Watchlist' | 'Disqualified'`.
- `computeValMoBreakdown(stock: StockScrip)`: Utility function generating weekly value vs momentum percentages.
