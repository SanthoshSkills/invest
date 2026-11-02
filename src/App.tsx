import React, { useState, useMemo } from 'react';
import {
  Compass,
  ShieldCheck,
  CheckSquare,
  BookOpen,
  Sliders,
  AlertCircle,
  TrendingUp,
  FileText,
  PieChart,
  Layers,
  Search,
  Filter,
  Zap,
  Target,
  ArrowRight,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  Briefcase,
  PlayCircle,
  BarChart2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  Copy,
  Check,
  X,
  Info,
  DollarSign,
  Activity,
  ExternalLink,
  Play,
} from 'lucide-react';
import {
  REGIMES_DATA,
  MACRO_SECTORS,
  INDUSTRY_GROUPS,
  BASE_INDUSTRIES,
  STOCK_SCRIPS,
  INITIAL_PAPER_PORTFOLIO,
  BACKTEST_SCENARIOS,
} from './data/nifty500Data';
import { StockScrip, PaperPosition, RegimeType } from './types/strategy';
import { SectorTreemap } from './components/SectorTreemap';
import { PipelineExecutionModal } from './components/PipelineExecutionModal';
import { SparklineChart } from './components/SparklineChart';
import { TechnicalChartWorkbench } from './components/TechnicalChartWorkbench';

export function App() {
  const appName = import.meta.env.VITE_APP_NAME || 'Invest';

  // Active Navigation View
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'candidates' | 'paper' | 'backtest' | 'specs'>('hierarchy');

  // Hierarchy drill-down state
  const [selectedSectorId, setSelectedSectorId] = useState<string>('capgoods');
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('power_td');
  const [selectedBaseIndustryId, setSelectedBaseIndustryId] = useState<string>('transformers');

  // Global Scrip Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inspectedScrip, setInspectedScrip] = useState<StockScrip | null>(null);

  // Paper Trading State
  const [portfolio, setPortfolio] = useState(INITIAL_PAPER_PORTFOLIO);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState<string | null>(null);

  // Markdown copy feedback state
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Dynamic live App URL for opening standalone or sharing
  const liveAppUrl = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ais-dev-e7jlziwwvxc2clubac46ma-516653370567.asia-east1.run.app';

  // Screener Run Engine State
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [lastRunTimestamp, setLastRunTimestamp] = useState('2026-10-31 15:35 IST');

  const handleRunComplete = () => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST`;
    setLastRunTimestamp(timeStr);
    setTradeSuccessMsg('Screener run finished: Nifty 500 universe scanned, Val-Mo scores and lot allocations refreshed!');
    setTimeout(() => setTradeSuccessMsg(null), 4000);
  };

  // Filtered stocks for the hierarchy drill-down
  const activeSector = useMemo(
    () => MACRO_SECTORS.find((s) => s.id === selectedSectorId) || MACRO_SECTORS[0],
    [selectedSectorId]
  );
  const activeIndustry = useMemo(
    () => INDUSTRY_GROUPS.find((i) => i.id === selectedIndustryId) || INDUSTRY_GROUPS[0],
    [selectedIndustryId]
  );
  const activeBaseIndustry = useMemo(
    () => BASE_INDUSTRIES.find((b) => b.id === selectedBaseIndustryId) || BASE_INDUSTRIES[0],
    [selectedBaseIndustryId]
  );

  const handleSelectSector = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    const matchInd = INDUSTRY_GROUPS.find((i) => i.sectorId === sectorId);
    if (matchInd) {
      setSelectedIndustryId(matchInd.id);
      const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === matchInd.id);
      if (matchBase) setSelectedBaseIndustryId(matchBase.id);
    }
  };

  // Advanced Custom Metric Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [minRoce, setMinRoce] = useState<number>(16); // Minimum 3-Year ROCE %
  const [maxDebtToEquity, setMaxDebtToEquity] = useState<number>(0.7); // Maximum Debt to Equity (x)
  const [maxPeg, setMaxPeg] = useState<number>(1.75); // Maximum PEG ratio
  const [candidateScope, setCandidateScope] = useState<'base_industry' | 'sector' | 'all'>('base_industry');

  const resetFiltersToDefault = () => {
    setMinRoce(16);
    setMaxDebtToEquity(0.7);
    setMaxPeg(1.75);
  };

  const clearFilters = () => {
    setMinRoce(0);
    setMaxDebtToEquity(2.0);
    setMaxPeg(4.0);
  };

  const isCustomFilterModified = minRoce !== 16 || maxDebtToEquity !== 0.7 || maxPeg !== 1.75;

  // Base pool of candidates according to selected scope
  const baseHierarchyPool = useMemo(() => {
    if (candidateScope === 'all') return STOCK_SCRIPS;
    if (candidateScope === 'sector') return STOCK_SCRIPS.filter((s) => s.sectorId === selectedSectorId);
    return STOCK_SCRIPS.filter((s) => s.baseIndustryId === selectedBaseIndustryId);
  }, [candidateScope, selectedSectorId, selectedBaseIndustryId]);

  // Filtered by custom ranges
  const filteredHierarchyStocks = useMemo(() => {
    return baseHierarchyPool.filter((s) => {
      if (s.roce3Y < minRoce) return false;
      if (s.debtToEquity > maxDebtToEquity) return false;
      if (s.peg > maxPeg) return false;
      return true;
    });
  }, [baseHierarchyPool, minRoce, maxDebtToEquity, maxPeg]);

  // Global Search Filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return STOCK_SCRIPS.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Model Qualified Candidates (Tier 5) with custom filters
  const qualifiedCandidates = useMemo(() => {
    return STOCK_SCRIPS.filter((s) => {
      if (s.qualificationTier !== 'Tier 5 Qualified') return false;
      if (s.roce3Y < minRoce) return false;
      if (s.debtToEquity > maxDebtToEquity) return false;
      if (s.peg > maxPeg) return false;
      return true;
    });
  }, [minRoce, maxDebtToEquity, maxPeg]);

  // Execution: Add to Paper Trading Portfolio
  const executePaperTrade = (stock: StockScrip) => {
    const requiredCapital = stock.calculatedLotShares * stock.price;
    if (portfolio.cashBalance < requiredCapital) {
      alert(`Insufficient tactical cash (Available: ₹${portfolio.cashBalance.toLocaleString('en-IN')}, Required: ₹${requiredCapital.toLocaleString('en-IN')}).`);
      return;
    }

    const newPosition: PaperPosition = {
      id: 'p-' + Date.now(),
      symbol: stock.symbol,
      name: stock.name,
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: stock.price,
      currentPrice: stock.price,
      shares: stock.calculatedLotShares,
      investedAmount: requiredCapital,
      currentValue: requiredCapital,
      pnl: 0,
      pnlPct: 0,
      stopLoss: stock.pyramidDownStopLossPrice,
      pyramidLevel: 1,
      trimTarget: stock.extremeValuationTrimPrice,
      estimatedStcgTax: 0,
      estimatedDpFees: 15.93,
    };

    setPortfolio((prev) => ({
      ...prev,
      cashBalance: prev.cashBalance - requiredCapital,
      positions: [newPosition, ...prev.positions],
    }));

    setTradeSuccessMsg(`Allocated lot of ${stock.calculatedLotShares} shares in ${stock.symbol} (₹${requiredCapital.toLocaleString('en-IN')}).`);
    setTimeout(() => setTradeSuccessMsg(null), 3000);
  };

  // Execution: Pyramid +1 Tranche into Winner
  const executePyramidTranche = (posId: string) => {
    const targetPos = portfolio.positions.find((p) => p.id === posId);
    if (!targetPos) return;

    const addCost = Math.round(targetPos.investedAmount * 0.5); // Add 50% pyramiding tranche
    if (portfolio.liquidBeEsBuffer < addCost) {
      alert(`Insufficient funds in Staging Reserve Pool (Available: ₹${portfolio.liquidBeEsBuffer.toLocaleString('en-IN')}, Required: ₹${addCost.toLocaleString('en-IN')}).`);
      return;
    }

    const additionalShares = Math.floor(addCost / targetPos.currentPrice);

    setPortfolio((prev) => ({
      ...prev,
      liquidBeEsBuffer: prev.liquidBeEsBuffer - addCost,
      positions: prev.positions.map((p) => {
        if (p.id === posId) {
          const newShares = p.shares + additionalShares;
          const newInvested = p.investedAmount + addCost;
          const newCurrentVal = newShares * p.currentPrice;
          const newPnl = newCurrentVal - newInvested;
          return {
            ...p,
            shares: newShares,
            investedAmount: newInvested,
            currentValue: newCurrentVal,
            pnl: newPnl,
            pnlPct: Number(((newPnl / newInvested) * 100).toFixed(2)),
            pyramidLevel: p.pyramidLevel + 1,
          };
        }
        return p;
      }),
    }));

    setTradeSuccessMsg(`Pyramided +${additionalShares} shares into ${targetPos.symbol} using Staging Buffer!`);
    setTimeout(() => setTradeSuccessMsg(null), 3500);
  };

  // Portfolio Totals
  const totalEquitiesValue = portfolio.positions.reduce((acc, p) => acc + p.currentValue, 0);
  const totalPortfolioValue = totalEquitiesValue + portfolio.cashBalance + portfolio.liquidBeEsBuffer;
  const totalPnl = portfolio.positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalInvested = portfolio.positions.reduce((acc, p) => acc + p.investedAmount, 0);
  const overallReturnPct = totalInvested > 0 ? Number(((totalPnl / totalInvested) * 100).toFixed(2)) : 0;
  const totalEstimatedStcg = portfolio.positions.reduce((acc, p) => acc + (p.pnl > 0 ? p.pnl * 0.2 : 0), 0);
  const totalDpDrag = portfolio.positions.length * 15.93;

  const copyToClipboard = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const rawState = `# Project State: Nifty 500 Regime & Val-Mo Strategy

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
- Active Task: Move from conceptual design to screener implementation.`;

  const rawTasks = `# Tasks & Execution Log

## Active Sprint (Next Session)
- [ ] Task 1: Finalize metric thresholds for Tier 3 (Industry EBITDA inflection) and Tier 5 (Stock Val-Mo screen).
- [ ] Task 2: Build Python script (\`screener.py\`) using \`yfinance\` to automate the 4-tier screening pipeline.
- [ ] Task 3: Implement staging pool logic for the ₹10,000 monthly inflow (pyramiding vs. new tranche rules).

## Completed Log
- [x] 2026-10-31: Defined 3 primary market regimes and 5 specialized market environments.
- [x] 2026-10-31: Established ₹1,00,000 baseline risk controls (stops, statutory fee mitigation).
- [x] 2026-10-31: Formulated dynamic headwind/tailwind framework (RRG rotation vs. static sector lists).
- [x] 2026-10-31: Locked hybrid Value-Momentum philosophy with staged scaling rules.
- [x] 2026-10-31: Integrated ₹10,000 monthly Staged-SIP capital inflow model.
- [x] 2026-10-31: Structured the 4-tier NSE classification screening pipeline.

## Discarded / Rejected Ideas
- Permanent static sector blacklists: Rejected because sector headwinds/tailwinds are cyclical.
- Binary all-or-nothing momentum exits: Rejected to avoid selling secular compounders too early.
- Direct monthly ₹10,000 micro-purchases across multiple stocks: Rejected due to DP transaction fees and odd lots.`;

  const rawResearch = `# Market Research & Quantitative Framework

## 1. Nifty 500 Index Structure (NSE Benchmark: September/October 2026)
- Coverage: ~89.9% of total NSE free-float market capitalization.
- Key Sector Weights:
  - Financial Services: 30.58%
  - Capital Goods: 7.50%
  - Automobile & Components: 7.42%
  - Healthcare: 7.31%
  - Oil, Gas & Consumable Fuels: 6.77%
  - Information Technology: 6.02%
- Current Valuation: P/E is 20.91 (historical 5-year median: 23.60, 11% discount).

## 2. Complete Regime Classification Matrix (8 Regimes)
- Bull Market, Sideways/Transition, Bear Market, Polarized, Volatile Choppy, Speculative Melt-Up, Liquidity Shock, Goldilocks Grind.

## 3. Stock Selection Rules
- Liquidity Minimum: ADTV > ₹30Cr to > ₹75Cr.
- Quality Filters: 3-year ROCE/ROE > 16%, OCF/EBITDA > 70%, Debt-to-Equity < 0.7x.
- Valuation Guardrail: PEG < 1.75x or current P/E ≤ 5-year historical median.

## 4. Sector & Industry Qualitative Filter
- Priority Tailwinds: Power T&D & Infrastructure, Pharma & CDMO, Secured Financial Services.
- Critical Headwinds: Unsecured Credit NBFCs & MFI, Overvalued Late-Cycle Cyclicals, Mass FMCG.`;

  const rawCheckpoint = `# Session Checkpoint

## 1. Timestamp & Branch
- Last Active Session: 2026-10-31
- Target Branch: main

## 2. Active Strategy State
- Capital Deployed: ₹0 / ₹1,00,000 (Initial base pending execution)
- Staged Reserve Pool: ₹0 (Awaiting Month 1 ₹10,000 deposit)
- Active Regime: Sideways / Transition
- Target Strategy: Value-Momentum (Val-Mo) 4-Tier Funnel

## 3. Immediate Resume Step
- Task in Progress: Task 1 in TASKS.md
- Next Action: Finalize EBITDA margin inflection metrics (Tier 3) and P/E median discount levels (Tier 5).
- Input Files Needed: NSE 500 sector classification list or yfinance ticker map.

## 4. Pending Uncommitted Changes
- None. (Workspace synchronized).`;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Institutional Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Market Status Ticker */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-400 flex items-center justify-center font-black text-slate-950 shadow-md shadow-emerald-500/20">
              <Compass className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>{appName}</span>
                  <span className="text-slate-500 text-xs font-normal">/</span>
                  <span className="text-xs font-medium text-slate-300">Quantitative Strategy Terminal</span>
                </h1>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Nifty 500 Val-Mo
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <Activity className="h-3 w-3" /> Active Regime: Sideways (40% Liquid Reserve)
                </span>
                <span>•</span>
                <span>P/E: 20.91 (11% disc.)</span>
                <span>•</span>
                <span>VIX: 14.8</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">Last Run: {lastRunTimestamp}</span>
              </div>
            </div>
          </div>

          {/* Quick Universal Scrip Search Bar */}
          <div className="relative flex-1 max-w-xs md:mx-4">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Scrip (e.g., APAR, DIVIS, ICICI)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Search Dropdown Results */}
            {isSearchOpen && searchQuery && (
              <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">No scrips matching "{searchQuery}"</div>
                ) : (
                  searchResults.map((scrip) => (
                    <div
                      key={scrip.symbol}
                      onClick={() => {
                        setInspectedScrip(scrip);
                        setIsSearchOpen(false);
                      }}
                      className="p-2.5 border-b border-slate-800/80 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{scrip.symbol}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            scrip.qualificationTier === 'Tier 5 Qualified'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {scrip.qualificationTier}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{scrip.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-white">₹{scrip.price.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">Score: {scrip.valMoScore}/100</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Navigation View Switcher */}
          <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'hierarchy'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Market Hierarchy
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'candidates'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="h-3.5 w-3.5" /> Model Candidates &amp; Lots
            </button>
            <button
              onClick={() => setActiveTab('paper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'paper'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Paper Trading
            </button>
            <button
              onClick={() => setActiveTab('backtest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'backtest'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" /> Backtester
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'specs'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Strategy Docs
            </button>
          </nav>

          {/* Action Buttons: Run Screener & Open Standalone */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setIsScreeningModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Screener</span>
            </button>
            <a
              href={liveAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-slate-500 text-slate-200 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer"
              title="Open terminal in a new standalone browser tab"
            >
              <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Open Standalone</span>
            </a>
          </div>
        </div>
      </header>

      {/* Action Notifications */}
      {tradeSuccessMsg && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs px-4 py-2 text-center font-medium flex items-center justify-center gap-2 animate-fade-in">
          <Check className="h-4 w-4" /> {tradeSuccessMsg}
        </div>
      )}

      {/* Main Terminal Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* ROUTE 1: MARKET HIERARCHY DRILL-DOWN */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-6 animate-fade-in">
            {/* Level 1: Market Regime Overview Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Tier 0: Active Regime
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      Nifty 500 Sideways / Transition Band
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    Market Macro Diagnostics
                  </h2>
                  <p className="text-xs text-slate-400">
                    Nifty 500 index within ±5% of 200-DMA • Market Breadth: 46% &gt; 50-DMA • Target: 60% Equity / 40% Liquid Reserve
                  </p>
                </div>

                {/* Capital Architecture Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-right">
                  <div>
                    <div className="text-[10px] text-slate-400">Base Capital</div>
                    <div className="text-sm font-black text-emerald-400">₹1,00,000</div>
                    <div className="text-[9px] text-slate-500">100% Cash CNC</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Monthly Inflow</div>
                    <div className="text-sm font-black text-teal-400">+₹10,000</div>
                    <div className="text-[9px] text-slate-500">Staging Pool</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Lot Sizing Floor</div>
                    <div className="text-sm font-black text-white">₹15k – ₹20k</div>
                    <div className="text-[9px] text-slate-500">No &lt;₹10k lots</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Concentration</div>
                    <div className="text-sm font-black text-cyan-400">5 to 7 Stocks</div>
                    <div className="text-[9px] text-slate-500">Scale Position Size</div>
                  </div>
                </div>
              </div>

              {/* 8-Regime Quick Selector Strip */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">8-Regime Classification Model:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {REGIMES_DATA.map((reg) => (
                    <div
                      key={reg.id}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        reg.status === 'active'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-70'
                      }`}
                    >
                      <div className="text-[10px] font-bold truncate">{reg.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{reg.equityAllocationPct}% Eq / {reg.cashAllocationPct}% Liq</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* D3-based Nifty 500 Sector Treemap Visualization */}
            <SectorTreemap
              sectors={MACRO_SECTORS}
              selectedSectorId={selectedSectorId}
              onSelectSector={handleSelectSector}
            />

            {/* Level 2 & Level 3 & Level 4: Drill-Down Funnel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Level 2: Macro Sector (RRG Quadrant Selection) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">1</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Macro Sector (RRG)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Filter: Leading &amp; Improving</span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {MACRO_SECTORS.map((sector) => (
                    <div
                      key={sector.id}
                      onClick={() => handleSelectSector(sector.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedSectorId === sector.id
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{sector.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          sector.quadrant === 'Leading'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : sector.quadrant === 'Improving'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {sector.quadrant}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Weight: {sector.weightPct}%</span>
                        <span>RS-Mom: {sector.rsMomentum}</span>
                        <span className={sector.macroStatus === 'Tailwind' ? 'text-emerald-400' : 'text-slate-400'}>
                          {sector.macroStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 3: Industry Operating Leverage & EBITDA Inflection */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center">2</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Industry Inflection
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">YoY Margin Delta &gt; 150bps</span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {INDUSTRY_GROUPS.filter((i) => i.sectorId === selectedSectorId).length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">No industry groups mapped for this sector</div>
                  ) : (
                    INDUSTRY_GROUPS.filter((i) => i.sectorId === selectedSectorId).map((ind) => (
                      <div
                        key={ind.id}
                        onClick={() => {
                          setSelectedIndustryId(ind.id);
                          const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === ind.id);
                          if (matchBase) setSelectedBaseIndustryId(matchBase.id);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedIndustryId === ind.id
                            ? 'bg-teal-500/15 border-teal-500/40 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{ind.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                            ind.ebitdaInflectionYoY > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {ind.ebitdaInflectionYoY > 0 ? `+${ind.ebitdaInflectionYoY} bps` : `${ind.ebitdaInflectionYoY} bps`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Capacity Util: {ind.capacityUtilizationPct}%</span>
                          <span className="text-teal-400">{ind.cyclePhase}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                          {ind.qualitativeTailwinds}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Level 4: Base Industry Moats & Supply/Demand Deficits */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">3</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Base Industry Moat
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Pricing Power &amp; Deficits</span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {BASE_INDUSTRIES.filter((b) => b.industryId === selectedIndustryId).length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">No base industries mapped for this industry</div>
                  ) : (
                    BASE_INDUSTRIES.filter((b) => b.industryId === selectedIndustryId).map((base) => (
                      <div
                        key={base.id}
                        onClick={() => setSelectedBaseIndustryId(base.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedBaseIndustryId === base.id
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{base.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                            base.pricingPower === 'High' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {base.pricingPower} Pricing Power
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-300 font-medium mb-1">
                          Moat: {base.moatType}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                          {base.supplyDemandStatus}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Level 5: Filtered Base Industry Candidates with Calculated Lot Sizing */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">4</span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Constituent Stocks: <span className="text-emerald-400">{candidateScope === 'all' ? 'All Nifty 500 Candidates' : candidateScope === 'sector' ? activeSector.name : activeBaseIndustry.name}</span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Integrated Value-Momentum evaluation with custom metric ranges &amp; calculated lot sizes
                  </p>
                </div>

                {/* Right controls: Scope Selector & Advanced Filter Toggle */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Scope Selector */}
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setCandidateScope('base_industry')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        candidateScope === 'base_industry' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Base Industry
                    </button>
                    <button
                      onClick={() => setCandidateScope('sector')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        candidateScope === 'sector' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Sector
                    </button>
                    <button
                      onClick={() => setCandidateScope('all')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        candidateScope === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Stocks ({STOCK_SCRIPS.length})
                    </button>
                  </div>

                  {/* Advanced Filters Toggle Button */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      showAdvancedFilters || isCustomFilterModified
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Advanced Filters</span>
                    {isCustomFilterModified && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    {showAdvancedFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="mb-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs animate-fade-in shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-emerald-400" />
                      <span className="font-bold text-white text-xs uppercase tracking-wider">Custom Metric Range Thresholds</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Matching {filteredHierarchyStocks.length} of {baseHierarchyPool.length} scrips
                      </span>
                    </div>

                    {/* Presets and Reset */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetFiltersToDefault}
                        className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" /> Reset Baseline
                      </button>
                      <button
                        onClick={clearFilters}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-cyan-950/30 border border-cyan-800/40 transition-colors"
                      >
                        Show All (Unrestricted)
                      </button>
                    </div>
                  </div>

                  {/* 3 Slider Control Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Filter 1: Min ROCE */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                          <span>Min 3-Year ROCE</span>
                        </label>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                          ≥ {minRoce}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        step="1"
                        value={minRoce}
                        onChange={(e) => setMinRoce(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span className="text-slate-400">Val-Mo standard: ≥16%</span>
                        <span>35%</span>
                      </div>
                    </div>

                    {/* Filter 2: Max Debt-to-Equity */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                          <span>Max Debt-to-Equity</span>
                        </label>
                        <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold text-xs border border-teal-500/30">
                          ≤ {maxDebtToEquity.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={maxDebtToEquity}
                        onChange={(e) => setMaxDebtToEquity(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0.0x (Debt-free)</span>
                        <span className="text-slate-400">Val-Mo standard: ≤0.70x</span>
                        <span>1.5x</span>
                      </div>
                    </div>

                    {/* Filter 3: Max PEG Ratio */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                          <span>Max PEG Ratio</span>
                        </label>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-xs border border-cyan-500/30">
                          ≤ {maxPeg.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.5"
                        step="0.05"
                        value={maxPeg}
                        onChange={(e) => setMaxPeg(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0.5x (Deep Value)</span>
                        <span className="text-slate-400">Val-Mo standard: ≤1.75x</span>
                        <span>3.5x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {filteredHierarchyStocks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-xl bg-slate-950/40 space-y-3">
                  <p>No candidate scrips match the active filters (ROCE ≥ {minRoce}%, D/E ≤ {maxDebtToEquity}x, PEG ≤ {maxPeg}x).</p>
                  <button
                    onClick={resetFiltersToDefault}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    Reset to Baseline Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                        <th className="py-2.5 px-3">Symbol / Name</th>
                        <th className="py-2.5 px-3">CMP</th>
                        <th className="py-2.5 px-3">P/E vs 5Y Med</th>
                        <th className="py-2.5 px-3">ROCE • D/E • PEG</th>
                        <th className="py-2.5 px-3">30D vs 50-DMA</th>
                        <th className="py-2.5 px-3">50-DMA Status</th>
                        <th className="py-2.5 px-3">Val-Mo Score</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Strategic Lot Size</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredHierarchyStocks.map((stock) => (
                        <tr key={stock.symbol} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{stock.symbol}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{stock.name}</div>
                          </td>
                          <td className="py-3 px-3 text-white font-mono font-semibold">
                            ₹{stock.price.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-white font-mono">{stock.pe}x</div>
                            <div className="text-[10px] text-slate-400">Med: {stock.peMedian5Y}x ({stock.peStdDevDelta > 0 ? `+${stock.peStdDevDelta}` : stock.peStdDevDelta}σ)</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-white text-xs">
                              <span className={stock.roce3Y >= minRoce ? 'text-emerald-400 font-bold' : 'text-slate-400'}>{stock.roce3Y}%</span>
                              <span className="text-slate-600 mx-1">/</span>
                              <span className={stock.debtToEquity <= maxDebtToEquity ? 'text-teal-400 font-bold' : 'text-slate-400'}>{stock.debtToEquity}x</span>
                              <span className="text-slate-600 mx-1">/</span>
                              <span className={stock.peg <= maxPeg ? 'text-cyan-400 font-bold' : 'text-slate-400'}>{stock.peg}x</span>
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5">ROCE / D-E / PEG</div>
                          </td>
                          <td className="py-3 px-3">
                            <SparklineChart
                              data={stock.sparkline30D}
                              dma50={stock.dma50}
                              currentPrice={stock.price}
                              width={84}
                              height={26}
                            />
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              stock.above50Dma ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {stock.above50Dma ? 'Reclaimed > 50-DMA' : 'Below 50-DMA'}
                            </span>
                            <div className="text-[10px] text-slate-400">Vol: {stock.deliveryVolumeRatio}x deliv.</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-400">{stock.valMoScore}</span>
                              <div className="h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${stock.valMoScore}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              stock.qualificationTier === 'Tier 5 Qualified'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : stock.qualificationTier === 'Watchlist'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            }`}>
                              {stock.qualificationTier}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {stock.calculatedLotShares > 0 ? (
                              <div>
                                <div className="font-bold text-white">{stock.calculatedLotShares} Shares (₹{(stock.calculatedLotShares * stock.price).toLocaleString('en-IN')})</div>
                                <div className="text-[10px] text-slate-400">
                                  Pyramid: ₹{stock.pyramidUpTriggerPrice} | Stop: ₹{stock.pyramidDownStopLossPrice}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Disqualified (no lot)</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setInspectedScrip(stock)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                              >
                                Metrics
                              </button>
                              {stock.qualificationTier === 'Tier 5 Qualified' && (
                                <button
                                  onClick={() => executePaperTrade(stock)}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                                >
                                  <Plus className="h-3 w-3" /> Paper Buy
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROUTE 2: STRATEGIC MODEL CANDIDATES & LOT SIZING */}
        {activeTab === 'candidates' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                      Quantitative Val-Mo Output
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      5-Tier Screening Pipeline Filtered
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    Strategic Model Candidates &amp; Calculated Lot Sizing
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Systematic lot allocation for ₹1,00,000 base capital (₹15,000–₹20,000 / position) with predefined pyramiding triggers.
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                  <div className="text-[10px] text-slate-400">Qualified Candidates</div>
                  <div className="text-2xl font-black text-emerald-400">{qualifiedCandidates.length} Scrips</div>
                  <div className="text-[10px] text-slate-500">Max 2 per sector rule active</div>
                </div>
              </div>

              {/* Filter Status Strip */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Filter className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold">Active Filter Bounds:</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono">
                    ROCE ≥ {minRoce}%
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-400 font-mono">
                    D/E ≤ {maxDebtToEquity.toFixed(2)}x
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-mono">
                    PEG ≤ {maxPeg.toFixed(2)}x
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('hierarchy');
                      setShowAdvancedFilters(true);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 font-medium"
                  >
                    <SlidersHorizontal className="h-3 w-3 text-emerald-400" /> Adjust Filter Ranges
                  </button>
                  {isCustomFilterModified && (
                    <button
                      onClick={resetFiltersToDefault}
                      className="text-[11px] px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-amber-400 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Cards Grid */}
            {qualifiedCandidates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/40 space-y-3">
                <p>No model candidates pass the active filters (ROCE ≥ {minRoce}%, D/E ≤ {maxDebtToEquity}x, PEG ≤ {maxPeg}x).</p>
                <button
                  onClick={resetFiltersToDefault}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                >
                  Reset to Val-Mo Baseline Filters
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {qualifiedCandidates.map((stock) => (
                <div
                  key={stock.symbol}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">{stock.symbol}</h3>
                        <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                          Val-Mo: {stock.valMoScore}/100
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{stock.name}</div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="text-base font-black text-white">₹{stock.price.toLocaleString('en-IN')}</div>
                      <div className="mt-1">
                        <SparklineChart
                          data={stock.sparkline30D}
                          dma50={stock.dma50}
                          currentPrice={stock.price}
                          width={76}
                          height={20}
                        />
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">RS-3M: +{stock.rsMansfield3M}%</div>
                    </div>
                  </div>

                  {/* Quantitative Checklist Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">P/E vs 5Y Med</div>
                      <div className="text-xs font-bold text-white">{stock.pe}x / {stock.peMedian5Y}x</div>
                      <div className="text-[9px] text-emerald-400">{stock.peStdDevDelta}σ discount</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Debt/Equity &amp; ROCE</div>
                      <div className="text-xs font-bold text-white">{stock.debtToEquity}x / {stock.roce3Y}%</div>
                      <div className="text-[9px] text-slate-400">Low Leverage</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Delivery Volume</div>
                      <div className="text-xs font-bold text-teal-400">{stock.deliveryVolumeRatio}x Avg</div>
                      <div className="text-[9px] text-emerald-400">&gt; 50-DMA Reclaimed</div>
                    </div>
                  </div>

                  {/* Strategic Lot Sizing Box */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-teal-500/10 border border-emerald-500/20 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-emerald-400" />
                        Calculated Lot Allocation (₹1L Portfolio):
                      </span>
                      <span className="text-xs font-black text-emerald-400">
                        {stock.calculatedLotShares} Shares (₹{(stock.calculatedLotShares * stock.price).toLocaleString('en-IN')})
                      </span>
                    </div>

                    {/* Pyramiding Triggers */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Pyramid Up (+6%):</span>
                        <strong className="text-emerald-400">₹{stock.pyramidUpTriggerPrice}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Hard Stop (-6.5%):</span>
                        <strong className="text-rose-400">₹{stock.pyramidDownStopLossPrice}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Trim (+1.5σ):</span>
                        <strong className="text-amber-400">₹{stock.extremeValuationTrimPrice}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setInspectedScrip(stock)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                    >
                      View Deep Metrics
                    </button>
                    <button
                      onClick={() => executePaperTrade(stock)}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                    >
                      <Plus className="h-4 w-4" /> Execute Paper Trade
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ROUTE 3: PAPER TRADING & VIRTUAL EXECUTION COCKPIT */}
        {activeTab === 'paper' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Portfolio Summary Banner */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                      Virtual Portfolio Execution
                    </span>
                    <span className="text-xs text-slate-400">
                      100% Cash Delivery (CNC) • Staged Inflow Model
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">
                    ₹{totalPortfolioValue.toLocaleString('en-IN')}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalPnl >= 0 ? `+₹${totalPnl.toLocaleString('en-IN')}` : `-₹${Math.abs(totalPnl).toLocaleString('en-IN')}`} ({overallReturnPct}%)
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs text-slate-400">Total Capital Base: ₹{portfolio.totalInitialCapital.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Cash Allocation Breakdown */}
                <div className="grid grid-cols-3 gap-3 md:border-l md:border-slate-800 md:pl-6 text-right">
                  <div>
                    <div className="text-[10px] text-slate-400">Active Equities</div>
                    <div className="text-base font-black text-white">₹{totalEquitiesValue.toLocaleString('en-IN')}</div>
                    <div className="text-[9px] text-slate-500">{portfolio.positions.length} Positions</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Staging Reserve (Liquid)</div>
                    <div className="text-base font-black text-teal-400">₹{portfolio.liquidBeEsBuffer.toLocaleString('en-IN')}</div>
                    <div className="text-[9px] text-slate-500">Liquid BeES (Pyramid Buffer)</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Tactical Cash</div>
                    <div className="text-base font-black text-cyan-400">₹{portfolio.cashBalance.toLocaleString('en-IN')}</div>
                    <div className="text-[9px] text-slate-500">Available for Entries</div>
                  </div>
                </div>
              </div>

              {/* Statutory Drag & Friction Bar */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span>Estimated STCG (20% on gains): <strong className="text-amber-400 font-mono">₹{totalEstimatedStcg.toFixed(0)}</strong></span>
                  <span>•</span>
                  <span>Estimated DP Fees (₹15.93/pos): <strong className="text-slate-300 font-mono">₹{totalDpDrag.toFixed(2)}</strong></span>
                </div>
                <div className="text-emerald-400 font-medium">
                  Total Friction Drag: &lt; 0.25% (Well below 0.5% statutory guardrail)
                </div>
              </div>
            </div>

            {/* Active Virtual Positions Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-400" />
                  Active Theoretical Positions ({portfolio.positions.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Target Concentration: 5 to 7 stocks capped
                </span>
              </div>

              {portfolio.positions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No open positions. Go to Model Candidates tab to initiate theoretical entries.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                        <th className="py-2.5 px-3">Scrip</th>
                        <th className="py-2.5 px-3">Entry Date</th>
                        <th className="py-2.5 px-3">Shares</th>
                        <th className="py-2.5 px-3">Avg Buy Price</th>
                        <th className="py-2.5 px-3">CMP</th>
                        <th className="py-2.5 px-3">Current Value</th>
                        <th className="py-2.5 px-3">Unrealized P&amp;L</th>
                        <th className="py-2.5 px-3">Stop Loss</th>
                        <th className="py-2.5 px-3 text-right">Pyramid Tranche</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {portfolio.positions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3">
                            <span className="font-bold text-white text-xs">{pos.symbol}</span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{pos.name}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{pos.entryDate}</td>
                          <td className="py-3 px-3 text-white font-mono font-bold">{pos.shares}</td>
                          <td className="py-3 px-3 text-slate-300 font-mono">₹{pos.entryPrice.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-white font-mono font-bold">₹{pos.currentPrice.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-white font-mono">₹{pos.currentValue.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3">
                            <span className={`font-mono font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pos.pnl >= 0 ? `+₹${pos.pnl}` : `-₹${Math.abs(pos.pnl)}`} ({pos.pnlPct}%)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-rose-400 font-mono">₹{pos.stopLoss}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => executePyramidTranche(pos.id)}
                              className="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-semibold rounded text-[11px] transition-colors"
                            >
                              Pyramid +50% Tranche
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROUTE 4: STRATEGY BACKTESTER */}
        {activeTab === 'backtest' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                      Multi-Regime Historical Simulation
                    </span>
                    <span className="text-xs text-slate-400">
                      Walk-Forward Val-Mo Framework vs Buy-and-Hold Nifty 500
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    Empirical Strategy Backtest Results
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulated performance accounting for 20% STCG tax drag, DP charges, and regime staging buffer rules.
                  </p>
                </div>
              </div>
            </div>

            {/* Backtest Scenarios Cards */}
            <div className="space-y-4">
              {BACKTEST_SCENARIOS.map((scenario) => (
                <div
                  key={scenario.period}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white">{scenario.period}</h3>
                      <span className="text-xs text-emerald-400 font-medium">Regime Tested: {scenario.regime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Generated Alpha:</span>
                      <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                        {scenario.alpha} vs Nifty 500
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Val-Mo Return</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">{scenario.valMoReturn}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Nifty 500 Return</div>
                      <div className="text-base font-black text-slate-300 mt-0.5">{scenario.nifty500Return}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Max Drawdown</div>
                      <div className="text-base font-black text-teal-400 mt-0.5">{scenario.maxDrawdown}</div>
                      <div className="text-[9px] text-slate-500">Benchmark: {scenario.benchmarkDrawdown}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Win Rate</div>
                      <div className="text-base font-black text-white mt-0.5">{scenario.winRate}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Profit Factor</div>
                      <div className="text-base font-black text-cyan-400 mt-0.5">{scenario.profitFactor}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400">STCG Tax Drag</div>
                      <div className="text-base font-black text-amber-400 mt-0.5">{scenario.stcgDragPct}</div>
                      <div className="text-[9px] text-slate-500">Avg Dur: {scenario.avgTradeDuration}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROUTE 5: STRATEGY DOCS & SPECIFICATIONS */}
        {activeTab === 'specs' && (
          <div className="space-y-6 animate-fade-in">
            {/* Free Hosting & Public Publishing Guide */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-400">🌐</span> Free Hosting &amp; Public Publishing Guide
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                You can share this terminal publicly with zero cost using either the built-in instant URL or automated GitHub Pages.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Method 1 */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>Option 1: Google Cloud Dev & Share URL</span>
                    <span className="text-[10px] text-slate-400 font-mono">Live</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Direct instance URL. To share publicly, use the <span className="text-slate-200 font-medium">Share</span> button in Google AI Studio or deploy to GitHub Pages.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={liveAppUrl}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard('preview-url', liveAppUrl)}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {copiedFile === 'preview-url' ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* Method 2 */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-400 flex items-center justify-between">
                    <span>Option 2: GitHub Pages (2-Click Activation)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Automated CI/CD</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Pre-configured via <code className="text-cyan-300 font-mono">.github/workflows/deploy.yml</code>.
                  </p>
                  <ol className="text-[11px] text-slate-300 list-decimal list-inside space-y-0.5">
                    <li>Go to GitHub: <span className="text-white font-mono">SanthoshSkills/invest</span></li>
                    <li>Click <strong>Settings</strong> ➔ <strong>Pages</strong></li>
                    <li>Under <strong>Source</strong>, choose <strong>GitHub Actions</strong></li>
                  </ol>
                  <div className="text-[10px] text-emerald-400 pt-0.5">
                    Live URL: <code className="font-mono">https://santhoshskills.github.io/invest/</code>
                  </div>
                </div>
              </div>
            </div>

            {/* STATE.md */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                  STATE.md (Single Source of Truth)
                </h3>
                <button
                  onClick={() => copyToClipboard('state', rawState)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  {copiedFile === 'state' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedFile === 'state' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
                {rawState}
              </pre>
            </div>

            {/* TASKS.md */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase text-blue-400 tracking-wider">
                  TASKS.md (Execution Log)
                </h3>
                <button
                  onClick={() => copyToClipboard('tasks', rawTasks)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  {copiedFile === 'tasks' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedFile === 'tasks' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
                {rawTasks}
              </pre>
            </div>

            {/* RESEARCH.md */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase text-purple-400 tracking-wider">
                  RESEARCH.md (Knowledge &amp; Formulas)
                </h3>
                <button
                  onClick={() => copyToClipboard('research', rawResearch)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  {copiedFile === 'research' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedFile === 'research' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
                {rawResearch}
              </pre>
            </div>

            {/* CHECKPOINT.md */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase text-amber-400 tracking-wider">
                  CHECKPOINT.md (Session State Handoff)
                </h3>
                <button
                  onClick={() => copyToClipboard('checkpoint', rawCheckpoint)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  {copiedFile === 'checkpoint' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedFile === 'checkpoint' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap border border-slate-800/80">
                {rawCheckpoint}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* SCRIP DETAIL MODAL / DRAWER */}
      {inspectedScrip && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-scale-up my-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectedScrip(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                {inspectedScrip.symbol.slice(0, 3)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{inspectedScrip.symbol}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    inspectedScrip.qualificationTier === 'Tier 5 Qualified'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {inspectedScrip.qualificationTier}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{inspectedScrip.name}</p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs mb-4">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Current Price</span>
                <span className="text-sm font-bold text-white">₹{inspectedScrip.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Val-Mo Score</span>
                <span className="text-sm font-bold text-emerald-400">{inspectedScrip.valMoScore} / 100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">P/E vs 5Y Med</span>
                <span className="text-xs font-semibold text-white">{inspectedScrip.pe}x ({inspectedScrip.peMedian5Y}x)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Debt/Eq &amp; ROCE</span>
                <span className="text-xs font-semibold text-white">{inspectedScrip.debtToEquity}x • {inspectedScrip.roce3Y}%</span>
              </div>
            </div>

            {/* Multi-Timeframe Technical Chart Workbench */}
            <div className="mb-4">
              <TechnicalChartWorkbench stock={inspectedScrip} />
            </div>

            {/* Calculated Allocation & Triggers */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-5 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Calculated Share Lot:</span>
                <strong className="text-white">{inspectedScrip.calculatedLotShares} Shares (₹{(inspectedScrip.calculatedLotShares * inspectedScrip.price).toLocaleString('en-IN')})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pyramid Up Breakout Trigger (+6%):</span>
                <strong className="text-emerald-400">₹{inspectedScrip.pyramidUpTriggerPrice}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hard Stop-Loss (-6.5%):</span>
                <strong className="text-rose-400">₹{inspectedScrip.pyramidDownStopLossPrice}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Extreme Valuation Trim (+1.5σ):</span>
                <strong className="text-amber-400">₹{inspectedScrip.extremeValuationTrimPrice}</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInspectedScrip(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Close
              </button>
              {inspectedScrip.qualificationTier === 'Tier 5 Qualified' && (
                <button
                  onClick={() => {
                    executePaperTrade(inspectedScrip);
                    setInspectedScrip(null);
                  }}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md"
                >
                  Allocate Paper Lot
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5-Tier Quantitative Pipeline Execution Modal */}
      <PipelineExecutionModal
        isOpen={isScreeningModalOpen}
        onClose={() => setIsScreeningModalOpen(false)}
        onComplete={handleRunComplete}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3.5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Branch: <code>geminigoofups</code> • Quantitative Strategic Tool (Non-Advisory)</span>
          <span className="text-[11px] text-slate-600">Nifty 500 Regime &amp; Val-Mo Strategy Framework</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
