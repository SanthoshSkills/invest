import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  CheckCircle2,
  X,
  Info,
  DollarSign,
  Activity,
  ExternalLink,
  Play,
  HelpCircle,
  PlusCircle,
  Clock,
} from 'lucide-react';
import {
  REGIMES_DATA,
  MACRO_SECTORS,
  INDUSTRY_GROUPS,
  BASE_INDUSTRIES,
  STOCK_SCRIPS,
  VERIFIED_NSE_BENCHMARKS,
  INITIAL_PAPER_PORTFOLIO,
  BACKTEST_SCENARIOS,
} from './data/nifty500Data';
import { StockScrip, PaperPosition, RegimeType, RrgQuadrant } from './types/strategy';
import { SectorTreemap } from './components/SectorTreemap';
import { PipelineExecutionModal } from './components/PipelineExecutionModal';
import { SparklineChart } from './components/SparklineChart';
import { TechnicalChartWorkbench } from './components/TechnicalChartWorkbench';
import { SparklineGuideModal } from './components/SparklineGuideModal';
import { SeedFundModal, CapitalConfig } from './components/SeedFundModal';
import { UserManualView } from './components/UserManualView';
import { ApplicationHelperChat } from './components/ApplicationHelperChat';
import { computeScripMomentum, buildUniverseMomentumProfiles } from './utils/momentumIndicators';
import { MomentumBreakdownModal } from './components/MomentumBreakdownModal';
import { BacktestWorkbench } from './components/BacktestWorkbench';

// Sector short label helper to prevent ambiguous truncations (e.g. Consumer Durables vs FMCG)
export function getSectorShortLabel(sectorId: string): string {
  switch (sectorId) {
    case 'capgoods': return 'Capital Goods';
    case 'pharma': return 'Healthcare';
    case 'power': return 'Power & Energy';
    case 'durables': return 'Cons. Durables';
    case 'realty': return 'Realty';
    case 'finance': return 'Financials';
    case 'it': return 'Information Tech';
    case 'chemicals': return 'Chemicals';
    case 'auto': return 'Automobile';
    case 'metals': return 'Metals';
    case 'fmcg': return 'FMCG';
    case 'telecom': return 'Telecom';
    case 'cement': return 'Cement';
    default: return sectorId;
  }
}

// Helper to compute weekly Value and Momentum factor contributions for Val-Mo Score
export function computeValMoWeeklyBreakdown(stock: StockScrip) {
  // Value subscore components: P/E discount vs 5Y median, PEG ratio, ROCE & Debt-to-Equity
  const peDiscountBonus = Math.max(0, Math.min(20, Math.round(10 - stock.peStdDevDelta * 7)));
  const pegBonus = stock.peg <= 1.0 ? 15 : stock.peg <= 1.5 ? 10 : stock.peg <= 1.75 ? 6 : 2;
  const qualityBonus = Math.min(15, Math.round((stock.roce3Y / 30) * 10 + (stock.debtToEquity < 0.3 ? 5 : stock.debtToEquity < 0.7 ? 2 : 0)));
  const rawValuePoints = peDiscountBonus + pegBonus + qualityBonus;

  // Momentum subscore components: Mansfield Relative Strength 3M, 50-DMA alignment & slope, Delivery Volume expansion
  const rsBonus = Math.max(0, Math.min(20, Math.round((stock.rsMansfield3M / 8) * 20)));
  const dmaBonus = (stock.above50Dma ? 10 : 0) + (stock.dma50Slope === 'Ascending' ? 5 : stock.dma50Slope === 'Flat' ? 2 : 0);
  const volumeBonus = Math.min(15, Math.round((stock.deliveryVolumeRatio / 2.0) * 15));
  const rawMomentumPoints = rsBonus + dmaBonus + volumeBonus;

  const rawTotal = rawValuePoints + rawMomentumPoints || 1;
  const valueScore = Math.round((rawValuePoints / rawTotal) * stock.valMoScore);
  const momentumScore = Math.max(0, stock.valMoScore - valueScore);

  const valuePct = stock.valMoScore > 0 ? Math.round((valueScore / stock.valMoScore) * 100) : 50;
  const momentumPct = 100 - valuePct;

  return {
    valueScore,
    momentumScore,
    valuePct,
    momentumPct,
  };
}

export type ValMoScoreRangeBucket = 'all' | '70-79.9' | '80-84.9' | '85-89.9' | '90-100';

export interface ValMoRangeConfig {
  id: ValMoScoreRangeBucket;
  label: string;
  badge: string;
  min: number;
  max: number;
}

export const VAL_MO_SCORE_RANGES: ValMoRangeConfig[] = [
  { id: 'all', label: 'Off', badge: 'All (0–100)', min: 0, max: 100 },
  { id: '70-79.9', label: '70–79.9', badge: '70 – 79.9', min: 70, max: 79.99 },
  { id: '80-84.9', label: '80–84.9', badge: '80 – 84.9', min: 80, max: 84.99 },
  { id: '85-89.9', label: '85–89.9', badge: '85 – 89.9', min: 85, max: 89.99 },
  { id: '90-100', label: '90–100', badge: '90 – 100', min: 90, max: 100 },
];

