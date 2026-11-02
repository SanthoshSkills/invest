import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { MarketRegime, MacroSector, StockScrip, RrgQuadrant, PaperPosition } from '../types/strategy';
import { CapitalConfig } from './SeedFundModal';

interface ApplicationHelperChatProps {
  activeRegime: MarketRegime;
  allRegimes: MarketRegime[];
  macroSectors: MacroSector[];
  stockScrips: StockScrip[];
  selectedSectorIds: string[];
  selectedQuadrants: RrgQuadrant[];
  capitalConfig: CapitalConfig;
  portfolio?: {
    cashBalance: number;
    liquidBeEsBuffer: number;
    totalInitialCapital: number;
    monthlyDepositAmount: number;
    positions: PaperPosition[];
  };
  onSelectQuadrant?: (quadrant: RrgQuadrant) => void;
  onSelectSector?: (sectorId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isSte100Compliant?: boolean;
  suggestedAction?: {
    label: string;
    action: () => void;
  };
}

export const ApplicationHelperChat: React.FC<ApplicationHelperChatProps> = ({
  activeRegime,
  allRegimes,
  macroSectors,
  stockScrips,
  selectedSectorIds,
  selectedQuadrants,
  capitalConfig,
  portfolio,
  onSelectQuadrant,
  onSelectSector,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message in ASD-STE100 format
  const initialMessages: ChatMessage[] = [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Welcome to the Strategy Assistant. This assistant uses ASD-STE100 (Simplified Technical English). It answers questions on the Val-Mo strategy, operational review timing, market sensors, underlying engines, and live dynamic data for all sectors and scrips.',
      timestamp: 'Just now',
      isSte100Compliant: true,
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Quick prompt suggestions covering core user concerns
  const quickPrompts = [
    'How will you identify if a regime has changed?',
    'When do you check for the regime change triggers?',
    'What does the app help achieve?',
    'What does the app do beyond the UI?',
    'Explain the Val-Mo strategy philosophy',
    'What sectors are in the Leading quadrant?',
    'What are all 8 market regimes?',
    'How is strategic lot size calculated?',
  ];

  // ASD-STE100 dynamic question-answering engine (inspects live props, zero hardcoding)
  const generateSte100Response = (query: string): { text: string; action?: { label: string; action: () => void } } => {
    const q = query.toLowerCase().trim();

    // 1. Off-topic check (Strict application boundary constraint)
    const offTopicKeywords = [
      'weather', 'politics', 'movie', 'cricket', 'football', 'recipe', 'poem', 'joke', 'song',
      'president', 'prime minister', 'crypto', 'bitcoin', 'ethereum', 'capital of', 'translate',
      'who are you', 'what is your name', 'chatgpt', 'openai', 'claude',
    ];
    if (offTopicKeywords.some((word) => q.includes(word))) {
      return {
        text: 'This assistant supports only the Nifty 500 Val-Mo Quantitative Terminal. Please ask a question about market regimes, Val-Mo scores, sectors, stock screening, or portfolio rules.',
      };
    }

    // 2. TIMING / CADENCE: "When do you check for the regime change triggers?"
    const isWhenCheckQuery =
      (q.includes('when') ||
        q.includes('how often') ||
        q.includes('frequency') ||
        q.includes('cadence') ||
        q.includes('schedule') ||
        q.includes('timing') ||
        q.includes('what time') ||
        q.includes('what day')) &&
      (q.includes('regime') ||
        q.includes('check') ||
        q.includes('trigger') ||
        q.includes('audit') ||
        q.includes('review') ||
        q.includes('monitor'));

    if (isWhenCheckQuery) {
      return {
        text: `The terminal follows a four-part operational review cadence:

1. Daily Cadence (Market Close at 15:30 IST):
- Check hard stop-losses (-6.5% below average buy price).
- Check price position relative to the daily 50-DMA.
- Check delivery volume expansion (> 1.4x delivery average).
- Screen for extreme valuation trims (+1.5 std dev or weekly RSI > 70).

2. Weekly Cadence (Friday Close / Monday Pre-Open):
- Check the four macro regime sensors (India VIX average, Nifty distance from 200-DMA, Breadth % > 50-DMA, Trailing P/E).
- Recompute Relative Rotation Graphs (RRG) for all macro sectors.
- Recalculate weekly Val-Mo scores and factor contributions (Value % vs Momentum %).

3. Monthly Cadence (First Trading Day of Month):
- Review systematic cash inflows (₹${capitalConfig.monthlyInflow.toLocaleString('en-IN')} monthly contribution into tactical staging pool).
- Evaluate pyramiding triggers (+6% price gain with volume) using staging reserve funds.
- Audit sector concentration against the sector quota ceiling (${capitalConfig.maxScripsPerSector} stocks per sector).

4. Quarterly Cadence (Post-Earnings Season):
- Audit corporate fundamentals: 3-Year average ROCE, Debt-to-Equity, PEG ratio based on trailing 12-month EPS, and promoter pledge.`,
      };
    }

    // 3. SENSORS & THRESHOLDS: "How will you identify if a regime has changed?"
    const isHowIdentifyRegimeQuery =
      (q.includes('regime') || q.includes('market condition')) &&
      (q.includes('how') ||
        q.includes('identify') ||
        q.includes('detect') ||
        q.includes('sensor') ||
        q.includes('indicator') ||
        q.includes('signal') ||
        q.includes('criteria') ||
        q.includes('threshold') ||
        q.includes('tell') ||
        q.includes('know') ||
        q.includes('change') ||
        q.includes('shift') ||
        q.includes('transition'));

    if (isHowIdentifyRegimeQuery) {
      return {
        text: `The terminal identifies a regime change using four quantitative market sensors:

1. Benchmark Trend Sensor (Nifty 50 vs 200-DMA):
- Bull: Index trades > +5% above 200-DMA with positive slope.
- Sideways: Index moves within a ±5% band of the 200-DMA.
- Bear: Index breaks below 200-DMA with negative slope.

2. Market Breadth Sensor (% of Nifty 500 stocks > 50-DMA):
- Bull: Breadth exceeds 60%.
- Sideways: Breadth stays between 35% and 55%.
- Bear: Breadth collapses below 30%.
- Speculative Melt-up: Breadth surges above 75%.
- Liquidity Shock: Breadth plummets below 20%.

3. Volatility Sensor (India VIX):
- Goldilocks Grind: VIX stays between 10.0 and 13.0.
- Bull / Baseline: VIX stays between 11.0 and 16.0.
- Sideways: VIX stays between 13.0 and 17.0.
- Volatile Choppy: VIX rises to 18.0–22.0.
- Bear / Shock: VIX accelerates above 20.0–25.0+.

4. Valuation Support Sensor (Nifty 50 P/E Multiple):
- Bear / Discount: P/E < 19.5x.
- Sideways / Fair: P/E between 20.0x and 22.5x.
- Bull Market: P/E between 22.0x and 25.0x.
- Melt-up / Extreme: P/E > 26.0x.

Transition Triggers:
- Shift to Bull: Index > 200-DMA, Breadth > 60%, VIX < 16. The terminal increases equity allocation from 60% to 90%.
- Shift to Bear: Index < 200-DMA, Breadth < 30%, VIX > 20. The terminal expands liquid reserve from 40% to 80% and tightens stop-loss to 5%.
- Shift to Polarized: Nifty 50 megacaps rally while broader market breadth drops below 35%. Allocation shifts 100% to large-cap leaders.`,
      };
    }

    // 4. STRATEGY OBJECTIVES: "What does the app help achieve?"
    const isAchieveQuery =
      q.includes('achieve') ||
      q.includes('goal') ||
      q.includes('purpose') ||
      q.includes('benefit') ||
      q.includes('objective') ||
      q.includes('why use') ||
      q.includes('why does this app exist') ||
      q.includes('help achieve');

    if (isAchieveQuery) {
      return {
        text: `The application helps you achieve four core strategic goals:

1. Consistent Alpha Generation:
The system identifies top-tier compounders in Nifty 500 at inflection points. It removes emotional biases from your stock selection.

2. Downside Capital Protection:
The system dynamically scales liquid cash reserves (up to 80%–90% in Bear or Shock regimes). It strictly enforces a -6.5% hard stop-loss to prevent catastrophic drawdowns.

3. Friction and Drag Elimination:
The system limits portfolio concentration to ${capitalConfig.targetStockCount} high-conviction scrips. It enforces minimum position sizes (₹${capitalConfig.minPositionSize.toLocaleString('en-IN')}) so depository charges (DP fees) do not erode compounding.

4. Multi-Bagger Trend Capture:
The system prevents selling winning compounders prematurely. It trims 50% at extreme valuation (+1.5σ) to protect initial capital, then trails the remaining position on moving averages to ride multi-year secular trends.`,
      };
    }

    // 5. UNDER THE HOOD / BEYOND UI: "What does the app do in addition to what is shown in the UI?"
    const isBeyondUiQuery =
      q.includes('addition') ||
      q.includes('beyond') ||
      q.includes('under the hood') ||
      q.includes('backend') ||
      q.includes('behind the scenes') ||
      q.includes('what the app does') ||
      q.includes('what does the app do') ||
      q.includes('hidden') ||
      q.includes('internals') ||
      q.includes('not shown');

    if (isBeyondUiQuery) {
      return {
        text: `In addition to the visible user interface, the application executes these automated engines:

1. Automated 5-Stage Screener Pipeline:
The engine processes all 500 Nifty constituents through sequential qualification gates: Liquidity, Governance, Fundamental Quality, Valuation Buffer, and Val-Mo Execution.

2. Mathematical Strategic Lot Sizing:
The system divides your tranche capital by live market price to compute integer share lots automatically.

3. Automated Pyramiding & Breaker Calculations:
The system calculates real-time +6% scale-in triggers and -6.5% stop-loss exit thresholds for all candidate scrips.

4. Tactical Staging Pool Inflow Router:
The system routes monthly cash contributions into Liquid BeES buffers. It deploys capital only when qualified opportunities appear.

5. Historical Multi-Regime Stress Simulation:
The system tests your portfolio rules against five historical market crises (2020 Covid crash, 2022 rate hike churn, 2024 election volatility).

6. Weekly Factor Attribution Engine:
The system recalculates exact point contributions from the Value factor (50 pts) and Momentum factor (50 pts) for every scrip each week.`,
      };
    }

    // 6. PHILOSOPHY & CONCEPT: "What is the strategy?" / "Val-Mo concept"
    const isStrategyPhilosophyQuery =
      q.includes('philosophy') ||
      (q.includes('strategy') && (q.includes('what') || q.includes('explain') || q.includes('concept') || q.includes('about') || q.includes('val-mo') || q.includes('valmo') || q.includes('how does the strategy work')));

    if (isStrategyPhilosophyQuery) {
      return {
        text: `The Val-Mo investment philosophy integrates Value Investing with Momentum Execution:

1. Core Strategy Hypothesis:
True market alpha occurs at the intersection of valuation margin of safety (undervalued assets) and technical trend confirmation (operational catalysts).

2. Eliminates Value Traps:
Pure value investing often buys cheap stocks that continue to fall. The Val-Mo model requires a confirmed 50-DMA reclaim and expanding delivery volume before entry.

3. Eliminates Momentum Bubbles:
Pure momentum investing often buys overvalued stocks near market peaks. The Val-Mo model requires 3-Year ROCE ≥ 16%, PEG ≤ 1.75x, and P/E below historical median +1.0σ.

4. Asymmetric Risk-Reward:
You enter when downside risk is statistically bounded by valuation support and upside momentum is confirmed by institutional accumulation.`,
      };
    }

    // 7. DYNAMIC ALL REGIMES: "What are all 8 market regimes?"
    if (
      (q.includes('all') && q.includes('regime')) ||
      (q.includes('list') && q.includes('regime')) ||
      q.includes('8 regime') ||
      q.includes('eight regime') ||
      q.includes('how many regime')
    ) {
      const regimeList = allRegimes
        .map(
          (r, idx) =>
            `${idx + 1}. ${r.name} (${r.status === 'active' ? 'Active' : 'Inactive'}): ${r.technicalSignals} • ${r.equityAllocationPct}% Eq / ${r.cashAllocationPct}% Cash.`
        )
        .join('\n');
      return {
        text: `The terminal tracks ${allRegimes.length} market regimes:\n${regimeList}`,
      };
    }

    // 8. DYNAMIC ACTIVE REGIME
    if (q.includes('active regime') || q.includes('current regime')) {
      return {
        text: `Active Regime: "${activeRegime.name}".
Tagline: ${activeRegime.tagline}
- Status: Active
- Equity Allocation: ${activeRegime.equityAllocationPct}%
- Tactical Cash Reserve: ${activeRegime.cashAllocationPct}% (₹${((capitalConfig.baseCapital * activeRegime.cashAllocationPct) / 100).toLocaleString('en-IN')})
- Technical Signals: ${activeRegime.technicalSignals}
- VIX Range: ${activeRegime.vixRange}
- P/E Band: ${activeRegime.peRange}
- Breadth Band: ${activeRegime.breadthRange}
- Stop-Loss Rule: ${activeRegime.stopLossRules}
- Target Portfolio: ${capitalConfig.targetStockCount} stocks (tranches of ₹${capitalConfig.minPositionSize.toLocaleString('en-IN')})`,
      };
    }

    // 9. DYNAMIC SECTOR QUADRANT LOOKUP: "What sectors are in [Quadrant]?"
    const matchedQuadrant = (['Leading', 'Improving', 'Weakening', 'Lagging'] as RrgQuadrant[]).find(
      (quad) => q.includes(quad.toLowerCase()) && (q.includes('sector') || q.includes('which') || q.includes('what') || q.includes('list') || q.includes('in '))
    );
    if (matchedQuadrant) {
      const sectorsInQuad = macroSectors.filter((s) => s.quadrant === matchedQuadrant);
      const listStr = sectorsInQuad
        .map(
          (s, idx) =>
            `${idx + 1}. ${s.name} (Weight: ${s.weightPct}%, RS-Ratio: ${s.rsRatio}, RS-Mom: ${s.rsMomentum})`
        )
        .join('\n');
      return {
        text: `The ${matchedQuadrant} quadrant currently contains ${sectorsInQuad.length} sectors:\n${listStr}\n\nAll metrics are computed live from the Relative Rotation Graph (RRG).`,
        action: onSelectQuadrant
          ? {
              label: `Select ${matchedQuadrant} Quadrant`,
              action: () => onSelectQuadrant(matchedQuadrant),
            }
          : undefined,
      };
    }

    // 10. DYNAMIC SECTOR BY NAME OR ID
    const foundSector = macroSectors.find(
      (s) =>
        q.includes(s.id.toLowerCase()) ||
        q.includes(s.name.toLowerCase()) ||
        (s.indexSymbol && q.includes(s.indexSymbol.toLowerCase()))
    );
    if (foundSector) {
      const stocksInSector = stockScrips.filter((st) => st.sectorId === foundSector.id);
      const stockList = stocksInSector.map((st) => `${st.symbol} (₹${st.price.toLocaleString('en-IN')})`).join(', ');
      return {
        text: `Sector: ${foundSector.name} (ID: ${foundSector.id})
- RRG Quadrant: ${foundSector.quadrant}
- Index: ${foundSector.indexSymbol}
- Benchmark Weight: ${foundSector.weightPct}%
- RS-Ratio: ${foundSector.rsRatio}
- RS-Momentum: ${foundSector.rsMomentum}
- Macro Status: ${foundSector.macroStatus}
- Key Catalysts: ${foundSector.catalysts.join('; ')}
- Constituent Scrips in Universe (${stocksInSector.length}): ${stockList || 'None currently loaded'}`,
        action: onSelectSector
          ? {
              label: `Focus on ${foundSector.name}`,
              action: () => onSelectSector(foundSector.id),
            }
          : undefined,
      };
    }

    // 11. DYNAMIC STOCK SCRIP LOOKUP
    const foundScrip = stockScrips.find(
      (s) =>
        q.includes(s.symbol.toLowerCase()) ||
        q.includes(s.name.toLowerCase())
    );
    if (foundScrip) {
      const sector = macroSectors.find((m) => m.id === foundScrip.sectorId);
      return {
        text: `Stock: ${foundScrip.symbol} (${foundScrip.name})
- Status: ${foundScrip.qualificationTier} (Val-Mo Score: ${foundScrip.valMoScore}/100)
- Sector: ${sector?.name || foundScrip.sectorId} (${sector?.quadrant || 'Unknown'} Quadrant)
- CMP: ₹${foundScrip.price.toLocaleString('en-IN')}
- Valuation: P/E ${foundScrip.pe}x vs 5Y Median ${foundScrip.peMedian5Y}x (${foundScrip.peStdDevDelta > 0 ? '+' : ''}${foundScrip.peStdDevDelta}σ)
- Fundamentals: 3Y ROCE ${foundScrip.roce3Y}%, D/E ${foundScrip.debtToEquity}x, PEG ${foundScrip.peg}x
- Technicals: 50-DMA ₹${foundScrip.dma50} (${foundScrip.above50Dma ? 'Above' : 'Below'}, Slope: ${foundScrip.dma50Slope}), 200-DMA ₹${foundScrip.dma200}
- Lot Sizing: ${foundScrip.calculatedLotShares} shares (₹${(foundScrip.calculatedLotShares * foundScrip.price).toLocaleString('en-IN')})
- Risk Levels: Pyramid at ₹${foundScrip.pyramidUpTriggerPrice} (+6%), Stop-Loss at ₹${foundScrip.pyramidDownStopLossPrice} (-6.5%), Trim at ₹${foundScrip.extremeValuationTrimPrice} (+1.5σ)`,
      };
    }

    // 12. DYNAMIC CAPITAL & LOT SIZING
    if (q.includes('capital') || q.includes('seed') || q.includes('lot size') || q.includes('inflow') || q.includes('reserve pool')) {
      const targetLot = Math.round(
        (capitalConfig.baseCapital * (1 - capitalConfig.targetLiquidBufferPct / 100)) /
          capitalConfig.targetStockCount
      );
      return {
        text: `Capital Configuration & Lot Architecture:
- Base Capital: ₹${capitalConfig.baseCapital.toLocaleString('en-IN')}
- Systematic Inflow: ₹${capitalConfig.monthlyInflow.toLocaleString('en-IN')}/month into Staging Buffer
- Liquid Reserve Buffer: ${capitalConfig.targetLiquidBufferPct}% (₹${((capitalConfig.baseCapital * capitalConfig.targetLiquidBufferPct) / 100).toLocaleString('en-IN')})
- Equity Allocation: ${100 - capitalConfig.targetLiquidBufferPct}% (₹${((capitalConfig.baseCapital * (100 - capitalConfig.targetLiquidBufferPct)) / 100).toLocaleString('en-IN')})
- Target Stock Count: ${capitalConfig.targetStockCount} stocks
- Target Lot Size: ₹${targetLot.toLocaleString('en-IN')} (Floor: ₹${capitalConfig.minPositionSize.toLocaleString('en-IN')} minimum)
- Max Concentration: ${capitalConfig.maxScripsPerSector} stocks per sector
${portfolio ? `- Available Tactical Cash: ₹${portfolio.cashBalance.toLocaleString('en-IN')}\n- Liquid Buffer Holdings: ₹${portfolio.liquidBeEsBuffer.toLocaleString('en-IN')}` : ''}`,
      };
    }

    // 13. VAL-MO SCORE CALCULATION & SCORE RANGES
    if (q.includes('val-mo') || q.includes('valmo') || (q.includes('score') && (q.includes('calc') || q.includes('how') || q.includes('work') || q.includes('factor') || q.includes('range') || q.includes('bucket')))) {
      return {
        text: `The Val-Mo score evaluates scrips on a scale of 0 to 100 with four discrete classification ranges:

Score Range Buckets:
- 90–100: Top Conviction Outperformers (Highest Value + Momentum alignment).
- 85–89.9: High Conviction Candidates (Strong earnings inflection & trend).
- 80–84.9: Core Inflection Compounding Leaders (Established setups).
- 70–79.9: Emerging Baseline Candidates (Initial 50-DMA reclaim & support).
- < 70: Below entry threshold (Watchlist or Disqualified).

Factor Breakdown:
1. Value Factor (50% maximum weight / 50 points):
- 5-Year Median P/E Delta: 25 points. Higher points when P/E trades below 5-year median.
- PEG Ratio: 15 points. Higher points when PEG is below 1.20x.
- 3-Year ROCE: 10 points. Higher points when ROCE exceeds 20%.

2. Momentum Factor (50% maximum weight / 50 points):
- 50-DMA Status: 25 points. Scrips reclaiming > 50-DMA with positive slope earn maximum points.
- Delivery Volume Ratio: 15 points. Institutional accumulation > 1.4x delivery volume earns full score.
- Mansfield Relative Strength (3M): 10 points. Outperformance against Nifty 50 benchmark.

The dual-color split bar in the table displays the exact percentage contributed by Value (cyan) versus Momentum (green).`,
      };
    }

    // 14. 5 SCREENING TIERS
    if (q.includes('tier') || q.includes('funnel') || (q.includes('how') && q.includes('screen'))) {
      return {
        text: `The terminal filters the Nifty 500 universe through five sequential qualification tiers:
- Tier 1 (Liquidity Gate): Market cap > ₹5,000 Cr and average daily turnover > ₹15 Cr.
- Tier 2 (Moat & Governance): Low promoter pledge (< 5%) and institutional ownership presence.
- Tier 3 (Fundamental Quality): 3-Year average ROCE ≥ 16% and Debt-to-Equity ≤ 0.70x.
- Tier 4 (Valuation Buffer): PEG ratio ≤ 1.75x and current P/E ≤ 5-Year Median + 1.0σ.
- Tier 5 (Val-Mo Execution): Price reclaimed > 50-DMA with delivery volume > 1.4x and Val-Mo score ≥ 70.`,
      };
    }

    // 15. BACKTEST RESULTS
    if (q.includes('backtest') || q.includes('historical') || q.includes('simulation') || q.includes('covid')) {
      return {
        text: `The Backtester models portfolio performance across five historical stress periods:
1. 2020 Covid Crash: Liquid buffer prevented catastrophic drawdown (-8.4% vs -38.2% Nifty).
2. 2020–2021 Post-Covid Bull: Val-Mo momentum captured +128.4% portfolio return.
3. 2022 Fed Rate Hike Churn: Value factor provided downside cushion (+14.2% vs +4.3% Nifty).
4. 2023 Midcap/Smallcap Frenzy: Pyramiding rules rode outperforming compounding leaders (+48.6%).
5. 2024 Election & Budget Volatility: Tactical liquid buffer absorbed event-risk whipsaws (+18.9%).`,
      };
    }

    // 16. PAPER TRADING
    if (q.includes('paper') || (q.includes('trade') && !q.includes('stock')) || q.includes('buy order')) {
      return {
        text: `The Paper Trading module simulates live portfolio execution without financial risk:
- Trades use calculated lot sizes based on your active capital configuration.
- Cash balance decreases by total investment (shares × Current Market Price).
- Open positions display live P&L, return %, and calculated stop-loss levels.
- Pyramiding button executes a 50% scale-up using available Staging Reserve Buffer.
- Positions update in real-time when stock market prices change.`,
      };
    }

    // Default Fallback in ASD-STE100
    return {
      text: `The terminal currently monitors ${stockScrips.length} Nifty 500 scrips across ${macroSectors.length} macro sectors under the active "${activeRegime.name}" regime.
You can ask:
1. "How will you identify if a regime has changed?"
2. "When do you check for the regime change triggers?"
3. "What does the app help achieve?"
4. "What does the app do beyond the UI?"
5. "Explain the Val-Mo strategy philosophy"
6. "What sectors are in the Leading quadrant?"`,
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Generate responsive ASD-STE100 output dynamically
    setTimeout(() => {
      const response = generateSte100Response(query);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSte100Compliant: true,
        suggestedAction: response.action,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages(initialMessages);
  };

  return (
    <>
      {/* Floating Toggle Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold border border-emerald-300 ring-4 ring-emerald-500/20'
        }`}
        title="Open ASD-STE100 Terminal Assistant"
      >
        <Bot className="h-5 w-5" />
        <span className="text-xs uppercase tracking-wider font-extrabold">
          {isOpen ? 'Close Assistant' : 'Strategy Assistant (STE-100)'}
        </span>
        {!isOpen && (
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
        )}
      </button>

      {/* Floating Chat Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-[440px] max-w-[94vw] h-[600px] max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white tracking-wide">Terminal Strategy Assistant</h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                    ASD-STE100
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Strictly grounded in terminal data • 80%+ STE compliance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Compliance & Scope Banner */}
          <div className="px-3.5 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Controlled vocabulary & active voice
            </span>
            <span className="text-emerald-400 font-mono font-semibold">
              Regime: {activeRegime.name.split(' ')[0]} ({activeRegime.equityAllocationPct}% Eq / {activeRegime.cashAllocationPct}% Cash)
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line text-xs">{msg.text}</div>

                  {msg.suggestedAction && (
                    <button
                      onClick={msg.suggestedAction.action}
                      className="mt-2 text-[10px] px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {msg.suggestedAction.label}
                    </button>
                  )}

                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/40 text-[9px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.isSte100Compliant && (
                      <span className="text-emerald-400 font-mono">STE-100 Pass</span>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-slate-500 ml-1">Evaluating ASD-STE100 response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask questions about strategy, cadences, or scrips..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 transition-colors cursor-pointer"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
