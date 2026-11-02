import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { MacroSector } from '../types/strategy';
import { Activity, Info, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface SectorTreemapProps {
  sectors: MacroSector[];
  selectedSectorId: string;
  onSelectSector: (sectorId: string) => void;
}

interface TreemapNode extends d3.HierarchyRectangularNode<any> {
  data: {
    id: string;
    name: string;
    weightPct: number;
    rsMomentum: number;
    rsRatio: number;
    quadrant: string;
    macroStatus: string;
    catalysts?: string[];
  };
}

export function SectorTreemap({
  sectors,
  selectedSectorId,
  onSelectSector,
}: SectorTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSector, setHoveredSector] = useState<MacroSector | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 320 });

  // Handle dynamic resize
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Maintain attractive institutional aspect ratio
      const height = Math.max(300, Math.min(380, Math.round(width * 0.38)));
      setDimensions({ width: Math.max(320, width), height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute D3 Treemap layout
  const rootNode = useMemo(() => {
    const data = {
      name: 'Nifty 500',
      children: sectors.map((s) => ({
        ...s,
        value: s.weightPct,
      })),
    };

    const hierarchy = d3
      .hierarchy(data)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const treemapLayout = d3
      .treemap<any>()
      .size([dimensions.width, dimensions.height])
      .paddingInner(3)
      .paddingOuter(2)
      .round(true);

    return treemapLayout(hierarchy);
  }, [sectors, dimensions]);

  // Interpolate institutional color scale based on RS-Momentum
  const getColor = (rsMomentum: number, isSelected: boolean) => {
    // 102+ : Leading (Strong Green / Emerald)
    // 100 - 102 : Improving (Teal / Cyan)
    // 98 - 100 : Weakening (Amber / Gold)
    // <98 : Lagging (Crimson / Rose)
    if (rsMomentum >= 102.5) return isSelected ? '#10b981' : '#059669';
    if (rsMomentum >= 101.0) return isSelected ? '#14b8a6' : '#0d9488';
    if (rsMomentum >= 100.0) return isSelected ? '#06b6d4' : '#0891b2';
    if (rsMomentum >= 98.0) return isSelected ? '#f59e0b' : '#d97706';
    return isSelected ? '#f43f5e' : '#e11d48';
  };

  const leaves = (rootNode.leaves() as TreemapNode[]) || [];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Treemap Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded border border-emerald-400/20">
              <PieChart className="h-3 w-3" /> Relative Strength Heatmap
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Nifty 500 Market Cap &amp; Momentum Treemap
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tile size = Nifty 500 Sector Weight % • Tile color = RRG RS-Momentum velocity • Click any tile to filter hierarchy below
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/80 text-[10px]">
          <span className="text-slate-400 font-semibold px-1">RS-Mom Scale:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block" />
            <span className="text-slate-300">&lt;98 (Lagging)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
            <span className="text-slate-300">98–100 (Weakening)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block" />
            <span className="text-slate-300">100–101 (Improving)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
            <span className="text-slate-300">&gt;101 (Leading)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="w-full relative overflow-hidden rounded-xl bg-slate-950/90 border border-slate-800/80">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="select-none overflow-hidden block"
        >
          {leaves.map((leaf) => {
            const w = Math.max(0, leaf.x1 - leaf.x0);
            const h = Math.max(0, leaf.y1 - leaf.y0);
            const isSelected = leaf.data.id === selectedSectorId;
            const isHovered = hoveredSector?.id === leaf.data.id;
            const fillColor = getColor(leaf.data.rsMomentum, isSelected);

            // Hide or condense text if cell is too small
            const showName = w > 65 && h > 35;
            const showDetails = w > 90 && h > 55;
            const showExtra = w > 140 && h > 80;

            return (
              <g
                key={leaf.data.id}
                transform={`translate(${leaf.x0}, ${leaf.y0})`}
                onClick={() => onSelectSector(leaf.data.id)}
                onMouseEnter={() => setHoveredSector(leaf.data as MacroSector)}
                onMouseLeave={() => setHoveredSector(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Treemap Cell Background */}
                <rect
                  width={w}
                  height={h}
                  rx={5}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
                  stroke={isSelected ? '#34d399' : isHovered ? '#ffffff' : '#0f172a'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 1}
                  className="transition-all duration-150"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.4))' : 'none',
                  }}
                />

                {/* Subtle Gradient Overlay */}
                <rect
                  width={w}
                  height={h}
                  rx={5}
                  fill="url(#cell-overlay-grad)"
                  opacity={0.35}
                  pointerEvents="none"
                />

                {/* Cell Content Text (Formatted for financial terminal density) */}
                {showName && (
                  <foreignObject width={w} height={h} className="pointer-events-none p-2">
                    <div className="h-full flex flex-col justify-between overflow-hidden text-white font-sans">
                      <div>
                        <div className="font-black text-xs leading-tight drop-shadow truncate">
                          {leaf.data.name}
                        </div>
                        <div className="text-[11px] font-bold text-white/90 drop-shadow mt-0.5 font-mono">
                          {leaf.data.weightPct}% Weight
                        </div>
                      </div>

                      {showDetails && (
                        <div className="mt-auto flex items-center justify-between text-[10px] text-white/90">
                          <span className="font-mono bg-black/40 px-1 py-0.2 rounded font-semibold">
                            Mom: {leaf.data.rsMomentum}
                          </span>
                          {showExtra && (
                            <span className="bg-black/30 px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase tracking-wider">
                              {leaf.data.quadrant}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="cell-overlay-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Detail Tooltip on Hover */}
        {hoveredSector && (
          <div className="absolute bottom-2 right-2 bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs pointer-events-none z-20 max-w-xs animate-fade-in">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-black text-white">{hoveredSector.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                hoveredSector.quadrant === 'Leading' ? 'bg-emerald-500/20 text-emerald-300' :
                hoveredSector.quadrant === 'Improving' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {hoveredSector.quadrant}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 mb-1 font-mono">
              <div>Weight: <strong className="text-white">{hoveredSector.weightPct}%</strong></div>
              <div>RS-Mom: <strong className="text-emerald-400">{hoveredSector.rsMomentum}</strong></div>
              <div>RS-Ratio: <strong>{hoveredSector.rsRatio}</strong></div>
              <div>Status: <strong className={hoveredSector.macroStatus === 'Tailwind' ? 'text-emerald-400' : 'text-slate-400'}>{hoveredSector.macroStatus}</strong></div>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Click tile to filter drill-down hierarchy to this sector
            </div>
          </div>
        )}
      </div>

      {/* Selected Sector Context Strip */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Active Treemap Selection: <strong className="text-white font-semibold">{sectors.find((s) => s.id === selectedSectorId)?.name}</strong> ({sectors.find((s) => s.id === selectedSectorId)?.weightPct}% Weight)
        </span>
        <span className="text-[11px] text-teal-400 font-medium hidden sm:inline">
          Tip: Click any sector tile to navigate its industries and constituent scrips below
        </span>
      </div>
    </div>
  );
}
