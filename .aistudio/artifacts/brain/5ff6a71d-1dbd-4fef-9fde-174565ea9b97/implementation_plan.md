# Implementation Plan: Weekly Universe Turnover & Dynamic CMP Calibration Chat Integration

## 1. Overview & Context
The user requested clarification on whether the terminal's 32-scrip active universe changes week-on-week, and mandated that the CMP correction chat responses in the Strategy Assistant explicitly reflect this operational reality. Based on user selection, the terminal operates on a **dynamic Friday rotation model with automated CMP calibration for newly qualified entrants**, explaining the five qualification gates and risk calculations.

---

## 2. Proposed Changes

### Component Updates: `src/components/ApplicationHelperChat.tsx`
1. **Update Menu Question Item 11**:
   - Refine Title to: `Batch CMP synchronization & weekly universe turnover (32 scrips)`.
   - Update Prompt & Keyword Matchers to capture:
     - "Will the 32 scrips change week on week?"
     - "Does the universe rotate weekly?"
     - "How does CMP calibration handle newly entering scrips?"
2. **Expand Response Content for CMP Synchronization (Question 11) & Google Finance Analysis (Question 9)**:
   - **Week-on-Week Turnover Confirmation**:
     - Confirm that the 32 scrips are **not static or permanent**; they represent the active qualified cohort filtered from the broad Nifty 500 universe at the weekly close (Friday 15:30 IST).
   - **Friday Re-Screening Gates & Rotation Mechanics**:
     - Outline the 5 qualification gates: Tier 1 Liquidity/Turnover, Tier 2 Moat/Low Pledge, Tier 3 Fundamental Quality (ROCE ≥ 16%), Tier 4 Valuation Buffer or Pure Momentum MTF indicators, and Tier 5 Execution (50-DMA reclaim / Weekly Triple EMA support).
     - Detail exit triggers: Scrips exit the active pool when their sector rotates into Lagging/Weakening quadrants, when momentum exhaustion triggers a weekly EMA breakdown, or when a -6.5% stop-loss is hit.
     - Detail entry triggers: Newly inflecting scrips from qualified sectors rotate in to fill sector quotas.
   - **Automated CMP Calibration for New Entrants**:
     - Explain how newly inducted scrips are immediately verified against official NSE closing CMPs.
     - Detail automated recalculation of integer lot sizes (tranche capital ÷ CMP), +6% pyramiding triggers, and -6.5% stop-loss levels.
3. **Menu & Keyword Routing Alignment**:
   - Ensure typing number `11` or clicking the card renders the new, comprehensive response.
   - Add query synonyms so questions like `"will universe change weekly"` or `"does universe change week on week"` automatically map to Question 11.

---

## 3. Verification & Testing
1. Run `lint_applet` (`tsc --noEmit`) to verify zero TypeScript errors.
2. Run `compile_applet` to confirm a successful build.
3. Verify that typing `11`, typing `"will the terminal universe change week on week"`, or clicking the Question 11 card delivers the fully updated explanation.
