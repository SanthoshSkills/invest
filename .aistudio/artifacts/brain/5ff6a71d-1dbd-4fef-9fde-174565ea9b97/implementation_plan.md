# Interactive Audit Cadence & Calibration Tracker

An interactive operational audit console embedded directly into the Knowledge & Strategy Hub under Route 5 (User Manual), providing real-time drift tracking, scheduled cadence countdowns (Daily, Weekly, Monthly, Quarterly), and automated portfolio compliance checks against RESEARCH.md rules.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your selections, the Audit & Calibration Tracker will be integrated directly into the **Knowledge & Strategy Hub (Route 5: User Manual)** with an interactive **Audit Schedule and Drift Alert widget**.
>
> - **Confirmed Placement**: Knowledge & Strategy Hub (Route 5 / User Manual) as an active top-level tab alongside Quickstart, Sparkline, Capital, Val-Mo, Regimes, and Raw Markdown Sync.
> - **Confirmed Functionality**: Real-time portfolio compliance evaluator, cadence countdown schedules, regime drift warning badges, and interactive "Execute Audit Check" action.

---

## 1. Overview & Core Concept

### What It Does
The **Audit Cadence & Calibration Tracker** bridges theoretical strategy rules with live portfolio operations. It explicitly visualizes and validates the four operational review cycles defined in `RESEARCH.md`:
1. **Daily Market Close**: Trailing 6.5% stop-loss threshold verification and +1.5$\sigma$ valuation ceiling trim monitoring.
2. **Weekly Close (Weekend Cadence)**: India VIX regime classification (sub-13 Complacent, 13–17 Goldilocks, 17–24 Transition/Caution, >24 Elevated Shock) and Sector Relative Rotation Graph (RRG) quadrant shifts.
3. **Monthly Inflow Cycle**: Allocation status for the ₹10,000 Tactical Staging Reserve and minimum 10% cash buffer audit.
4. **Quarterly & Semi-Annual**: Earnings hurdle compliance (ROCE/ROE > 16%, OCF/EBITDA > 70%) and semi-annual NSE index reconstitution dates.

### Target Audience & Persona
Long-term systematic investors adhering to disciplined Value-Momentum principles who require certainty that the live portfolio has not drifted away from the strategy formulas.

### Key Value
Eliminates ambiguity regarding when and how rules are audited. Instead of relying on manual mental math, users can inspect upcoming audit deadlines, review current drift indicators, and trigger an automated audit that validates all active scrips against quantitative constraints.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Navigating to the Audit Tracker**:
   - The user opens **Manual / Help** (Route 5) from the navigation bar.
   - A dedicated tab **"Audit & Drift Tracker"** (with clock/shield indicator) displays current audit health: *Status: Nominal (Zero Rule Breaches)* or *Drift Detected*.
2. **Inspecting Audit Cadences**:
   - The user views 4 distinct cadence cards:
     - **Daily Trigger Monitor**: Monitored stops, valuation ceilings, and high-water mark drawdowns.
     - **Weekly Regime Matrix**: India VIX reading (15.42 Goldilocks), Sector RRG status (Auto & Power Leading, IT Lagging), 50-DMA breadth.
     - **Monthly Inflow Staging**: Next inflow deployment date, cash buffer status (12.4% vs 10% floor).
     - **Quarterly Fundamental Audit**: Next earnings verification window, ROCE/OCF validation date.
3. **Interactive Audit Execution**:
   - The user clicks **"Run Portfolio Rule Audit"**.
   - The system evaluates every holding in the active portfolio against the 6 quantitative constraints in `RESEARCH.md` (Stop Loss, Valuation Ceiling, ROCE Hurdle, OCF/EBITDA, Regime Allocation Cap, Cash Floor).
   - Instant visual diagnostic table shows pass/warning/fail status with concrete metrics for each scrip.

