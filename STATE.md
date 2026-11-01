# Project State: Nifty 500 Regime & Val-Mo Strategy

## 1. Capital & Inflow Architecture
- Initial Base Capital: ₹1,00,000 (100% cash delivery, CNC only, no leverage/MTF).
- Systematic Inflow: ₹10,000 added monthly into a Tactical Staging Pool (Liquid BeES / Cash).
- Position Sizing Floor: No micro-positions below ₹10,000 (prevents DP charge drag). Minimum initial position size is ₹15,000 to ₹20,000.
- Portfolio Concentration: Capped at 5 to 7 stocks maximum. As capital expands toward ₹2,20,000 in Year 1, scale position sizes rather than adding more stock names.

## 2. Investment Philosophy: Integrated Value-Momentum (Val-Mo)
- Strategy: Identify companies at the intersection of depressed valuations (margin of safety) and operational/price inflections (the catalyst).
- Wave Riding & Scaling Rule: Do not exit winners fully on P/E expansion alone. Trim 33% to 50% when valuation reaches extreme levels (+1.5 std dev above 5-yr median) to de-risk principal, then trail the remainder using moving averages (weekly 10-EMA / daily 50-DMA) to capture multi-bagger momentum.

## 3. Dynamic Sector-to-Stock Screening Pipeline (NSE Hierarchy)
- Tier 1 (Macro Sector): Exclude macro-policy and regulatory headwind areas.
- Tier 2 (Sector): 14 NSE Sectoral Indices mapped via RRG. Screen only 'Improving' and 'Leading' quadrants (RS-Momentum > 100).
- Tier 3 (Industry): Operating leverage inflection (YoY EBITDA margin expansion, capacity utilization > 75%).
- Tier 4 (Basic Industry): Supply deficit, capex turnaround, or pricing power moats.
- Tier 5 (Stock Selection): P/E <= 5-year median + price reclaiming 50-DMA on >1.5x delivery volume.

## 4. Active Status (Late October 2026)
- Regime: Sideways / Transition.
- Active Task: Move from conceptual design to screener implementation.
