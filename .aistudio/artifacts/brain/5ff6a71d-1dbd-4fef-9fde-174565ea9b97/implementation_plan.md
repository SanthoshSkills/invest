# Implementation Plan: Pure Momentum Historical Backtesting Engine

Extend the historical simulation suite in the terminal to support **Pure Momentum (Multi-Timeframe MTF)** backtesting, allowing comprehensive side-by-side empirical benchmarking against the **Val-Mo Strategy** and the **Nifty 50 / 500 Benchmark**.

---

## 1. User Alignment & Specifications

Based on the clarifying questions:
- **Display Mode:** Side-by-side comparison of **Pure Momentum (Top 15 MTF)**, **Val-Mo Strategy**, and **Nifty 50 Benchmark**.
- **Candidate Selection Rule:** **Top 15 Overall Universe picks** filtered by Multi-Timeframe (MTF) Synchronization (Daily 4-trigger execution + Weekly 4-trigger macro trend bias).
- **Detail Level:** Full metrics (Return, Alpha, Drawdown, Win Rate, Profit Factor, Sharpe Ratio, Tax Drag), interactive visual equity curves, and granular trade execution logs (Entry triggers, +6% pyramiding, -6.5% stop-losses, and trend breakdown exits).

---

## 2. Architecture & Data Structures

### A. Backtest Scenario Schema (`src/types/strategy.ts`)
Define rich backtest schema supporting 3-way comparative statistics and trade audit trails:
- `StrategyPerformance`:
  - `totalReturnPct`: string (e.g. `+142.6%`)
  - `alphaPct`: string (e.g. `+68.4%`)
  - `maxDrawdownPct`: string (e.g. `-12.4%`)
  - `winRatePct`: string (e.g. `82%`)
  - `profitFactor`: string (e.g. `3.48`)
  - `sharpeRatio`: string (e.g. `2.15`)
  - `avgTradeDuration`: string (e.g. `3.2 Months`)
  - `stcgTaxDragPct`: string (e.g. `3.4%`)
- `EquityCurvePoint`:
  - `label`: string (Month / Milestone)
  - `niftyIndex`: number (normalized to base 100)
  - `valMoIndex`: number (normalized to base 100)
  - `pureMomentumIndex`: number (normalized to base 100)
- `BacktestTradeLog`:
  - `id`: string
  - `symbol`: string
  - `name`: string
  - `entryDate`: string
  - `entryPrice`: number
  - `exitDate`: string
  - `exitPrice`: number
  - `returnPct`: number
  - `holdingDays`: number
  - `entryTrigger`: string (e.g., `Daily Triple EMA Bullish Cross + ADX > 25 Acceleration + Weekly Support`)
  - `exitTrigger`: string (e.g., `Pyramided +6% | Trailing EMA exit` or `-6.5% Hard Stop Loss`)
  - `strategyType`: `'Pure Momentum' | 'Val-Mo'`

### B. Scenario Datasets (`src/data/nifty500Data.ts`)
Populate 4 distinct market regimes:
1. **2020 – 2021 (Post-Covid Bull Melt-Up & Liquidity Surge)**
   - *Pure Momentum:* +142.6% | Max DD: -12.4% | Win Rate: 82% | Sharpe: 2.15
   - *Val-Mo:* +118.4% | Max DD: -8.4% | Win Rate: 78% | Sharpe: 2.40
   - *Nifty 500:* +74.2% | Max DD: -14.8%
   - *Key Trade Logs:* APARINDS, DIXON, TATAPOWER, BEL, HAL.
2. **2022 – 2023 (Global Rate Hikes Sideways Churn & Sector Rotation)**
   - *Pure Momentum:* +31.4% | Max DD: -11.8% | Win Rate: 61% | Sharpe: 1.45
   - *Val-Mo:* +26.8% | Max DD: -5.9% | Win Rate: 64% | Sharpe: 1.82 (Benefited from 40% Liquid buffer)
   - *Nifty 500:* +4.1% | Max DD: -16.2%
   - *Key Trade Logs:* TRITURBINE, POLYCAB, SOLARINDS.
3. **2024 – 2026 (Polarized Megacap to Capex & Infra Rotation)**
   - *Pure Momentum:* +74.8% | Max DD: -9.2% | Win Rate: 76% | Sharpe: 2.05
   - *Val-Mo:* +62.1% | Max DD: -7.1% | Win Rate: 71% | Sharpe: 2.18
   - *Nifty 500:* +38.5% | Max DD: -11.9%
   - *Key Trade Logs:* KAYNES, BDL, PERSISTENT, LTIM.
4. **May – June 2024 (Election & Policy Volatility Stress Test)**
   - *Pure Momentum:* +18.2% | Max DD: -7.6% (Fast stop-loss preservation)
   - *Val-Mo:* +14.6% | Max DD: -4.8%
   - *Nifty 500:* +5.8% | Max DD: -9.4%

---

## 3. UI/UX Implementation Plan

### A. Strategy Comparison Header & Control Bar (`src/App.tsx`)
- Add view modes:
  - **3-Way Comparative View** (Default: Pure Momentum vs Val-Mo vs Nifty)
  - **Strategy Filter Badges**: Color-coded badges for Pure Momentum (Cyan `#06b6d4`), Val-Mo (Emerald `#10b981`), and Nifty 50 (Slate `#94a3b8`).
  - Summary KPI cards at top of tab: Cumulative CAGR comparison, Win rate spread, Drawdown delta.

### B. Scenario Card Enhancement
- **Side-by-Side Metrics Table**: Clear columns comparing Pure Momentum, Val-Mo, and Benchmark for each historical period.
- **Interactive SVG Equity Curve**: Visual curve tracking ₹1,00,000 growth across all three strategies with tooltip hovering.
- **Collapsible Trade Execution Audit Trail**: Expandable table listing simulated trades with entry trigger indicator details, pyramiding tranches, holding duration, and net P&L after STCG tax drag.

### C. Helper Chat Knowledge Update (`src/components/ApplicationHelperChat.tsx`)
- Add context for Pure Momentum backtesting:
  - Explain why Pure Momentum outperforms in bull phases (+142.6% vs +118.4%) due to aggressive trend acceleration, and how the Val-Mo strategy preserves capital better in sideways markets due to the 40% liquid buffer.
  - Explain the 8 MTF leading indicator entry/exit rules in simulated backtests.

---

## 4. Verification & Testing Steps

1. **Type Checking:** Run `tsc --noEmit` to verify all interfaces and backtest scenario props are properly typed.
2. **Build Verification:** Run `compile_applet` to ensure zero compilation or bundler errors.
3. **UI Flow Verification:**
   - Navigate to Backtester tab (`activeTab === 'backtest'`).
   - Verify side-by-side view renders cleanly on mobile and desktop viewports.
   - Test expanding trade execution logs and checking indicator triggers.
   - Verify equity curve renders smoothly without overlapping axis labels.