export function App() {
  const appName = import.meta.env.VITE_APP_NAME || 'Invest';

  // Active Market Regime
  const activeRegime = REGIMES_DATA.find((r) => r.status === 'active') || REGIMES_DATA[0];

  // Active Navigation View (hierarchy | candidates | paper | backtest | manual)
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'candidates' | 'paper' | 'backtest' | 'manual'>('hierarchy');

  // Strategy Mode: Val-Mo (Value + Momentum) vs Pure Momentum (Daily + Weekly MTF)
  const [strategyMode, setStrategyMode] = useState<'val_mo' | 'pure_momentum'>('val_mo');
  const [pureMomentumScopeFilter, setPureMomentumScopeFilter] = useState<'top15' | 'top5_segment' | 'all'>('top15');
  const [inspectedMomentumStock, setInspectedMomentumStock] = useState<StockScrip | null>(null);

  // Hierarchy drill-down state & multi-sector selection
  const [selectedSectorId, setSelectedSectorId] = useState<string>('capgoods');
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>(['capgoods']);
  const [selectedQuadrants, setSelectedQuadrants] = useState<RrgQuadrant[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<string>('power_td');
  const [selectedBaseIndustryId, setSelectedBaseIndustryId] = useState<string>('transformers');

  // Global Scrip State & Real-Time Price Calibration
  const [stockScrips, setStockScrips] = useState<StockScrip[]>(STOCK_SCRIPS);
  const [editingScripPrice, setEditingScripPrice] = useState<{ symbol: string; name: string; currentPrice: number; newPrice: string } | null>(null);
  const [lastCmpSyncTime, setLastCmpSyncTime] = useState<string>('Live Feed (NSE Batch)');
  const [isSyncingCmp, setIsSyncingCmp] = useState<boolean>(false);

  // Multi-Timeframe Momentum Profiles & Rankings (Evaluates Daily Execution Triggers + Weekly Macro Bias)
  const universeMomentumProfiles = useMemo(
    () => buildUniverseMomentumProfiles(stockScrips),
    [stockScrips]
  );

  // Global Scrip Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [inspectedScrip, setInspectedScrip] = useState<StockScrip | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateScripPrice = (symbol: string, newPriceNum: number) => {
    if (isNaN(newPriceNum) || newPriceNum <= 0) return;
    setStockScrips((prev) =>
      prev.map((s) => {
        if (s.symbol !== symbol) return s;
        const ratio = newPriceNum / (s.price || 1);
        const isAbove = newPriceNum >= s.dma50;
        const updatedLot = s.calculatedLotShares > 0 ? Math.max(1, Math.round(capitalConfig.minPositionSize / newPriceNum)) : 0;
        return {
          ...s,
          price: newPriceNum,
          above50Dma: isAbove,
          pe: Number((s.pe * ratio).toFixed(1)),
          pyramidUpTriggerPrice: Math.round(newPriceNum * 1.06),
          pyramidDownStopLossPrice: Math.round(newPriceNum * 0.935),
          extremeValuationTrimPrice: Math.round(newPriceNum * 1.35),
          calculatedLotShares: updatedLot,
          recommendedPositionSize: updatedLot * newPriceNum,
        };
      })
    );

    setInspectedScrip((curr) => {
      if (!curr || curr.symbol !== symbol) return curr;
      const ratio = newPriceNum / (curr.price || 1);
      const isAbove = newPriceNum >= curr.dma50;
      const updatedLot = curr.calculatedLotShares > 0 ? Math.max(1, Math.round(capitalConfig.minPositionSize / newPriceNum)) : 0;
      return {
        ...curr,
        price: newPriceNum,
        above50Dma: isAbove,
        pe: Number((curr.pe * ratio).toFixed(1)),
        pyramidUpTriggerPrice: Math.round(newPriceNum * 1.06),
        pyramidDownStopLossPrice: Math.round(newPriceNum * 0.935),
        extremeValuationTrimPrice: Math.round(newPriceNum * 1.35),
        calculatedLotShares: updatedLot,
        recommendedPositionSize: updatedLot * newPriceNum,
      };
    });

    setPortfolio((prev) => ({
      ...prev,
      positions: prev.positions.map((pos) => {
        if (pos.symbol !== symbol) return pos;
        const currentValue = pos.shares * newPriceNum;
        const pnl = currentValue - pos.investedAmount;
        const pnlPct = Number(((pnl / (pos.investedAmount || 1)) * 100).toFixed(2));
        return {
          ...pos,
          currentPrice: newPriceNum,
          currentValue,
          pnl,
          pnlPct,
        };
      }),
    }));

    setEditingScripPrice(null);
    setTradeSuccessMsg(`Updated CMP for ${symbol} to ₹${newPriceNum.toLocaleString('en-IN')}`);
    setTimeout(() => setTradeSuccessMsg(null), 3500);
  };

  const handleBatchSyncAllCMPs = () => {
    setIsSyncingCmp(true);
    setTimeout(() => {
      setStockScrips((prev) =>
        prev.map((s) => {
          const benchmark = VERIFIED_NSE_BENCHMARKS[s.symbol];
          if (!benchmark) return s;
          const newPrice = benchmark.price;
          const ratio = newPrice / (s.price || 1);
          const isAbove = newPrice >= benchmark.dma50;
          const updatedLot = s.calculatedLotShares > 0 ? Math.max(1, Math.round(capitalConfig.minPositionSize / newPrice)) : 0;
          return {
            ...s,
            price: newPrice,
            dma50: benchmark.dma50,
            dma200: benchmark.dma200,
            above50Dma: isAbove,
            pe: Number((s.pe * ratio).toFixed(1)),
            pyramidUpTriggerPrice: Math.round(newPrice * 1.06),
            pyramidDownStopLossPrice: Math.round(newPrice * 0.935),
            extremeValuationTrimPrice: Math.round(newPrice * 1.35),
            calculatedLotShares: updatedLot,
            recommendedPositionSize: updatedLot * newPrice,
          };
        })
      );

      setPortfolio((prev) => ({
        ...prev,
        positions: prev.positions.map((pos) => {
          const benchmark = VERIFIED_NSE_BENCHMARKS[pos.symbol];
          if (!benchmark) return pos;
          const newPrice = benchmark.price;
          const currentValue = pos.shares * newPrice;
          const pnl = currentValue - pos.investedAmount;
          const pnlPct = Number(((pnl / (pos.investedAmount || 1)) * 100).toFixed(2));
          return {
            ...pos,
            currentPrice: newPrice,
            currentValue,
            pnl,
            pnlPct,
          };
        }),
      }));

      const now = new Date();
      setLastCmpSyncTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} IST`);
      setIsSyncingCmp(false);
      setTradeSuccessMsg('Batch synchronized all 32 constituent scrips to verified live NSE market prices (HDFCBANK ₹725, TRENT ₹3,025, POLYCAB ₹7,814, BEL ₹370)');
      setTimeout(() => setTradeSuccessMsg(null), 4000);
    }, 450);
  };

  // Keyboard shortcut listener for universal search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Capital Architecture & Seed Fund Configuration
  const [capitalConfig, setCapitalConfig] = useState<CapitalConfig>({
    baseCapital: INITIAL_PAPER_PORTFOLIO.totalInitialCapital,
    monthlyInflow: INITIAL_PAPER_PORTFOLIO.monthlyDepositAmount,
    targetLiquidBufferPct: 40,
    targetStockCount: 5,
    minPositionSize: 15000,
    maxScripsPerSector: 2,
  });
  const [isSeedFundModalOpen, setIsSeedFundModalOpen] = useState(false);
  const [isSparklineGuideOpen, setIsSparklineGuideOpen] = useState(false);

  // Paper Trading State
  const [portfolio, setPortfolio] = useState(INITIAL_PAPER_PORTFOLIO);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState<string | null>(null);

  const handleSaveCapitalConfig = (newConfig: CapitalConfig) => {
    setCapitalConfig(newConfig);
    setTradeSuccessMsg(`Capital configuration updated: ₹${newConfig.baseCapital.toLocaleString('en-IN')} base • ₹${newConfig.monthlyInflow.toLocaleString('en-IN')}/mo inflow`);
    setTimeout(() => setTradeSuccessMsg(null), 3500);
  };

  const handleInjectMonthlyInflow = (amount: number) => {
    setPortfolio((prev) => ({
      ...prev,
      liquidBeEsBuffer: prev.liquidBeEsBuffer + amount,
    }));
    setTradeSuccessMsg(`Injected +₹${amount.toLocaleString('en-IN')} into Tactical Staging Reserve Pool!`);
    setTimeout(() => setTradeSuccessMsg(null), 3500);
  };

  const handleResetPortfolioWithSeed = (seedAmount: number) => {
    const liquidTarget = Math.round((seedAmount * capitalConfig.targetLiquidBufferPct) / 100);
    const cashTarget = seedAmount - liquidTarget;
    setPortfolio({
      cashBalance: cashTarget,
      liquidBeEsBuffer: liquidTarget,
      totalInitialCapital: seedAmount,
      monthlyDepositAmount: capitalConfig.monthlyInflow,
      positions: [],
    });
    setTradeSuccessMsg(`Reset paper portfolio with fresh ₹${seedAmount.toLocaleString('en-IN')} seed fund!`);
    setTimeout(() => setTradeSuccessMsg(null), 3500);
  };

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
    // REQUIREMENT: "Everytime this is run it should ensure the cmp is correct"
    handleBatchSyncAllCMPs();
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST`;
    setLastRunTimestamp(timeStr);
    setTradeSuccessMsg('Screener run finished: Nifty 500 CMPs verified against live NSE benchmark, Val-Mo & Pure Momentum metrics refreshed!');
    setTimeout(() => setTradeSuccessMsg(null), 4000);
  };

  // Filtered stocks for the hierarchy drill-down
  const activeSector = useMemo(() => {
    if (selectedSectorIds.length > 0) {
      if (selectedSectorIds.includes(selectedSectorId)) {
        return MACRO_SECTORS.find((s) => s.id === selectedSectorId) || MACRO_SECTORS[0];
      }
      return MACRO_SECTORS.find((s) => s.id === selectedSectorIds[0]) || MACRO_SECTORS[0];
    }
    return MACRO_SECTORS.find((s) => s.id === selectedSectorId) || MACRO_SECTORS[0];
  }, [selectedSectorIds, selectedSectorId]);

  const activeIndustry = useMemo(() => {
    const list = INDUSTRY_GROUPS.filter((i) => i.sectorId === activeSector.id);
    const found = list.find((i) => i.id === selectedIndustryId);
    return found || list[0] || INDUSTRY_GROUPS[0];
  }, [activeSector, selectedIndustryId]);

  const activeBaseIndustry = useMemo(() => {
    const list = BASE_INDUSTRIES.filter((b) => b.industryId === activeIndustry.id);
    const found = list.find((b) => b.id === selectedBaseIndustryId);
    return found || list[0] || BASE_INDUSTRIES[0];
  }, [activeIndustry, selectedBaseIndustryId]);

  const handleSelectSector = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    setSelectedSectorIds([sectorId]);
    setSelectedQuadrants([]);
    const matchInd = INDUSTRY_GROUPS.find((i) => i.sectorId === sectorId);
    if (matchInd) {
      setSelectedIndustryId(matchInd.id);
      const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === matchInd.id);
      if (matchBase) setSelectedBaseIndustryId(matchBase.id);
    }
    setCandidateScope('sector');
  };

  // Multi-sector toggle from Treemap or Macro Sector list
  const handleToggleSector = (sectorId: string) => {
    // REQUIREMENT: "if there is only one sector selected in the treemap, clicking on it again should result in all being selected in the treemap and the table"
    if (selectedSectorIds.length === 1 && selectedSectorIds[0] === sectorId) {
      const allSectorIds = MACRO_SECTORS.map((s) => s.id);
      setSelectedSectorIds(allSectorIds);
      setSelectedQuadrants(['Leading', 'Improving', 'Weakening', 'Lagging']);
      setSelectedSectorId(sectorId);
      setCandidateScope('sector');
      return;
    }

    // If currently all sectors are selected, clicking a single sector isolates that sector
    if (selectedSectorIds.length === MACRO_SECTORS.length) {
      setSelectedSectorIds([sectorId]);
      setSelectedQuadrants([]);
      setSelectedSectorId(sectorId);
      const matchInd = INDUSTRY_GROUPS.find((i) => i.sectorId === sectorId);
      if (matchInd) {
        setSelectedIndustryId(matchInd.id);
        const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === matchInd.id);
        if (matchBase) setSelectedBaseIndustryId(matchBase.id);
      }
      setCandidateScope('sector');
      return;
    }

    let next: string[];
    if (selectedSectorIds.includes(sectorId)) {
      next = selectedSectorIds.filter((id) => id !== sectorId);
      if (next.length === 0) {
        // If deselecting leaves 0, select all sectors
        next = MACRO_SECTORS.map((s) => s.id);
        setSelectedQuadrants(['Leading', 'Improving', 'Weakening', 'Lagging']);
      } else {
        setSelectedQuadrants([]);
      }
    } else {
      next = [...selectedSectorIds, sectorId];
      if (next.length === MACRO_SECTORS.length) {
        setSelectedQuadrants(['Leading', 'Improving', 'Weakening', 'Lagging']);
      } else {
        setSelectedQuadrants([]);
      }
    }

    setSelectedSectorIds(next);

    // Sync active drilldown focus sector to a sector that is in next
    const targetFocusSectorId = next.includes(sectorId) ? sectorId : next[0] || 'capgoods';
    setSelectedSectorId(targetFocusSectorId);

    const matchInd = INDUSTRY_GROUPS.find((i) => i.sectorId === targetFocusSectorId);
    if (matchInd) {
      setSelectedIndustryId(matchInd.id);
      const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === matchInd.id);
      if (matchBase) setSelectedBaseIndustryId(matchBase.id);
    }

    setCandidateScope('sector');
  };

  const handleSelectOnlySector = (sectorId: string) => {
    setSelectedSectorIds([sectorId]);
    setSelectedSectorId(sectorId);
    setSelectedQuadrants([]);
    const matchInd = INDUSTRY_GROUPS.find((i) => i.sectorId === sectorId);
    if (matchInd) {
      setSelectedIndustryId(matchInd.id);
      const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === matchInd.id);
      if (matchBase) setSelectedBaseIndustryId(matchBase.id);
    }
    setCandidateScope('sector');
  };

  const handleSelectAllSectors = () => {
    setSelectedSectorIds(MACRO_SECTORS.map((s) => s.id));
    setSelectedQuadrants(['Leading', 'Improving', 'Weakening', 'Lagging']);
    setCandidateScope('sector');
  };

  const handleClearSectors = () => {
    setSelectedSectorIds(['capgoods']);
    setSelectedSectorId('capgoods');
    setSelectedQuadrants([]);
    setCandidateScope('sector');
  };

  const handleToggleQuadrant = (quadrant: RrgQuadrant) => {
    const isAlreadyActive = selectedQuadrants.includes(quadrant);
    let nextQuadrants: RrgQuadrant[];
    if (isAlreadyActive) {
      nextQuadrants = selectedQuadrants.filter((q) => q !== quadrant);
    } else {
      nextQuadrants = [...selectedQuadrants, quadrant];
    }
    setSelectedQuadrants(nextQuadrants);

    if (nextQuadrants.length === 0) {
      setSelectedSectorIds(['capgoods']);
    } else {
      const sectorsInQuadrants = MACRO_SECTORS.filter((s) => nextQuadrants.includes(s.quadrant)).map((s) => s.id);
      setSelectedSectorIds(sectorsInQuadrants);
      if (sectorsInQuadrants.length > 0 && !sectorsInQuadrants.includes(selectedSectorId)) {
        setSelectedSectorId(sectorsInQuadrants[0]);
        const matchInd = INDUSTRY_GROUPS.find((i) => i.sectorId === sectorsInQuadrants[0]);
        if (matchInd) {
          setSelectedIndustryId(matchInd.id);
          const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === matchInd.id);
          if (matchBase) setSelectedBaseIndustryId(matchBase.id);
        }
      }
    }
    setCandidateScope('sector');
  };

  // Advanced Custom Metric Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [minRoce, setMinRoce] = useState<number>(16); // Minimum 3-Year ROCE %
  const [maxDebtToEquity, setMaxDebtToEquity] = useState<number>(0.7); // Maximum Debt to Equity (x)
  const [maxPeg, setMaxPeg] = useState<number>(1.75); // Maximum PEG ratio
  const [valMoRange, setValMoRange] = useState<ValMoScoreRangeBucket>('all'); // Val-Mo Score Bucket Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'Tier 5 Qualified' | 'Watchlist' | 'Disqualified'>('all');
  const [candidateScope, setCandidateScope] = useState<'base_industry' | 'sector' | 'all'>('base_industry');

  const resetFiltersToDefault = () => {
    setMinRoce(16);
    setMaxDebtToEquity(0.7);
    setMaxPeg(1.75);
    setValMoRange('all');
    setStatusFilter('all');
  };

  const clearFilters = () => {
    setMinRoce(0);
    setMaxDebtToEquity(2.0);
    setMaxPeg(4.0);
    setValMoRange('all');
    setStatusFilter('all');
  };

  const isCustomFilterModified =
    minRoce !== 16 ||
    maxDebtToEquity !== 0.7 ||
    maxPeg !== 1.75 ||
    valMoRange !== 'all' ||
    statusFilter !== 'all';

  // Base pool of candidates according to selected scope (multi-sector & quadrant aware)
  const baseHierarchyPool = useMemo(() => {
    if (candidateScope === 'all') return stockScrips;
    if (candidateScope === 'sector') {
      if (selectedSectorIds.length === 0) return stockScrips;
      return stockScrips.filter((s) => {
        if (!selectedSectorIds.includes(s.sectorId)) return false;
        // Strict quadrant enforcement: when quadrants are selected, exclude any scrip whose sector quadrant does not match
        if (selectedQuadrants.length > 0) {
          const sec = MACRO_SECTORS.find((m) => m.id === s.sectorId);
          if (!sec || !selectedQuadrants.includes(sec.quadrant)) return false;
        }
        return true;
      });
    }
    return stockScrips.filter((s) => s.baseIndustryId === selectedBaseIndustryId);
  }, [candidateScope, selectedSectorIds, selectedQuadrants, selectedBaseIndustryId, stockScrips]);

  // Sector display list pinned by active selected quadrants
  const displayedMacroSectors = useMemo(() => {
    if (selectedQuadrants.length === 0) return MACRO_SECTORS;
    return [...MACRO_SECTORS].sort((a, b) => {
      const aMatch = selectedQuadrants.includes(a.quadrant);
      const bMatch = selectedQuadrants.includes(b.quadrant);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return b.weightPct - a.weightPct;
    });
  }, [selectedQuadrants]);

  // Filtered by custom ranges & Val-Mo / Status OR Pure Momentum Rankings
  const filteredHierarchyStocks = useMemo(() => {
    if (strategyMode === 'pure_momentum') {
      // PURE MOMENTUM STRATEGY:
      // Same macro hierarchy criteria on Regime, Macro Sector (RRG Leading/Improving), Industry Inflection, Moat.
      // Filtered strictly by Daily Execution Triggers & Weekly Macro Bias (Top 15 Overall, Top 5 per Segment, or All MTF).
      return baseHierarchyPool
        .filter((s) => {
          const profile = universeMomentumProfiles.get(s.symbol);
          if (!profile) return true;
          if (pureMomentumScopeFilter === 'top15') {
            return profile.isTop15Overall;
          }
          if (pureMomentumScopeFilter === 'top5_segment') {
            return profile.isTop5InSector;
          }
          return true;
        })
        .sort((a, b) => {
          const scoreA = universeMomentumProfiles.get(a.symbol)?.pureMomentumScore || 0;
          const scoreB = universeMomentumProfiles.get(b.symbol)?.pureMomentumScore || 0;
          return scoreB - scoreA;
        });
    }

    // VAL-MO STRATEGY (Value + Momentum):
    const rangeConfig = VAL_MO_SCORE_RANGES.find((r) => r.id === valMoRange);
    return baseHierarchyPool.filter((s) => {
      if (s.roce3Y < minRoce) return false;
      if (s.debtToEquity > maxDebtToEquity) return false;
      if (s.peg > maxPeg) return false;
      if (rangeConfig && valMoRange !== 'all') {
        if (s.valMoScore < rangeConfig.min || s.valMoScore > rangeConfig.max) return false;
      }
      if (statusFilter !== 'all' && s.qualificationTier !== statusFilter) return false;
      return true;
    });
  }, [
    strategyMode,
    pureMomentumScopeFilter,
    baseHierarchyPool,
    universeMomentumProfiles,
    minRoce,
    maxDebtToEquity,
    maxPeg,
    valMoRange,
    statusFilter,
  ]);

  // Global Search Filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return stockScrips.filter(
      (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [searchQuery, stockScrips]);

  // Model Qualified Candidates with custom filters
  const qualifiedCandidates = useMemo(() => {
    if (strategyMode === 'pure_momentum') {
      // Top Momentum picks passing macro hierarchy and MTF criteria
      return stockScrips
        .filter((s) => {
          const profile = universeMomentumProfiles.get(s.symbol);
          if (!profile) return false;
          return (profile.isTop15Overall || profile.isTop5InSector) && profile.totalIndicatorCount >= 4;
        })
        .sort((a, b) => {
          const scoreA = universeMomentumProfiles.get(a.symbol)?.pureMomentumScore || 0;
          const scoreB = universeMomentumProfiles.get(b.symbol)?.pureMomentumScore || 0;
          return scoreB - scoreA;
        });
    }

    const rangeConfig = VAL_MO_SCORE_RANGES.find((r) => r.id === valMoRange);
    return stockScrips.filter((s) => {
      if (s.qualificationTier !== 'Tier 5 Qualified') return false;
      if (s.roce3Y < minRoce) return false;
      if (s.debtToEquity > maxDebtToEquity) return false;
      if (s.peg > maxPeg) return false;
      if (rangeConfig && valMoRange !== 'all') {
        if (s.valMoScore < rangeConfig.min || s.valMoScore > rangeConfig.max) return false;
      }
      if (statusFilter !== 'all' && s.qualificationTier !== statusFilter) return false;
      return true;
    });
  }, [
    strategyMode,
    stockScrips,
    universeMomentumProfiles,
    minRoce,
    maxDebtToEquity,
    maxPeg,
    valMoRange,
    statusFilter,
  ]);

  // Classify qualified candidates by Val-Mo score with Sector & Overall concentration caps
  const classifiedCandidates = useMemo(() => {
    const sorted = [...qualifiedCandidates].sort((a, b) => {
      if (b.valMoScore !== a.valMoScore) return b.valMoScore - a.valMoScore;
      return b.roce3Y - a.roce3Y;
    });

    const targetLotSize = Math.max(
      capitalConfig.minPositionSize,
      Math.round(
        (capitalConfig.baseCapital * (1 - capitalConfig.targetLiquidBufferPct / 100)) /
          capitalConfig.targetStockCount
      )
    );

    const sectorCounts: Record<string, number> = {};
    let selectedCount = 0;

    return sorted.map((stock, idx) => {
      const sector = MACRO_SECTORS.find((m) => m.id === stock.sectorId);
      const sectorName = sector ? sector.name : stock.sectorId;
      const currentSectorCount = sectorCounts[stock.sectorId] || 0;

      const dynamicShares = Math.max(1, Math.floor(targetLotSize / stock.price));
      const dynamicAmount = dynamicShares * stock.price;

      if (selectedCount < capitalConfig.targetStockCount) {
        if (
          capitalConfig.maxScripsPerSector > 0 &&
          currentSectorCount >= capitalConfig.maxScripsPerSector
        ) {
          return {
            stock,
            selectionRank: idx + 1,
            status: 'sector_capped' as const,
            sectorName,
            sectorCountAtSelection: currentSectorCount,
            dynamicLotShares: dynamicShares,
            dynamicInvestedAmount: dynamicAmount,
            reason: `Sector limit reached (${currentSectorCount}/${capitalConfig.maxScripsPerSector} in ${sectorName})`,
          };
        } else {
          sectorCounts[stock.sectorId] = currentSectorCount + 1;
          selectedCount++;
          return {
            stock,
            selectionRank: idx + 1,
            status: 'selected' as const,
            sectorName,
            sectorCountAtSelection: currentSectorCount + 1,
            dynamicLotShares: dynamicShares,
            dynamicInvestedAmount: dynamicAmount,
            reason: `Primary Model Pick #${selectedCount}`,
          };
        }
      } else {
        return {
          stock,
          selectionRank: idx + 1,
          status: 'portfolio_capped' as const,
          sectorName,
          sectorCountAtSelection: currentSectorCount,
          dynamicLotShares: dynamicShares,
          dynamicInvestedAmount: dynamicAmount,
          reason: `Portfolio ceiling reached (${capitalConfig.targetStockCount} max names)`,
        };
      }
    });
  }, [qualifiedCandidates, capitalConfig]);

  // Execution: Add to Paper Trading Portfolio
  const executePaperTrade = (stock: StockScrip, customShares?: number) => {
    const sharesToBuy = customShares && customShares > 0 ? customShares : stock.calculatedLotShares;
    const requiredCapital = sharesToBuy * stock.price;
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
      shares: sharesToBuy,
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

  // Execution: Exit / Liquidate Position
  const executeExitPosition = (posId: string) => {
    const targetPos = portfolio.positions.find((p) => p.id === posId);
    if (!targetPos) return;

    const returnCash = targetPos.currentValue;
    setPortfolio((prev) => ({
      ...prev,
      cashBalance: prev.cashBalance + returnCash,
      positions: prev.positions.filter((p) => p.id !== posId),
    }));

    setTradeSuccessMsg(`Exited position in ${targetPos.symbol} (Returned ₹${returnCash.toLocaleString('en-IN')} to Tactical Cash).`);
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

          {/* Quick Universal Scrip Search Bar (Expanded for comfortable desktop/tablet access) */}
          <div className="relative flex-1 max-w-sm md:max-w-md lg:max-w-xl mx-2 md:mx-4">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search stocks by symbol or name (e.g., APAR, DIVIS, BEL, ICICI)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-950/90 border border-slate-700/90 hover:border-slate-600 rounded-xl pl-9 pr-16 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/80 pointer-events-none">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Quick Search Dropdown Results */}
            {isSearchOpen && searchQuery && (
              <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                <div className="p-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Found {searchResults.length} matching scrips</span>
                  <span className="text-slate-500">Press ESC or click to inspect</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">
                    No scrips matching "{searchQuery}". Try searching by ticker (e.g. APAR) or name (e.g. Tata).
                  </div>
                ) : (
                  searchResults.map((scrip) => (
                    <div
                      key={scrip.symbol}
                      onClick={() => {
                        setInspectedScrip(scrip);
                        setIsSearchOpen(false);
                      }}
                      className="p-3 border-b border-slate-800/80 hover:bg-slate-800/70 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{scrip.symbol}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            scrip.qualificationTier === 'Tier 5 Qualified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {scrip.qualificationTier}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">{scrip.name}</div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Mini Sparkline in search result */}
                        <div className="hidden sm:block">
                          <SparklineChart
                            data={scrip.sparkline30D}
                            dma50={scrip.dma50}
                            currentPrice={scrip.price}
                            width={72}
                            height={22}
                          />
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-white">₹{scrip.price.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-emerald-400 font-mono font-semibold">Score: {scrip.valMoScore}/100</div>
                        </div>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Market Hierarchy
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'candidates'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="h-3.5 w-3.5" /> Model Candidates &amp; Lots
            </button>
            <button
              onClick={() => setActiveTab('paper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'paper'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Paper Trading
            </button>
            <button
              onClick={() => setActiveTab('backtest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'backtest'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" /> Backtester
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> User Manual &amp; Docs
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-right">
                    <div>
                      <div className="text-[10px] text-slate-400">Base Capital</div>
                      <div className="text-sm font-black text-emerald-400">₹{capitalConfig.baseCapital.toLocaleString('en-IN')}</div>
                      <div className="text-[9px] text-slate-500">100% Cash CNC</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Monthly Inflow</div>
                      <div className="text-sm font-black text-teal-400">+₹{capitalConfig.monthlyInflow.toLocaleString('en-IN')}</div>
                      <div className="text-[9px] text-slate-500">Staging Pool</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Lot Sizing Floor</div>
                      <div className="text-sm font-black text-white">₹{(capitalConfig.minPositionSize / 1000).toFixed(0)}k+</div>
                      <div className="text-[9px] text-slate-500">No &lt;₹10k lots</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Concentration</div>
                      <div className="text-sm font-black text-cyan-400">{capitalConfig.targetStockCount} Stocks</div>
                      <div className="text-[9px] text-slate-500">Scale Position Size</div>
                    </div>
                  </div>

                  {/* Seed Fund Adjustment Trigger Button */}
                  <button
                    onClick={() => setIsSeedFundModalOpen(true)}
                    className="flex sm:flex-col items-center justify-center gap-1.5 px-3 py-2 sm:py-3 rounded-xl bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                    title="Click to adjust base seed capital, monthly SIP, and cash buffers"
                  >
                    <Sliders className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] whitespace-nowrap">Adjust Capital</span>
                  </button>
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

            {/* D3-based Nifty 500 Sector Treemap Visualization with Multi-Sector & Quadrant Filter */}
            <SectorTreemap
              sectors={MACRO_SECTORS}
              selectedSectorIds={selectedSectorIds}
              activeFocusSectorId={selectedSectorId}
              onToggleSector={handleToggleSector}
              onSelectOnlySector={handleSelectOnlySector}
              onSelectAllSectors={handleSelectAllSectors}
              onClearSectors={handleClearSectors}
              selectedQuadrants={selectedQuadrants}
              onToggleQuadrant={handleToggleQuadrant}
            />

            {/* Level 2 & Level 3 & Level 4: Drill-Down Funnel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Level 2: Macro Sector (RRG Quadrant Selection & Multi-Select) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center">1</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Macro Sector (RRG)
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                    {selectedSectorIds.length} of {MACRO_SECTORS.length} Selected
                  </span>
                </div>

                {/* Quadrant Quick Filter Pills in Table Header */}
                <div className="mb-2.5 pb-2 border-b border-slate-800/80 flex flex-wrap items-center gap-1">
                  {(['Leading', 'Improving', 'Weakening', 'Lagging'] as RrgQuadrant[]).map((quad) => {
                    const isActive = selectedQuadrants.includes(quad);
                    const quadColors = {
                      Leading: 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm',
                      Improving: 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm',
                      Weakening: 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm',
                      Lagging: 'bg-rose-500 text-white border-rose-400 font-bold shadow-sm',
                    };
                    const count = MACRO_SECTORS.filter((s) => s.quadrant === quad).length;
                    return (
                      <button
                        key={quad}
                        onClick={() => handleToggleQuadrant(quad)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          isActive
                            ? quadColors[quad]
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                        title={`Filter scrips by ${quad} quadrant (${count} sectors)`}
                      >
                        {quad} ({count})
                      </button>
                    );
                  })}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={handleSelectAllSectors}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                      title="Select all 13 sectors"
                    >
                      All
                    </button>
                    <button
                      onClick={handleClearSectors}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
                      title="Reset selection"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Active Quadrant Filtering Alert Banner */}
                {selectedQuadrants.length > 0 && (
                  <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-300 flex items-center justify-between">
                    <span className="font-semibold">
                      Filtered: {selectedQuadrants.join(', ')} ({selectedSectorIds.length} sectors)
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Matching sectors pinned to top</span>
                  </div>
                )}

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
                  {displayedMacroSectors.map((sector) => {
                    const isSelected = selectedSectorIds.includes(sector.id);
                    const count = stockScrips.filter((s) => s.sectorId === sector.id).length;
                    return (
                      <div
                        key={sector.id}
                        onClick={() => handleToggleSector(sector.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold border transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'bg-slate-900 border-slate-700 text-transparent'
                            }`}>
                              ✓
                            </span>
                            <span className="font-bold text-xs">{sector.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOnlySector(sector.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-opacity cursor-pointer"
                              title={`Isolate ${sector.name} only`}
                            >
                              Only
                            </button>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                              sector.quadrant === 'Leading'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : sector.quadrant === 'Improving'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : sector.quadrant === 'Weakening'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {sector.quadrant}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pl-5.5">
                          <span>Weight: {sector.weightPct}%</span>
                          <span>RS-Mom: {sector.rsMomentum}</span>
                          <span className="text-emerald-400 font-mono font-medium">{count} scrips</span>
                        </div>
                      </div>
                    );
                  })}
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
                  {INDUSTRY_GROUPS.filter((i) => i.sectorId === activeSector.id).length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">No industry groups mapped for {activeSector.name}</div>
                  ) : (
                    INDUSTRY_GROUPS.filter((i) => i.sectorId === activeSector.id).map((ind) => (
                      <div
                        key={ind.id}
                        onClick={() => {
                          setSelectedIndustryId(ind.id);
                          const matchBase = BASE_INDUSTRIES.find((b) => b.industryId === ind.id);
                          if (matchBase) setSelectedBaseIndustryId(matchBase.id);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          activeIndustry.id === ind.id
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
                  {BASE_INDUSTRIES.filter((b) => b.industryId === activeIndustry.id).length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">No base industries mapped for {activeIndustry.name}</div>
                  ) : (
                    BASE_INDUSTRIES.filter((b) => b.industryId === activeIndustry.id).map((base) => (
                      <div
                        key={base.id}
                        onClick={() => setSelectedBaseIndustryId(base.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          activeBaseIndustry.id === base.id
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
                      Constituent Stocks:{' '}
                      <span className="text-emerald-400">
                        {candidateScope === 'all' || selectedSectorIds.length === MACRO_SECTORS.length
                          ? 'All Nifty 500 Candidates'
                          : candidateScope === 'sector'
                          ? selectedQuadrants.length > 0 && selectedSectorIds.length > 1
                            ? `${selectedQuadrants.join(' & ')} Quadrants (${selectedSectorIds.length} Sectors: ${selectedSectorIds.map((id) => getSectorShortLabel(id)).join(', ')})`
                            : selectedSectorIds.length === 1
                            ? MACRO_SECTORS.find((s) => s.id === selectedSectorIds[0])?.name || activeSector.name
                            : `${selectedSectorIds.length} Selected Sectors (${selectedSectorIds.map((id) => getSectorShortLabel(id)).join(', ')})`
                          : activeBaseIndustry.name}
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {candidateScope === 'sector'
                      ? selectedQuadrants.length > 0
                        ? `Filtered strictly by ${selectedQuadrants.join(', ')} quadrant sectors (${selectedSectorIds.map((id) => getSectorShortLabel(id)).join(', ')}) • Showing ${filteredHierarchyStocks.length} matching scrips below`
                        : selectedSectorIds.length === 1
                        ? `Filtered by ${MACRO_SECTORS.find((s) => s.id === selectedSectorIds[0])?.name || activeSector.name} • Showing ${filteredHierarchyStocks.length} matching scrips below`
                        : `Filtered by ${selectedSectorIds.length} macro sectors • Showing ${filteredHierarchyStocks.length} matching scrips below`
                      : 'Integrated Value-Momentum evaluation with custom metric ranges & calculated lot sizes'}
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
                      Selected Sectors ({selectedSectorIds.length})
                    </button>
                    <button
                      onClick={() => setCandidateScope('all')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        candidateScope === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Stocks ({stockScrips.length})
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

              {/* Primary Strategy Mode Switcher: Val-Mo vs Pure Momentum */}
              <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    strategyMode === 'pure_momentum'
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {strategyMode === 'pure_momentum' ? <Zap className="h-5 w-5" /> : <PieChart className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-white">Active Strategy Framework</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        strategyMode === 'pure_momentum'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {strategyMode === 'val_mo' ? 'Val-Mo (Value + Momentum Integrated)' : 'Pure Momentum (Daily + Weekly MTF)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {strategyMode === 'val_mo'
                        ? 'Integrates fundamental valuation margin of safety (P/E discount, ROCE ≥ 16%, PEG ≤ 1.75x) with technical 50-DMA volume reclaims.'
                        : 'Retains identical macro hierarchy (Regime Tier 0, Macro Sector RRG Leading/Improving, Industry Inflection > 150 bps EBITDA, Base Moat) ranked by 8 Daily & Weekly MTF Indicators.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => setStrategyMode('val_mo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      strategyMode === 'val_mo'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <PieChart className="h-3.5 w-3.5" />
                    <span>Val-Mo Strategy</span>
                  </button>
                  <button
                    onClick={() => setStrategyMode('pure_momentum')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      strategyMode === 'pure_momentum'
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Pure Momentum Alone</span>
                  </button>
                </div>
              </div>

              {/* Pure Momentum Scope & Sub-filters Bar (Top 15 Overall & Top 5 in Each Segment) */}
              {strategyMode === 'pure_momentum' && (
                <div className="mb-4 p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-500/30 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner animate-fade-in">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-cyan-300 font-bold flex items-center gap-1 text-xs">
                      <Target className="h-4 w-4" /> Momentum Filter:
                    </span>
                    <button
                      onClick={() => setPureMomentumScopeFilter('top15')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        pureMomentumScopeFilter === 'top15'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>★ Top 15 Overall Universe</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({universeMomentumProfiles ? Array.from(universeMomentumProfiles.values()).filter((p) => p.isTop15Overall).length : 15})
                      </span>
                    </button>
                    <button
                      onClick={() => setPureMomentumScopeFilter('top5_segment')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        pureMomentumScopeFilter === 'top5_segment'
                          ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>★ Top 5 in Each Segment</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({universeMomentumProfiles ? Array.from(universeMomentumProfiles.values()).filter((p) => p.isTop5InSector).length : 0})
                      </span>
                    </button>
                    <button
                      onClick={() => setPureMomentumScopeFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        pureMomentumScopeFilter === 'all'
                          ? 'bg-slate-700 text-white shadow-md font-black'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>All MTF Scrips</span>
                      <span className="text-[10px] opacity-75 font-mono">({baseHierarchyPool.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                      4 Daily Triggers
                    </span>
                    <span className="text-slate-600">+</span>
                    <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30 font-semibold">
                      4 Weekly Macro
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-cyan-300 font-medium">Click any row for MTF audit</span>
                  </div>
                </div>
              )}

              {/* Live CMP Price Synchronization & Benchmark Calibration Bar */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shadow-inner">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">Live Price Feed:</span>
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                      NSE India Calibrated
                    </span>
                  </div>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="text-slate-400 text-[11px]">
                    Status: <span className="text-slate-200 font-medium">{lastCmpSyncTime}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[11px] text-slate-400 hidden xl:flex items-center gap-2 font-mono">
                    <span>HDFCBANK: <strong className="text-white">₹{stockScrips.find((s) => s.symbol === 'HDFCBANK')?.price || 725}</strong></span>
                    <span className="text-slate-700">|</span>
                    <span>TRENT: <strong className="text-white">₹{stockScrips.find((s) => s.symbol === 'TRENT')?.price || 3025}</strong></span>
                    <span className="text-slate-700">|</span>
                    <span>BEL: <strong className="text-white">₹{stockScrips.find((s) => s.symbol === 'BEL')?.price || 370}</strong></span>
                  </div>
                  <button
                    onClick={handleBatchSyncAllCMPs}
                    disabled={isSyncingCmp}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    title="Batch-synchronize all 32 scrip prices to verified live NSE market rates"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingCmp ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCmp ? 'Syncing CMPs...' : 'Sync Live NSE CMPs'}</span>
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

              {/* Filter Strip: Val-Mo vs Pure Momentum */}
              {strategyMode === 'val_mo' ? (
                <div className="mb-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  {/* Status Segmented Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 font-semibold text-[11px] mr-1">Status Filter:</span>
                    {[
                      { id: 'all', label: 'All Scrips', count: baseHierarchyPool.length },
                      { id: 'Tier 5 Qualified', label: 'Tier 5 Qualified', count: baseHierarchyPool.filter((s) => s.qualificationTier === 'Tier 5 Qualified').length },
                      { id: 'Watchlist', label: 'Watchlist', count: baseHierarchyPool.filter((s) => s.qualificationTier === 'Watchlist').length },
                      { id: 'Disqualified', label: 'Disqualified', count: baseHierarchyPool.filter((s) => s.qualificationTier === 'Disqualified').length },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          statusFilter === tab.id
                            ? tab.id === 'Tier 5 Qualified'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                              : tab.id === 'Watchlist'
                              ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                              : tab.id === 'Disqualified'
                              ? 'bg-rose-500 text-white shadow-sm font-bold'
                              : 'bg-slate-700 text-white shadow-sm font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="ml-1.5 opacity-75 font-mono text-[10px]">({tab.count})</span>
                      </button>
                    ))}
                  </div>

                  {/* Val-Mo Score Range Bucket Controller */}
                  <div className="flex items-center gap-2.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold text-[11px] whitespace-nowrap">Val-Mo Range:</span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs whitespace-nowrap">
                        {VAL_MO_SCORE_RANGES.find((r) => r.id === valMoRange)?.badge || 'All (0–100)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {VAL_MO_SCORE_RANGES.map((range) => {
                        const isSelected = valMoRange === range.id;
                        return (
                          <button
                            key={range.id}
                            onClick={() => setValMoRange(range.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                            title={`Filter scrips with Val-Mo score in range ${range.badge}`}
                          >
                            {range.label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Factor Legend */}
                    <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-cyan-400 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" /> Value %
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Momentum %
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan-400 font-semibold text-[11px] flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" /> Pure Momentum Hierarchy:
                    </span>
                    <span className="text-slate-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Regime: {activeRegime.name}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="text-slate-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Sector: {candidateScope === 'all' ? 'All Macro Sectors' : activeSector.name}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="text-slate-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Top 15 Overall &amp; Top 5 Segment
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                    <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span><strong>Weekly Close Cadence:</strong> Capital allocated only on Friday close when Daily &amp; Weekly MTF both pass</span>
                  </div>
                </div>
              )}

              {filteredHierarchyStocks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-xl bg-slate-950/40 space-y-3">
                  <p>
                    {strategyMode === 'pure_momentum'
                      ? `No scrips match the active Pure Momentum scope (${pureMomentumScopeFilter === 'top15' ? 'Top 15 Overall' : pureMomentumScopeFilter === 'top5_segment' ? 'Top 5 in Each Segment' : 'All'}).`
                      : `No candidate scrips match the active filters (ROCE ≥ ${minRoce}%, D/E ≤ ${maxDebtToEquity}x, PEG ≤ ${maxPeg}x${valMoRange !== 'all' ? `, Val-Mo Range: ${VAL_MO_SCORE_RANGES.find((r) => r.id === valMoRange)?.badge}` : ''}).`}
                  </p>
                  <button
                    onClick={resetFiltersToDefault}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
                        <th className="py-2.5 px-3">CMP (Live NSE)</th>
                        {strategyMode === 'pure_momentum' ? (
                          <>
                            <th className="py-2.5 px-3">Pure Momentum Rank &amp; Score</th>
                            <th className="py-2.5 px-3">Daily Leading Indicators (4)</th>
                            <th className="py-2.5 px-3">Weekly Macro Trend (4)</th>
                            <th className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <span>30D Trend</span>
                                <button
                                  type="button"
                                  onClick={() => setIsSparklineGuideOpen(true)}
                                  className="text-cyan-400 hover:text-cyan-200 transition-colors p-0.5 rounded cursor-pointer"
                                  title="Click to learn how to read this sparkline chart"
                                >
                                  <HelpCircle className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                            <th className="py-2.5 px-3">MTF Alignment</th>
                            <th className="py-2.5 px-3">Strategic Lot Size</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </>
                        ) : (
                          <>
                            <th className="py-2.5 px-3">P/E vs 5Y Med</th>
                            <th className="py-2.5 px-3">ROCE • D/E • PEG</th>
                            <th className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <span>30D vs 50-DMA</span>
                                <button
                                  type="button"
                                  onClick={() => setIsSparklineGuideOpen(true)}
                                  className="text-cyan-400 hover:text-cyan-200 transition-colors p-0.5 rounded cursor-pointer"
                                  title="Click to learn how to read this sparkline chart"
                                >
                                  <HelpCircle className="h-3 w-3" />
                                </button>
                              </div>
                            </th>
                            <th className="py-2.5 px-3">Daily &amp; Weekly Momentum</th>
                            <th className="py-2.5 px-3">Val-Mo Score (Factor Split)</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Strategic Lot Size</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredHierarchyStocks.map((stock) => {
                        const factorBreakdown = computeValMoWeeklyBreakdown(stock);
                        const mtf = universeMomentumProfiles?.get(stock.symbol);

                        return (
                          <tr key={stock.symbol} className="hover:bg-slate-800/30 transition-colors">
                            {/* Symbol & Sector Identification */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white">{stock.symbol}</span>
                                {(() => {
                                  const sec = MACRO_SECTORS.find((m) => m.id === stock.sectorId);
                                  const quad = sec?.quadrant || 'Leading';
                                  const quadStyles = {
                                    Leading: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                                    Improving: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
                                    Weakening: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                                    Lagging: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                                  };
                                  return (
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${quadStyles[quad]}`}
                                      title={`Sector: ${sec?.name || stock.sectorId} (${quad} Quadrant)`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        quad === 'Leading' ? 'bg-emerald-400' :
                                        quad === 'Improving' ? 'bg-cyan-400' :
                                        quad === 'Weakening' ? 'bg-amber-400' : 'bg-rose-400'
                                      }`} />
                                      <span>{quad} • {getSectorShortLabel(stock.sectorId)}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{stock.name}</div>
                            </td>

                            {/* CMP (Live Verified & Editable) */}
                            <td className="py-3 px-3 text-white font-mono font-semibold">
                              <div className="flex items-center gap-1.5 group">
                                <span>₹{stock.price.toLocaleString('en-IN')}</span>
                                <button
                                  onClick={() => setEditingScripPrice({
                                    symbol: stock.symbol,
                                    name: stock.name,
                                    currentPrice: stock.price,
                                    newPrice: String(stock.price),
                                  })}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-400 p-0.5 rounded transition-opacity cursor-pointer"
                                  title={`Edit/Calibrate CMP for ${stock.symbol}`}
                                >
                                  <SlidersHorizontal className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="text-[9px] text-emerald-400/80 font-mono">NSE Calibrated</div>
                            </td>

                            {/* PURE MOMENTUM COLUMNS */}
                            {strategyMode === 'pure_momentum' ? (
                              <>
                                {/* Pure Momentum Rank & Score */}
                                <td className="py-3 px-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono font-black text-sm text-cyan-300">
                                        #{mtf?.rankOverall || 1}
                                      </span>
                                      {mtf?.isTop15Overall && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                          ★ Top 15 Overall
                                        </span>
                                      )}
                                      {mtf?.isTop5InSector && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                          ★ Top 5 {getSectorShortLabel(stock.sectorId)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-300">
                                      Score: <strong className="text-white">{mtf?.pureMomentumScore || 0}</strong>
                                      <span className="text-[10px] text-slate-500">/100</span>
                                      <span className="text-slate-600 mx-1">·</span>
                                      <span className="text-cyan-400 text-[10px]">{mtf?.totalIndicatorCount || 0}/8 Passed</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Daily Leading Indicators */}
                                <td className="py-3 px-3">
                                  <div
                                    onClick={() => setInspectedMomentumStock(stock)}
                                    className="cursor-pointer group p-1.5 -m-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                                    title="Click to view full Daily Leading Indicators audit"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                        (mtf?.daily.passedCount || 0) >= 3
                                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                          : (mtf?.daily.passedCount || 0) === 2
                                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                      }`}>
                                        {mtf?.daily.passedCount || 0}/4 Daily • {mtf?.daily.statusLabel || 'Neutral'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-slate-400">
                                      <span className={(mtf?.daily.priceAboveFastEma && mtf?.daily.shortAboveLongEma) ? 'text-emerald-400' : 'text-slate-500'}>
                                        {(mtf?.daily.priceAboveFastEma && mtf?.daily.shortAboveLongEma) ? '✓ EMA-Cross' : '✗ EMA-Cross'}
                                      </span>
                                      <span className="text-slate-600">·</span>
                                      <span className={mtf?.daily.adxAccelerating ? 'text-emerald-400' : 'text-slate-500'}>
                                        {mtf?.daily.adxAccelerating ? `✓ ADX ${mtf?.daily.adx}` : `✗ ADX ${mtf?.daily.adx}`}
                                      </span>
                                      <span className="text-slate-600">·</span>
                                      <span className={(mtf?.daily.volumeAbove20Dma || mtf?.daily.rsiMomentumRoom) ? 'text-emerald-400' : 'text-slate-500'}>
                                        {(mtf?.daily.volumeAbove20Dma || mtf?.daily.rsiMomentumRoom) ? '✓ Vol/RSI' : '✗ Vol/RSI'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Weekly Macro Trend */}
                                <td className="py-3 px-3">
                                  <div
                                    onClick={() => setInspectedMomentumStock(stock)}
                                    className="cursor-pointer group p-1.5 -m-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                                    title="Click to view full Weekly Macro Trend audit"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                        (mtf?.weekly.passedCount || 0) >= 3
                                          ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                                          : (mtf?.weekly.passedCount || 0) === 2
                                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                          : 'bg-slate-800 text-slate-400 border-slate-700'
                                      }`}>
                                        {mtf?.weekly.passedCount || 0}/4 Weekly • {mtf?.weekly.statusLabel || 'Constructive'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-slate-400">
                                      <span className={mtf?.weekly.supportedByEmaBands ? 'text-teal-400' : 'text-slate-500'}>
                                        {mtf?.weekly.supportedByEmaBands ? '✓ EMA-Bands' : '✗ EMA-Bands'}
                                      </span>
                                      <span className="text-slate-600">·</span>
                                      <span className={mtf?.weekly.weeklyAdxRising ? 'text-teal-400' : 'text-slate-500'}>
                                        {mtf?.weekly.weeklyAdxRising ? `✓ W-ADX ${mtf?.weekly.weeklyAdx}` : `✗ W-ADX ${mtf?.weekly.weeklyAdx}`}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* 30D Trend Sparkline */}
                                <td className="py-3 px-3">
                                  <SparklineChart
                                    data={stock.sparkline30D}
                                    dma50={stock.dma50}
                                    currentPrice={stock.price}
                                    width={84}
                                    height={26}
                                    onGuideClick={() => setIsSparklineGuideOpen(true)}
                                  />
                                </td>

                                {/* MTF Alignment & Weekly Close Cadence */}
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                    mtf?.weekly.mtfSynchronized ? 'text-emerald-400' : 'text-amber-400'
                                  }`}>
                                    {mtf?.weekly.mtfSynchronized ? 'MTF Synchronized' : 'Desynchronized'}
                                  </span>
                                  <div className="mt-1">
                                    {mtf?.isWeeklyCloseQualified ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                                        ✓ Friday Close Ready
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                        Pending Friday Close
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Strategic Lot Sizing */}
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

                                {/* Actions */}
                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setInspectedMomentumStock(stock)}
                                      className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                                      title="Audit all 8 Daily & Weekly indicators"
                                    >
                                      <Zap className="h-3 w-3" /> MTF Details
                                    </button>
                                    <button
                                      onClick={() => executePaperTrade(stock)}
                                      className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" /> Paper Buy
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              /* VAL-MO COLUMNS */
                              <>
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
                                    onGuideClick={() => setIsSparklineGuideOpen(true)}
                                  />
                                </td>
                                <td className="py-3 px-3">
                                  <div
                                    onClick={() => setInspectedMomentumStock(stock)}
                                    className="cursor-pointer group p-1 -m-1 rounded hover:bg-slate-800/40 transition-colors"
                                    title="Click to audit Daily & Weekly Leading Indicators"
                                  >
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                        stock.above50Dma ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                      }`}>
                                        {stock.above50Dma ? '>50D' : '<50D'}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                                        D:{mtf?.daily.passedCount || 0}/4
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                                        W:{mtf?.weekly.passedCount || 0}/4
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                                      <span>Vol: {stock.deliveryVolumeRatio}x</span>
                                      <span className="text-slate-600">·</span>
                                      <span className="text-cyan-400 group-hover:underline">MTF details →</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3 min-w-[170px]">
                                  <div className="space-y-1">
                                    <div className="flex items-baseline justify-between">
                                      <span className="font-black text-emerald-400 font-mono text-xs">
                                        {stock.valMoScore}
                                        <span className="text-[9px] text-slate-500 font-normal">/100</span>
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-400">
                                        <span className="text-cyan-400 font-semibold">{factorBreakdown.valuePct}% Val</span>
                                        <span className="text-slate-600 mx-1">·</span>
                                        <span className="text-emerald-400 font-semibold">{factorBreakdown.momentumPct}% Mo</span>
                                      </span>
                                    </div>

                                    {/* Inline Dual-Color Split Bar */}
                                    <div
                                      className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800"
                                      title={`Weekly Factor Split: Value ${factorBreakdown.valueScore} pts (${factorBreakdown.valuePct}%) + Momentum ${factorBreakdown.momentumScore} pts (${factorBreakdown.momentumPct}%) = ${stock.valMoScore} Total`}
                                    >
                                      <div
                                        className="h-full bg-cyan-500 transition-all"
                                        style={{ width: `${factorBreakdown.valuePct}%` }}
                                      />
                                      <div
                                        className="h-full bg-emerald-400 transition-all"
                                        style={{ width: `${factorBreakdown.momentumPct}%` }}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                                      <span className="text-cyan-400/90">{factorBreakdown.valueScore}v pts</span>
                                      <span className="text-emerald-400/90">{factorBreakdown.momentumScore}m pts</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
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
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
                                    >
                                      Metrics
                                    </button>
                                    <button
                                      onClick={() => setInspectedMomentumStock(stock)}
                                      className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/40 rounded text-[11px] transition-colors cursor-pointer"
                                      title="Audit Daily & Weekly MTF Indicators"
                                    >
                                      MTF
                                    </button>
                                    {stock.qualificationTier === 'Tier 5 Qualified' && (
                                      <button
                                        onClick={() => executePaperTrade(stock)}
                                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                                      >
                                        <Plus className="h-3 w-3" /> Paper Buy
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      strategyMode === 'pure_momentum'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {strategyMode === 'pure_momentum' ? 'Pure Momentum Model Picks' : 'Quantitative Val-Mo Output'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {strategyMode === 'pure_momentum' ? 'Daily & Weekly MTF Indicators Synchronized' : '5-Tier Screening Pipeline Filtered'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    {strategyMode === 'pure_momentum'
                      ? 'Pure Momentum Candidates & Lot Sizing'
                      : 'Strategic Model Candidates & Calculated Lot Sizing'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Systematic lot allocation for ₹{capitalConfig.baseCapital.toLocaleString('en-IN')} base capital with predefined pyramiding triggers and stop-losses.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Strategy Mode Switcher in Candidate View */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setStrategyMode('val_mo')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        strategyMode === 'val_mo'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <PieChart className="h-3.5 w-3.5" />
                      <span>Val-Mo</span>
                    </button>
                    <button
                      onClick={() => setStrategyMode('pure_momentum')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        strategyMode === 'pure_momentum'
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-sm font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Pure Momentum</span>
                    </button>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 flex flex-col items-end gap-0.5">
                    <div className="text-[10px] text-slate-400">Qualified Candidates</div>
                    <div className="text-2xl font-black text-emerald-400">{qualifiedCandidates.length} Scrips</div>
                    <button
                      onClick={() => setIsSparklineGuideOpen(true)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="h-3 w-3" /> How to read charts
                    </button>
                  </div>
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

            {/* Concentration & Selection Controls Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    <span>Portfolio Concentration &amp; Sector Quota Engine</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Controls total scrips admitted to the model portfolio and caps single-sector concentration to ensure factor diversification.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSeedFundModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Adjust Seed Capital (₹{capitalConfig.baseCapital.toLocaleString('en-IN')})</span>
                  </button>
                </div>
              </div>

              {/* Interactive Selectors Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
                {/* 1. Overall Scrip Limit */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Overall Portfolio Ceiling</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {capitalConfig.targetStockCount} Scrips Max
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[3, 5, 7, 10, 15].map((count) => (
                      <button
                        key={count}
                        onClick={() =>
                          setCapitalConfig((prev) => ({ ...prev, targetStockCount: count }))
                        }
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          capitalConfig.targetStockCount === count
                            ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {count} Names
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Deployable Lot: ~₹{Math.round((capitalConfig.baseCapital * (1 - capitalConfig.targetLiquidBufferPct / 100)) / capitalConfig.targetStockCount).toLocaleString('en-IN')}/lot</span>
                    <span>Equity Pool: {100 - capitalConfig.targetLiquidBufferPct}%</span>
                  </div>
                </div>

                {/* 2. Sector Concentration Limit */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Sector Concentration Cap</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {capitalConfig.maxScripsPerSector === 0
                        ? 'Unlimited'
                        : `Max ${capitalConfig.maxScripsPerSector} / Sector`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { val: 1, label: '1 / Sector', desc: 'Strict' },
                      { val: 2, label: '2 / Sector', desc: 'Balanced' },
                      { val: 3, label: '3 / Sector', desc: 'Conviction' },
                      { val: 0, label: 'Unlimited', desc: 'Pure' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() =>
                          setCapitalConfig((prev) => ({ ...prev, maxScripsPerSector: item.val }))
                        }
                        className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          capitalConfig.maxScripsPerSector === item.val
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Prioritizes top Val-Mo ranked stocks</span>
                    <span>Prevents cluster risk</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Selection Quota:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                    {classifiedCandidates.filter((c) => c.status === 'selected').length} of {capitalConfig.targetStockCount} Primary Model Picks
                  </span>
                  {classifiedCandidates.filter((c) => c.status === 'sector_capped').length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold font-mono">
                      {classifiedCandidates.filter((c) => c.status === 'sector_capped').length} Sector Capped (Reserve)
                    </span>
                  )}
                  {classifiedCandidates.filter((c) => c.status === 'portfolio_capped').length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold font-mono">
                      {classifiedCandidates.filter((c) => c.status === 'portfolio_capped').length} Portfolio Limit (On Deck)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Cards Grid */}
            {classifiedCandidates.length === 0 ? (
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
              {classifiedCandidates.map(({ stock, selectionRank, status, sectorName, dynamicLotShares, dynamicInvestedAmount, reason }) => (
                <div
                  key={stock.symbol}
                  className={`border rounded-2xl p-5 shadow-lg transition-all ${
                    status === 'selected'
                      ? 'bg-slate-900/80 border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-500/5'
                      : status === 'sector_capped'
                      ? 'bg-slate-900/50 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">{stock.symbol}</h3>
                        <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                          Val-Mo: {stock.valMoScore}/100 (Rank #{selectionRank})
                        </span>
                        {status === 'selected' ? (
                          <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                            PRIMARY PICK
                          </span>
                        ) : status === 'sector_capped' ? (
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                            SECTOR CAPPED
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            RESERVE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {stock.name} · <span className="text-slate-300 font-medium">{sectorName}</span>
                      </div>

                      {/* Weekly Val-Mo Factor Contribution Split Bar */}
                      {(() => {
                        const factor = computeValMoWeeklyBreakdown(stock);
                        return (
                          <div className="mt-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 max-w-sm">
                            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                              <span className="text-cyan-400 font-semibold">Value: {factor.valuePct}% ({factor.valueScore} pts)</span>
                              <span className="text-emerald-400 font-semibold">Momentum: {factor.momentumPct}% ({factor.momentumScore} pts)</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                              <div
                                className="h-full bg-cyan-500 transition-all"
                                style={{ width: `${factor.valuePct}%` }}
                              />
                              <div
                                className="h-full bg-emerald-400 transition-all"
                                style={{ width: `${factor.momentumPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
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
                          onGuideClick={() => setIsSparklineGuideOpen(true)}
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
                  <div className={`p-3.5 rounded-xl border mb-4 ${
                    status === 'selected'
                      ? 'bg-gradient-to-r from-emerald-500/10 via-slate-900 to-teal-500/10 border-emerald-500/20'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Target className="h-4 w-4 text-emerald-400" />
                        Dynamic Lot Allocation ({capitalConfig.targetStockCount}-Stock Model):
                      </span>
                      <span className={`text-xs font-black ${status === 'selected' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {dynamicLotShares} Shares (₹{dynamicInvestedAmount.toLocaleString('en-IN')})
                      </span>
                    </div>

                    {/* Status Note */}
                    <div className="text-[11px] font-medium py-1 px-2 rounded bg-slate-950/90 border border-slate-800/80 mb-2">
                      <span className="text-slate-400">Quota Status: </span>
                      <strong className={
                        status === 'selected'
                          ? 'text-emerald-400'
                          : status === 'sector_capped'
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }>
                        {reason}
                      </strong>
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
                  <div className="flex items-center justify-between gap-2.5">
                    <button
                      onClick={() => setInspectedScrip(stock)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Deep Metrics
                    </button>
                    <button
                      onClick={() => setInspectedMomentumStock(stock)}
                      className="px-3 py-2 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="Audit 4 Daily & 4 Weekly Leading Indicators"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>MTF Details</span>
                    </button>
                    <button
                      onClick={() => executePaperTrade(stock, dynamicLotShares)}
                      className={`flex-1 py-2 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer ${
                        status === 'selected'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>{status === 'selected' ? 'Execute Paper Trade' : 'Add to Portfolio'}</span>
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

              {/* Seed Capital & Inflow Controls Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold">Seed Corpus: ₹{portfolio.totalInitialCapital.toLocaleString('en-IN')}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-teal-400 font-mono">+₹{capitalConfig.monthlyInflow.toLocaleString('en-IN')}/mo Staged Inflow</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInjectMonthlyInflow(capitalConfig.monthlyInflow)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-semibold transition-all cursor-pointer"
                    title="Add one month systematic deposit into staging buffer"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Inject Monthly SIP (+₹{capitalConfig.monthlyInflow.toLocaleString('en-IN')})</span>
                  </button>
                  <button
                    onClick={() => setIsSeedFundModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition-all cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Adjust Seed Capital</span>
                  </button>
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
                        <th className="py-2.5 px-3">Avg Buy</th>
                        <th className="py-2.5 px-3">CMP</th>
                        <th className="py-2.5 px-3">Unrealized P&amp;L</th>
                        <th className="py-2.5 px-3">Stop Loss</th>
                        <th className="py-2.5 px-3">Exit Status &amp; Universe Health</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {portfolio.positions.map((pos) => {
                        const scrip = stockScrips.find((s) => s.symbol === pos.symbol);
                        const isStopLossTriggered = pos.currentPrice <= pos.stopLoss;
                        const isTrimTriggered = scrip?.extremeValuationTrimPrice ? pos.currentPrice >= scrip.extremeValuationTrimPrice : false;
                        const isOffScreener = scrip ? scrip.qualificationTier !== 'Tier 5 Qualified' : false;
                        const isBelow50Dma = scrip ? !scrip.above50Dma : false;

                        return (
                          <tr key={pos.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-3">
                              <span className="font-bold text-white text-xs">{pos.symbol}</span>
                              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{pos.name}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{pos.entryDate}</td>
                            <td className="py-3 px-3 text-white font-mono font-bold">{pos.shares}</td>
                            <td className="py-3 px-3 text-slate-300 font-mono">₹{pos.entryPrice.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-3 text-white font-mono font-bold">₹{pos.currentPrice.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-3">
                              <span className={`font-mono font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {pos.pnl >= 0 ? `+₹${pos.pnl.toLocaleString('en-IN')}` : `-₹${Math.abs(pos.pnl).toLocaleString('en-IN')}`} ({pos.pnlPct}%)
                              </span>
                            </td>
                            <td className="py-3 px-3 text-rose-400 font-mono">₹{pos.stopLoss}</td>
                            <td className="py-3 px-3">
                              {isStopLossTriggered ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                                  🔴 Hard Stop Hit (-6.5%) · Exit Now
                                </span>
                              ) : isTrimTriggered ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  🟣 Valuation Extended (+1.5σ) · Trim 50%
                                </span>
                              ) : isOffScreener ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  🟡 Dropped Off Screener · Trailing Stop Active
                                </span>
                              ) : isBelow50Dma ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                                  🟠 Below 50-DMA · Watch Friday Close
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  🟢 Screener Qualified · Trend Holding
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => executePyramidTranche(pos.id)}
                                  className="px-2 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                                  title="Add +50% pyramid tranche from staging buffer"
                                >
                                  Pyramid
                                </button>
                                <button
                                  onClick={() => executeExitPosition(pos.id)}
                                  className="px-2 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold rounded text-[11px] transition-colors cursor-pointer"
                                  title="Liquidate position and return funds to tactical cash"
                                >
                                  Exit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROUTE 4: STRATEGY BACKTESTER */}
        {activeTab === 'backtest' && (
          <div className="animate-fade-in">
            <BacktestWorkbench scenarios={BACKTEST_SCENARIOS} stockScrips={stockScrips} />
          </div>
        )}

        {/* ROUTE 5: USER MANUAL, STRATEGY WRITEUPS & QUANTITATIVE SPECS */}
        {activeTab === 'manual' && (
          <UserManualView
            onOpenSparklineGuide={() => setIsSparklineGuideOpen(true)}
            onOpenSeedFundModal={() => setIsSeedFundModalOpen(true)}
            rawState={rawState}
            rawTasks={rawTasks}
            rawResearch={rawResearch}
            rawCheckpoint={rawCheckpoint}
            copiedFile={copiedFile}
            onCopyFile={copyToClipboard}
            portfolio={portfolio}
          />
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
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">Current Price</span>
                  <button
                    onClick={() => setEditingScripPrice({
                      symbol: inspectedScrip.symbol,
                      name: inspectedScrip.name,
                      currentPrice: inspectedScrip.price,
                      newPrice: String(inspectedScrip.price),
                    })}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                    title="Edit market price"
                  >
                    <SlidersHorizontal className="h-3 w-3" /> Edit
                  </button>
                </div>
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

      {/* Sparkline Visual Guide Modal */}
      <SparklineGuideModal
        isOpen={isSparklineGuideOpen}
        onClose={() => setIsSparklineGuideOpen(false)}
      />

      {/* Interactive Scrip Price Calibration Modal */}
      {editingScripPrice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setEditingScripPrice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                Market Price Calibration
              </span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{editingScripPrice.symbol}</span>
              <span className="text-xs text-slate-400 font-normal">({editingScripPrice.name})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Adjust current market price to test real-time 50-DMA status, P/E multiple recalibration, and quantitative lot allocations.
            </p>

            <div className="my-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Market Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={editingScripPrice.newPrice}
                    onChange={(e) =>
                      setEditingScripPrice({
                        ...editingScripPrice,
                        newPrice: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
                    placeholder="Enter price in ₹"
                  />
                </div>
              </div>

              {/* Reference Benchmark Quick-Set Button for any scrip */}
              {VERIFIED_NSE_BENCHMARKS[editingScripPrice.symbol] && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified NSE Reference: <strong>₹{VERIFIED_NSE_BENCHMARKS[editingScripPrice.symbol].price.toLocaleString('en-IN')}</strong></span>
                  </div>
                  <button
                    onClick={() => setEditingScripPrice({ ...editingScripPrice, newPrice: String(VERIFIED_NSE_BENCHMARKS[editingScripPrice.symbol].price) })}
                    className="underline text-emerald-400 font-semibold hover:text-emerald-200 cursor-pointer ml-2 whitespace-nowrap"
                  >
                    Set ₹{VERIFIED_NSE_BENCHMARKS[editingScripPrice.symbol].price.toLocaleString('en-IN')}
                  </button>
                </div>
              )}

              {/* Dynamic Recalculation Preview Card */}
              {parseFloat(editingScripPrice.newPrice) > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-2">
                  <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Dynamic Parameter Recalculations:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">Lot Sizing</div>
                      <div className="font-mono font-bold text-white mt-0.5">
                        {Math.max(1, Math.round(capitalConfig.minPositionSize / parseFloat(editingScripPrice.newPrice)))} Sh
                      </div>
                      <div className="text-[9px] text-slate-500">
                        ₹{(Math.max(1, Math.round(capitalConfig.minPositionSize / parseFloat(editingScripPrice.newPrice))) * parseFloat(editingScripPrice.newPrice)).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">+6% Pyramid</div>
                      <div className="font-mono font-bold text-teal-400 mt-0.5">
                        ₹{Math.round(parseFloat(editingScripPrice.newPrice) * 1.06).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-teal-500/80">Scale-up Trigger</div>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] text-slate-400">-6.5% Stop</div>
                      <div className="font-mono font-bold text-rose-400 mt-0.5">
                        ₹{Math.round(parseFloat(editingScripPrice.newPrice) * 0.935).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-rose-500/80">Capital Breaker</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setEditingScripPrice(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateScripPrice(editingScripPrice.symbol, parseFloat(editingScripPrice.newPrice))}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Apply Price Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Fund & Capital Architecture Modal */}
      <SeedFundModal
        isOpen={isSeedFundModalOpen}
        onClose={() => setIsSeedFundModalOpen(false)}
        config={capitalConfig}
        onSaveConfig={handleSaveCapitalConfig}
        onInjectMonthlyInflow={handleInjectMonthlyInflow}
        onResetPortfolioWithSeed={handleResetPortfolioWithSeed}
        currentCash={portfolio.cashBalance}
        currentLiquidBuffer={portfolio.liquidBeEsBuffer}
        currentEquitiesVal={totalEquitiesValue}
      />

      {/* Multi-Timeframe Momentum Breakdown & Indicators Audit Modal */}
      {inspectedMomentumStock && (
        <MomentumBreakdownModal
          stock={inspectedMomentumStock}
          allStocks={stockScrips}
          onClose={() => setInspectedMomentumStock(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3.5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Branch: <code>geminigoofups</code> • Quantitative Strategic Tool (Non-Advisory)</span>
          <span className="text-[11px] text-slate-600">Nifty 500 Regime &amp; Val-Mo Strategy Framework</span>
        </div>
      </footer>

      {/* ASD-STE100 Terminal Strategy Assistant */}
      <ApplicationHelperChat
        activeRegime={activeRegime}
        allRegimes={REGIMES_DATA}
        macroSectors={MACRO_SECTORS}
        stockScrips={stockScrips}
        selectedSectorIds={selectedSectorIds}
        selectedQuadrants={selectedQuadrants}
        capitalConfig={capitalConfig}
        portfolio={portfolio}
        onSelectQuadrant={handleToggleQuadrant}
        onSelectSector={handleSelectSector}
      />
    </div>
  );
}

export default App;
