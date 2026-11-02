# Nifty 500 Regime & Val-Mo Quantitative Strategy Terminal

Systematic Indian equity strategy and screening terminal tracking Nifty 500 opportunities with dynamic regime classification, Relative Rotation Graphs (RRG), operating leverage inflections, position lot sizing, and multi-horizon Wave Riding (10-period EMA on Weekly & Monthly timeframes).

---

## 🌐 Free Hosting & Publishing Options

You have three options for free hosting:

### Option 1: Instant Google Cloud Instance (Zero Setup, Active Now)
The application is **hosted live** on Google Cloud Run within Google AI Studio:
- **Dev App URL**: [https://ais-dev-e7jlziwwvxc2clubac46ma-516653370567.asia-east1.run.app](https://ais-dev-e7jlziwwvxc2clubac46ma-516653370567.asia-east1.run.app)
- **Public Sharing**: Click the **Share** button in the AI Studio top bar to generate a public link, or activate GitHub Pages below.

---

### Option 2: GitHub Pages (Free via Automated GitHub Action)
The repository includes an automated workflow (`.github/workflows/deploy.yml`) that builds and publishes the app to GitHub Pages on every commit.

**How to activate in 2 clicks**:
1. Open your GitHub repository in your browser: `https://github.com/SanthoshSkills/invest`
2. Go to **Settings** ➔ **Pages** (in the left sidebar).
3. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
4. That's it! GitHub will run the `.github/workflows/deploy.yml` action and publish your terminal to:
   `https://santhoshskills.github.io/invest/`

---

### Option 3: Vercel or Netlify (Free Tier with Custom Domain)
1. Sign in to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) using your GitHub account.
2. Click **Add New Project** and import the `SanthoshSkills/invest` repository.
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Your site will be live on a global CDN with free SSL.

---

## 🚀 Core Strategy & Terminal Features

1. **Market Hierarchy & D3 Treemap**:
   - Visualizes all Nifty 500 sectors proportional to benchmark index weights.
   - Color-coded by Relative Rotation Graph (RRG) RS-Momentum score.
2. **In-App Screener Engine**:
   - Live 5-tier quantitative pipeline animation scanning Macro, Sector RRG, EBITDA inflections, Moats, and Val-Mo lot allocations.
3. **Multi-Timeframe Technical Workbench**:
   - **Daily (60D)**: 50-DMA and 200-DMA reclaim with delivery volume bars.
   - **Weekly (52-Wk)**: 10-period EMA trailing stop wave rider with +1.5σ valuation trim target.
   - **Monthly (36-Mo)**: 10-month EMA secular baseline with 3-year horizontal base breakout channel.
   - **Dual View**: Weekly and Monthly wave riders positioned side-by-side.
   - **4-State Secular Trend Indicator**: Real-time signal based on dual 10-EMA co-alignment:
     - 🟢 **Super-Cycle**: Weekly & Monthly > 10-EMA (Maximum wave-riding persistence).
     - 🟡 **Secular Dip**: Weekly < 10-EMA & Monthly > 10-EMA (Prime Val-Mo accumulation zone).
     - 🔵 **Counter-Trend**: Weekly > 10-EMA & Monthly < 10-EMA (Tactical bounce below secular ceiling).
     - 🔴 **Secular Downtrend**: Both timeframes below 10-EMA (Disqualified).
   - **Renko (14-ATR)**: Noise-free price-only brick chart using 14-period Average True Range box size.
4. **Paper Trading Cockpit**:
   - Simulates ₹1,00,000 base capital + ₹10,000/mo staged inflow with statutory DP charge drag mitigation.
5. **Backtester**:
   - Evaluates performance across Bull Run, Sideways Consolidation, and High VIX Flash Crash regimes.
