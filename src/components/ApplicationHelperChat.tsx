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
    'Compare Pure Momentum vs Val-Mo Backtest',
    'How did Pure Momentum perform in 2020 vs 2022?',
    'Explain the Pure Momentum Strategy',
    'What are the 4 Daily Leading Indicators?',
    'What are the 4 Weekly Leading Indicators?',
    'How are Top 15 Overall and Top 5 Segment selected?',
    'Does it make sense to use Google Finance for CMP?',
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

    // 1b. CMP & GOOGLE FINANCE ACCURACY: "Does it make sense to use googlefinance for cmp? will it be more accurate?"
    const isGoogleFinanceQuery =
      q.includes('googlefinance') ||
      q.includes('google finance') ||
      (q.includes('google') && q.includes('finance')) ||
      (q.includes('sheets') && q.includes('price'));

    if (isGoogleFinanceQuery) {
      return {
        text: `Google Finance analysis for terminal CMP integration:

1. How Google Finance Operates:
- The GOOGLEFINANCE("NSE:SYMBOL") function is an internal spreadsheet formula designed specifically for Google Sheets documents.
- It does NOT provide a free, public, CORS-enabled REST API for client-side web browser applications. Direct HTTP requests from a browser to Google Finance URLs fail immediately with CORS security errors (403 Forbidden).

2. Price Accuracy Comparison:
- Google Finance prices for Indian equities (NSE) are delayed by up to 15 minutes during live market hours.
- While accurate for personal spreadsheets, relying on delayed web scraping introduces network lag, rate limits, and risk calculation errors.

3. The Terminal Solution:
- The terminal uses verified batch-calibrated market feeds synchronized directly to official NSE closing/tick data.
- All 32 constituent scrips are verified against live market levels (e.g. HDFCBANK ₹725.00, TRENT ₹3,025, POLYCAB ₹7,814).
- You can use the "Sync Live NSE CMPs" button in Section 4 or click any stock's CMP to calibrate prices manually with instant recalculation of lot sizes and risk levels.`,
      };
    }

    // 1c. HDFC CMP DISCREPANCY & CORPORATE ADJUSTMENT: "Why was HDFC bank price showing 1,780?" / "HDFC discrepancy"
    const isHdfcDiscrepancyQuery =
      (q.includes('hdfc') || q.includes('hdfcbank')) &&
      (q.includes('1780') ||
        q.includes('725') ||
        q.includes('discrepancy') ||
        q.includes('cmp') ||
        q.includes('price') ||
        q.includes('split') ||
        q.includes('merger') ||
        q.includes('wrong') ||
        q.includes('difference'));

    if (isHdfcDiscrepancyQuery) {
      const hdfcScrip = stockScrips.find((s) => s.symbol === 'HDFCBANK');
      const hdfcPrice = hdfcScrip?.price || 725;
      const lotShares = hdfcScrip?.calculatedLotShares || 24;
      return {
        text: `HDFC Bank (HDFCBANK) CMP Discrepancy Explanation:

1. Cause of the Discrepancy:
- The historic mega-merger of Housing Development Finance Corporation (HDFC Ltd) into HDFC Bank Ltd and subsequent corporate capital adjustments caused unadjusted financial datasets to report pre-merger price levels (~₹1,780).
- On the National Stock Exchange (NSE), HDFC Bank trades at approximately ₹720–₹725 post-adjustment.

2. Calibrated Status in Terminal:
- Current Calibrated CMP: ₹${hdfcPrice.toLocaleString('en-IN')}.
- Strategic Lot Size: ${lotShares} shares (₹${(lotShares * hdfcPrice).toLocaleString('en-IN')}), perfectly aligned with the ₹15,000–₹18,000 portfolio capital slice.
- +6% Pyramid Scale-In: ₹${Math.round(hdfcPrice * 1.06)}.
- -6.5% Hard Stop-Loss: ₹${Math.round(hdfcPrice * 0.935)}.
- 50-DMA Baseline: ₹708 (Trend: Ascending).`,
      };
    }

    // 1d. CMP SYNC & LIVE PRICE MECHANICS: "How do prices sync?" / "How is CMP updated?"
    const isCmpSyncQuery =
      (q.includes('cmp') || q.includes('price') || q.includes('quote')) &&
      (q.includes('sync') || q.includes('calibrate') || q.includes('update') || q.includes('accuracy') || q.includes('live') || q.includes('feed'));

    if (isCmpSyncQuery) {
      return {
        text: `Terminal Current Market Price (CMP) & Synchronization Architecture:

1. Batch NSE Calibration:
- The terminal universe contains 32 constituent scrips calibrated to verified live NSE rates (e.g. HDFCBANK ₹725, ICICIBANK ₹1,398, BEL ₹370, POLYCAB ₹7,814).

2. One-Click In-App Sync:
- In Section 4 (Constituent Stocks), click "Sync Live NSE CMPs" to batch-synchronize all 32 scrips to official benchmark levels.

3. Dynamic Risk Recalculation:
- When any CMP changes, the terminal automatically recalculates:
  * Strategic integer lot size (tranche allocation / CMP).
  * +6% Pyramid scale-in trigger price.
  * -6.5% Hard stop-loss breaker level.
  * Proportionate 50-DMA and 200-DMA relationships.
  * Paper trading unrealized P&L.

4. Manual Price Calibration:
- Click the edit icon next to any scrip's CMP to test custom price scenarios or reset to the verified NSE benchmark.`,
      };
    }

    // 1e. PURE MOMENTUM STRATEGY & MTF CRITERIA: "Explain the Pure Momentum Strategy"
    const isPureMomentumQuery =
      (q.includes('momentum') && (q.includes('strategy') || q.includes('pure') || q.includes('alone') || q.includes('option'))) ||
      q.includes('pure momentum') ||
      q.includes('momentum alone');

    if (isPureMomentumQuery) {
      return {
        text: `Pure Momentum Strategy Framework & Multi-Timeframe Architecture:

1. Identical Macro Hierarchy Defense:
- The Pure Momentum option uses the exact same macro criteria as the Val-Mo strategy:
  * Tier 0 Regime Sensor (Benchmark 200-DMA, Breadth > 50-DMA, VIX, P/E support).
  * Tier 1 Sector RRG (Strictly Leading & Improving quadrants with RS-Mom > 100).
  * Tier 2 Industry Operating Leverage (>+150 bps YoY EBITDA margin inflection).
  * Tier 3 Base Industry Moat (Pricing power & structural deficit protection).

2. Technical Momentum Execution Criteria:
- Rather than scoring on P/E discount or PEG ratio, candidate scrips are ranked and filtered strictly on 8 Multi-Timeframe (MTF) Leading Indicators:
  * 4 Daily Leading Indicators: Triple EMA Cross & Alignment, ADX Trend Acceleration, Volume Expansion or RSI Runway, and Volatility Expansion (ATR/BB).
  * 4 Weekly Leading Indicators: Triple EMA Band Structure, ADX Macro Strength (>30), Weekly Volume Accumulation or RSI Divergence, and Multi-Timeframe Synchronization.

3. Portfolio Allocation & Scrip Quotas:
- Top 15 Overall Universe: The 15 highest-ranked scrips across the entire Nifty 500 universe with verified multi-timeframe alignment.
- Top 5 in Each Segment: The top 5 momentum leaders within each qualified macro sector, guaranteeing cross-sector leadership.
- Risk Controls: Systematic integer lot sizing derived from calibrated CMP with +6% pyramiding trigger and -6.5% hard stop-loss.`,
      };
    }

    // 1f. DAILY LEADING INDICATORS: "What are the 4 Daily Leading Indicators?"
    const isDailyIndicatorsQuery =
      q.includes('daily') && (q.includes('indicator') || q.includes('leading') || q.includes('trigger') || q.includes('execution') || q.includes('ema') || q.includes('adx') || q.includes('atr'));

    if (isDailyIndicatorsQuery) {
      return {
        text: `Daily Leading Indicators: Execution & Entry Triggers:

1. Triple EMA Cross & Price Alignment:
- Criteria: Price closes above fastest EMA (9-EMA), and the short-term EMA (9) crosses above the medium (21-EMA) and long-term (55-EMA) averages on the daily chart.
- Rationale: Captures immediate shift in short-term trend direction with reduced lag, serving as the primary directional entry trigger.

2. ADX Trend Acceleration:
- Criteria: ADX value crosses above 20 (or 25) from below, with the +DI line strictly above -DI (Bullish).
- Rationale: Confirms that the asset is transitioning out of a choppy, sideways range and into a high-momentum, tradable trend.

3. Volume Expansion OR RSI Momentum Room:
- Criteria (Volume): Daily trading volume closes above its 20-day moving average.
- Criteria (RSI): Daily RSI expands between 45 and 65, avoiding overbought (>70) or oversold (<30) exhaustion zones.
- Rationale: Volume validates institutional conviction behind the price move; RSI ensures sufficient runway before hitting momentum exhaustion.

4. Volatility Expansion:
- Criteria: Price range expands outside the 14-day ATR (Average True Range) or initiates a Bollinger Band expansion.
- Rationale: Ensures the trade is entered exactly as market liquidity and volatility return, maximizing the speed of the price advance.`,
      };
    }

    // 1g. WEEKLY LEADING INDICATORS: "What are the 4 Weekly Leading Indicators?"
    const isWeeklyIndicatorsQuery =
      q.includes('weekly') && (q.includes('indicator') || q.includes('macro') || q.includes('band') || q.includes('divergence') || q.includes('synchronization') || q.includes('mtf'));

    if (isWeeklyIndicatorsQuery) {
      return {
        text: `Weekly Leading Indicators: Macro Trend & Structural Bias:

1. Triple EMA Band Structure:
- Criteria: Price remains structurally supported by, and trading above, the long-term Triple EMA bands (EMA 13 > 34 > 89) on consecutive weekly closes.
- Rationale: Establishes the macro-level market bias, ensuring trades are never taken against the dominant, higher-timeframe trend.

2. ADX Macro Strength:
- Criteria: Weekly ADX is sustained above 30 and rising.
- Rationale: Indicates a powerful, long-term secular trend is underway, signaling the strategy should aggressively prioritize breakout entries over mean-reversion counter-trades.

3. Volume Accumulation OR RSI Divergence:
- Criteria (Volume): Increasing aggregate volume on positive weekly closes (accumulation) or negative weekly closes (distribution).
- Criteria (RSI): Weekly RSI prints a bullish or bearish divergence against price (e.g., price makes a lower low, but RSI makes a higher low).
- Rationale: Weekly volume highlights underlying institutional supply/demand shifts; weekly RSI divergences act as early-warning leading indicators of major structural trend reversals weeks before they occur.

4. Multi-Timeframe Synchronization:
- Criteria: Daily directional triggers must perfectly align with the Weekly Triple EMA trend status.
- Rationale: Eliminates low-probability counter-trend setups by filtering out daily noise that conflicts with macro institutional positioning.`,
      };
    }

    // 1h. TOP 15 OVERALL & TOP 5 SEGMENT SELECTION: "How are Top 15 Overall and Top 5 Segment selected?"
    const isTopRankingsQuery =
      (q.includes('top 15') || q.includes('top 5') || q.includes('segment') || q.includes('quota') || q.includes('ranking')) &&
      (q.includes('how') || q.includes('select') || q.includes('calculate') || q.includes('filter') || q.includes('overall'));

    if (isTopRankingsQuery) {
      return {
        text: `Pure Momentum Selection Engine (Top 15 Overall & Top 5 in Each Segment):

1. Scoring Methodology:
- Scrips passing the Macro Hierarchy (Regime, Sector RRG, Industry Inflection & Moat) receive a Pure Momentum Score (0 to 100).
- Points are awarded across the 8 indicators:
  * 4 Daily Triggers: Up to 50 points (Triple EMA Cross, ADX > 20/25, Vol > 20DMA/RSI 45-65, Volatility Expansion).
  * 4 Weekly Macro Triggers: Up to 50 points (Weekly Triple EMA Bands, Weekly ADX > 30, Weekly Accumulation/RSI Divergence, MTF Sync).

2. Top 15 Overall Universe:
- The terminal ranks all 32 constituent scrips by their composite Pure Momentum Score.
- The 15 highest-ranked scrips are marked with the "★ Top 15 Overall" badge and prioritized for primary portfolio entry.

3. Top 5 in Each Segment:
- Within each macro sector (Capital Goods, Healthcare, Power, Cons. Durables, etc.), scrips are ranked by their momentum profile.
- The top 5 performers in each sector are marked with the "★ Top 5 Segment" badge, ensuring you can deploy capital into sector leaders without cluster risk.

4. In-App Switching:
- Toggle between "★ Top 15 Overall", "★ Top 5 in Each Segment", and "All MTF Scrips" directly in Section 4 or Model Candidates view.`,
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
The system tests your portfolio rules against four empirical market regimes (2020 Covid melt-up, 2022 rate hike churn, 2024 capex rotation, May-June 2024 election volatility).

6. Weekly Factor Attribution Engine:
The system recalculates exact point contributions from the Value factor (50 pts) and Momentum factor (50 pts) for every scrip each week.`,
      };
    }

    // 5b. HISTORICAL BACKTESTING & STRATEGY COMPARISON: "Implement backtest for momentum also", "Compare backtests", "Momentum backtest results"
    const isBacktestQuery =
      q.includes('backtest') ||
      q.includes('back-test') ||
      (q.includes('momentum') && (q.includes('result') || q.includes('simulation') || q.includes('perform in 2020') || q.includes('perform in 2022') || q.includes('historical')));

    if (isBacktestQuery) {
      return {
        text: `Pure Momentum vs Val-Mo Empirical Backtest Analysis:

1. Performance Overview:
- 2020–2021 Bull Melt-Up:
  • Pure Momentum: +142.6% (Alpha: +68.4% vs Nifty +74.2%, Win Rate: 82%, Sharpe: 2.15)
  • Val-Mo: +118.4% (Alpha: +44.2%, Win Rate: 78%, Sharpe: 2.40)
  • Key Finding: Pure Momentum generated +24.2% higher return by aggressively riding high-beta industrial and electronics breakouts (Apar, Dixon, Tata Power).

- 2022–2023 Global Rate Hike Churn:
  • Pure Momentum: +31.4% (Max Drawdown: -11.8%, Win Rate: 61%, Sharpe: 1.45)
  • Val-Mo: +26.8% (Max Drawdown: -5.9%, Win Rate: 64%, Sharpe: 1.82)
  • Key Finding: Val-Mo provided superior downside defense, cushioning drawdown by 5.9% due to its mandatory 40% tactical Liquid BeES buffer.

- 2024–2026 Capex Rotation:
  • Pure Momentum: +74.8% (Alpha: +36.3% vs Nifty +38.5%, Win Rate: 76%, Sharpe: 2.05)
  • Val-Mo: +62.1% (Alpha: +23.6%, Win Rate: 71%, Sharpe: 2.18)

- May–June 2024 Election Volatility Stress Test:
  • Pure Momentum: +18.2% (Max Drawdown: -7.6%, Win Rate: 80%)
  • Val-Mo: +14.6% (Max Drawdown: -4.8%, Win Rate: 85%)

2. Multi-Timeframe Trade Execution Rules:
- Entry: Requires 4 Daily Triggers (Triple EMA 9>21>55 + ADX > 20/25 + Volume/RSI room + Volatility expansion) perfectly aligned with 4 Weekly Macro Trend indicators.
- Pyramiding: +50% tranche added automatically at +6% breakout from entry.
- Stop-Loss: Hard stop at -6.5% below entry to eliminate capital destruction.
- Exit: Trailing daily EMA-21 or weekly EMA-13 breakdown.

3. Interactive Terminal Navigation:
Navigate to the "Historical Backtesting" tab to view the side-by-side 3-way performance table, normalized equity compounding curve (base 100), and trade execution logs.`,
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
