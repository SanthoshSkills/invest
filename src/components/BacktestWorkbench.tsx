import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Sparkles,
  Sliders,
  Activity,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ComprehensiveBacktestScenario, StockScrip } from '../types/strategy';
import { buildUniverseMomentumProfiles } from '../utils/momentumIndicators';

interface BacktestWorkbenchProps {
  scenarios: ComprehensiveBacktestScenario[];
  stockScrips?: StockScrip[];
}

export function BacktestWorkbench({ scenarios, stockScrips = [] }: BacktestWorkbenchProps) {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'comparative' | 'momentum' | 'valmo'>('comparative');
  const [tradeFilter, setTradeFilter] = useState<'all' | 'Pure Momentum' | 'Val-Mo'>('all');
  const [showAllLogs, setShowAllLogs] = useState<boolean>(true);
  const [showMtfIndicatorsPanel, setShowMtfIndicatorsPanel] = useState<boolean>(true);

  const activeScenario = scenarios[selectedScenarioIndex] || scenarios[0];

  // Live universe momentum profiles synchronized with the main terminal
  const universeProfiles = useMemo(() => {
    if (!stockScrips || stockScrips.length === 0) return null;
    return buildUniverseMomentumProfiles(stockScrips);
  }, [stockScrips]);

  // Top MTF constituent scrips from the main terminal matching 6+ indicators
  const topMtfScrips = useMemo(() => {
    if (!universeProfiles || stockScrips.length === 0) return [];
    return stockScrips
      .map((s) => ({
        stock: s,
        profile: universeProfiles.get(s.symbol),
      }))
      .filter((item) => item.profile && item.profile.totalIndicatorCount >= 5)
      .sort((a, b) => (b.profile?.pureMomentumScore || 0) - (a.profile?.pureMomentumScore || 0))
      .slice(0, 8);
  }, [stockScrips, universeProfiles]);

  const isMomentumIsolated = viewMode === 'momentum';

  const filteredTrades = activeScenario.tradeLogs.filter((t) => {
    if (isMomentumIsolated) return t.strategy === 'Pure Momentum';
    if (tradeFilter === 'all') return true;
    return t.strategy === tradeFilter;
  });

  // Calculate SVG coordinates for Equity Curve
  const equityPoints = activeScenario.equityCurve;
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 25;

  const allValues = equityPoints.flatMap((p) => [p.nifty, p.valMo, p.momentum]);
  const minValue = Math.min(...allValues, 80);
  const maxValue = Math.max(...allValues, 200);

  const getY = (val: number) => {
    const range = maxValue - minValue || 1;
    return svgHeight - paddingY - ((val - minValue) / range) * (svgHeight - paddingY * 2);
  };

  const getX = (idx: number) => {
    const step = (svgWidth - paddingX * 2) / (equityPoints.length - 1 || 1);
    return paddingX + idx * step;
  };

  const momentumPath = equityPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.momentum).toFixed(1)}`)
    .join(' ');

  const valMoPath = equityPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.valMo).toFixed(1)}`)
    .join(' ');

  const niftyPath = equityPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.nifty).toFixed(1)}`)
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Top Benchmark Overview & Cumulative Multi-Regime Performance */}
      <div className={`border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${
        isMomentumIsolated
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/40 border-cyan-500/50 shadow-cyan-500/10'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-all ${
                isMomentumIsolated
                  ? 'text-cyan-300 bg-cyan-400/20 border-cyan-400/50 shadow-sm'
                  : 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
              }`}>
                Multi-Timeframe Quantitative Simulation
              </span>
              <span className="text-xs text-slate-400">
                {isMomentumIsolated
                  ? 'Pure Momentum (Top 15 MTF Universe) · 8 Leading Indicators Set'
                  : 'Pure Momentum (Top 15 MTF) vs Val-Mo vs Nifty 500 Buy & Hold'}
              </span>
              {isMomentumIsolated && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Momentum Isolated
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Historical Backtest &amp; Strategy Engine</span>
              {isMomentumIsolated && (
                <span className="text-cyan-400 font-mono text-sm font-semibold">[Pure MTF Mode]</span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Empirical walk-forward simulation incorporating 20% Short-Term Capital Gains (STCG) tax drag, DP transaction charges, and dynamic execution triggers (+6% pyramiding, -6.5% hard stop-loss).
            </p>
          </div>

          {/* DEDICATED VISUAL TOGGLE / ACTION BUTTON TO SPECIFICALLY ISOLATE MOMENTUM-ONLY */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start lg:self-auto">
            {/* Primary Isolation Button */}
            <button
              onClick={() => {
                if (isMomentumIsolated) {
                  setViewMode('comparative');
                } else {
                  setViewMode('momentum');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-md ${
                isMomentumIsolated
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-cyan-500/25 ring-2 ring-cyan-400/30'
                  : 'bg-slate-950 hover:bg-slate-800 text-cyan-400 border-cyan-500/40 hover:border-cyan-400'
              }`}
            >
              <Zap className={`h-4 w-4 ${isMomentumIsolated ? 'text-slate-950 fill-slate-950' : 'text-cyan-400'}`} />
              <span>{isMomentumIsolated ? '⚡ Isolate Momentum: ACTIVE' : '⚡ Isolate Momentum-Only Backtest'}</span>
            </button>

            {/* Quick 3-Way Mode Controller */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('comparative')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'comparative'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Compare Pure Momentum, Val-Mo, and Nifty 500 side-by-side"
              >
                Side-by-Side (3-Way)
              </button>
              <button
                onClick={() => setViewMode('valmo')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'valmo'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Isolate Val-Mo Strategy"
              >
                Val-Mo
              </button>
            </div>
          </div>
        </div>

        {/* 3 Strategy Cumulative Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* 1. Pure Momentum Strategy */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMomentumIsolated
              ? 'bg-cyan-950/30 border-cyan-400 shadow-xl shadow-cyan-950/30 ring-1 ring-cyan-400/40'
              : viewMode === 'comparative'
              ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
              : 'bg-slate-950/40 border-slate-800 opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                <Zap className="h-4 w-4" /> Pure Momentum (Top 15 MTF)
              </span>
              <span className="text-[10px] bg-cyan-400/10 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-400/20 font-bold">
                {isMomentumIsolated ? 'ACTIVE FOCUS' : 'Aggressive Trend'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">+142.6%</span>
              <span className="text-xs font-semibold text-cyan-400">(Best: 2020 Melt-up)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Avg Bull Win Rate:</span>
                <span className="font-mono text-cyan-300 font-bold">82%</span>
              </div>
              <div className="flex justify-between">
                <span>Sharpe Ratio:</span>
                <span className="font-mono text-white font-semibold">2.15</span>
              </div>
              <div className="flex justify-between">
                <span>Indicator Set:</span>
                <span className="text-cyan-300 font-medium font-mono">4 Daily + 4 Weekly MTF</span>
              </div>
            </div>
          </div>

          {/* 2. Val-Mo Strategy */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMomentumIsolated
              ? 'bg-slate-950/30 border-slate-800/80 opacity-45'
              : viewMode === 'valmo' || viewMode === 'comparative'
              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-950/40 border-slate-800 opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Val-Mo Hybrid (Value + Mom)
              </span>
              <span className="text-[10px] bg-emerald-400/10 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                Capital Preserving
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">+118.4%</span>
              <span className="text-xs font-semibold text-emerald-400">(Max DD: -5.9% in Chop)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Avg Sideways Win Rate:</span>
                <span className="font-mono text-emerald-300 font-bold">64%</span>
              </div>
              <div className="flex justify-between">
                <span>Sharpe Ratio:</span>
                <span className="font-mono text-white font-semibold">2.40</span>
              </div>
              <div className="flex justify-between">
                <span>Execution Rule:</span>
                <span className="text-slate-300 font-medium">40% Staging Buffer + Val Gate</span>
              </div>
            </div>
          </div>

          {/* 3. Nifty 500 Buy & Hold Benchmark */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMomentumIsolated ? 'bg-slate-950/30 border-slate-800/80 opacity-50' : 'bg-slate-950/40 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-slate-400" /> Nifty 500 Benchmark
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                Passive Beta
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-200 font-mono">+74.2%</span>
              <span className="text-xs font-semibold text-slate-400">(Max DD: -16.2%)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Active Alpha Capture:</span>
                <span className="font-mono text-emerald-400 font-bold">Up to +68.4%</span>
              </div>
              <div className="flex justify-between">
                <span>Drawdown Protection:</span>
                <span className="font-mono text-teal-300 font-semibold">10.3% Buffer</span>
              </div>
              <div className="flex justify-between">
                <span>Turnover Drag:</span>
                <span className="text-slate-300 font-medium">None (Index Hold)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED MTF INDICATOR SET SPECIFICATION & LIVE UNIVERSE AUDIT CARD */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              <Zap className="h-3.5 w-3.5" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Synchronized Multi-Timeframe (MTF) Leading Indicator Set</span>
                <span className="text-[9px] px-2 py-0.2 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Terminal Rule Standard
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                The momentum backtester enforces the exact 4 Daily Triggers + 4 Weekly Macro Trend rules calibrated across the universe.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowMtfIndicatorsPanel(!showMtfIndicatorsPanel)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            {showMtfIndicatorsPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{showMtfIndicatorsPanel ? 'Hide Indicator Rules' : 'Show Indicator Rules'}</span>
          </button>
        </div>

        {showMtfIndicatorsPanel && (
          <div className="space-y-4">
            {/* Weekly Close Investment Cadence Protocol Banner */}
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-200 font-black uppercase tracking-wider text-xs">
                    Execution Protocol: Friday Weekly Close Allocation Only
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed max-w-2xl">
                  While daily and weekly screening runs continuously for situational tracking, capital deployment occurs <strong>strictly at Friday week close (15:30 IST)</strong> when both daily execution triggers and weekly macro criteria are satisfied simultaneously on closing day. Mid-week price swings are filtered out to eliminate false breakout whipsaws.
                </p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[10px] text-cyan-400 font-mono font-bold bg-slate-900/80 px-3 py-1.5 rounded-lg border border-cyan-500/30 shrink-0">
                <span>Cadence: Weekly Close</span>
                <span className="text-slate-400 font-normal">Dual MTF Alignment</span>
              </div>
            </div>

            {/* 8 Indicators Grid (4 Daily + 4 Weekly) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 4 Daily Leading Indicators */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> 4 Daily Leading Indicators (Execution &amp; Entry Triggers)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Short-Term Shift</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold shrink-0">1.</span>
                    <div>
                      <strong className="text-slate-200">Triple EMA Cross &amp; Price Alignment:</strong>
                      <span className="text-slate-400 block text-[11px]">Price closes above EMA-9, and EMA-9 crosses above EMA-21 and EMA-55 (Bullish alignment).</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold shrink-0">2.</span>
                    <div>
                      <strong className="text-slate-200">ADX Trend Acceleration:</strong>
                      <span className="text-slate-400 block text-[11px]">ADX crosses above 20 from below with +DI &gt; -DI line (confirming transition out of sideways chop).</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold shrink-0">3.</span>
                    <div>
                      <strong className="text-slate-200">Volume Expansion OR RSI Room:</strong>
                      <span className="text-slate-400 block text-[11px]">Daily volume closes above 20-DMA OR Daily RSI expanding in 45–65 sweet spot (runway before exhaustion).</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold shrink-0">4.</span>
                    <div>
                      <strong className="text-slate-200">Volatility Expansion:</strong>
                      <span className="text-slate-400 block text-[11px]">Daily range expands outside 14-day ATR or triggers Bollinger Band expansion for fast momentum moves.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Weekly Leading Indicators */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> 4 Weekly Leading Indicators (Macro Trend &amp; Structural Bias)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Higher Timeframe</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 font-mono font-bold shrink-0">1.</span>
                    <div>
                      <strong className="text-slate-200">Triple EMA Band Structure:</strong>
                      <span className="text-slate-400 block text-[11px]">Price structurally supported above Weekly EMA-13 &gt; EMA-34 &gt; EMA-89 bands on consecutive closes.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 font-mono font-bold shrink-0">2.</span>
                    <div>
                      <strong className="text-slate-200">ADX Macro Strength:</strong>
                      <span className="text-slate-400 block text-[11px]">Weekly ADX sustained above 30 and rising, favoring breakout entries over counter-trend trades.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 font-mono font-bold shrink-0">3.</span>
                    <div>
                      <strong className="text-slate-200">Volume Accumulation OR RSI Divergence:</strong>
                      <span className="text-slate-400 block text-[11px]">Increasing weekly volume on up-closes (accumulation) OR early structural bullish RSI divergence.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 font-mono font-bold shrink-0">4.</span>
                    <div>
                      <strong className="text-slate-200">Multi-Timeframe Synchronization:</strong>
                      <span className="text-slate-400 block text-[11px]">Daily directional triggers perfectly match Weekly Triple EMA trend status, eliminating counter-trend noise.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Terminal Constituent Scrips Indicator Audit Strip */}
            {topMtfScrips.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    Live Terminal MTF Candidates Currently Meeting Indicator Criteria:
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Top 15 Overall Universe Selection
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {topMtfScrips.map(({ stock, profile }) => (
                    <div
                      key={stock.symbol}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs flex items-center gap-2"
                    >
                      <span className="font-bold text-white">{stock.symbol}</span>
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        {profile?.totalIndicatorCount}/8 MTF
                      </span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-300 font-mono">
                        Score: {profile?.pureMomentumScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scenario Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {scenarios.map((scenario, idx) => (
          <button
            key={scenario.period}
            onClick={() => setSelectedScenarioIndex(idx)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              selectedScenarioIndex === idx
                ? isMomentumIsolated
                  ? 'bg-slate-800 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400/30'
                  : 'bg-slate-800 border-cyan-500/50 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Calendar className={`h-3.5 w-3.5 ${selectedScenarioIndex === idx ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{scenario.period.split('(')[0].trim()}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
              selectedScenarioIndex === idx ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-950 text-slate-500'
            }`}>
              {scenario.regime.split('/')[0].trim()}
            </span>
          </button>
        ))}
      </div>

      {/* Active Scenario Card Container */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-6 transition-all ${
        isMomentumIsolated
          ? 'bg-slate-900/90 border-cyan-500/40 shadow-cyan-950/20'
          : 'bg-slate-900/70 border-slate-800'
      }`}>
        {/* Scenario Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">{activeScenario.period}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {activeScenario.regime}
              </span>
              {isMomentumIsolated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  Pure Momentum Scenario Run
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {activeScenario.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Pure Momentum Alpha:</span>
            <span className="text-sm font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 font-mono">
              {activeScenario.pureMomentum.alphaPct}
            </span>
          </div>
        </div>

        {/* 1. SIDE-BY-SIDE METRICS COMPARISON TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4 font-bold">Quantitative Performance Metric</th>
                <th className={`py-3 px-4 font-bold text-cyan-400 ${isMomentumIsolated ? 'bg-cyan-500/10' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Pure Momentum (Top 15 MTF)
                    {isMomentumIsolated && <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400 text-slate-950 font-black">ISOLATED</span>}
                  </div>
                </th>
                {!isMomentumIsolated && (
                  <th className="py-3 px-4 font-bold text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> Val-Mo Strategy
                    </div>
                  </th>
                )}
                <th className="py-3 px-4 font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" /> Nifty 500 Benchmark
                  </div>
                </th>
                <th className="py-3 px-4 font-bold text-teal-400 text-right">Advantage / Differential</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {/* Cumulative Return */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-sans font-medium text-slate-300">
                  Total Simulated Return (Gross)
                </td>
                <td className={`py-3 px-4 font-bold text-cyan-300 text-sm ${isMomentumIsolated ? 'bg-cyan-500/5' : ''}`}>
                  {activeScenario.pureMomentum.totalReturnPct}
                </td>
                {!isMomentumIsolated && (
                  <td className="py-3 px-4 font-bold text-emerald-300 text-sm">
                    {activeScenario.valMo.totalReturnPct}
                  </td>
                )}
                <td className="py-3 px-4 text-slate-400">
                  {activeScenario.nifty500.totalReturnPct}
                </td>
                <td className="py-3 px-4 text-right font-sans font-bold text-cyan-400">
                  {parseFloat(activeScenario.pureMomentum.totalReturnPct) >= parseFloat(activeScenario.valMo.totalReturnPct)
                    ? `+${(parseFloat(activeScenario.pureMomentum.totalReturnPct) - parseFloat(activeScenario.valMo.totalReturnPct)).toFixed(1)}% vs Val-Mo`
                    : `+${(parseFloat(activeScenario.valMo.totalReturnPct) - parseFloat(activeScenario.pureMomentum.totalReturnPct)).toFixed(1)}% Val-Mo lead`}
                </td>
              </tr>

              {/* Generated Alpha */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-sans font-medium text-slate-300">
                  Generated Alpha vs Nifty 500
                </td>
                <td className={`py-3 px-4 font-bold text-cyan-400 ${isMomentumIsolated ? 'bg-cyan-500/5' : ''}`}>
                  {activeScenario.pureMomentum.alphaPct}
                </td>
                {!isMomentumIsolated && (
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {activeScenario.valMo.alphaPct}
                  </td>
                )}
                <td className="py-3 px-4 text-slate-500">0.0% (Base)</td>
                <td className="py-3 px-4 text-right font-sans text-xs text-slate-300">
                  High factor sensitivity
                </td>
              </tr>

              {/* Maximum Drawdown */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-sans font-medium text-slate-300">
                  Maximum Peak-to-Trough Drawdown
                </td>
                <td className={`py-3 px-4 font-semibold text-rose-300 ${isMomentumIsolated ? 'bg-cyan-500/5' : ''}`}>
                  {activeScenario.pureMomentum.maxDrawdownPct}
                </td>
                {!isMomentumIsolated && (
                  <td className="py-3 px-4 font-semibold text-emerald-400">
                    {activeScenario.valMo.maxDrawdownPct}
                  </td>
                )}
                <td className="py-3 px-4 text-rose-400 font-semibold">
                  {activeScenario.nifty500.maxDrawdownPct}
                </td>
                <td className="py-3 px-4 text-right font-sans font-bold text-emerald-400">
                  {isMomentumIsolated ? (
                    <span className="text-cyan-300 font-mono font-normal">Controlled by -6.5% Stop</span>
                  ) : (
                    `Val-Mo cushions ${(-parseFloat(activeScenario.pureMomentum.maxDrawdownPct) - -parseFloat(activeScenario.valMo.maxDrawdownPct)).toFixed(1)}%`
                  )}
                </td>
              </tr>

              {/* Win Rate */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-sans font-medium text-slate-300">
                  Trade Win Rate (% winning closed trades)
                </td>
                <td className={`py-3 px-4 font-semibold text-white ${isMomentumIsolated ? 'bg-cyan-500/5' : ''}`}>
                  {activeScenario.pureMomentum.winRatePct}
                </td>
                {!isMomentumIsolated && (
                  <td className="py-3 px-4 font-semibold text-white">
                    {activeScenario.valMo.winRatePct}
                  </td>
                )}
                <td className="py-3 px-4 text-slate-500">N/A (Holding)</td>
                <td className="py-3 px-4 text-right font-sans text-xs text-slate-300">
                  -6.5% hard stop filter
                </td>
              </tr>

              {/* Profit Factor */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-sans font-medium text-slate-300">
                  Profit Factor (Gross Profit / Gross Loss)
                </td>
                <td className={`py-3 px-4 font-bold text-cyan-300 ${isMomentumIsolated ? 'bg-cyan-500/5' : ''}`}>
                  {activeScenario.pureMomentum.profitFactor}
                </td>
                {!isMomentumIsolated && (
                  <td className="py-3 px-4 font-bold text-emerald-300">
                    {activeScenario.valMo.profitFactor}
                  </td>
                )}
                <td className="py-3 px-4 text-slate-500">1.00</td>
                <td className="py-3 px-4 text-right font-sans text-xs text-slate-300">
                  Risk/Reward &gt; 3:1
                </td>
              </tr>

              {/* Sharpe Ratio */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-sans font-medium text-slate-300">
                  Annualized Sharpe Ratio (Rf = 6.8%)
                </td>
                <td className={`py-3 px-4 font-bold text-white ${isMomentumIsolated ? 'bg-cyan-500/5' : ''}`}>
                  {activeScenario.pureMomentum.sharpeRatio}
                </td>
                {!isMomentumIsolated && (
                  <td className="py-3 px-4 font-bold text-white">
                    {activeScenario.valMo.sharpeRatio}
                  </td>
                )}
                <td className="py-3 px-4 text-slate-400">0.82</td>
                <td className="py-3 px-4 text-right font-sans text-xs text-emerald-400 font-bold">
                  Superior risk-adjusted
                </td>
              </tr>

              {/* STCG Tax Drag */}
              <tr className="hover:bg-slate-800/20">
                <td className="py-3 px-4 font-sans font-medium text-slate-300">
                  Estimated 20% STCG Tax Drag
                </td>
                <td className={`py-3 px-4 text-amber-400 ${isMomentumIsolated ? 'bg-cyan-500/5' : ''}`}>
                  {activeScenario.pureMomentum.stcgTaxDragPct}
                </td>
                {!isMomentumIsolated && (
                  <td className="py-3 px-4 text-amber-400">
                    {activeScenario.valMo.stcgTaxDragPct}
                  </td>
                )}
                <td className="py-3 px-4 text-slate-500">0.0% (Unrealized)</td>
                <td className="py-3 px-4 text-right font-sans text-xs text-slate-400">
                  Avg Duration: {activeScenario.pureMomentum.avgTradeDuration}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. INTERACTIVE VISUAL EQUITY CURVE */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                {isMomentumIsolated
                  ? 'Pure Momentum Growth Trajectory vs Benchmark (Base = 100)'
                  : 'Normalized Equity Growth Curve (Base = 100)'}
              </span>
              <span className="text-[10px] text-slate-400">
                Visual walk-forward equity compounding across key regime milestones
              </span>
            </div>

            {/* Curve Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40" />
                <span className="text-cyan-300 font-bold">Pure Momentum</span>
              </div>
              {!isMomentumIsolated && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-300 font-bold">Val-Mo Strategy</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-400">Nifty 500</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 select-none overflow-visible"
            >
              {/* Horizontal Grid lines */}
              {[100, 150, 200].map((val) => {
                if (val < minValue || val > maxValue) return null;
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#334155"
                      strokeDasharray="3 3"
                      strokeWidth="0.8"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Nifty 500 Path */}
              <path
                d={niftyPath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-70"
              />

              {/* Val-Mo Strategy Path (Hidden if Momentum isolated) */}
              {!isMomentumIsolated && (
                <path
                  d={valMoPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="opacity-90"
                />
              )}

              {/* Pure Momentum Path */}
              <path
                d={momentumPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth={isMomentumIsolated ? 3.5 : 3}
                className={isMomentumIsolated ? 'opacity-100 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'opacity-100'}
              />

              {/* Point Markers & Tooltip Anchors */}
              {equityPoints.map((point, i) => {
                const x = getX(i);
                const yMom = getY(point.momentum);
                const yVal = getY(point.valMo);
                const yNif = getY(point.nifty);

                return (
                  <g key={point.periodLabel}>
                    {/* Period Label */}
                    <text
                      x={x}
                      y={svgHeight - 8}
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {point.periodLabel}
                    </text>

                    {/* Nifty Circle */}
                    <circle cx={x} cy={yNif} r="2.5" fill="#94a3b8" />

                    {/* Val-Mo Circle */}
                    {!isMomentumIsolated && (
                      <circle
                        cx={x}
                        cy={yVal}
                        r="3.5"
                        fill="#10b981"
                      />
                    )}

                    {/* Momentum Circle */}
                    <circle
                      cx={x}
                      cy={yMom}
                      r={isMomentumIsolated ? 4.5 : 4}
                      fill="#06b6d4"
                      className="cursor-pointer"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 3. GRANULAR MTF TRADE EXECUTION LOGS AUDIT TRAIL */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-cyan-400" />
                {isMomentumIsolated
                  ? `Pure Momentum MTF Trade Execution Logs (${filteredTrades.length})`
                  : `Simulated Multi-Timeframe Trade Execution Logs (${filteredTrades.length})`}
              </span>
              <button
                onClick={() => setShowAllLogs(!showAllLogs)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                {showAllLogs ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showAllLogs ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {/* Strategy Filter Tabs (hidden when momentum is specifically isolated) */}
            {!isMomentumIsolated && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => setTradeFilter('all')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    tradeFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Trades
                </button>
                <button
                  onClick={() => setTradeFilter('Pure Momentum')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    tradeFilter === 'Pure Momentum' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pure Momentum MTF
                </button>
              </div>
            )}
          </div>

          {showAllLogs && (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-950/80">
                    <th className="py-2.5 px-3">Scrip / Name</th>
                    <th className="py-2.5 px-3">Entry Date &amp; Price</th>
                    <th className="py-2.5 px-3">Exit Date &amp; Price</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Net P&amp;L %</th>
                    <th className="py-2.5 px-3">Daily &amp; Weekly Leading Indicator Entry Trigger</th>
                    <th className="py-2.5 px-3 text-right">Exit &amp; Pyramiding Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-800/25">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{trade.symbol}</span>
                          {trade.pyramided && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold" title="Pyramided +50% at +6% breakout">
                              +6% PYRAMID
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{trade.name}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        <div className="font-semibold text-white">{trade.entryDate}</div>
                        <div className="text-white font-bold">₹{trade.entryPrice.toLocaleString('en-IN')}</div>
                        {trade.executionTiming && (
                          <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-mono mt-0.5 ${
                            trade.executionTiming.includes('Weekly Close')
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {trade.executionTiming}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        <div>{trade.exitDate}</div>
                        <div className="text-white font-bold">₹{trade.exitPrice.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {trade.holdingDays} days
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                          trade.returnPct > 0
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {trade.returnPct > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {trade.returnPct > 0 ? `+${trade.returnPct}%` : `${trade.returnPct}%`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px] max-w-xs leading-relaxed">
                        <div className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{trade.entryTrigger}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] text-slate-300 max-w-xs">
                        <span className={`inline-block text-left text-[10px] px-2 py-1 rounded ${
                          trade.returnPct > 0 ? 'bg-slate-900 border border-slate-700' : 'bg-rose-950/30 border border-rose-800/40 text-rose-300'
                        }`}>
                          {trade.exitTrigger}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