### Visual Identity & Theme
- **Dominant Neutral Canvas**: Deep slate foundation (`bg-slate-950` / `bg-slate-900`) matching terminal aesthetic.
- **Structural Surfaces**: Subtle 1px borders (`border-slate-800`), dark card surfaces with single-elevation depth.
- **Accent Tokens**:
  - Green (`text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/30`): Fully compliant / nominal state.
  - Amber (`text-amber-400`, `bg-amber-500/10`, `border-amber-500/30`): Approaching threshold (e.g., drawdown between 5% and 6.5%, cash buffer near 10%).
  - Crimson (`text-rose-400`, `bg-rose-500/10`, `border-rose-500/30`): Rule breach / action required (stop-loss triggered).
  - Cyan (`text-cyan-400`): Active inspection tab and cadence timing indicators.
- **Typography**: Clean sans hierarchy (`Plus Jakarta Sans` / system sans) with strict tabular numerals (`font-mono tabular-nums`) for all percentages, prices, and countdown dates. Zero pills or decorative pulsing dots.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Audit Engine vs Backend Polling**
  - *Chosen Approach*: Dynamic in-browser rule evaluator operating against the loaded portfolio state, benchmark indices, and `RESEARCH.md` parameters.
  - *Why*: Instant latency, works seamlessly in static builds (e.g. GitHub Pages), and allows immediate "what-if" testing when seed funds or scrip prices are updated.
- **Decision 2: Placement in Knowledge Hub (Route 5)**
  - *Chosen Approach*: Embedded as a dedicated section in the Investor Manual rather than cluttering the primary macro or holdings view.
  - *Why*: Direct alignment with the user's explicit preference while keeping the primary dashboard focused on real-time execution.
- **Decision 3: Historical Audit Trail in Local Storage**
  - *Chosen Approach*: Persist the timestamp and outcome of user-initiated audit runs in `localStorage` so the user can verify when the last review occurred across sessions.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    UserManualView (Route 5)                  │
├──────────────────────────────────────────────────────────────┤
│ Navigation Tabs: Quickstart | Sparkline | ValMo | Regimes    │
│                  Specs | [ Audit & Drift Tracker ]  <── NEW  │
└──────────────────────────────┬───────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌──────────────────────────────┐
│     Cadence Schedule Cards    │   │   Live Rule Audit Engine     │
├───────────────────────────────┤   ├──────────────────────────────┤
│ • Daily: Stop Loss & Trim     │   │ Evaluates Active Holdings:   │
│ • Weekly: VIX & RRG Quadrants │   │ 1. Max Drawdown <= 6.5%      │
│ • Monthly: Inflow & Reserve   │   │ 2. P/E <= Median + 1.5σ      │
│ • Quarterly: Fundamental ROCE │   │ 3. Cash Buffer >= 10%        │
│ • Next Review Deadlines       │   │ 4. Regime Max Exposure       │
└───────────────────────────────┘   └──────────────┬───────────────┘
                                                   │
                                    ┌──────────────▼───────────────┐
                                    │    Audit Diagnostic Table    │
                                    │  Scrip | Metric | Rule | OK  │
                                    └──────────────────────────────┘
```

### Data Model & State
```typescript
interface AuditCadenceItem {
  id: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  title: string;
  interval: string;
  lastChecked: string;
  nextScheduled: string;
  triggerRules: string[];
  status: 'nominal' | 'warning' | 'alert';
}

interface HoldingAuditResult {
  symbol: string;
  companyName: string;
  pnlPercent: number;
  maxDrawdownFromPeak: number;
  peRatio: number;
  peHistoricalMedian: number;
  roce3Yr: number;
  stopLossBreached: boolean;
  valuationCeilingBreached: boolean;
  fundamentalHealthy: boolean;
  actionRequired: string | null;
}
```

### Component & State Mapping
- `AuditTrackerTab`: The tab component inside `UserManualView.tsx`.
- State hooks:
  - `lastAuditTimestamp`: Last audit run time, hydrated from `localStorage`.
  - `activeAuditFilter`: Filter table by 'All', 'Action Required', or 'Compliant'.
  - `handleRunAudit()`: Re-computes drawdown from high-water mark, compares against trailing stop thresholds, checks current cash ratio against 10%, and updates audit health report.
