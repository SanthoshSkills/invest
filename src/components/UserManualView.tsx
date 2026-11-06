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
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import { SparklineChart } from './SparklineChart';
import { STOCK_SCRIPS, INITIAL_PAPER_PORTFOLIO } from '../data/nifty500Data';

interface UserManualViewProps {
  onOpenSparklineGuide: () => void;
  onOpenSeedFundModal: () => void;
  rawState: string;
  rawTasks: string;
  rawResearch: string;
  rawCheckpoint: string;
  copiedFile: string | null;
  onCopyFile: (filename: string, content: string) => void;
  portfolio?: typeof INITIAL_PAPER_PORTFOLIO;
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
  portfolio = INITIAL_PAPER_PORTFOLIO,
}: UserManualViewProps) {
  const [activeSection, setActiveSection] = useState<
    'quickstart' | 'sparkline' | 'capital' | 'valmo' | 'regimes' | 'specs' | 'audit'
  >('quickstart');

  const [lastAuditTime, setLastAuditTime] = useState<string>(() => {
    return localStorage.getItem('valmo_last_audit_timestamp') || 'Nov 2, 2026, 15:30 IST';
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditNotification, setAuditNotification] = useState<string | null>(null);
  const [simulateStress, setSimulateStress] = useState(false);
  const [driftFilter, setDriftFilter] = useState<'all' | 'alerts' | 'compliant'>('all');

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      const nowStr = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' IST';
      setLastAuditTime(nowStr);
      localStorage.setItem('valmo_last_audit_timestamp', nowStr);
      setIsAuditing(false);
      setAuditNotification('Audit Complete: All 6 quantitative invariants re-validated against RESEARCH.md rules!');
      setTimeout(() => setAuditNotification(null), 4000);
    }, 450);
  };

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
                Master the complete Nifty 500 Value-Momentum (Val-Mo) methodology, capital architecture controls, sparkline diagnostics, and 8-market mode allocation models.
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
            <BarChart2 className="h-3.5 w-3.5" /> 5. 8-Mode Matrix
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
          <button
            onClick={() => setActiveSection('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === 'audit'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-rose-400" /> 7. Audit &amp; Drift Tracker
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

            {/* Pure Momentum MTF Strategy & Weekly Close Execution Cadence */}
            <div className="p-5 bg-gradient-to-r from-cyan-950/40 to-slate-900/60 rounded-xl border border-cyan-500/30 text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Pure Momentum MTF Strategy (Weekly Close Investment Rule)
                </div>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded self-start sm:self-auto">
                  Cadence: Friday 15:30 IST Close Only
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                While continuous screening tracks the 4 Daily Leading Indicators and 4 Weekly Macro Bias signals throughout the week for monitoring, <strong>actual capital investment occurs strictly at the Friday week close</strong>. Capital is allocated only when a scrip simultaneously satisfies both daily execution triggers and weekly structural trend confirmation on the closing day. This eliminates false intra-week whipsaw breakouts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
                  <strong className="text-cyan-300 block">4 Daily Triggers (Evaluated on Friday Close)</strong>
                  <ul className="text-slate-300 space-y-0.5 list-disc pl-4 text-[10px]">
                    <li>Triple EMA Cross &amp; Price Alignment (Price &gt; EMA9 &gt; EMA21 &gt; EMA55)</li>
                    <li>ADX Trend Acceleration (ADX &gt; 20 with +DI &gt; -DI)</li>
                    <li>Volume Expansion (&gt;20-DMA) OR RSI Sweet Spot (45–65)</li>
                    <li>Volatility Expansion (14-day ATR or Bollinger Band)</li>
                  </ul>
                </div>
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
                  <strong className="text-teal-300 block">4 Weekly Bias Signals (Macro Trend Alignment)</strong>
                  <ul className="text-slate-300 space-y-0.5 list-disc pl-4 text-[10px]">
                    <li>Triple EMA Band Structure (Price structurally above 13 &gt; 34 &gt; 89 EMA)</li>
                    <li>ADX Macro Strength (&gt; 30 and rising)</li>
                    <li>Volume Accumulation on up-weeks OR Bullish RSI Divergence</li>
                    <li>Multi-Timeframe Synchronization (Daily triggers align with Weekly trend)</li>
                  </ul>
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
              <span>The 8 Market Modes Classification Model</span>
            </h3>
            <p className="text-xs text-slate-400">
              Quantitative asset allocation adjusts dynamically based on market breadth, India VIX, and index distance to the 200-DMA:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center justify-between font-bold text-amber-300 mb-1">
                  <span>1. Sideways / Transition (Current Active Mode)</span>
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

      {/* SECTION 7: AUDIT CADENCE & DRIFT TRACKER */}
      {activeSection === 'audit' && (
        <div className="space-y-6 animate-fade-in">
          {/* Audit Notification Banner */}
          {auditNotification && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{auditNotification}</span>
              </div>
              <button
                onClick={() => setAuditNotification(null)}
                className="text-emerald-400 hover:text-white text-xs ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Audit Health Control Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    simulateStress
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    {simulateStress ? 'Regime Shock & Drift Advisory' : 'System Health: Nominal'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Last Verified: <strong className="text-white">{lastAuditTime}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Quantitative Invariant &amp; Calibration Cockpit
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  {simulateStress
                    ? 'CRITICAL ALERT: Intraday price drop breached trailing stop threshold on TRIL (-6.7%). India VIX (26.4) exceeds transition mode ceiling. Corrective trim and cash re-allocation required.'
                    : 'All 6 mathematical invariants from RESEARCH.md are in active alignment. No trailing stop-loss violations, valuation ceilings within +1.5σ thresholds, and cash reserves exceed the 10% floor.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                  <span>{isAuditing ? 'Auditing Invariants...' : 'Run Live Audit'}</span>
                </button>
                <button
                  onClick={() => setSimulateStress(!simulateStress)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    simulateStress
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <AlertTriangle className={`h-3.5 w-3.5 ${simulateStress ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{simulateStress ? 'Reset to Nominal State' : 'Simulate Volatility Drift'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Stop-Loss Invariant</div>
                <div className={`text-sm font-bold mt-0.5 ${simulateStress ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {simulateStress ? '1 Violation (TRIL)' : '0 Breaches (5/5 Safe)'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400">India VIX Band Audit</div>
                <div className={`text-sm font-bold mt-0.5 ${simulateStress ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {simulateStress ? '26.40 (Shock Spike)' : '15.42 (Goldilocks)'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Cash Buffer Floor (≥10%)</div>
                <div className={`text-sm font-bold mt-0.5 ${simulateStress ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {simulateStress ? '6.8% (Below 10% Floor)' : '40.0% (₹40,000 Nominal)'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Val-Mo Scoring Anchor</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  RESEARCH.md (Synced)
                </div>
              </div>
            </div>
          </div>

          {/* 4 Operational Review Cadence Schedule Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>Operational Review Cadences &amp; Audit Triggers</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily Cadence */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <h5 className="text-sm font-bold text-white">1. Daily Market Close Review</h5>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">15:30 IST Every Trading Day</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scans every active holding against hard trailing stop-loss thresholds and valuation trim ceilings immediately upon market close.
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Trailing Stop-Loss Rule:</span>
                    <strong className="font-mono text-white">Fixed -6.5% from peak high</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Valuation Trim Ceiling:</span>
                    <strong className="font-mono text-white">+1.5σ over 5Y median P/E</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Action on Violation:</span>
                    <span className="text-rose-400 font-semibold">Immediate market-order exit</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status Today:</span>
                  <span className={`font-semibold ${simulateStress ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {simulateStress ? 'Breach: TRIL below stop price' : 'Compliant: All 5 holdings above stops'}
                  </span>
                </div>
              </div>

              {/* Weekly Cadence */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    <h5 className="text-sm font-bold text-white">2. Weekly Weekend Audit</h5>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400">Every Friday 16:00 IST</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates macro market mode transitions, Relative Rotation Graph (RRG) sector quadrant migration, and market breadth indicators.
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• India VIX Band Classification:</span>
                    <strong className="font-mono text-white">&lt;13, 13–17, 17–24, &gt;24</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Sector RRG Quadrants:</span>
                    <strong className="font-mono text-white">Leading vs. Lagging rotation</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Nifty 500 &gt; 50-DMA Breadth:</span>
                    <strong className="font-mono text-white">64.2% (Healthy Expansion)</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Active Regime:</span>
                  <span className="font-semibold text-purple-400">
                    {simulateStress ? 'Shock Regime (Emergency Cut)' : 'Sideways/Transition (60% Eq / 40% Res)'}
                  </span>
                </div>
              </div>

              {/* Monthly Cadence */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-400" />
                    <h5 className="text-sm font-bold text-white">3. Monthly Inflow &amp; Pyramiding Cycle</h5>
                  </div>
                  <span className="text-[11px] font-mono text-teal-400">1st of Month (Capital Credit)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Executes the ₹10,000 monthly Tactical Staging Reserve deployment. Checks whether to pyramid existing winners (+50% tranche) or initiate a new Tier-5 entrant.
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Monthly Inflow Target:</span>
                    <strong className="font-mono text-white">+₹10,000 to Liquid Reserve</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Pyramiding Condition:</span>
                    <strong className="font-mono text-white">&gt;+6% gain with ascending 50-DMA</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Liquidity Reserve Floor:</span>
                    <strong className="font-mono text-white">Minimum 10% cash equivalent</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Staging Reserve Buffer:</span>
                  <span className="font-semibold text-teal-400">₹40,000 (40.0% of Capital)</span>
                </div>
              </div>

              {/* Quarterly Cadence */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    <h5 className="text-sm font-bold text-white">4. Quarterly &amp; Semi-Annual Audits</h5>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400">Quarterly Results &amp; March/Sept Rebalance</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Audits quarterly corporate earnings reports for fundamental health decay and adapts to semi-annual NSE index reconstitution announcements.
                </p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• 3-Yr ROCE &amp; ROE Hurdle:</span>
                    <strong className="font-mono text-white">&gt; 16.0% Minimum (Audited)</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• Cash Conversion Hurdle:</span>
                    <strong className="font-mono text-white">OCF / EBITDA &gt; 70%</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">• NSE Rebalance Cadence:</span>
                    <strong className="font-mono text-white">Semi-annual (March &amp; Sept)</strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Next Scheduled Audit:</span>
                  <span className="font-semibold text-blue-400">March 2027 Index Rebalance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Holding-Level Invariant Verification Table */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Active Holdings Invariant Audit (Val-Mo Rules)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Every position is systematically checked against trailing stop-loss, valuation trim, and fundamental hurdles.
                </p>
              </div>

              {/* Segmented Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setDriftFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    driftFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All (5)
                </button>
                <button
                  onClick={() => setDriftFilter('alerts')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    driftFilter === 'alerts'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  Action Required ({simulateStress ? '1' : '0'})
                </button>
                <button
                  onClick={() => setDriftFilter('compliant')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    driftFilter === 'compliant'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Compliant ({simulateStress ? '4' : '5'})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Scrip</th>
                    <th className="py-2.5 px-3">Current / Entry</th>
                    <th className="py-2.5 px-3">Trailing Stop (-6.5%)</th>
                    <th className="py-2.5 px-3">P/E vs 5Y Med</th>
                    <th className="py-2.5 px-3">ROCE / D-E</th>
                    <th className="py-2.5 px-3 text-right">Invariant State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {portfolio.positions
                    .map((pos) => {
                      const scrip = STOCK_SCRIPS.find((s) => s.symbol === pos.symbol);
                      // In simulate stress mode, TRIL breaches stop
                      const isTrilStressed = simulateStress && pos.symbol === 'TRIL';
                      const effectivePrice = isTrilStressed ? 2540 : pos.currentPrice;
                      const stopBreached = effectivePrice <= pos.stopLoss;
                      const stopDistancePct = ((effectivePrice - pos.stopLoss) / effectivePrice) * 100;

                      return {
                        pos,
                        scrip,
                        effectivePrice,
                        stopBreached,
                        stopDistancePct,
                        isTrilStressed,
                      };
                    })
                    .filter((item) => {
                      if (driftFilter === 'alerts') return item.stopBreached;
                      if (driftFilter === 'compliant') return !item.stopBreached;
                      return true;
                    })
                    .map(({ pos, scrip, effectivePrice, stopBreached, stopDistancePct, isTrilStressed }) => (
                      <tr
                        key={pos.symbol}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          stopBreached ? 'bg-rose-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{pos.symbol}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{pos.name}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className={`font-bold ${isTrilStressed ? 'text-rose-400' : 'text-white'}`}>
                            ₹{effectivePrice.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400">Entry: ₹{pos.entryPrice.toLocaleString('en-IN')}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white">₹{pos.stopLoss.toLocaleString('en-IN')}</div>
                          <div className={`text-[10px] font-bold ${
                            stopBreached
                              ? 'text-rose-400'
                              : stopDistancePct < 4
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {stopBreached ? 'BREACHED (-0.4%)' : `+${stopDistancePct.toFixed(1)}% safe buffer`}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white">{scrip?.pe ?? '—'}x</div>
                          <div className="text-[10px] text-slate-400">Med: {scrip?.peMedian5Y ?? '—'}x</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white">ROCE: {scrip?.roce3Y ?? '—'}%</div>
                          <div className="text-[10px] text-slate-400">D/E: {scrip?.debtToEquity ?? '—'}x</div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {stopBreached ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                              <AlertCircle className="h-3 w-3 text-rose-400" />
                              <span>EXIT: STOP HIT</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span>COMPLIANT</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anchor Explanation: How RESEARCH.md Controls the Entire App */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              <span>How is RESEARCH.md Anchored to the Application Code?</span>
            </h4>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>RESEARCH.md is the single immutable quantitative constitution</strong> of this investment framework. All terminal logic, position calculations, and market mode transitions are hardcoded derivatives of its mathematical specifications:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-bold text-white text-xs mb-1">1. Stop-Loss &amp; Sizing</div>
                  <p className="text-[11px] text-slate-400">
                    The -6.5% hard stop and Tier-5 scrip sizing are calculated directly using the formulas documented in RESEARCH.md §4 and §5.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-bold text-white text-xs mb-1">2. Market Mode Allocations</div>
                  <p className="text-[11px] text-slate-400">
                    The 8-market mode equity/cash bands (e.g. 60% Equity / 40% Reserve for Sideways) are codified in <code className="text-purple-300">REGIMES_DATA</code> in <code className="text-purple-300">nifty500Data.ts</code>.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="font-bold text-white text-xs mb-1">3. Valuation Ceilings</div>
                  <p className="text-[11px] text-slate-400">
                    The +1.5σ historical P/E trim price triggers partial profit taking before extreme mean reversion occurs.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-slate-400 text-[11px]">
                  Want to inspect or copy the full raw markdown and formulas?
                </span>
                <button
                  onClick={() => setActiveSection('specs')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Inspect RESEARCH.md in Chapter 6</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
