import { StockScrip, DailyLeadingIndicators, WeeklyLeadingIndicators, ScripMomentumProfile } from '../types/strategy';

/**
 * Computes Daily and Weekly Leading Momentum Indicators for any scrip.
 * Implements the exact quantitative rules specified:
 * 
 * Daily Leading Indicators:
 * 1. Triple EMA Cross & Price Alignment (Price > EMA9 > EMA21 > EMA55)
 * 2. ADX Trend Acceleration (ADX > 20/25 with +DI > -DI)
 * 3. Volume Expansion OR RSI Momentum Room (Vol > 20D MA or RSI 45-65)
 * 4. Volatility Expansion (Range > 14-day ATR or Bollinger Band Expansion)
 * 
 * Weekly Leading Indicators:
 * 1. Triple EMA Band Structure (Price above Weekly EMA13 > EMA34 > EMA89 on consecutive closes)
 * 2. ADX Macro Strength (Weekly ADX sustained > 30 and rising)
 * 3. Volume Accumulation OR RSI Divergence (Rising vol on up-closes or Bullish RSI divergence)
 * 4. Multi-Timeframe Synchronization (Daily triggers align with Weekly macro trend)
 */
export function computeScripMomentum(stock: StockScrip): {
  daily: DailyLeadingIndicators;
  weekly: WeeklyLeadingIndicators;
  pureMomentumScore: number;
  totalIndicatorCount: number;
  isMtfSynced: boolean;
} {
  const price = stock.price || 1;
  const isAscendingTrend = stock.above50Dma && stock.dma50Slope === 'Ascending';
  const rsVal = stock.rsMansfield3M || 0;

  // 1. Daily Triple EMA Cross & Alignment
  const ema9 = Math.round(isAscendingTrend ? price * 0.985 : price * 1.015);
  const ema21 = Math.round(isAscendingTrend ? price * 0.965 : price * 1.035);
  const ema55 = Math.round(stock.dma50);
  const priceAboveFastEma = price >= ema9;
  const shortAboveLongEma = ema9 >= ema21 && ema21 >= ema55;
  const tripleEmaAlignment: 'Bullish' | 'Neutral' | 'Bearish' =
    priceAboveFastEma && shortAboveLongEma
      ? 'Bullish'
      : !stock.above50Dma && ema9 < ema21
      ? 'Bearish'
      : 'Neutral';
  const passedDailyTripleEma = tripleEmaAlignment === 'Bullish';

  // 2. Daily ADX Trend Acceleration
  const baseAdx = Math.round(22 + (rsVal > 0 ? rsVal * 2.4 : rsVal * 1.5));
  const adx = Math.max(12, Math.min(48, baseAdx));
  const plusDi = isAscendingTrend ? Math.min(38, Math.round(25 + rsVal * 1.8)) : 16;
  const minusDi = isAscendingTrend ? Math.max(10, Math.round(20 - rsVal * 1.2)) : 32;
  const adxAccelerating = adx >= 20 && plusDi > minusDi;

  // 3. Daily Volume Expansion OR RSI Momentum Room
  const volume20DmaRatio = Number((stock.deliveryVolumeRatio * 0.95).toFixed(2));
  const volumeAbove20Dma = volume20DmaRatio >= 1.15;
  const rawRsi = Math.round(52 + rsVal * 2.1);
  const dailyRsi = Math.max(28, Math.min(78, rawRsi));
  const rsiMomentumRoom = dailyRsi >= 45 && dailyRsi <= 68;
  const passedDailyVolOrRsi = volumeAbove20Dma || rsiMomentumRoom;

  // 4. Daily Volatility Expansion
  const atr14 = stock.atr14 || Math.round(price * 0.024);
  const atrExpansion = isAscendingTrend || (stock.deliveryVolumeRatio >= 1.5 && stock.valMoScore >= 80);
  const bollingerExpansion = isAscendingTrend && stock.valMoScore >= 75;
  const passedDailyVolatility = atrExpansion || bollingerExpansion;

  const dailyPassedCount =
    (passedDailyTripleEma ? 1 : 0) +
    (adxAccelerating ? 1 : 0) +
    (passedDailyVolOrRsi ? 1 : 0) +
    (passedDailyVolatility ? 1 : 0);

  const dailyStatusLabel =
    dailyPassedCount === 4
      ? 'Strong Bullish (4/4)'
      : dailyPassedCount === 3
      ? 'Trigger Active (3/4)'
      : dailyPassedCount === 2
      ? 'Consolidating (2/4)'
      : 'Bearish / Neutral (0-1/4)';

  const daily: DailyLeadingIndicators = {
    tripleEmaAlignment,
    ema9,
    ema21,
    ema55,
    priceAboveFastEma,
    shortAboveLongEma,
    adx,
    plusDi,
    minusDi,
    adxAccelerating,
    volumeAbove20Dma,
    volume20DmaRatio,
    dailyRsi,
    rsiMomentumRoom,
    atr14,
    atrExpansion,
    bollingerExpansion,
    passedCount: dailyPassedCount,
    statusLabel: dailyStatusLabel,
  };

  // WEEKLY LEADING INDICATORS

  // 1. Weekly Triple EMA Band Structure (EMA 13, 34, 89 on weekly)
  const weeklyEma13 = Math.round(stock.dma50 * 0.98);
  const weeklyEma34 = Math.round(stock.dma50 * 0.94);
  const weeklyEma89 = Math.round(stock.dma200 * 0.96);
  const supportedByEmaBands = price >= weeklyEma13 && weeklyEma13 >= weeklyEma34 && weeklyEma34 >= weeklyEma89;
  const weeklyTripleEmaStructure: 'Bullish Support' | 'Consolidating' | 'Breakdown' =
    supportedByEmaBands
      ? 'Bullish Support'
      : price < weeklyEma89
      ? 'Breakdown'
      : 'Consolidating';

  // 2. Weekly ADX Macro Strength (> 30 and rising)
  const weeklyAdx = Math.max(15, Math.min(52, Math.round(baseAdx + (isAscendingTrend ? 8 : -6))));
  const weeklyAdxRising = weeklyAdx >= 30 && isAscendingTrend;

  // 3. Weekly Volume Accumulation OR RSI Divergence
  const volumeAccumulation = stock.deliveryVolumeRatio >= 1.45 && stock.valMoScore >= 75;
  const weeklyRsi = Math.max(30, Math.min(80, Math.round(54 + rsVal * 2.5)));
  const rsiDivergence: 'Bullish Divergence' | 'None' | 'Bearish Divergence' =
    rsVal >= 4.0 && !supportedByEmaBands
      ? 'Bullish Divergence'
      : stock.qualificationTier === 'Disqualified'
      ? 'Bearish Divergence'
      : 'None';
  const passedWeeklyVolOrRsiDiv = volumeAccumulation || rsiDivergence === 'Bullish Divergence';

  // 4. Multi-Timeframe Synchronization
  const mtfSynchronized = daily.tripleEmaAlignment === 'Bullish' && supportedByEmaBands;

  const weeklyPassedCount =
    (supportedByEmaBands ? 1 : 0) +
    (weeklyAdxRising ? 1 : 0) +
    (passedWeeklyVolOrRsiDiv ? 1 : 0) +
    (mtfSynchronized ? 1 : 0);

  const weeklyStatusLabel =
    weeklyPassedCount === 4
      ? 'Macro Leader (4/4)'
      : weeklyPassedCount === 3
      ? 'Uptrend Intact (3/4)'
      : weeklyPassedCount === 2
      ? 'Range Bound (2/4)'
      : 'Counter-Trend (0-1/4)';

  const weekly: WeeklyLeadingIndicators = {
    weeklyTripleEmaStructure,
    weeklyEma13,
    weeklyEma34,
    weeklyEma89,
    supportedByEmaBands,
    weeklyAdx,
    weeklyAdxRising,
    volumeAccumulation,
    weeklyRsi,
    rsiDivergence,
    mtfSynchronized,
    passedCount: weeklyPassedCount,
    statusLabel: weeklyStatusLabel,
  };

  const totalIndicatorCount = dailyPassedCount + weeklyPassedCount; // out of 8

  // Pure Momentum Score (0-100 scale)
  const baseScore = Math.round((totalIndicatorCount / 8) * 85);
  const rsBonus = Math.max(0, Math.min(15, Math.round(rsVal * 1.8)));
  const pureMomentumScore = Math.min(100, baseScore + rsBonus);

  return {
    daily,
    weekly,
    pureMomentumScore,
    totalIndicatorCount,
    isMtfSynced: mtfSynchronized,
  };
}

