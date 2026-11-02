# GitHub Pages Deployment & Main Branch Convergence Plan

Resolve the GitHub Actions check failure (`❌ 0 / 2`), merge all 22 application commits from `geminigoofups` into `main`, and publish the live investment analysis web application to GitHub Pages (`https://santhoshskills.github.io/invest/`).

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of Confirmed Choices from Phase 1:**
> - **Unified Primary Branch**: Merge `geminigoofups` into `main` so that Google AI Studio sync, GitHub default branch, and GitHub Pages deployment all target `main`.
> - **Application Delivery Method**: You will apply the workflow fixes and merge directly on GitHub (via Pull Request / web interface) or via your local Git terminal, requiring no PAT exposure in the chat.
> - **GitHub Pages Deployment Source**: Repository Settings &rarr; Pages must have **Source** set to **GitHub Actions** rather than "Deploy from a branch".

---

## 1. Overview & Core Concept

- **The Problem Identified from Screenshots**:
  1. **Branch Divergence**: AI Studio sync was attached to `main` (which only contained the empty 5-commit template), while the completed Secular Trend & Renko charting application lived entirely on `geminigoofups` (22 commits ahead).
  2. **GitHub Actions ❌ 0 / 2 Failure**: On `geminigoofups`, commit `c328eed` failed because `actions/setup-node@v4` with `cache: 'npm'` failed due to a missing `package-lock.json`, and GitHub Pages environment permissions had not yet been provisioned in repository settings.
- **The Solution**:
  1. Merge `geminigoofups` into `main` so both GitHub and AI Studio track the same unified source code.
  2. Configure GitHub Pages to use **GitHub Actions** under repository settings.
  3. Ensure the GitHub Actions build workflow and package lock are committed cleanly so the runner builds and publishes the production bundle without errors.

---

## 2. Step-by-Step Resolution Workflow

```
┌─────────────────────────────────┐           Pull Request / Merge           ┌─────────────────────────────────┐
│     geminigoofups Branch        │ ───────────────────────────────────────> │           main Branch           │
│   (22 Commits: Full App)        │                                          │  (AI Studio Sync + Pages Root)  │
└─────────────────────────────────┘                                          └────────────────┬────────────────┘
                                                                                              │
                                                                                Triggers Push to main
                                                                                              │
                                                                                              ▼
                                                                             ┌─────────────────────────────────┐
                                                                             │      GitHub Actions Run         │
                                                                             │  .github/workflows/deploy.yml   │
                                                                             └────────────────┬────────────────┘
                                                                                              │
                                                                                Deploys ./dist to Pages
                                                                                              │
                                                                                              ▼
                                                                             ┌─────────────────────────────────┐
                                                                             │      Live GitHub Pages App      │
                                                                             │  santhoshskills.github.io/      │
                                                                             │              invest/            │
                                                                             └─────────────────────────────────┘
```

### Action 1: Merge `geminigoofups` into `main` on GitHub
You can complete this directly on GitHub without entering terminal commands:
1. Navigate to: **`https://github.com/SanthoshSkills/invest/compare/main...geminigoofups`**
2. Click the green **"Create pull request"** button.
3. Title it: `Merge geminigoofups into main (Complete App & Pages Deploy)`
4. Click **"Create pull request"**, then click **"Merge pull request"** &rarr; **"Confirm merge"**.
5. Once merged, `main` will possess the full application codebase.

### Action 2: Enable GitHub Actions as Pages Source
In order for GitHub Actions to publish to `https://santhoshskills.github.io/invest/`:
1. Navigate to **`https://github.com/SanthoshSkills/invest/settings/pages`**
2. Under **Build and deployment**:
   - Change **Source** from *"Deploy from a branch"* to **"GitHub Actions"**.
3. Save changes.

### Action 3: Ensure Clean Workflow Execution & GitHub Pages Base Path
- **Root Cause of Asset 404s**: When deployed without an explicit base path, Vite defaults to root `/assets/...`. Because GitHub Pages serves the site at `https://santhoshskills.github.io/invest/`, requests to `/assets/...` failed with HTTP 404 instead of reaching `/invest/assets/...`.
- **Configured `vite.config.ts`**:
  ```ts
  base: process.env.GITHUB_ACTIONS || process.env.GITHUB_PAGES ? '/invest/' : './'
  ```
  This ensures:
  1. Automated builds on GitHub Actions prefix all assets with `/invest/` (`/invest/assets/...`), resolving with HTTP 200 on GitHub Pages.
  2. Local and AI Studio development environments continue using `./` without requiring a path prefix.
- The workflow in `.github/workflows/deploy.yml` triggers on pushes to both `main` and `geminigoofups`.

---

## 3. Key Decisions & Trade-Offs

- **Decision 1: Merging into `main` vs. Switching AI Studio to `geminigoofups`**:
  - *Chosen*: Merge `geminigoofups` into `main`.
  - *Why*: Google AI Studio sync natively tracks `main`. By merging `geminigoofups` into `main`, AI Studio sync remains green and up-to-date, GitHub's default branch displays the real application, and GitHub Pages deploys seamlessly.
- **Decision 2: GitHub Pull Request Merge vs. Local PAT Push**:
  - *Chosen*: User performs the merge on GitHub or local terminal.
  - *Why*: User explicitly preferred applying fixes directly on GitHub or via pull command, keeping credentials secure and in their full control.

---

## 4. Technical Architecture & Component Reference

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Root (`src/App.tsx`)                        │
├───────────────────────────────────┬────────────────────────────────────┤
│           Watchlist & Radar       │         Strategy Screener          │
│   • Top Movers & Breadth Matrix   │   • Value-Momentum Multi-Factor    │
│   • Metric Sparklines & Alerts    │   • Sector Relative Strength       │
├───────────────────────────────────┴────────────────────────────────────┤
│        Technical Chart Workbench (`TechnicalChartWorkbench.tsx`)       │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │ 4-State Secular Trend Indicator:                             │     │
│   │ [1] Super Cycle Bull  [2] Secular Dip                        │     │
│   │ [3] Counter-Trend     [4] Structural Downtrend               │     │
│   ├──────────────────────────────────────────────────────────────┤     │
│   │ 10-EMA Wave Rider (Weekly & Monthly Timeframes)              │     │
│   ├──────────────────────────────────────────────────────────────┤     │
│   │ Renko ATR 14 Brick Box Visualization                         │     │
│   └──────────────────────────────────────────────────────────────┘     │
├────────────────────────────────────────────────────────────────────────┤
│                 Execution & Paper Trading Terminal                     │
│   • Live Position Book & PnL     • Dynamic Sizing Calculator           │
└────────────────────────────────────────────────────────────────────────┘
```

### Verification & Success Checklist:
1. [ ] Pull request merged: `geminigoofups` &rarr; `main` on GitHub.
2. [ ] GitHub Pages source set to **GitHub Actions** in repository settings.
3. [ ] GitHub Actions workflow under `https://github.com/SanthoshSkills/invest/actions` shows a green checkmark `✔ Deploy to GitHub Pages`.
4. [ ] `https://santhoshskills.github.io/invest/` loads the live Val-Mo Terminal with all charts and indicators functional.
