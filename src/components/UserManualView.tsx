import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Activity,
  Layers,
  Target,
  Briefcase,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  DollarSign,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Info,
  Zap,
  BarChart2,
  Lock,
} from 'lucide-react';
import { SparklineChart } from './SparklineChart';

interface UserManualViewProps {
  onOpenSparklineGuide: () => void;
  onOpenSeedFundModal: () => void;
  rawState: string;
  rawTasks: string;
  rawResearch: string;
  rawCheckpoint: string;
  copiedFile: string | null;
  onCopyFile: (filename: string, content: string) => void;
}

export function UserManualView({
  onOpenSparklineGuide,
  onOpenSeedFundModal,
  rawState,
  rawTasks,
  rawResearch,
  rawCheckpoint,
  copiedFile,
  onCopyFile,
}: UserManualViewProps) {
  const [activeSection, setActiveSection] = useState<
    'quickstart' | 'sparkline' | 'capital' | 'valmo' | 'regimes' | 'specs'
  >('quickstart');

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <BookOpen className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  Investor Manual &amp; Playbook
                </span>
                <span className="text-xs text-slate-400 font-mono">v1.2 (October 2026 Edition)</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                Strategy Guide, Terminal Manual &amp; Quantitative Specs
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Master the complete Nifty 500 Value-Momentum (Val-Mo) methodology, capital architecture controls, sparkline diagnostics, and 8-regime allocation models.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenSparklineGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold transition-all cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sparkline Visual Guide</span>
            </button>
            <button
              onClick={onOpenSeedFundModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition-all cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
              <span>Adjust Seed Capital</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSection('quickstart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'quickstart'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> 1. Terminal Quickstart
          </button>
          <button
            onClick={() => setActiveSection('sparkline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'sparkline'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-3.5 w-3.5" /> 2. Reading Sparklines
          </button>
          <button
            onClick={() => setActiveSection('capital')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'capital'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" /> 3. Seed Capital &amp; SIP
          </button>
          <button
            onClick={() => setActiveSection('valmo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'valmo'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Target className="h-3.5 w-3.5" /> 4. Val-Mo Philosophy
          </button>
          <button
            onClick={() => setActiveSection('regimes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'regimes'
                ? 'bg-purple-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" /> 5. 8-Regime Matrix
          </button>
          <button
            onClick={() => setActiveSection('specs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'specs'
                ? 'bg-blue-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> 6. Git Specs (Markdown)
          </button>
        </div>
      </div>

      {/* SECTION 1: QUICKSTART */}
      {activeSection === 'quickstart' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>Interactive Terminal Walkthrough</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                  <span>Step 1: Market Hierarchy Drill-Down</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Start in the <strong>Market Hierarchy</strong> tab. Click any tile on the <strong>Nifty 500 Relative Strength Heatmap</strong> to isolate a Macro Sector. The terminal will instantly filter downstream Industry Groups, Base Moats, and qualifying stock scrips.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                  Macro Sector (RRG) ➔ Industry Inflection ➔ Base Moat ➔ Scrip List
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="font-bold text-cyan-400 flex items-center gap-1.5 text-sm">
                  <span>Step 2: Universal Scrip Search</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Use the prominent search bar in the top navigation or press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">/</kbd> or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-white font-mono">Ctrl+K</kbd> to search any scrip (e.g., <code>APARINDS</code>, <code>DIVISLAB</code>, <code>ICICIBANK</code>).
                </p>
                <p className="text-slate-400 text-[11px]">
                  Clicking any search result opens the full diagnostic drawer with fundamental metrics and technical momentum charts.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="font-bold text-teal-400 flex items-center gap-1.5 text-sm">
                  <span>Step 3: Run the 4-Tier Screener</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Click the green <strong>Run Screener</strong> button at the top right to simulate the Python quantitative pipeline. It filters all 500 stocks through Macro headwind checks, EBITDA margin inflections, P/E historical discounts, and 50-DMA volume breakouts.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                  <span>Step 4: Execute &amp; Pyramid Paper Trades</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Navigate to <strong>Paper Trading</strong>. Allocate initial lots (₹15,000 to ₹20,000). When a stock gains +8% or more, execute the <strong>Pyramid +1 Tranche (+50%)</strong> button to deploy capital from your Staging Reserve Pool into proven winners!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SPARKLINE GUIDE */}
      {activeSection === 'sparkline' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>How to Read the Sparkline Chart</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Every stock row includes a micro 30-day sparkline with a 50-DMA institutional benchmark line.
                </p>
              </div>
              <button
                onClick={onOpenSparklineGuide}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
              >
                Open Interactive Visual Guide
              </button>
            </div>

            {/* Visual Example Card */}
            <div className="p-5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Anatomy Diagram:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-xs">Bullish Inflection Pattern</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                      +4.2% Above 50-DMA
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-white">APARINDS</div>
                      <div className="text-[10px] text-slate-400">CMP: ₹3,120 • 50-DMA: ₹2,980</div>
                    </div>
                    <SparklineChart currentPrice={3120} dma50={2980} width={130} height={36} />
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>• <strong>Dashed Cyan Line:</strong> Fixed 50-DMA level (₹2,980).</div>
                    <div>• <strong>Green Fill &amp; Solid Line:</strong> Price is actively trading above 50-DMA.</div>
                    <div>• <strong>End Dot:</strong> Current price (CMP) at ₹3,120.</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400 text-xs">Bearish / Trapped Pattern</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono font-bold">
                      -6.8% Below 50-DMA
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-sm font-bold text-white">LAGGING SCRIP</div>
                      <div className="text-[10px] text-slate-400">CMP: ₹1,420 • 50-DMA: ₹1,524</div>
                    </div>
                    <SparklineChart currentPrice={1420} dma50={1524} width={130} height={36} />
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>• <strong>Dashed Cyan Line:</strong> Overhead 50-DMA resistance level.</div>
                    <div>• <strong>Red Fill &amp; Solid Line:</strong> Trapped below the moving average.</div>
                    <div>• <strong>Val-Mo Decision:</strong> Automatically disqualified from Tier 5 buy list.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Decision Rules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Rule 1: Fresh Lot Entry</span>
                <p className="text-slate-400 text-[11px]">
                  Only buy when price is between <strong className="text-white">+1% and +8%</strong> above the 50-DMA on ascending slope.
                </p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1">Rule 2: Don't Chase Overextended</span>
                <p className="text-slate-400 text-[11px]">
                  If the badge reads <strong className="text-amber-300">&gt;+12%</strong>, the stock is stretched. Wait for a pullback to the dashed line before allocating.
                </p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-rose-400 block mb-1">Rule 3: Risk Breaker</span>
                <p className="text-slate-400 text-[11px]">
                  If an active position drops <strong className="text-rose-300">&gt;6.5%</strong> below your cost or breaks the 50-DMA with heavy volume, execute hard stop.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CAPITAL & SIP */}
      {activeSection === 'capital' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span>Seed Fund &amp; Staged-SIP Architecture</span>
                </h3>
                <p className="text-xs text-slate-400">
                  How the ₹1,00,000 base capital and ₹10,000 monthly inflow protect returns against statutory drag.
                </p>
              </div>
              <button
                onClick={onOpenSeedFundModal}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/30 transition-colors cursor-pointer"
              >
                Open Capital Allocator Slider
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="font-bold text-teal-400 text-sm">
                  1. The Staging Pool Principle (Liquid BeES)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Instead of taking ₹10,000 every month and dividing it into tiny ₹2,000 purchases across 5 stocks, all monthly deposits are routed into a <strong>Tactical Staging Pool</strong> (held in Liquid BeES or cash).
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  <strong>Why?</strong> Buying micro odd-lots creates severe DP drag. In India, CDSL/NSDL charges ₹15.93 flat per scrip sell transaction. Selling a ₹2,000 micro-lot eats <strong>0.80%</strong> of capital on day one before brokerage and STCG!
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="font-bold text-emerald-400 text-sm">
                  2. Lot Sizing Floor (₹15,000 to ₹20,000)
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Our minimum initial position size is strictly enforced at <strong>₹15,000 to ₹20,000</strong>. At this size, the ₹15.93 DP charge represents less than <strong>0.08%</strong> drag, negligible compared to the 20-30% Val-Mo alpha target.
                </p>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  <strong>Concentration Cap:</strong> Capped at 5 to 7 high-conviction scrips. As your capital grows from ₹1,00,000 to ₹2,20,000, scale position sizes rather than adding more stocks.
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                How Staged Inflows are Deployed:
              </div>
              <ol className="text-xs text-slate-300 list-decimal list-inside space-y-1.5 leading-relaxed">
                <li>
                  <strong>Option A (Pyramiding into Winners):</strong> When an existing holding breaks out with +8% to +10% gain, draw 50% lot size (~₹8,000-₹10,000) from the staging pool to add to the position.
                </li>
                <li>
                  <strong>Option B (Deploying a New 6th Lot):</strong> Once the staging pool accumulates ₹18,000–₹20,000, allocate a fresh full-size lot into the next highest-scoring Tier 5 candidate.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: VAL-MO PHILOSOPHY */}
      {activeSection === 'valmo' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Target className="h-4 w-4 text-amber-400" />
              <span>Integrated Value-Momentum (Val-Mo) Philosophy</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <span className="font-bold text-amber-400 text-sm block">The Problem with Pure Value</span>
                <p className="text-slate-300 leading-relaxed">
                  Traditional value investing buys cheap stocks. But in Indian markets, cheap stocks often get cheaper because of corporate governance red flags, margin contraction, or structural obsolescence (<strong>Value Traps</strong>).
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <span className="font-bold text-rose-400 text-sm block">The Problem with Pure Momentum</span>
                <p className="text-slate-300 leading-relaxed">
                  Pure momentum buys whatever is flying highest. When market sentiment shifts or liquidity contracts (such as during RBI rate tightening or global shocks), high-valuation momentum stocks experience brutal 30-50% drawdowns.
                </p>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 rounded-xl border border-emerald-500/30 text-xs space-y-3">
              <div className="font-bold text-emerald-400 text-sm">
                The Val-Mo Synthesis: Margin of Safety + Price Inflection
              </div>
              <p className="text-slate-200 leading-relaxed">
                Val-Mo buys companies with <strong>depressed valuation multiples</strong> (P/E ≤ 5-year median, PEG &lt; 1.75x) only when a <strong>fundamental catalyst has already sparked technical momentum</strong> (price reclaiming 50-DMA on &gt;1.5x delivery volume).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                  <strong className="text-emerald-300 block mb-0.5">1. Quality Moat</strong>
                  <span>3-Yr ROCE &gt; 16%, Debt/Equity &lt; 0.7x, OCF/EBITDA &gt; 70%.</span>
                </div>
                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                  <strong className="text-teal-300 block mb-0.5">2. Valuation Anchor</strong>
                  <span>Current P/E ≤ 5-Year Historical Median P/E.</span>
                </div>
                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                  <strong className="text-cyan-300 block mb-0.5">3. Momentum Spark</strong>
                  <span>Reclaiming 50-DMA on high delivery volume.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: REGIMES */}
      {activeSection === 'regimes' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="h-4 w-4 text-purple-400" />
              <span>The 8 Market Regimes Classification Model</span>
            </h3>
            <p className="text-xs text-slate-400">
              Quantitative asset allocation adjusts dynamically based on market breadth, India VIX, and index distance to the 200-DMA:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between font-bold text-amber-300 mb-1">
                  <span>1. Sideways / Transition (Current Active Regime)</span>
                  <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded">60% Equity / 40% Liquid</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Index within ±5% of 200-DMA; Breadth 35-55%; VIX 13-17. Hold a 40% liquid staging buffer in Liquid BeES. Deploy into deep value inflections only.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between font-bold text-emerald-400 mb-1">
                  <span>2. Bull Market (Secular Trend)</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded">90% Equity / 10% Liquid</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Index &gt; 200-DMA; Breadth &gt; 60%; VIX 11-16. Full risk-on with aggressive pyramiding in high-beta leaders.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between font-bold text-rose-400 mb-1">
                  <span>3. Bear Market (Risk Off)</span>
                  <span className="text-[10px] font-mono bg-rose-500/20 px-2 py-0.5 rounded">20% Equity / 80% Liquid</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Index &lt; 200-DMA; Breadth &lt; 30%; VIX &gt; 20. Strict capital preservation. Tight 5% stop-losses and heavy cash allocation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between font-bold text-cyan-400 mb-1">
                  <span>4. Polarized (K-Shaped)</span>
                  <span className="text-[10px] font-mono bg-cyan-500/20 px-2 py-0.5 rounded">50% Equity / 50% Liquid</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Narrow rally concentrated exclusively in top 10 megacaps while mid/smallcap breadth collapses. Restrict buying solely to Nifty 50 compounders.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: SPECS (MARKDOWN SOURCE FILES) */}
      {activeSection === 'specs' && (
        <div className="space-y-6 animate-fade-in">
          {/* STATE.md */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                STATE.md (Single Source of Truth)
              </h3>
              <button
                onClick={() => onCopyFile('state', rawState)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                {copiedFile === 'state' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedFile === 'state' ? 'Copied' : 'Copy Markdown'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
              {rawState}
            </pre>
          </div>

          {/* TASKS.md */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-blue-400 tracking-wider">
                TASKS.md (Execution Log)
              </h3>
              <button
                onClick={() => onCopyFile('tasks', rawTasks)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                {copiedFile === 'tasks' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedFile === 'tasks' ? 'Copied' : 'Copy Markdown'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
              {rawTasks}
            </pre>
          </div>

          {/* RESEARCH.md */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-purple-400 tracking-wider">
                RESEARCH.md (Quantitative Knowledge)
              </h3>
              <button
                onClick={() => onCopyFile('research', rawResearch)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                {copiedFile === 'research' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedFile === 'research' ? 'Copied' : 'Copy Markdown'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
              {rawResearch}
            </pre>
          </div>

          {/* CHECKPOINT.md */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                CHECKPOINT.md (Session State Handoff)
              </h3>
              <button
                onClick={() => onCopyFile('checkpoint', rawCheckpoint)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                {copiedFile === 'checkpoint' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedFile === 'checkpoint' ? 'Copied' : 'Copy Markdown'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
              {rawCheckpoint}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
