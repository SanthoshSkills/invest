import React from 'react';
import {
  X,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  BarChart2,
} from 'lucide-react';
import { StockScrip, ScripMomentumProfile } from '../types/strategy';
import { computeScripMomentum, buildUniverseMomentumProfiles } from '../utils/momentumIndicators';

interface MomentumBreakdownModalProps {
  stock: StockScrip | null;
  allStocks?: StockScrip[];
  onClose: () => void;
}

export function MomentumBreakdownModal({
  stock,
  allStocks = [],
  onClose,
}: MomentumBreakdownModalProps) {
  if (!stock) return null;

  const profileMap = buildUniverseMomentumProfiles(allStocks.length > 0 ? allStocks : [stock]);
  const defaultMomentum = computeScripMomentum(stock);
  const profile: ScripMomentumProfile = profileMap.get(stock.symbol) || {
    ...defaultMomentum,
    rankOverall: 1,
    rankInSector: 1,
    isTop15Overall: true,
    isTop5InSector: true,
    isWeeklyCloseQualified: defaultMomentum.isWeeklyCloseQualified,
    weeklyCloseStatus: defaultMomentum.weeklyCloseStatus,
  };

  const { daily, weekly, pureMomentumScore, totalIndicatorCount, isMtfSynced } = profile;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative animate-scale-up my-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-400/20 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Multi-Timeframe Momentum Audit
              </span>
              {isMtfSynced ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> MTF Synchronized
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Daily / Weekly Divergence
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>{stock.symbol}</span>
              <span className="text-sm font-normal text-slate-400">({stock.name})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified CMP: <strong className="text-white font-mono">₹{stock.price.toLocaleString('en-IN')}</strong> • Sector: <span className="text-emerald-400 font-medium">{stock.sectorId}</span>
            </p>
          </div>

          {/* Score & Rank Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-right">
              <div className="text-[10px] text-slate-400">Pure Momentum Score</div>
              <div className="text-xl font-black text-teal-400 font-mono">{pureMomentumScore}<span className="text-xs text-slate-500">/100</span></div>
              <div className="text-[9px] text-slate-400">{totalIndicatorCount} of 8 Indicators Passed</div>
            </div>

            <div className="space-y-1 text-right text-xs font-mono">
              <div className={`px-2 py-0.5 rounded font-bold border text-[11px] ${
                profile.isTop15Overall ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                Rank #{profile.rankOverall} Overall {profile.isTop15Overall ? '★ Top 15' : ''}
              </div>
              <div className={`px-2 py-0.5 rounded font-semibold border text-[10px] ${
                profile.isTop5InSector ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                Rank #{profile.rankInSector} in Segment {profile.isTop5InSector ? '★ Top 5' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Close Investment Cadence Banner */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Weekly-Close Investment Cadence:</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                profile.isWeeklyCloseQualified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {profile.isWeeklyCloseQualified ? 'QUALIFIED FOR WEEKLY CLOSE (Friday 15:30 IST)' : 'PENDING FRIDAY CLOSE CONFIRMATION'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              While daily and weekly screening runs continuously for situational tracking, fresh investment occurs <strong>only on Friday weekly close</strong> when both daily execution criteria and weekly macro criteria are satisfied simultaneously.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Execution Rule</span>
            <span className="text-xs font-mono font-bold text-cyan-400">Friday EOD Close Only</span>
          </div>
        </div>

        {/* 2-Column Indicator Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-5">
          {/* LEFT: DAILY LEADING INDICATORS */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Daily Leading Triggers</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                daily.passedCount === 4 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {daily.passedCount} / 4 Passed
              </span>
            </div>

            {/* Indicator 1: Triple EMA Cross & Price Alignment */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">1. Triple EMA Cross &amp; Alignment</span>
                {daily.tripleEmaAlignment === 'Bullish' ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Bullish Aligned
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {daily.tripleEmaAlignment}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Price (₹{stock.price}) &gt; EMA9 (₹{daily.ema9}) &gt; EMA21 (₹{daily.ema21}) &gt; EMA55 (₹{daily.ema55})
              </div>
              <p className="text-[10px] text-slate-400">
                Primary directional execution trigger with minimal lag.
              </p>
            </div>

            {/* Indicator 2: ADX Trend Acceleration */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">2. ADX Trend Acceleration</span>
                {daily.adxAccelerating ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Accelerating
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Sub-Threshold
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                ADX: <strong className="text-white">{daily.adx}</strong> (Hurdle ≥ 20) • +DI: <span className="text-emerald-400">{daily.plusDi}</span> vs -DI: <span className="text-rose-400">{daily.minusDi}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Confirms shift from choppy range into high-momentum directional trend.
              </p>
            </div>

            {/* Indicator 3: Volume Expansion OR RSI Momentum Room */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">3. Volume OR RSI Momentum Room</span>
                {daily.volumeAbove20Dma || daily.rsiMomentumRoom ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Runway Validated
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Overbought / Low Vol
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Volume: {daily.volume20DmaRatio}x 20D MA • RSI: <strong className="text-white">{daily.dailyRsi}</strong> (Target 45–65)
              </div>
              <p className="text-[10px] text-slate-400">
                Volume proves institutional backing; RSI confirms room to run before exhaustion.
              </p>
            </div>

            {/* Indicator 4: Volatility Expansion */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">4. Volatility Expansion (ATR / BB)</span>
                {daily.atrExpansion || daily.bollingerExpansion ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Liquidity Expansion
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Range Bound
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                14-Day ATR: ₹{daily.atr14} • Bollinger Squeeze Breakout: {daily.bollingerExpansion ? 'Active' : 'Neutral'}
              </div>
              <p className="text-[10px] text-slate-400">
                Ensures entry as volatility returns, maximizing impulse move speed.
              </p>
            </div>
          </div>

          {/* RIGHT: WEEKLY LEADING INDICATORS */}
          <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Weekly Macro Bias</h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                weekly.passedCount === 4 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
              }`}>
                {weekly.passedCount} / 4 Passed
              </span>
            </div>

            {/* Indicator 1: Weekly Triple EMA Band Structure */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">1. Weekly Triple EMA Band Structure</span>
                {weekly.supportedByEmaBands ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Structurally Supported
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {weekly.weeklyTripleEmaStructure}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Price &gt; W-EMA13 (₹{weekly.weeklyEma13}) &gt; W-EMA34 (₹{weekly.weeklyEma34}) &gt; W-EMA89 (₹{weekly.weeklyEma89})
              </div>
              <p className="text-[10px] text-slate-400">
                Prevents taking trades against dominant higher-timeframe secular trend.
              </p>
            </div>

            {/* Indicator 2: Weekly ADX Macro Strength */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">2. Weekly ADX Macro Strength</span>
                {weekly.weeklyAdxRising ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Macro Strength &gt; 30
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Weak / Choppy
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Weekly ADX: <strong className="text-white">{weekly.weeklyAdx}</strong> (Hurdle ≥ 30) • Trend Direction: {weekly.weeklyAdxRising ? 'Ascending' : 'Flat/Falling'}
              </div>
              <p className="text-[10px] text-slate-400">
                Prioritizes aggressive trend breakouts over counter-trend mean reversion.
              </p>
            </div>

            {/* Indicator 3: Volume Accumulation OR RSI Divergence */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">3. Volume Accumulation / RSI Divergence</span>
                {weekly.volumeAccumulation || weekly.rsiDivergence === 'Bullish Divergence' ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Accumulation
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Normal Volume
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Weekly Vol: {weekly.volumeAccumulation ? 'Institutional Inflows' : 'Neutral'} • RSI Div: {weekly.rsiDivergence}
              </div>
              <p className="text-[10px] text-slate-400">
                Highlights structural supply/demand shifts and early trend turnarounds.
              </p>
            </div>

            {/* Indicator 4: Multi-Timeframe Synchronization */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">4. MTF Synchronization</span>
                {weekly.mtfSynchronized ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> 100% Synced
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Conflict
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                Daily Alignment: {daily.tripleEmaAlignment} ↔ Weekly Bands: {weekly.weeklyTripleEmaStructure}
              </div>
              <p className="text-[10px] text-slate-400">
                Eliminates low-probability counter-trend traps by filtering out conflicting noise.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px]">
            Quantitative Strategy: Leading Execution + Macro Trend Synchronization
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
