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
