'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { positionSize, riskReward } from '../../lib/core/risk';

export function RiskTools() {
  const analysis = useAppStore((state) => state.analysis);
  const [risk, setRisk] = useState(500);
  const [entry, setEntry] = useState(() => analysis?.levels.entry ?? 0);
  const [stop, setStop] = useState(() => analysis?.levels.stop ?? 0);
  const [target, setTarget] = useState(() => analysis?.levels.target ?? 0);
  const bias = analysis ? (analysis.execution.includes('buy') ? 'long' : 'short') : 'long';

  useEffect(() => {
    if (analysis) {
      setEntry(analysis.levels.entry);
      setStop(analysis.levels.stop);
      setTarget(analysis.levels.target);
    }
  }, [analysis]);

  const rr = useMemo(() => riskReward(entry, stop, target, bias === 'long' ? 'long' : 'short'), [entry, stop, target, bias]);
  const size = useMemo(
    () => positionSize({ riskDollars: risk, entry, stop, bias: bias === 'long' ? 'long' : 'short' }),
    [risk, entry, stop, bias]
  );

  return (
    <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm shadow">
      <header>
        <h3 className="text-base font-semibold text-slate-100">Risk Tools</h3>
        <p className="text-xs text-slate-500">Position sizing with R:R guidance.</p>
      </header>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <label className="space-y-1">
          <span className="text-slate-400">Risk ($)</span>
          <input
            type="number"
            value={risk}
            onChange={(event) => setRisk(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-400">Entry</span>
          <input
            type="number"
            value={entry}
            onChange={(event) => setEntry(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-400">Stop</span>
          <input
            type="number"
            value={stop}
            onChange={(event) => setStop(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-1">
          <span className="text-slate-400">Target</span>
          <input
            type="number"
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>R:R</span>
        <span>{rr}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>Size (shares/contracts)</span>
        <span>{size}</span>
      </div>
      <button
        className="w-full rounded-md bg-accent/30 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-accent"
        onClick={() => {
          const line = `Risk ${risk} | Entry ${entry} | Stop ${stop} | Target ${target} | Size ${size}`;
          navigator.clipboard.writeText(line).catch(console.error);
        }}
      >
        Copy Summary
      </button>
    </section>
  );
}
