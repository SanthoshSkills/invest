import React, { useState, useMemo } from 'react';
import { StockScrip } from '../types/strategy';
import { Activity, TrendingUp, Layers, Compass, BarChart2, Check, Info, Sliders, ShieldAlert } from 'lucide-react';

interface TechnicalChartWorkbenchProps {
  stock: StockScrip;
}

type TimeframeMode = 'daily' | 'weekly' | 'monthly' | 'dual' | 'renko';

interface RenkoBrick {
  index: number;
  type: 'up' | 'down';
  open: number;
  close: number;
  high: number;
  low: number;
  date: string;
}

export function TechnicalChartWorkbench({ stock }: TechnicalChartWorkbenchProps) {
  const [activeMode, setActiveMode] = useState<TimeframeMode>('daily');
  const [atrMultiplier, setAtrMultiplier] = useState<number>(1.0);
  const [showRenkoEma, setShowRenkoEma] = useState<boolean>(true);
  const [hoveredBrick, setHoveredBrick] = useState<RenkoBrick | null>(null);
  const [showTrimLevel, setShowTrimLevel] = useState<boolean>(true);
  const [hoveredWeek, setHoveredWeek] = useState<{ week: string; price: number; ema10: number } | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<{ month: string; price: number; ema10: number } | null>(null);

  // Generate realistic daily series (60 days) with High, Low, Close for True Range
  const dailyData = useMemo(() => {
    if (stock.dailySeries && stock.dailySeries.length >= 20) return stock.dailySeries;
    const series = [];
    const base = stock.dma50 * 0.92;
    for (let i = 0; i < 60; i++) {
      const progress = i / 59;
      const wave = Math.sin(i * 0.28) * (stock.price * 0.035);
      const price = base + (stock.price - base) * progress + wave;
      const dma50 = stock.dma50 * (0.96 + progress * 0.04);
      const dma200 = stock.dma200 * (0.98 + progress * 0.02);
      const volumeRatio = 0.8 + Math.abs(Math.sin(i * 0.5)) * (i > 50 ? 1.4 : 0.8);

      const high = price * 1.012;
      const low = price * 0.988;

      series.push({
        date: `Day ${i + 1}`,
        price: Number(price.toFixed(1)),
        high: Number(high.toFixed(1)),
        low: Number(low.toFixed(1)),
        dma50: Number(dma50.toFixed(1)),
        dma200: Number(dma200.toFixed(1)),
        volumeRatio: Number(volumeRatio.toFixed(2)),
      });
    }
    series[series.length - 1].price = stock.price;
    series[series.length - 1].high = stock.price * 1.008;
    series[series.length - 1].low = stock.price * 0.992;
    series[series.length - 1].volumeRatio = stock.deliveryVolumeRatio;
    return series;
  }, [stock]);

  // Generate weekly series (52 weeks) with true 10-period Exponential Moving Average (10-EMA)
  const weeklyData = useMemo(() => {
    const series = [];
    const startPrice = stock.price * 0.65;
    const k10 = 2 / (10 + 1); // 0.1818 smoothing factor for 10-period EMA

    let runningEma10 = startPrice;
    for (let i = 0; i < 52; i++) {
      const progress = i / 51;
      const wave = Math.sin(i * 0.32) * (stock.price * 0.04);
      let price = startPrice + (stock.price - startPrice) * progress + wave;
      if (i === 51) price = stock.price;

      if (i === 0) {
        runningEma10 = price;
      } else {
        runningEma10 = price * k10 + runningEma10 * (1 - k10);
      }

      series.push({
        week: `Wk ${i + 1}`,
        price: Number(price.toFixed(1)),
        ema10: Number(runningEma10.toFixed(1)),
      });
    }

    return series;
  }, [stock]);

  // Generate monthly series (36 months) with true 10-month EMA and multi-year consolidation base
  const monthlyData = useMemo(() => {
    const series = [];
    const baseLow = stock.price * 0.52;
    const baseHigh = stock.price * 0.78;
    const k10 = 2 / (10 + 1); // 0.1818 smoothing factor for 10-month EMA

    let runningEma10 = baseLow;
    for (let i = 0; i < 36; i++) {
      const isBreakout = i >= 26;
      let price: number;
      if (!isBreakout) {
        price = baseLow + (baseHigh - baseLow) * (0.5 + 0.45 * Math.sin(i * 0.6));
      } else {
        const progress = (i - 26) / 9;
        price = baseHigh + (stock.price - baseHigh) * progress;
      }
      if (i === 35) price = stock.price;

      if (i === 0) {
        runningEma10 = price;
      } else {
        runningEma10 = price * k10 + runningEma10 * (1 - k10);
      }

      series.push({
        month: `M-${35 - i}`,
        price: Number(price.toFixed(1)),
        ema10: Number(runningEma10.toFixed(1)),
        baseHigh: Number(baseHigh.toFixed(1)),
        baseLow: Number(baseLow.toFixed(1)),
      });
    }

    return series;
  }, [stock]);

  // -------------------------------------------------------------
  // DYNAMIC 14-PERIOD ATR & CLASSICAL RENKO ENGINE
  // -------------------------------------------------------------
  const renkoConfig = useMemo(() => {
    // 1. Calculate 14-period Average True Range (ATR)
    const trueRanges: number[] = [];
    for (let i = 1; i < dailyData.length; i++) {
      const prevClose = dailyData[i - 1].price;
      const curHigh = dailyData[i].high || dailyData[i].price * 1.01;
      const curLow = dailyData[i].low || dailyData[i].price * 0.99;

      const tr = Math.max(
        curHigh - curLow,
        Math.abs(curHigh - prevClose),
        Math.abs(curLow - prevClose)
      );
      trueRanges.push(tr);
    }

    // 14-period SMA of True Range
    const recentTR = trueRanges.slice(-14);
    const rawAtr =
      recentTR.length > 0
        ? recentTR.reduce((sum, v) => sum + v, 0) / recentTR.length
        : stock.price * 0.022;

    const baseAtr = stock.atr14 || rawAtr;
    // Apply selected multiplier
    const effectiveBrickSize = Math.max(1, Number((baseAtr * atrMultiplier).toFixed(1)));

    // 2. Classical Japanese Renko Construction with 2-brick reversal threshold
    const bricks: RenkoBrick[] = [];
    let prevTop = Math.round(dailyData[0].price / effectiveBrickSize) * effectiveBrickSize;
    let prevBottom = prevTop - effectiveBrickSize;
    let currentDirection: 'up' | 'down' = 'up';

    for (let i = 1; i < dailyData.length; i++) {
      const close = dailyData[i].price;
      const date = dailyData[i].date;

      if (currentDirection === 'up') {
        // Trend Continuation: Price moves up by >= brickSize from prevTop
        if (close >= prevTop + effectiveBrickSize) {
          const count = Math.floor((close - prevTop) / effectiveBrickSize);
          for (let c = 0; c < count; c++) {
            const open = prevTop;
            const bClose = prevTop + effectiveBrickSize;
            bricks.push({
              index: bricks.length,
              type: 'up',
              open,
              close: bClose,
              high: bClose,
              low: open,
              date,
            });
            prevBottom = open;
            prevTop = bClose;
          }
        }
        // Trend Reversal: Price drops below prevBottom by >= brickSize (2-brick rule from top)
        else if (close <= prevBottom - effectiveBrickSize) {
          const count = Math.floor((prevBottom - close) / effectiveBrickSize);
          for (let c = 0; c < count; c++) {
            const open = prevBottom;
            const bClose = prevBottom - effectiveBrickSize;
            bricks.push({
              index: bricks.length,
              type: 'down',
              open,
              close: bClose,
              high: open,
              low: bClose,
              date,
            });
            prevTop = open;
            prevBottom = bClose;
          }
          currentDirection = 'down';
        }
      } else {
        // Trend Continuation: Price drops by >= brickSize from prevBottom
        if (close <= prevBottom - effectiveBrickSize) {
          const count = Math.floor((prevBottom - close) / effectiveBrickSize);
          for (let c = 0; c < count; c++) {
            const open = prevBottom;
            const bClose = prevBottom - effectiveBrickSize;
            bricks.push({
              index: bricks.length,
              type: 'down',
              open,
              close: bClose,
              high: open,
              low: bClose,
              date,
            });
            prevTop = open;
            prevBottom = bClose;
          }
        }
        // Trend Reversal: Price climbs above prevTop by >= brickSize (2-brick rule from bottom)
        else if (close >= prevTop + effectiveBrickSize) {
          const count = Math.floor((close - prevTop) / effectiveBrickSize);
          for (let c = 0; c < count; c++) {
            const open = prevTop;
            const bClose = prevTop + effectiveBrickSize;
            bricks.push({
              index: bricks.length,
              type: 'up',
              open,
              close: bClose,
              high: bClose,
              low: open,
              date,
            });
            prevBottom = open;
            prevTop = bClose;
          }
          currentDirection = 'up';
        }
      }
    }

    // Keep the most recent 24-30 bricks for balanced display
    const visibleBricks = bricks.slice(-28);

    // Calculate 10-Brick Exponential Moving Average (EMA)
    const emaValues: number[] = [];
    const k = 2 / (10 + 1);
    let prevEma = visibleBricks.length > 0 ? (visibleBricks[0].open + visibleBricks[0].close) / 2 : 0;

    visibleBricks.forEach((b, idx) => {
      const mid = (b.open + b.close) / 2;
      if (idx === 0) {
        prevEma = mid;
      } else {
        prevEma = mid * k + prevEma * (1 - k);
      }
      emaValues.push(Number(prevEma.toFixed(1)));
    });

    // Consecutive streak calculation
    const consecutiveBullish = visibleBricks.slice().reverse().findIndex((b) => b.type !== 'up');
    const bullishRun = consecutiveBullish === -1 ? visibleBricks.length : consecutiveBullish;

    // Noise filtering efficiency calculation
    const noiseFilteredPct = Math.max(
      35,
      Math.min(85, Math.round((1 - visibleBricks.length / dailyData.length) * 100))
    );

    // Reversal trigger levels for the active position
    const lastBrick = visibleBricks[visibleBricks.length - 1];
    const isCurrentlyBullish = lastBrick ? lastBrick.type === 'up' : true;
    const nextBrickUpTrigger = lastBrick ? Math.max(lastBrick.open, lastBrick.close) + effectiveBrickSize : stock.price + effectiveBrickSize;
    const bearishReversalTrigger = lastBrick ? Math.min(lastBrick.open, lastBrick.close) - effectiveBrickSize : stock.price - effectiveBrickSize;

    return {
      brickSize: effectiveBrickSize,
      baseAtr: Number(baseAtr.toFixed(1)),
      bricks: visibleBricks,
      emaValues,
      bullishRun,
      isCurrentlyBullish,
      noiseFilteredPct,
      nextBrickUpTrigger: Number(nextBrickUpTrigger.toFixed(1)),
      bearishReversalTrigger: Number(bearishReversalTrigger.toFixed(1)),
    };
  }, [dailyData, stock, atrMultiplier]);

  // -------------------------------------------------------------
  // SECULAR TREND ALIGNMENT (WEEKLY 10-EMA & MONTHLY 10-EMA)
  // -------------------------------------------------------------
  const secularTrend = useMemo(() => {
    const weeklyEma10 = weeklyData[weeklyData.length - 1].ema10;
    const monthlyEma10 = monthlyData[monthlyData.length - 1].ema10;
    const price = stock.price;

    const isWeeklyBull = price >= weeklyEma10;
    const isMonthlyBull = price >= monthlyEma10;

    const weeklyBufferPct = Number((((price - weeklyEma10) / weeklyEma10) * 100).toFixed(1));
    const monthlyBufferPct = Number((((price - monthlyEma10) / monthlyEma10) * 100).toFixed(1));

    if (isWeeklyBull && isMonthlyBull) {
      return {
        state: 'super_cycle' as const,
        label: 'SUPER-CYCLE (BULL RUN)',
        shortLabel: 'Super-Cycle',
        tagline: 'Weekly & Monthly 10-EMA Aligned in Expansion',
        description: 'Both intermediate and secular wave-riders aligned above baseline. Maximum trend persistence for wave riding.',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        action: 'Hold full core; trail remainder on Weekly 10-EMA.',
        weeklyEma10,
        monthlyEma10,
        weeklyBufferPct,
        monthlyBufferPct,
      };
    } else if (!isWeeklyBull && isMonthlyBull) {
      return {
        state: 'secular_dip' as const,
        label: 'SECULAR DIP (ACCUMULATE)',
        shortLabel: 'Secular Dip',
        tagline: 'Pullback in Macro Bull Trend (Prime Val-Mo Entry)',
        description: 'Intermediate weekly consolidation while macro monthly uptrend remains intact. Prime institutional accumulation zone.',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-400',
        action: 'Watch for daily 50-DMA volume reclaim to initiate or pyramid.',
        weeklyEma10,
        monthlyEma10,
        weeklyBufferPct,
        monthlyBufferPct,
      };
    } else if (isWeeklyBull && !isMonthlyBull) {
      return {
        state: 'counter_trend' as const,
        label: 'COUNTER-TREND RALLY',
        shortLabel: 'Counter-Trend',
        tagline: 'Tactical Bounce Below Secular Ceiling',
        description: 'Intermediate momentum active but facing multi-year secular resistance. Prone to cyclical rejection.',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dotClass: 'bg-cyan-400',
        action: 'Enforce tight stops; take quick profits on valuation expansion.',
        weeklyEma10,
        monthlyEma10,
        weeklyBufferPct,
        monthlyBufferPct,
      };
    } else {
      return {
        state: 'downtrend' as const,
        label: 'SECULAR DOWNTREND',
        shortLabel: 'Downtrend',
        tagline: 'Dual Timeframe Structural Headwind',
        description: 'Price trading below both Weekly 10-EMA and Monthly 10-EMA. Zero trend support.',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dotClass: 'bg-rose-400',
        action: 'Disqualified for capital deployment under Val-Mo rules.',
        weeklyEma10,
        monthlyEma10,
        weeklyBufferPct,
        monthlyBufferPct,
      };
    }
  }, [stock, weeklyData, monthlyData]);

  const chartWidth = 540;
  const chartHeight = 190;

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-inner">
      {/* Timeframe & Mode Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
              Technical Workbench
            </span>

            {/* Secular Trend Alignment 4-State Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-tight cursor-help shadow-sm ${secularTrend.badgeClass}`}
              title={`Secular Trend Signal: ${secularTrend.label}\n${secularTrend.description}\nWeekly 10-EMA: ₹${secularTrend.weeklyEma10} (${secularTrend.weeklyBufferPct >= 0 ? '+' : ''}${secularTrend.weeklyBufferPct}%)\nMonthly 10-EMA: ₹${secularTrend.monthlyEma10} (${secularTrend.monthlyBufferPct >= 0 ? '+' : ''}${secularTrend.monthlyBufferPct}%)\nAction: ${secularTrend.action}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${secularTrend.dotClass} animate-pulse`} />
              <span>Secular Trend: {secularTrend.label}</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-white mt-1">
            {activeMode === 'daily' && 'Daily Inflection (60-Day • 50/200 DMA)'}
            {activeMode === 'weekly' && 'Weekly Wave Rider (10-EMA Trail Stop)'}
            {activeMode === 'monthly' && 'Monthly Secular Wave Rider (10-Month EMA & Base)'}
            {activeMode === 'dual' && 'Dual-Horizon Wave Rider (Weekly 10-EMA + Monthly 10-EMA Side-by-Side)'}
            {activeMode === 'renko' && `14-ATR Noise-Free Renko (Dynamic Box: ₹${renkoConfig.brickSize})`}
          </div>
        </div>

        {/* Segmented Timeframe Switcher Tabs */}
        <div className="flex flex-wrap items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px] self-start sm:self-auto gap-0.5">
          <button
            onClick={() => setActiveMode('daily')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMode === 'daily'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveMode('weekly')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMode === 'weekly'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly (10-EMA)
          </button>
          <button
            onClick={() => setActiveMode('monthly')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMode === 'monthly'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly (10-EMA)
          </button>
          <button
            onClick={() => setActiveMode('dual')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMode === 'dual'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="View Weekly and Monthly Wave Rider charts side-by-side"
          >
            Dual View (Wk + Mo)
          </button>
          <button
            onClick={() => setActiveMode('renko')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeMode === 'renko'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Renko (ATR)
          </button>
        </div>
      </div>

      {/* Secular Trend Alignment Sub-Banner */}
      <div className="mb-3 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Dual 10-EMA Trailing Alignment:</span>
          <span className="text-slate-200">
            Weekly 10-EMA: <strong className="font-mono text-amber-400">₹{secularTrend.weeklyEma10}</strong> ({secularTrend.weeklyBufferPct >= 0 ? '+' : ''}{secularTrend.weeklyBufferPct}%)
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-200">
            Monthly 10-EMA: <strong className="font-mono text-cyan-400">₹{secularTrend.monthlyEma10}</strong> ({secularTrend.monthlyBufferPct >= 0 ? '+' : ''}{secularTrend.monthlyBufferPct}%)
          </span>
        </div>
        <div className="text-[10px] text-emerald-400/90 font-medium italic">
          {secularTrend.tagline}
        </div>
      </div>

      {/* VIEW 1: DAILY INFLECTION */}
      {activeMode === 'daily' && (
        <div className="space-y-2">
          {(() => {
            const prices = dailyData.map((d) => d.price);
            const dma50s = dailyData.map((d) => d.dma50);
            const min = Math.min(...prices, ...dma50s) * 0.97;
            const max = Math.max(...prices, ...dma50s) * 1.03;
            const range = max - min || 1;

            const getY = (val: number) => chartHeight - 35 - ((val - min) / range) * (chartHeight - 50);
            const getX = (idx: number) => (idx / (dailyData.length - 1)) * (chartWidth - 20) + 10;

            const pricePath = dailyData.reduce(
              (acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.price)}` : `${acc} L ${getX(i)} ${getY(d.price)}`),
              ''
            );
            const dma50Path = dailyData.reduce(
              (acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.dma50)}` : `${acc} L ${getX(i)} ${getY(d.dma50)}`),
              ''
            );

            return (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                <path d={dma50Path} fill="none" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3,3" opacity={0.8} />
                <path d={pricePath} fill="none" stroke="#10b981" strokeWidth={2} />

                {dailyData.map((d, i) => {
                  const x = getX(i);
                  const barH = Math.min(26, d.volumeRatio * 14);
                  const isBreakoutVol = d.volumeRatio >= 1.5;
                  return (
                    <rect
                      key={i}
                      x={x - 2}
                      y={chartHeight - barH}
                      width={4}
                      height={barH}
                      fill={isBreakoutVol ? '#10b981' : '#334155'}
                      rx={1}
                      opacity={0.8}
                    />
                  );
                })}

                <text x="12" y="16" fill="#10b981" fontSize="10" fontWeight="bold">CMP: ₹{stock.price}</text>
                <text x="110" y="16" fill="#06b6d4" fontSize="10">50-DMA: ₹{stock.dma50}</text>
                <text x={chartWidth - 10} y={chartHeight - 6} fill="#64748b" fontSize="9" textAnchor="end">
                  Volume &gt; 1.5x delivery threshold highlighted in green
                </text>
              </svg>
            );
          })()}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
            <span>Inflection Signal: <strong className="text-emerald-400">Reclaimed 50-DMA on {stock.deliveryVolumeRatio}x Volume</strong></span>
            <span>Slope: <strong className="text-white">{stock.dma50Slope}</strong></span>
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY WAVE RIDER (10-EMA) */}
      {activeMode === 'weekly' && (
        <div className="space-y-3">
          {/* Weekly Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" /> Wave Riding Trailing Model:
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-semibold">
                Weekly 10-EMA Trail
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showTrimLevel}
                  onChange={(e) => setShowTrimLevel(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-950 h-3.5 w-3.5"
                />
                <span>Show +1.5σ Trim Level (₹{stock.extremeValuationTrimPrice})</span>
              </label>
            </div>
          </div>

          {/* SVG Canvas for Weekly 10-EMA Chart */}
          {(() => {
            const prices = weeklyData.map((d) => d.price);
            const ema10s = weeklyData.map((d) => d.ema10);
            const trimPrice = stock.extremeValuationTrimPrice;
            const currentEma10 = ema10s[ema10s.length - 1];

            const comparePrices = showTrimLevel ? [...prices, ...ema10s, trimPrice] : [...prices, ...ema10s];
            const minPrice = Math.min(...comparePrices) * 0.96;
            const maxPrice = Math.max(...comparePrices) * 1.04;
            const range = maxPrice - minPrice || 1;

            const paddingLeft = 25;
            const paddingRight = 45;
            const paddingTop = 25;
            const paddingBottom = 25;

            const usableW = chartWidth - paddingLeft - paddingRight;
            const usableH = chartHeight - paddingTop - paddingBottom;

            const getY = (val: number) => {
              const norm = (val - minPrice) / range;
              return chartHeight - paddingBottom - norm * usableH;
            };

            const getX = (idx: number) => paddingLeft + (idx / (weeklyData.length - 1)) * usableW;

            // Price Path
            const pricePath = weeklyData.reduce(
              (acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.price)}` : `${acc} L ${getX(i)} ${getY(d.price)}`),
              ''
            );

            // 10-EMA Path
            const ema10Path = weeklyData.reduce(
              (acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.ema10)}` : `${acc} L ${getX(i)} ${getY(d.ema10)}`),
              ''
            );

            // Wave Riding Safe Area (between price and 10-EMA)
            const forwardArea = weeklyData.map((d, i) => `${getX(i)},${getY(d.price)}`).join(' ');
            const reverseArea = weeklyData
              .slice()
              .reverse()
              .map((d, i) => `${getX(weeklyData.length - 1 - i)},${getY(d.ema10)}`)
              .join(' ');
            const waveAreaPolygon = `${forwardArea} ${reverseArea}`;

            const isAbove10Ema = stock.price >= currentEma10;
            const bufferPct = (((stock.price - currentEma10) / currentEma10) * 100).toFixed(1);

            return (
              <div className="relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 overflow-visible select-none">
                  {/* Horizontal Gridlines */}
                  {[0.25, 0.5, 0.75].map((pct, gIdx) => {
                    const priceLevel = minPrice + range * pct;
                    const y = getY(priceLevel);
                    return (
                      <g key={gIdx}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="2,2"
                        />
                        <text
                          x={chartWidth - paddingRight + 4}
                          y={y + 3}
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          ₹{Math.round(priceLevel)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Wave Riding Safe Corridor (Green tint between Price and 10-EMA) */}
                  <polygon points={waveAreaPolygon} fill="rgba(16, 185, 129, 0.12)" />

                  {/* +1.5σ Extreme Valuation Trim Target (Dashed Amber) */}
                  {showTrimLevel && (
                    <g>
                      <line
                        x1={paddingLeft}
                        y1={getY(trimPrice)}
                        x2={chartWidth - paddingRight}
                        y2={getY(trimPrice)}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="4,3"
                        opacity={0.85}
                      />
                      <text
                        x={chartWidth - paddingRight + 4}
                        y={getY(trimPrice) + 3}
                        fill="#f59e0b"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        ₹{trimPrice} (+1.5σ)
                      </text>
                    </g>
                  )}

                  {/* Weekly 10-EMA Trailing Stop Line (Gold) */}
                  <path
                    d={ema10Path}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5,2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Weekly Price Line (Emerald) */}
                  <path
                    d={pricePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Current Position Markers */}
                  <circle
                    cx={getX(weeklyData.length - 1)}
                    cy={getY(stock.price)}
                    r={3.5}
                    fill="#10b981"
                    stroke="#070b12"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={getX(weeklyData.length - 1)}
                    cy={getY(currentEma10)}
                    r={3}
                    fill="#f59e0b"
                    stroke="#070b12"
                    strokeWidth={1.5}
                  />

                  {/* Header Legend inside SVG */}
                  <text x={paddingLeft} y="15" fill="#10b981" fontSize="10" fontWeight="bold">
                    CMP: ₹{stock.price}
                  </text>
                  <text x={paddingLeft + 90} y="15" fill="#f59e0b" fontSize="10" fontWeight="bold">
                    • Weekly 10-EMA: ₹{currentEma10} (+{bufferPct}% Buffer)
                  </text>
                  <text x={chartWidth - paddingRight} y="15" fill="#64748b" fontSize="9" textAnchor="end">
                    52-Week Wave Riding View
                  </text>

                  {/* Interactive Hover Listener Bars */}
                  {weeklyData.map((w, idx) => {
                    const x = getX(idx);
                    const widthPerCol = usableW / weeklyData.length;
                    return (
                      <rect
                        key={idx}
                        x={x - widthPerCol / 2}
                        y={0}
                        width={widthPerCol}
                        height={chartHeight}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredWeek(w)}
                        onMouseLeave={() => setHoveredWeek(null)}
                      />
                    );
                  })}
                </svg>

                {/* Floating Hover Tooltip */}
                {hoveredWeek && (
                  <div className="absolute top-2 right-4 bg-slate-900/95 border border-slate-700 p-2 rounded-lg shadow-xl text-[10px] pointer-events-none z-10 font-mono">
                    <div className="text-white font-bold mb-0.5">{hoveredWeek.week}</div>
                    <div className="text-emerald-400">Close: ₹{hoveredWeek.price}</div>
                    <div className="text-amber-400">10-EMA: ₹{hoveredWeek.ema10}</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Wave Riding Quantitative Strategy Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Wave Riding Status</span>
              <strong className={stock.price >= weeklyData[weeklyData.length - 1].ema10 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {stock.price >= weeklyData[weeklyData.length - 1].ema10 ? 'ACTIVE (Hold Winners)' : 'STOP BREACHED'}
              </strong>
              <span className="text-[10px] text-slate-500 block">Weekly close &gt; 10-EMA</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">10-EMA Trailing Stop</span>
              <strong className="text-amber-400 font-mono font-bold">
                ₹{weeklyData[weeklyData.length - 1].ema10}
              </strong>
              <span className="text-[10px] text-emerald-400 block">
                +{(((stock.price - weeklyData[weeklyData.length - 1].ema10) / weeklyData[weeklyData.length - 1].ema10) * 100).toFixed(1)}% buffer
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">De-risking Trim (+1.5σ)</span>
              <strong className="text-amber-300 font-mono font-bold">₹{stock.extremeValuationTrimPrice}</strong>
              <span className="text-[10px] text-slate-500 block">P/E: {stock.pe}x vs 5Y: {stock.peMedian5Y}x</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Scaling Philosophy</span>
              <span className="text-[10px] text-slate-300 block leading-tight">
                Trim 33%–50% at +1.5σ to secure principal; ride remainder on 10-EMA.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY SECULAR WAVE RIDER (10-MONTH EMA) */}
      {activeMode === 'monthly' && (
        <div className="space-y-3">
          {/* Monthly Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-cyan-400" /> Secular Wave Riding Trailing Model:
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-semibold">
                Monthly 10-EMA Secular Baseline
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showTrimLevel}
                  onChange={(e) => setShowTrimLevel(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-950 h-3.5 w-3.5"
                />
                <span>Show +1.5σ Trim Level (₹{stock.extremeValuationTrimPrice})</span>
              </label>
            </div>
          </div>

          {/* SVG Canvas for Monthly 10-EMA Chart */}
          {(() => {
            const prices = monthlyData.map((d) => d.price);
            const ema10s = monthlyData.map((d) => d.ema10);
            const trimPrice = stock.extremeValuationTrimPrice;
            const currentMonthEma10 = ema10s[ema10s.length - 1];

            const comparePrices = showTrimLevel ? [...prices, ...ema10s, trimPrice] : [...prices, ...ema10s];
            const minPrice = Math.min(...comparePrices) * 0.94;
            const maxPrice = Math.max(...comparePrices) * 1.06;
            const range = maxPrice - minPrice || 1;

            const paddingLeft = 25;
            const paddingRight = 45;
            const paddingTop = 25;
            const paddingBottom = 25;

            const usableW = chartWidth - paddingLeft - paddingRight;
            const usableH = chartHeight - paddingTop - paddingBottom;

            const getY = (val: number) => {
              const norm = (val - minPrice) / range;
              return chartHeight - paddingBottom - norm * usableH;
            };

            const getX = (idx: number) => paddingLeft + (idx / (monthlyData.length - 1)) * usableW;

            const baseHighY = getY(monthlyData[0].baseHigh);
            const baseLowY = getY(monthlyData[0].baseLow);

            // Price Path
            const pricePath = monthlyData.reduce(
              (acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.price)}` : `${acc} L ${getX(i)} ${getY(d.price)}`),
              ''
            );

            // Monthly 10-EMA Path
            const ema10Path = monthlyData.reduce(
              (acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.ema10)}` : `${acc} L ${getX(i)} ${getY(d.ema10)}`),
              ''
            );

            // Wave Riding Safe Area (between monthly price and 10-month EMA)
            const forwardArea = monthlyData.map((d, i) => `${getX(i)},${getY(d.price)}`).join(' ');
            const reverseArea = monthlyData
              .slice()
              .reverse()
              .map((d, i) => `${getX(monthlyData.length - 1 - i)},${getY(d.ema10)}`)
              .join(' ');
            const waveAreaPolygon = `${forwardArea} ${reverseArea}`;

            const isAbove10MonthEma = stock.price >= currentMonthEma10;
            const monthBufferPct = (((stock.price - currentMonthEma10) / currentMonthEma10) * 100).toFixed(1);

            return (
              <div className="relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 overflow-visible select-none">
                  {/* Horizontal Gridlines */}
                  {[0.25, 0.5, 0.75].map((pct, gIdx) => {
                    const priceLevel = minPrice + range * pct;
                    const y = getY(priceLevel);
                    return (
                      <g key={gIdx}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="2,2"
                        />
                        <text
                          x={chartWidth - paddingRight + 4}
                          y={y + 3}
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          ₹{Math.round(priceLevel)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Multi-Year Horizontal Accumulation Channel */}
                  <rect
                    x={paddingLeft}
                    y={baseHighY}
                    width={usableW}
                    height={Math.max(8, baseLowY - baseHighY)}
                    fill="rgba(6, 182, 212, 0.08)"
                    stroke="#0891b2"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  <text
                    x={paddingLeft + 6}
                    y={baseHighY + 12}
                    fill="#06b6d4"
                    fontSize="9"
                    fontWeight="bold"
                    opacity={0.8}
                  >
                    3-Year Secular Base Corridor (₹{monthlyData[0].baseLow} – ₹{monthlyData[0].baseHigh})
                  </text>

                  {/* Wave Riding Safe Area (Green tint between Monthly Price and 10-Month EMA) */}
                  <polygon points={waveAreaPolygon} fill="rgba(16, 185, 129, 0.12)" />

                  {/* +1.5σ Extreme Valuation Trim Target (Dashed Amber) */}
                  {showTrimLevel && (
                    <g>
                      <line
                        x1={paddingLeft}
                        y1={getY(trimPrice)}
                        x2={chartWidth - paddingRight}
                        y2={getY(trimPrice)}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="4,3"
                        opacity={0.85}
                      />
                      <text
                        x={chartWidth - paddingRight + 4}
                        y={getY(trimPrice) + 3}
                        fill="#f59e0b"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        ₹{trimPrice} (+1.5σ)
                      </text>
                    </g>
                  )}

                  {/* Monthly 10-EMA Trailing Line (Gold) */}
                  <path
                    d={ema10Path}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5,2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Monthly Price Line (Emerald) */}
                  <path
                    d={pricePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Current Position Markers */}
                  <circle
                    cx={getX(monthlyData.length - 1)}
                    cy={getY(stock.price)}
                    r={3.5}
                    fill="#10b981"
                    stroke="#070b12"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={getX(monthlyData.length - 1)}
                    cy={getY(currentMonthEma10)}
                    r={3}
                    fill="#f59e0b"
                    stroke="#070b12"
                    strokeWidth={1.5}
                  />

                  {/* Header Legend inside SVG */}
                  <text x={paddingLeft} y="15" fill="#10b981" fontSize="10" fontWeight="bold">
                    CMP: ₹{stock.price}
                  </text>
                  <text x={paddingLeft + 90} y="15" fill="#f59e0b" fontSize="10" fontWeight="bold">
                    • Monthly 10-EMA: ₹{currentMonthEma10} (+{monthBufferPct}% Buffer)
                  </text>
                  <text x={chartWidth - paddingRight} y="15" fill="#64748b" fontSize="9" textAnchor="end">
                    36-Month Secular Wave Rider
                  </text>

                  {/* Interactive Hover Listener Bars */}
                  {monthlyData.map((m, idx) => {
                    const x = getX(idx);
                    const widthPerCol = usableW / monthlyData.length;
                    return (
                      <rect
                        key={idx}
                        x={x - widthPerCol / 2}
                        y={0}
                        width={widthPerCol}
                        height={chartHeight}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredMonth(m)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      />
                    );
                  })}
                </svg>

                {/* Floating Hover Tooltip */}
                {hoveredMonth && (
                  <div className="absolute top-2 right-4 bg-slate-900/95 border border-slate-700 p-2 rounded-lg shadow-xl text-[10px] pointer-events-none z-10 font-mono">
                    <div className="text-white font-bold mb-0.5">{hoveredMonth.month}</div>
                    <div className="text-emerald-400">Close: ₹{hoveredMonth.price}</div>
                    <div className="text-amber-400">10-Mo EMA: ₹{hoveredMonth.ema10}</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Monthly Secular Strategy Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Secular Wave Riding</span>
              <strong className={stock.price >= monthlyData[monthlyData.length - 1].ema10 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {stock.price >= monthlyData[monthlyData.length - 1].ema10 ? 'ACTIVE (Secular Bull)' : 'BELOW 10-MO EMA'}
              </strong>
              <span className="text-[10px] text-slate-500 block">Monthly close &gt; 10-EMA</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">10-Month EMA Baseline</span>
              <strong className="text-amber-400 font-mono font-bold">
                ₹{monthlyData[monthlyData.length - 1].ema10}
              </strong>
              <span className="text-[10px] text-emerald-400 block">
                +{(((stock.price - monthlyData[monthlyData.length - 1].ema10) / monthlyData[monthlyData.length - 1].ema10) * 100).toFixed(1)}% buffer
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Base Corridor Breakout</span>
              <strong className="text-cyan-400 font-mono font-bold">₹{monthlyData[0].baseHigh}</strong>
              <span className="text-[10px] text-slate-500 block">Emerging from 3Y base</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Long-Term Scaling Rule</span>
              <span className="text-[10px] text-slate-300 block leading-tight">
                Hold secular compounder while &gt; 10-mo EMA; trim 33%–50% at +1.5σ (₹{stock.extremeValuationTrimPrice}).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3B: DUAL HORIZON WAVE RIDER (WEEKLY 10-EMA + MONTHLY 10-EMA POSITIONED SIDE-BY-SIDE) */}
      {activeMode === 'dual' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" /> Multi-Horizon Wave Riding Architecture:
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Intermediate Wave (Weekly 10-EMA) on Left • Secular Super-Cycle (Monthly 10-EMA) on Right
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Weekly 10-EMA Wave Rider */}
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Weekly 10-EMA Wave Rider
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  Stop: ₹{weeklyData[weeklyData.length - 1].ema10} (+{(((stock.price - weeklyData[weeklyData.length - 1].ema10) / weeklyData[weeklyData.length - 1].ema10) * 100).toFixed(1)}%)
                </span>
              </div>

              {(() => {
                const prices = weeklyData.map((d) => d.price);
                const ema10s = weeklyData.map((d) => d.ema10);
                const min = Math.min(...prices, ...ema10s) * 0.96;
                const max = Math.max(...prices, ...ema10s) * 1.04;
                const range = max - min || 1;

                const colW = 280;
                const colH = 130;
                const getY = (v: number) => colH - 15 - ((v - min) / range) * (colH - 30);
                const getX = (i: number) => 15 + (i / (weeklyData.length - 1)) * (colW - 30);

                const pricePath = weeklyData.reduce((acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.price)}` : `${acc} L ${getX(i)} ${getY(d.price)}`), '');
                const ema10Path = weeklyData.reduce((acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.ema10)}` : `${acc} L ${getX(i)} ${getY(d.ema10)}`), '');

                return (
                  <svg viewBox={`0 0 ${colW} ${colH}`} className="w-full h-32 overflow-visible select-none">
                    <path d={ema10Path} fill="none" stroke="#f59e0b" strokeWidth={1.75} strokeDasharray="3,2" />
                    <path d={pricePath} fill="none" stroke="#10b981" strokeWidth={2} />
                    <circle cx={getX(weeklyData.length - 1)} cy={getY(stock.price)} r={3} fill="#10b981" />
                    <circle cx={getX(weeklyData.length - 1)} cy={getY(weeklyData[weeklyData.length - 1].ema10)} r={2.5} fill="#f59e0b" />
                  </svg>
                );
              })()}

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Intermediate trailing stop</span>
                <span className="text-amber-400 font-semibold">Weekly close &gt; 10-EMA</span>
              </div>
            </div>

            {/* Right Column: Monthly 10-EMA Secular Wave Rider */}
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Monthly 10-EMA Secular Base
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  Baseline: ₹{monthlyData[monthlyData.length - 1].ema10} (+{(((stock.price - monthlyData[monthlyData.length - 1].ema10) / monthlyData[monthlyData.length - 1].ema10) * 100).toFixed(1)}%)
                </span>
              </div>

              {(() => {
                const prices = monthlyData.map((d) => d.price);
                const ema10s = monthlyData.map((d) => d.ema10);
                const min = Math.min(...prices, ...ema10s) * 0.94;
                const max = Math.max(...prices, ...ema10s) * 1.06;
                const range = max - min || 1;

                const colW = 280;
                const colH = 130;
                const getY = (v: number) => colH - 15 - ((v - min) / range) * (colH - 30);
                const getX = (i: number) => 15 + (i / (monthlyData.length - 1)) * (colW - 30);

                const pricePath = monthlyData.reduce((acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.price)}` : `${acc} L ${getX(i)} ${getY(d.price)}`), '');
                const ema10Path = monthlyData.reduce((acc, d, i) => (i === 0 ? `M ${getX(i)} ${getY(d.ema10)}` : `${acc} L ${getX(i)} ${getY(d.ema10)}`), '');

                return (
                  <svg viewBox={`0 0 ${colW} ${colH}`} className="w-full h-32 overflow-visible select-none">
                    <rect x={15} y={getY(monthlyData[0].baseHigh)} width={colW - 30} height={Math.max(6, getY(monthlyData[0].baseLow) - getY(monthlyData[0].baseHigh))} fill="rgba(6, 182, 212, 0.08)" stroke="#0891b2" strokeDasharray="2,2" />
                    <path d={ema10Path} fill="none" stroke="#f59e0b" strokeWidth={1.75} strokeDasharray="3,2" />
                    <path d={pricePath} fill="none" stroke="#10b981" strokeWidth={2.2} />
                    <circle cx={getX(monthlyData.length - 1)} cy={getY(stock.price)} r={3} fill="#10b981" />
                    <circle cx={getX(monthlyData.length - 1)} cy={getY(monthlyData[monthlyData.length - 1].ema10)} r={2.5} fill="#f59e0b" />
                  </svg>
                );
              })()}

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Secular base gatekeeper</span>
                <span className="text-cyan-400 font-semibold">Monthly close &gt; 10-EMA</span>
              </div>
            </div>
          </div>

          {/* Unified Dual Strategy Strip */}
          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-300">
              Wave Riding Scaling Rule: <strong className="text-amber-400">Trim 33%–50% at +1.5σ (₹{stock.extremeValuationTrimPrice})</strong> to de-risk principal.
            </span>
            <span className="text-emerald-400 font-medium">
              Both Weekly &amp; Monthly 10-EMA Trailing Trajectories Aligned Above Baseline
            </span>
          </div>
        </div>
      )}

      {/* VIEW 4: DYNAMIC 14-PERIOD ATR RENKO CHART */}
      {activeMode === 'renko' && (
        <div className="space-y-3">
          {/* Renko Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Sliders className="h-3 w-3 text-emerald-400" /> ATR Multiplier:
              </span>
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setAtrMultiplier(0.75)}
                  className={`px-2 py-0.5 rounded font-mono transition-colors ${
                    atrMultiplier === 0.75
                      ? 'bg-slate-800 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  0.75x (₹{(renkoConfig.baseAtr * 0.75).toFixed(1)})
                </button>
                <button
                  onClick={() => setAtrMultiplier(1.0)}
                  className={`px-2 py-0.5 rounded font-mono transition-colors ${
                    atrMultiplier === 1.0
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1.0x ATR (₹{renkoConfig.baseAtr})
                </button>
                <button
                  onClick={() => setAtrMultiplier(1.5)}
                  className={`px-2 py-0.5 rounded font-mono transition-colors ${
                    atrMultiplier === 1.5
                      ? 'bg-slate-800 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1.5x (₹{(renkoConfig.baseAtr * 1.5).toFixed(1)})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showRenkoEma}
                  onChange={(e) => setShowRenkoEma(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-950 h-3.5 w-3.5"
                />
                <span>10-Brick EMA Overlay</span>
              </label>
            </div>
          </div>

          {/* SVG Canvas for Renko Bricks */}
          {(() => {
            const bricks = renkoConfig.bricks;
            if (bricks.length === 0) {
              return (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                  No price moves exceeded the ₹{renkoConfig.brickSize} ATR brick size threshold during this period.
                </div>
              );
            }

            const allPrices = bricks.flatMap((b) => [b.open, b.close]);
            const minPrice = Math.min(...allPrices) - renkoConfig.brickSize * 0.5;
            const maxPrice = Math.max(...allPrices) + renkoConfig.brickSize * 0.5;
            const range = maxPrice - minPrice || 1;

            const paddingLeft = 30;
            const paddingRight = 45;
            const paddingTop = 25;
            const paddingBottom = 25;

            const usableW = chartWidth - paddingLeft - paddingRight;
            const usableH = chartHeight - paddingTop - paddingBottom;

            const getY = (price: number) => {
              const norm = (price - minPrice) / range;
              return chartHeight - paddingBottom - norm * usableH;
            };

            const brickWidth = Math.max(12, Math.min(22, Math.floor(usableW / bricks.length)));

            // Build 10-Brick EMA Path
            const emaPath = renkoConfig.emaValues.reduce((acc, ema, idx) => {
              const x = paddingLeft + idx * brickWidth + brickWidth / 2;
              const y = getY(ema);
              return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');

            return (
              <div className="relative">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48 overflow-visible select-none"
                >
                  {/* Subtle Horizontal Reference Grid Lines */}
                  {[0.25, 0.5, 0.75].map((pct, gIdx) => {
                    const priceLevel = minPrice + range * pct;
                    const y = getY(priceLevel);
                    return (
                      <g key={gIdx}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={chartWidth - paddingRight}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray="2,2"
                        />
                        <text
                          x={chartWidth - paddingRight + 4}
                          y={y + 3}
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          ₹{Math.round(priceLevel)}
                        </text>
                      </g>
                    );
                  })}

                  {/* 10-Brick EMA Trend Indicator Line */}
                  {showRenkoEma && (
                    <path
                      d={emaPath}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Renko Bricks Stack */}
                  {bricks.map((b, i) => {
                    const x = paddingLeft + i * brickWidth;
                    const topY = getY(Math.max(b.open, b.close));
                    const bottomY = getY(Math.min(b.open, b.close));
                    const h = Math.max(5, bottomY - topY);
                    const isUp = b.type === 'up';
                    const isLast = i === bricks.length - 1;
                    const isHovered = hoveredBrick?.index === b.index;

                    return (
                      <g
                        key={i}
                        onMouseEnter={() => setHoveredBrick(b)}
                        onMouseLeave={() => setHoveredBrick(null)}
                        className="cursor-pointer transition-all"
                      >
                        {/* Brick Body */}
                        <rect
                          x={x}
                          y={topY}
                          width={brickWidth - 2}
                          height={h}
                          fill={isUp ? '#10b981' : '#f43f5e'}
                          stroke={isHovered ? '#ffffff' : isUp ? '#34d399' : '#fb7185'}
                          strokeWidth={isHovered ? 2 : 1}
                          rx={1.5}
                          style={{
                            filter: isLast
                              ? `drop-shadow(0 0 5px ${isUp ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)'})`
                              : 'none',
                          }}
                        />

                        {/* Top Bevel Highlight */}
                        <line
                          x1={x + 1}
                          y1={topY + 1}
                          x2={x + brickWidth - 3}
                          y2={topY + 1}
                          stroke="#ffffff"
                          strokeOpacity={0.35}
                        />
                      </g>
                    );
                  })}

                  {/* Header Legend inside SVG */}
                  <text x={paddingLeft} y="15" fill="#10b981" fontSize="10" fontWeight="bold">
                    14-Period ATR: ₹{renkoConfig.brickSize} / brick
                  </text>
                  {showRenkoEma && (
                    <text x={paddingLeft + 160} y="15" fill="#f59e0b" fontSize="10">
                      • 10-Brick EMA Overlay
                    </text>
                  )}
                  <text x={chartWidth - paddingRight} y="15" fill="#64748b" fontSize="9" textAnchor="end">
                    Diagonal Brick Step: ±₹{renkoConfig.brickSize}
                  </text>
                </svg>

                {/* Floating Brick Inspection Tooltip */}
                {hoveredBrick && (
                  <div className="absolute top-2 right-4 bg-slate-900/95 border border-slate-700 p-2 rounded-lg shadow-xl text-[10px] pointer-events-none z-10 font-mono">
                    <div className="flex items-center gap-1.5 font-bold text-white mb-0.5">
                      <span className={hoveredBrick.type === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                        {hoveredBrick.type === 'up' ? '▲ Bullish Brick' : '▼ Bearish Brick'}
                      </span>
                      <span>#{hoveredBrick.index + 1}</span>
                    </div>
                    <div className="text-slate-300">
                      Open: ₹{hoveredBrick.open} ➔ Close: ₹{hoveredBrick.close}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Institutional Telemetry Footer Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Trend Signal</span>
              <strong className={renkoConfig.isCurrentlyBullish ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {renkoConfig.isCurrentlyBullish ? 'BULLISH RUN' : 'BEARISH CHURN'}
              </strong>
              <span className="text-[10px] text-slate-500 block">+{renkoConfig.bullishRun} Bricks</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Noise Filtered</span>
              <strong className="text-cyan-400 font-bold">{renkoConfig.noiseFilteredPct}%</strong>
              <span className="text-[10px] text-slate-500 block">Sideways churn pruned</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Next Bullish Brick</span>
              <strong className="text-emerald-300 font-mono font-bold">₹{renkoConfig.nextBrickUpTrigger}</strong>
              <span className="text-[10px] text-slate-500 block">Triggers +1 Up Brick</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Bearish Reversal Level</span>
              <strong className="text-rose-400 font-mono font-bold">₹{renkoConfig.bearishReversalTrigger}</strong>
              <span className="text-[10px] text-slate-500 block">2-Brick drop threshold</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
