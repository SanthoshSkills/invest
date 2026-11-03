export type RegimeType =
  | 'bull'
  | 'sideways'
  | 'bear'
  | 'polarized'
  | 'choppy'
  | 'meltup'
  | 'shock'
  | 'goldilocks';

export interface MarketRegime {
  id: RegimeType;
  name: string;
  tagline: string;
  status: 'active' | 'inactive';
  technicalSignals: string;
  capTilt: string;
  capitalAllocation: string;
  equityAllocationPct: number;
  cashAllocationPct: number;
  stopLossRules: string;
  vixRange: string;
  peRange: string;
  breadthRange: string;
}

export type RrgQuadrant = 'Leading' | 'Improving' | 'Weakening' | 'Lagging';

export interface MacroSector {
  id: string;
  name: string;
  indexSymbol: string;
  weightPct: number;
  quadrant: RrgQuadrant;
  rsRatio: number;
  rsMomentum: number;
  macroStatus: 'Tailwind' | 'Neutral' | 'Headwind';
  catalysts: string[];
}

export interface IndustryGroup {
  id: string;
  sectorId: string;
  name: string;
  ebitdaInflectionYoY: number; // e.g. +220 bps
  capacityUtilizationPct: number; // e.g. 82%
  cyclePhase: 'Early Capex' | 'Operating Inflection' | 'Peak Earnings' | 'De-stocking';
  qualitativeTailwinds: string;
}

export interface BaseIndustry {
  id: string;
  industryId: string;
  name: string;
  moatType: string;
  pricingPower: 'High' | 'Moderate' | 'Constrained';
  supplyDemandStatus: string;
}

export interface StockScrip {
  symbol: string;
  name: string;
  sectorId: string;
  industryId: string;
  baseIndustryId: string;
  marketCapCr: number;
  price: number;
  pe: number;
  peMedian5Y: number;
  peStdDevDelta: number; // e.g. -0.4 or +1.6
  peg: number;
  debtToEquity: number;
  roce3Y: number;
  roe3Y: number;
  above50Dma: boolean;
  dma50: number;
  dma200: number;
  dma50Slope: 'Ascending' | 'Flat' | 'Descending';
  deliveryVolumeRatio: number; // e.g. 1.8x
  rsMansfield3M: number; // e.g. +4.2%
  valMoScore: number; // 0 to 100
  qualificationTier: 'Tier 5 Qualified' | 'Watchlist' | 'Disqualified';
  disqualificationReason?: string;
  recommendedPositionSize: number; // e.g. 18000
  calculatedLotShares: number; // e.g. 14 shares
  pyramidUpTriggerPrice: number; // +6%
  pyramidDownStopLossPrice: number; // -6.5%
  extremeValuationTrimPrice: number; // +1.5 std dev
  sparkline30D?: number[];
  atr14?: number;
  dailySeries?: { date: string; price: number; high?: number; low?: number; dma50: number; dma200: number; volumeRatio: number }[];
  weeklySeries?: { week: string; price: number; ema10: number; ema30: number }[];
  monthlySeries?: { month: string; price: number; baseHigh: number; baseLow: number }[];
}

export interface PaperPosition {
  id: string;
  symbol: string;
  name: string;
  entryDate: string;
  entryPrice: number;
  currentPrice: number;
  shares: number;
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  stopLoss: number;
  pyramidLevel: number;
  trimTarget: number;
  estimatedStcgTax: number;
  estimatedDpFees: number;
}

export interface DailyLeadingIndicators {
  tripleEmaAlignment: 'Bullish' | 'Neutral' | 'Bearish';
  ema9: number;
  ema21: number;
  ema55: number;
  priceAboveFastEma: boolean;
  shortAboveLongEma: boolean;
  adx: number;
  plusDi: number;
  minusDi: number;
  adxAccelerating: boolean; // ADX > 20/25 with +DI > -DI
  volumeAbove20Dma: boolean;
  volume20DmaRatio: number;
  dailyRsi: number;
  rsiMomentumRoom: boolean; // 45 <= RSI <= 65
  atr14: number;
  atrExpansion: boolean;
  bollingerExpansion: boolean;
  passedCount: number; // 0 to 4
  statusLabel: string;
}

export interface WeeklyLeadingIndicators {
  weeklyTripleEmaStructure: 'Bullish Support' | 'Consolidating' | 'Breakdown';
  weeklyEma13: number;
  weeklyEma34: number;
  weeklyEma89: number;
  supportedByEmaBands: boolean;
  weeklyAdx: number;
  weeklyAdxRising: boolean; // sustained > 30 and rising
  volumeAccumulation: boolean;
  weeklyRsi: number;
  rsiDivergence: 'Bullish Divergence' | 'None' | 'Bearish Divergence';
  mtfSynchronized: boolean; // Daily triggers align with Weekly Triple EMA status
  passedCount: number; // 0 to 4
  statusLabel: string;
}

export interface ScripMomentumProfile {
  daily: DailyLeadingIndicators;
  weekly: WeeklyLeadingIndicators;
  pureMomentumScore: number; // 0 to 100
  totalIndicatorCount: number; // 0 to 8
  isMtfSynced: boolean;
  rankOverall: number;
  rankInSector: number;
  isTop15Overall: boolean;
  isTop5InSector: boolean;
}

export interface StrategyPerformanceMetrics {
  totalReturnPct: string;
  alphaPct: string;
  maxDrawdownPct: string;
  winRatePct: string;
  profitFactor: string;
  sharpeRatio: string;
  avgTradeDuration: string;
  stcgTaxDragPct: string;
}

export interface EquityCurvePoint {
  periodLabel: string;
  nifty: number; // base 100
  valMo: number; // base 100
  momentum: number; // base 100
}

export interface BacktestTradeLog {
  id: string;
  symbol: string;
  name: string;
  strategy: 'Pure Momentum' | 'Val-Mo';
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  returnPct: number;
  holdingDays: number;
  entryTrigger: string;
  exitTrigger: string;
  pyramided: boolean;
}

export interface ComprehensiveBacktestScenario {
  period: string;
  regime: string;
  description: string;
  pureMomentum: StrategyPerformanceMetrics;
  valMo: StrategyPerformanceMetrics;
  nifty500: {
    totalReturnPct: string;
    maxDrawdownPct: string;
  };
  equityCurve: EquityCurvePoint[];
  tradeLogs: BacktestTradeLog[];
}
