'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { RiskTools } from './RiskTools';

export function RightRail() {
  const analysis = useAppStore((state) => state.analysis);
  const patterns = useAppStore((state) => state.patterns);
  const catalysts = useAppStore((state) => state.catalysts);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow">
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Regime</h3>
          <span className="text-xs uppercase tracking-wide text-slate-500">macro</span>
        </header>
        {analysis ? (
          <div className="space-y-2 text-sm text-slate-200">
            <p className="text-lg font-bold">
              {analysis.regime === 'bull' ? '🐂 Bull' : analysis.regime === 'bear' ? '🐻 Bear' : '😐 Neutral'}
            </p>
            <p className="text-xs text-slate-400">Confidence {analysis.confidence}% | R:R {analysis.rr}</p>
            <p className="text-xs text-slate-400">Entry {analysis.levels.entry.toFixed(2)} | Stop {analysis.levels.stop.toFixed(2)} | Target {analysis.levels.target.toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Run the assistant to populate regime signals.</p>
        )}
      </section>
      <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow">
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Pattern Engine</h3>
          <span className="text-xs uppercase tracking-wide text-slate-500">structure</span>
        </header>
        {patterns.length ? (
          <ul className="space-y-2 text-xs text-slate-300">
            {patterns.map((pattern) => (
              <li
                key={`${pattern.type}-${pattern.startIndex}-${pattern.endIndex}`}
                className="flex items-center justify-between rounded-md bg-slate-950/60 px-3 py-2"
              >
                <span className="capitalize">{pattern.type}</span>
                <span>{Math.round(pattern.score * 100)}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">No patterns detected yet.</p>
        )}
      </section>
      <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow">
        <header className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Catalyst Deck</h3>
          <span className="text-xs uppercase tracking-wide text-slate-500">macro</span>
        </header>
        {catalysts.length ? (
          <ul className="space-y-1 text-xs text-slate-300">
            {catalysts.map((catalyst) => (
              <li key={catalyst} className="rounded-md bg-slate-950/60 px-3 py-2">
                {catalyst}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Add catalysts in the input panel to track events.</p>
        )}
      </section>
      <RiskTools />
    </motion.aside>
  );
}