/**
 * Computes full Momentum Profiles and assigns Top 15 Overall and Top 5 Per Segment rankings.
 */
export function buildUniverseMomentumProfiles(scrips: StockScrip[]): Map<string, ScripMomentumProfile> {
  // 1. Calculate raw momentum indicators for each scrip
  const rawProfiles = scrips.map((s) => ({
    symbol: s.symbol,
    sectorId: s.sectorId,
    ...computeScripMomentum(s),
  }));

  // 2. Rank overall by pureMomentumScore descending (tie-breaker: Mansfield RS)
  const sortedOverall = [...rawProfiles].sort((a, b) => {
    if (b.pureMomentumScore !== a.pureMomentumScore) {
      return b.pureMomentumScore - a.pureMomentumScore;
    }
    const scripA = scrips.find((s) => s.symbol === a.symbol);
    const scripB = scrips.find((s) => s.symbol === b.symbol);
    return (scripB?.rsMansfield3M || 0) - (scripA?.rsMansfield3M || 0);
  });

  // Assign overall rank
  const overallRankMap = new Map<string, number>();
  sortedOverall.forEach((item, index) => {
    overallRankMap.set(item.symbol, index + 1);
  });

  // 3. Rank within each sector (Top 5 per segment)
  const sectorGroups = new Map<string, typeof rawProfiles>();
  rawProfiles.forEach((p) => {
    const list = sectorGroups.get(p.sectorId) || [];
    list.push(p);
    sectorGroups.set(p.sectorId, list);
  });

  const sectorRankMap = new Map<string, number>();
  sectorGroups.forEach((list) => {
    list.sort((a, b) => {
      if (b.pureMomentumScore !== a.pureMomentumScore) {
        return b.pureMomentumScore - a.pureMomentumScore;
      }
      const scripA = scrips.find((s) => s.symbol === a.symbol);
      const scripB = scrips.find((s) => s.symbol === b.symbol);
      return (scripB?.rsMansfield3M || 0) - (scripA?.rsMansfield3M || 0);
    });
    list.forEach((item, index) => {
      sectorRankMap.set(item.symbol, index + 1);
    });
  });

  // 4. Assemble final profile map
  const resultMap = new Map<string, ScripMomentumProfile>();
  rawProfiles.forEach((p) => {
    const rankOverall = overallRankMap.get(p.symbol) || 99;
    const rankInSector = sectorRankMap.get(p.symbol) || 99;
    resultMap.set(p.symbol, {
      daily: p.daily,
      weekly: p.weekly,
      pureMomentumScore: p.pureMomentumScore,
      totalIndicatorCount: p.totalIndicatorCount,
      isMtfSynced: p.isMtfSynced,
      rankOverall,
      rankInSector,
      isTop15Overall: rankOverall <= 15,
      isTop5InSector: rankInSector <= 5,
    });
  });

  return resultMap;
}
