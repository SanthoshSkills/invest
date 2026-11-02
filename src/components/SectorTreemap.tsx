import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { MacroSector, RrgQuadrant } from '../types/strategy';
import { PieChart, CheckSquare, Square, RotateCcw, Check, X, Filter } from 'lucide-react';

export interface SectorTreemapProps {
  sectors: MacroSector[];
  selectedSectorIds: string[];
  activeFocusSectorId: string;
  onToggleSector: (sectorId: string) => void;
  onSelectOnlySector: (sectorId: string) => void;
  onSelectAllSectors: () => void;
  onClearSectors: () => void;
  selectedQuadrants: RrgQuadrant[];
  onToggleQuadrant: (quadrant: RrgQuadrant) => void;
}

interface TreemapNode extends d3.HierarchyRectangularNode<any> {
  data: {
    id: string;
    name: string;
    weightPct: number;
    rsMomentum: number;
    rsRatio: number;
    quadrant: RrgQuadrant;
    macroStatus: string;
    catalysts?: string[];
  };
}

const QUADRANTS: { id: RrgQuadrant; label: string; activeClass: string; dotClass: string }[] = [
  { id: 'Leading', label: 'Leading', activeClass: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400', dotClass: 'bg-emerald-400' },
  { id: 'Improving', label: 'Improving', activeClass: 'bg-cyan-500 text-slate-950 font-bold border-cyan-400', dotClass: 'bg-cyan-400' },
  { id: 'Weakening', label: 'Weakening', activeClass: 'bg-amber-500 text-slate-950 font-bold border-amber-400', dotClass: 'bg-amber-400' },
  { id: 'Lagging', label: 'Lagging', activeClass: 'bg-rose-500 text-white font-bold border-rose-400', dotClass: 'bg-rose-400' },
];

export function SectorTreemap({
  sectors,
  selectedSectorIds,
  activeFocusSectorId,
  onToggleSector,
  onSelectOnlySector,
  onSelectAllSectors,
  onClearSectors,
  selectedQuadrants,
  onToggleQuadrant,
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

  // Color mapping based on RS-Momentum
  const getColor = (rsMomentum: number, isSelected: boolean) => {
    if (rsMomentum >= 102.5) return isSelected ? '#10b981' : '#059669';
    if (rsMomentum >= 101.0) return isSelected ? '#14b8a6' : '#0d9488';
    if (rsMomentum >= 100.0) return isSelected ? '#06b6d4' : '#0891b2';
    if (rsMomentum >= 98.0) return isSelected ? '#f59e0b' : '#d97706';
    return isSelected ? '#f43f5e' : '#e11d48';
  };

  const leaves = (rootNode.leaves() as TreemapNode[]) || [];

  // Summary calculations
  const totalSelectedWeight = useMemo(() => {
    return Number(
      sectors
        .filter((s) => selectedSectorIds.includes(s.id))
        .reduce((sum, s) => sum + s.weightPct, 0)
        .toFixed(1)
    );
  }, [sectors, selectedSectorIds]);

  const quadrantCounts = useMemo(() => {
    const counts: Record<RrgQuadrant, number> = {
      Leading: 0,
      Improving: 0,
      Weakening: 0,
      Lagging: 0,
    };
    sectors.forEach((s) => {
      counts[s.quadrant] = (counts[s.quadrant] || 0) + 1;
    });
    return counts;
  }, [sectors]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Treemap Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded border border-emerald-400/20">
              <PieChart className="h-3 w-3" /> Relative Strength Heatmap
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Nifty 500 Multi-Sector &amp; Quadrant Filter
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any tile to toggle scrip filtering below • Select quadrants (Leading, Improving, Weakening, Lagging) to filter sectors in bulk
          </p>
        </div>

        {/* Quadrant Quick Selectors & Select All / Clear */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3 text-cyan-400" /> Filter by:
          </span>

          {QUADRANTS.map((quad) => {
            const count = quadrantCounts[quad.id];
            const isActive = selectedQuadrants.includes(quad.id);
            return (
              <button
                key={quad.id}
                onClick={() => onToggleQuadrant(quad.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                  isActive
                    ? quad.activeClass
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
                title={`Filter to all ${quad.label} sectors (${count} sectors)`}
              >
                <span className={`w-2 h-2 rounded-full ${quad.dotClass}`} />
                <span>{quad.label}</span>
                <span className="opacity-75 font-mono text-[10px]">({count})</span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={onSelectAllSectors}
            className="px-2 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            title="Select all 13 macro sectors"
          >
            All Sectors ({sectors.length})
          </button>

          <button
            onClick={onClearSectors}
            className="px-2 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
            title="Reset to default sector"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
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
            const isSelected = selectedSectorIds.includes(leaf.data.id);
            const isFocused = leaf.data.id === activeFocusSectorId;
            const isHovered = hoveredSector?.id === leaf.data.id;
            const fillColor = getColor(leaf.data.rsMomentum, isSelected);

            const showName = w > 65 && h > 35;
            const showDetails = w > 90 && h > 55;
            const showExtra = w > 140 && h > 80;

            return (
              <g
                key={leaf.data.id}
                transform={`translate(${leaf.x0}, ${leaf.y0})`}
                onClick={() => onToggleSector(leaf.data.id)}
                onMouseEnter={() => setHoveredSector(leaf.data as MacroSector)}
                onMouseLeave={() => setHoveredSector(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Treemap Cell Background */}
                <rect
                  width={w}
                  height={h}
                  rx={6}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.95 : isHovered ? 0.65 : 0.28}
                  stroke={isSelected ? '#34d399' : isHovered ? '#ffffff' : '#1e293b'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 1}
                  className="transition-all duration-150"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.45))' : 'none',
                  }}
                />

                {/* Subtle Gradient Overlay */}
                <rect
                  width={w}
                  height={h}
                  rx={6}
                  fill="url(#cell-overlay-grad)"
                  opacity={isSelected ? 0.35 : 0.15}
                  pointerEvents="none"
                />

                {/* Cell Content Text (Formatted for financial terminal density) */}
                {showName && (
                  <foreignObject width={w} height={h} className="pointer-events-none p-2">
                    <div className="h-full flex flex-col justify-between overflow-hidden text-white font-sans">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-black text-xs leading-tight truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {leaf.data.name}
                          </span>
                          {/* Selected Checkbox Indicator */}
                          <span className={`shrink-0 text-[10px] px-1 py-0.2 rounded font-mono font-bold ${
                            isSelected
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-400/40'
                              : 'bg-black/40 text-slate-400'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <div className={`text-[11px] font-bold drop-shadow mt-0.5 font-mono ${isSelected ? 'text-white/95' : 'text-slate-400'}`}>
                          {leaf.data.weightPct}% Weight
                        </div>
                      </div>

                      {showDetails && (
                        <div className="mt-auto flex items-center justify-between text-[10px] text-white/90">
                          <span className={`font-mono px-1 py-0.2 rounded font-semibold ${isSelected ? 'bg-black/50 text-emerald-300' : 'bg-black/40 text-slate-400'}`}>
                            Mom: {leaf.data.rsMomentum}
                          </span>
                          {showExtra && (
                            <span className="bg-black/40 px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase tracking-wider text-slate-200">
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
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
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
                hoveredSector.quadrant === 'Improving' ? 'bg-cyan-500/20 text-cyan-300' :
                hoveredSector.quadrant === 'Weakening' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {hoveredSector.quadrant}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 mb-1 font-mono">
              <div>Weight: <strong className="text-white">{hoveredSector.weightPct}%</strong></div>
              <div>RS-Mom: <strong className="text-emerald-400">{hoveredSector.rsMomentum}</strong></div>
              <div>RS-Ratio: <strong>{hoveredSector.rsRatio}</strong></div>
              <div>Filter: <strong className={selectedSectorIds.includes(hoveredSector.id) ? 'text-emerald-400' : 'text-slate-400'}>
                {selectedSectorIds.includes(hoveredSector.id) ? 'Selected (Active)' : 'Unselected'}
              </strong></div>
            </div>
            <div className="text-[10px] text-cyan-400 font-medium">
              {selectedSectorIds.length === 1 && selectedSectorIds.includes(hoveredSector.id)
                ? 'Click tile again to select ALL sectors'
                : selectedSectorIds.length === sectors.length
                ? `Click to isolate ${hoveredSector.name}`
                : `Click tile to ${selectedSectorIds.includes(hoveredSector.id) ? 'remove from' : 'add to'} scrip table filter`}
            </div>
          </div>
        )}
      </div>

      {/* Selected Sector Context & Chips Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {selectedSectorIds.length === sectors.length
              ? 'All 13 Macro Sectors Active (100% Universe):'
              : `Filtered (${selectedSectorIds.length} Sector${selectedSectorIds.length > 1 ? 's' : ''} • ${totalSelectedWeight}% Weight):`}
          </span>

          {selectedSectorIds.length === sectors.length ? (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
              All Sectors Selected • Full Nifty 500 Candidate Pool
            </span>
          ) : (
            selectedSectorIds.map((id) => {
              const s = sectors.find((item) => item.id === id);
              if (!s) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 text-[11px] bg-slate-950 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md"
                >
                  <span>{s.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSector(id);
                    }}
                    className="hover:text-white text-emerald-400/80 ml-0.5 cursor-pointer"
                    title={`Remove ${s.name} from filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })
          )}

          {selectedSectorIds.length === 1 && (
            <span className="text-[10px] text-cyan-400/90 italic ml-1">
              (Click tile again to select all sectors)
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Showing scrips from <strong className="text-white">{selectedSectorIds.length}</strong> {selectedSectorIds.length === 1 ? 'sector' : 'sectors'} in table below
        </div>
      </div>
    </div>
  );
}
