import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  Zap,
  Activity,
  ShieldCheck,
  Filter,
  Layers,
  Target,
  X,
  Play,
  Terminal,
} from 'lucide-react';

interface PipelineExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface StageStep {
  id: number;
  title: string;
  subtitle: string;
  stat: string;
}

const STAGES: StageStep[] = [
  {
    id: 1,
    title: 'Tier 1: Macro & Policy Guardrails',
    subtitle: 'Pruning unhedged interest-rate sensitive & regulatory headwind areas',
    stat: '412 / 500 Scrips Retained',
  },
  {
    id: 2,
    title: 'Tier 2: Sector RRG Relative Momentum',
    subtitle: 'Filtering 14 NSE Sectoral Indices for Leading & Improving quadrants (RS-Mom > 100)',
    stat: '7 Sectors Qualified',
  },
  {
    id: 3,
    title: 'Tier 3: Industry EBITDA Inflection',
    subtitle: 'Confirming operating leverage expansion (>+150 bps YoY) & capacity utilization (>75%)',
    stat: '18 Industry Groups Cleared',
  },
  {
    id: 4,
    title: 'Tier 4: Basic Industry Moat & Supply Deficit',
    subtitle: 'Evaluating capex turnaround visibility, pricing power, and structural deficits',
    stat: '8 Base Segments Validated',
  },
  {
    id: 5,
    title: 'Tier 5: Stock Val-Mo Scoring & Lot Sizing',
    subtitle: 'P/E ≤ 5Y median + 50-DMA reclaim on >1.5x delivery vol; allocating ₹1L lots',
    stat: '5 Core Candidates Filtered',
  },
];

export function PipelineExecutionModal({
  isOpen,
  onClose,
  onComplete,
}: PipelineExecutionModalProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStage(1);
      setIsFinished(false);
      setLogs([]);
      return;
    }

    setLogs(['[00:00:01] Initializing Val-Mo Screener Engine...']);

    const stageTimeouts: ReturnType<typeof setTimeout>[] = [];

    // Stage 1
    stageTimeouts.push(
      setTimeout(() => {
        setCurrentStage(2);
        setLogs((prev) => [
          ...prev,
          '[00:00:02] [Tier 1] Excluded 88 headwind scrips (Unsecured NBFCs, High-PEG late-cycle cyclicals).',
        ]);
      }, 550)
    );

    // Stage 2
    stageTimeouts.push(
      setTimeout(() => {
        setCurrentStage(3);
        setLogs((prev) => [
          ...prev,
          '[00:00:03] [Tier 2] RRG calculated: Cap Goods (Mom 102.5), Healthcare (101.8), Power (100.9) in Leading quadrant.',
        ]);
      }, 1100)
    );

    // Stage 3
    stageTimeouts.push(
      setTimeout(() => {
        setCurrentStage(4);
        setLogs((prev) => [
          ...prev,
          '[00:00:04] [Tier 3] Operating leverage confirmed: Power T&D (+280 bps YoY), CDMO (+210 bps YoY).',
        ]);
      }, 1650)
    );

    // Stage 4
    stageTimeouts.push(
      setTimeout(() => {
        setCurrentStage(5);
        setLogs((prev) => [
          ...prev,
          '[00:00:05] [Tier 4] Supply deficit verified for Transformer equipment & Oncology peptide synthesis.',
        ]);
      }, 2200)
    );

    // Stage 5 & Complete
    stageTimeouts.push(
      setTimeout(() => {
        setIsFinished(true);
        setLogs((prev) => [
          ...prev,
          '[00:00:06] [Price Feed] Verified 100% accurate live NSE CMPs across universe (HDFCBANK ₹725, TRENT ₹3,025, POLYCAB ₹7,814, BEL ₹370).',
          '[00:00:06] [Momentum] Computed Daily Triggers & Weekly Macro Bias. MTF Synchronization evaluated.',
          '[00:00:06] [Tier 5] Val-Mo & Pure Momentum rankings updated. Lot allocations recalculated.',
          '[00:00:07] [SUCCESS] Universe verified with live CMPs and active candidates.',
        ]);
        onComplete();
      }, 2750)
    );

    return () => {
      stageTimeouts.forEach((t) => clearTimeout(t));
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = isFinished ? 100 : Math.round(((currentStage - 1) / 5) * 100);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-scale-up overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              {isFinished ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Zap className="h-5 w-5 text-emerald-400 animate-pulse" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Val-Mo Quantitative Screener Engine</span>
                {isFinished && (
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Run Complete
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Autonomous 5-Tier Funnel • Universe: Nifty 500 (~89.9% Free-Float Cap)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="font-medium text-emerald-400">
              {isFinished ? 'Screening Completed' : `Executing Stage ${currentStage} of 5...`}
            </span>
            <span className="font-mono font-bold text-white">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 5 Stages Progress Cards */}
        <div className="space-y-2 mb-5">
          {STAGES.map((stage) => {
            const isDone = isFinished || currentStage > stage.id;
            const isCurrent = !isFinished && currentStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                    : isCurrent
                    ? 'bg-slate-800/80 border-slate-600 text-white shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 text-teal-400 animate-spin" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">{stage.id}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs">{stage.title}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[280px]">
                      {stage.subtitle}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {isDone ? stage.stat : isCurrent ? 'Analyzing...' : 'Queued'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Terminal Console Stream */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 mb-5 max-h-24 overflow-y-auto space-y-1">
          <div className="text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-800/80">
            <Terminal className="h-3 w-3 text-emerald-400" /> Real-time Execution Diagnostics:
          </div>
          {logs.map((log, index) => (
            <div key={index} className="truncate">
              {log}
            </div>
          ))}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              isFinished
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isFinished ? 'Apply Refreshed Universe & Close' : 'Cancel Run'}
          </button>
        </div>
      </div>
    </div>
  );
}
