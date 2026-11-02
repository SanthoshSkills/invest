# Tasks & Execution Log

## Active Sprint (Next Session)
- [ ] Task 1: Finalize metric thresholds for Tier 3 (Industry EBITDA inflection) and Tier 5 (Stock Val-Mo screen).
- [ ] Task 2: Build Python script (`screener.py`) using `yfinance` to automate the 4-tier screening pipeline.
- [ ] Task 3: Implement staging pool logic for the ₹10,000 monthly inflow (pyramiding vs. new tranche rules).

## Completed Log
- [x] 2026-10-31: Defined 3 primary market regimes and 5 specialized market environments.
- [x] 2026-10-31: Established ₹1,00,000 baseline risk controls (stops, statutory fee mitigation).
- [x] 2026-10-31: Formulated dynamic headwind/tailwind framework (RRG rotation vs. static sector lists).
- [x] 2026-10-31: Locked hybrid Value-Momentum philosophy with staged scaling rules.
- [x] 2026-10-31: Integrated ₹10,000 monthly Staged-SIP capital inflow model.
- [x] 2026-10-31: Structured the 4-tier NSE classification screening pipeline.
- [x] 2026-10-31: Implemented interactive in-app Screener Trigger Run with live 5-stage pipeline animation and standalone web launch.
- [x] 2026-10-31: Implemented 30-day 50-DMA sparklines in candidate tables and multi-timeframe chart workbench (Daily, Weekly 10-EMA, Monthly Base, 14-ATR Renko).
- [x] 2026-10-31: Implemented dynamic 14-period ATR Renko chart engine with noise-filtering metrics, 10-brick EMA overlay, and multi-brick reversal triggers.
- [x] 2026-10-31: Enhanced Weekly timeframe view with true 10-period EMA overlay, safe corridor shading, +1.5σ valuation trim target, and Wave Riding scaling rules.
- [x] 2026-11-01: Implemented 4-State Secular Trend indicator (Weekly & Monthly 10-EMA co-alignment) and automated GitHub Pages CI/CD workflow.
- [x] 2026-11-02: Implemented interactive Audit Cadence & Calibration Tracker (Route 5 / User Manual) with 4 operational review cadences (Daily, Weekly, Monthly, Quarterly), live holding-level invariant checker, and volatility stress simulation.
- [x] 2026-11-02: Added customizable scrip selection controls (Overall Portfolio Ceiling: 3 to 15 stocks; Sector Concentration Cap: 1, 2, 3, or Unlimited) integrated across Capital Architecture Settings and the Candidate Screener view.

## Discarded / Rejected Ideas
- Permanent static sector blacklists: Rejected because sector headwinds/tailwinds are cyclical.
- Binary all-or-nothing momentum exits: Rejected to avoid selling secular compounders too early.
- Direct monthly ₹10,000 micro-purchases across multiple stocks: Rejected due to DP transaction fees and odd lots.
