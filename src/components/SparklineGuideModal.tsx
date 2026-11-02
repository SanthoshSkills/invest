import React from 'react';
import { X, TrendingUp, TrendingDown, HelpCircle, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { SparklineChart } from './SparklineChart';

interface SparklineGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SparklineGuideModal({ isOpen, onClose }: SparklineGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-6 max-h-[90vh] overflow-y-auto text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close guide"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>How to Read the Sparkline Chart</span>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                30-Day Trend vs 50-DMA
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Instant visual pulse of price action relative to the intermediate institutional benchmark.
            </p>
          </div>
        </div>

        {/* Visual Anatomy Showcase */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 mb-5 space-y-4">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Visual Anatomy of the Sparkline:
          </div>

          {/* Interactive Examples Side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bullish Example */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Bullish Setup (Above 50-DMA)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  Qualified
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">APARINDS</div>
                  <div className="text-[10px] text-slate-400">CMP: ₹3,120 • 50-DMA: ₹2,980</div>
                </div>
                <SparklineChart currentPrice={3120} dma50={2980} width={110} height={32} />
              </div>
              <p className="text-[11px] text-slate-400">
                Green line &amp; shaded area indicate the stock is comfortably trading above its 50-DMA with positive trajectory.
              </p>
            </div>

            {/* Bearish Example */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Bearish Setup (Below 50-DMA)
                </span>
                <span className="text-[10px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                  Disqualified
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">SAMPLE</div>
                  <div className="text-[10px] text-slate-400">CMP: ₹1,420 • 50-DMA: ₹1,550</div>
                </div>
                <SparklineChart currentPrice={1420} dma50={1550} width={110} height={32} />
              </div>
              <p className="text-[11px] text-slate-400">
                Red line &amp; shaded area signal the stock is trapped below intermediate resistance; excluded from fresh entries.
              </p>
            </div>
          </div>
        </div>

        {/* Component Elements Breakdown */}
        <div className="space-y-3 mb-5 text-xs">
          <h3 className="font-bold text-white text-sm">Key Chart Components:</h3>
          
          <div className="flex items-start gap-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="w-8 h-4 mt-1 border-t-2 border-dashed border-cyan-400 shrink-0" />
            <div>
              <strong className="text-cyan-400">Dashed Cyan Horizontal Line (50-DMA):</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                The 50-day moving average. In our Val-Mo model, reclaiming and staying above this line is the mandatory Tier 5 quantitative filter for momentum.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="w-8 h-4 mt-1 bg-emerald-500/20 border-t-2 border-emerald-500 shrink-0 rounded-sm" />
            <div>
              <strong className="text-emerald-400">Solid Line &amp; Gradient Fill:</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Represents the closing price trajectory over the trailing 30 trading sessions. Turns <span className="text-emerald-400 font-semibold">Green</span> when CMP ≥ 50-DMA and <span className="text-rose-400 font-semibold">Red</span> when CMP &lt; 50-DMA.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="w-8 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            </div>
            <div>
              <strong className="text-white">End Dot Marker:</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Pinpoints the latest Current Market Price (CMP) at the end of the 30-day timeline.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <div className="w-8 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">+4.7%</span>
            </div>
            <div>
              <strong className="text-white">Percentage Metric (+/- %):</strong>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Shows the exact percentage delta of the current price above or below the 50-DMA.
                <span className="block text-amber-300 font-medium mt-1">
                  Sweet Spot: Between +1% and +8% above 50-DMA. Stocks &gt;12% above may be over-extended and subject to mean-reversion pullbacks.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
