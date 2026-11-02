import React, { useState } from 'react';
import { X, DollarSign, Sliders, RefreshCw, PlusCircle, ShieldCheck, ArrowRight, Check, AlertCircle, Info } from 'lucide-react';

export interface CapitalConfig {
  baseCapital: number;
  monthlyInflow: number;
  targetLiquidBufferPct: number;
  targetStockCount: number;
  minPositionSize: number;
  maxScripsPerSector: number; // 1, 2, 3, or 0 (0 = Unlimited)
}

interface SeedFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CapitalConfig;
  onSaveConfig: (newConfig: CapitalConfig) => void;
  onInjectMonthlyInflow: (amount: number) => void;
  onResetPortfolioWithSeed: (seedAmount: number) => void;
  currentCash: number;
  currentLiquidBuffer: number;
  currentEquitiesVal: number;
}

export function SeedFundModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onInjectMonthlyInflow,
  onResetPortfolioWithSeed,
  currentCash,
  currentLiquidBuffer,
  currentEquitiesVal,
}: SeedFundModalProps) {
  const [baseCapital, setBaseCapital] = useState(config.baseCapital);
  const [monthlyInflow, setMonthlyInflow] = useState(config.monthlyInflow);
  const [liquidPct, setLiquidPct] = useState(config.targetLiquidBufferPct);
  const [stockCount, setStockCount] = useState(config.targetStockCount);
  const [maxPerSector, setMaxPerSector] = useState(config.maxScripsPerSector ?? 2);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Computed projections
  const targetLiquidAmount = Math.round((baseCapital * liquidPct) / 100);
  const targetEquityPool = baseCapital - targetLiquidAmount;
  const targetLotSize = Math.round(targetEquityPool / stockCount);

  const handleSave = () => {
    onSaveConfig({
      baseCapital,
      monthlyInflow,
      targetLiquidBufferPct: liquidPct,
      targetStockCount: stockCount,
      minPositionSize: Math.max(10000, Math.round(targetLotSize * 0.75)),
      maxScripsPerSector: maxPerSector,
    });
    setToastMsg('Capital configuration saved successfully!');
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 1200);
  };

  const handleInjectInflow = () => {
    onInjectMonthlyInflow(monthlyInflow);
    setToastMsg(`Injected +₹${monthlyInflow.toLocaleString('en-IN')} into Staging Reserve Pool!`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleResetSeed = () => {
    onResetPortfolioWithSeed(baseCapital);
    setShowResetConfirm(false);
    setToastMsg(`Portfolio re-initialized with ₹${baseCapital.toLocaleString('en-IN')} seed fund!`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-slate-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Seed Fund &amp; Capital Architecture Settings</span>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Interactive Allocator
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Customize your initial deployment capital, monthly staging inflows, and regime cash buffers.
            </p>
          </div>
        </div>

        {toastMsg && (
          <div className="mb-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Current Active Allocation Strip */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 mb-5 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Equities</div>
            <div className="text-sm font-bold text-white mt-0.5">₹{currentEquitiesVal.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tactical Cash</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">₹{currentCash.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Liquid Reserve (Staging)</div>
            <div className="text-sm font-bold text-teal-400 mt-0.5">₹{currentLiquidBuffer.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Sliders & Inputs Section */}
        <div className="space-y-5">
          {/* Base Capital */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>1. Initial Base Seed Capital</span>
                </label>
                <span className="text-[11px] text-slate-400">Starting corpus for delivery CNC allocation (no leverage).</span>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-emerald-400 font-mono">
                  ₹{baseCapital.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <input
              type="range"
              min={25000}
              max={1000000}
              step={5000}
              value={baseCapital}
              onChange={(e) => setBaseCapital(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
              {[50000, 100000, 200000, 500000, 1000000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBaseCapital(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    baseCapital === preset
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  ₹{(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Staged Inflow (SIP) */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-white">2. Monthly Systematic Inflow (Staged SIP)</label>
                <span className="text-[11px] text-slate-400 block">
                  Deposited into Liquid BeES / Staging Buffer to avoid micro-lot DP charge drag.
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-teal-400 font-mono">
                  +₹{monthlyInflow.toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>

            <input
              type="range"
              min={2000}
              max={100000}
              step={1000}
              value={monthlyInflow}
              onChange={(e) => setMonthlyInflow(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />

            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
                {[5000, 10000, 20000, 30000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMonthlyInflow(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      monthlyInflow === preset
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    ₹{(preset / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>

              {/* Instant Inflow Inject Button */}
              <button
                type="button"
                onClick={handleInjectInflow}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all cursor-pointer"
                title="Add 1 month inflow into your staging buffer right now"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Simulate Inflow (+₹{monthlyInflow.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </div>

          {/* Liquid Reserve Buffer & Stock Concentration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Liquid Buffer % */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-white">Liquid Reserve %</label>
                <span className="text-xs font-bold text-amber-400 font-mono">{liquidPct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                step={5}
                value={liquidPct}
                onChange={(e) => setLiquidPct(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Sideways baseline: 40%</span>
                <span className="text-amber-300 font-mono">₹{targetLiquidAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Target Stock Count */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-white">Target Stock Count</label>
                <span className="text-xs font-bold text-cyan-400 font-mono">{stockCount} Stocks</span>
              </div>
              <input
                type="range"
                min={3}
                max={15}
                step={1}
                value={stockCount}
                onChange={(e) => setStockCount(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Model rule: 5 to 7 names</span>
                <span className="text-cyan-300 font-mono">~₹{targetLotSize.toLocaleString('en-IN')}/lot</span>
              </div>
            </div>

            {/* Sector Concentration Cap */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-xs font-bold text-white">Sector Concentration Limit</label>
                  <span className="text-[11px] text-slate-400 block">
                    Caps maximum scrips selected from any single macro sector during screening.
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {maxPerSector === 0 ? 'Unlimited' : `Max ${maxPerSector} / Sector`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 1, label: '1 / Sector', desc: 'Strict Diversification' },
                  { value: 2, label: '2 / Sector', desc: 'Balanced Momentum' },
                  { value: 3, label: '3 / Sector', desc: 'Sector Conviction' },
                  { value: 0, label: 'Unlimited', desc: 'Pure Factor Ranking' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMaxPerSector(opt.value)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      maxPerSector === opt.value
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Allocation Architecture Summary Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Calculated Lot Sizing Output:</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Rule Validated
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Deployable Equity</span>
                <strong className="text-white font-mono">₹{targetEquityPool.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Staging Reserve</span>
                <strong className="text-teal-400 font-mono">₹{targetLiquidAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Target Lot Size</span>
                <strong className="text-emerald-400 font-mono">₹{targetLotSize.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Min Position Floor</span>
                <strong className="text-cyan-400 font-mono">₹{Math.max(10000, Math.round(targetLotSize * 0.75)).toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              *Positions are capped at ₹{targetLotSize.toLocaleString('en-IN')} per stock. Pyramiding into winners takes funds from the Staging Reserve Pool.
            </p>
          </div>
        </div>

        {/* Reset Confirmation Drawer */}
        {showResetConfirm && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2 animate-fade-in">
            <div className="font-bold flex items-center gap-1.5 text-rose-300">
              <AlertCircle className="h-4 w-4" />
              <span>Reset &amp; Re-initialize Portfolio?</span>
            </div>
            <p className="text-[11px] text-slate-300">
              This will clear active paper positions and reset the cash balance and staging pool to match your new seed capital of ₹{baseCapital.toLocaleString('en-IN')}.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetSeed}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Yes, Reset Portfolio
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to New Seed Amount</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Apply &amp; Save Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
