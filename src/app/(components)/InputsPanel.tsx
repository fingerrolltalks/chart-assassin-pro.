'use client';

import { FormEvent, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

type ModeOption = 'scalp' | 'swing' | 'position';

const timeframes = ['5m', '15m', '30m', '1h', '4h', '1d'];
const modes: Array<{ label: string; value: ModeOption }> = [
  { label: 'Scalp', value: 'scalp' },
  { label: 'Swing', value: 'swing' },
  { label: 'Position', value: 'position' }
];

export function InputsPanel() {
  const ticker = useAppStore((state) => state.ticker);
  const timeframe = useAppStore((state) => state.timeframe);
  const mode = useAppStore((state) => state.mode);
  const catalysts = useAppStore((state) => state.catalysts);
  const setTicker = useAppStore((state) => state.setTicker);
  const setTimeframe = useAppStore((state) => state.setTimeframe);
  const setMode = useAppStore((state) => state.setMode);
  const addCatalyst = useAppStore((state) => state.addCatalyst);
  const removeCatalyst = useAppStore((state) => state.removeCatalyst);
  const setData = useAppStore((state) => state.setData);
  const setAnalysis = useAppStore((state) => state.setAnalysis);
  const pushMessage = useAppStore((state) => state.pushMessage);
  const setLoadingStore = useAppStore((state) => state.setLoading);

  const [catalystDraft, setCatalystDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddCatalyst = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const value = catalystDraft.trim();
      if (!value) return;
      addCatalyst(value);
      setCatalystDraft('');
    },
    [addCatalyst, catalystDraft]
  );

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    setLoadingStore(true);

    try {
      const symbol = ticker.trim().toUpperCase();
      if (!symbol) throw new Error('Ticker required');

      const tf = timeframe;
      const response = await fetch(
        `/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}&limit=500`,
        { cache: 'no-store' }
      );
      const json = await response.json();
      if (!response.ok || !Array.isArray(json?.candles) || json.candles.length < 20) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load candles');
      }

      const candles = json.candles.map((bar: any) => ({
        ts: Number(bar.t),
        open: Number(bar.o),
        high: Number(bar.h),
        low: Number(bar.l),
        close: Number(bar.c),
        volume: Number(bar.v ?? 0)
      }));

      setData(candles);

      const ohlcv = candles.map((bar: any) => [bar.ts, bar.open, bar.high, bar.low, bar.close, bar.volume]);

      const plan = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe: tf, mode, ohlcv })
      });

      const data = await plan.json();
      if (!plan.ok || !data?.report) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Analyze failed');
      }

      const lines = String(data.report).split('\n').map((line: string) => line.trim()).filter(Boolean);
      const firstLine = lines[0] ?? '';
      let regime: 'bull' | 'bear' | 'neutral' = 'neutral';
      if (firstLine.toLowerCase().includes('bull')) regime = 'bull';
      else if (firstLine.toLowerCase().includes('bear')) regime = 'bear';

      const execution = lines.at(-1) ?? '';
      const bullets = lines.slice(1, Math.max(1, lines.length - 1));

      setAnalysis({
        regime,
        bullets,
        execution,
        confidence: Math.round((Number(data.stats?.confidence ?? 0) * 100) || 0),
        rr: Number(data.stats?.rr ?? 0),
        levels: {
          entry: Number(data.levels?.entry ?? 0),
          stop: Number(data.levels?.stop ?? 0),
          target: Number(data.levels?.target ?? 0)
        }
      });

      pushMessage({
        role: 'assistant',
        content: data.report,
        createdAt: Date.now()
      });
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
      setLoadingStore(false);
    }
  }, [mode, pushMessage, setAnalysis, setData, setLoadingStore, timeframe, ticker]);

  return (
    <motion.section
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow"
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-100">Trading Inputs</h2>
        <p className="text-xs text-slate-400">Configure symbol, timeframe, mode, and catalysts before generating insight.</p>
      </header>

      <div className="space-y-3 text-sm text-slate-200">
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">Ticker</span>
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            placeholder="AAPL"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">Timeframe</span>
          <select
            value={timeframe}
            onChange={(event) => setTimeframe(event.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
          >
            {timeframes.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2">
          <legend className="text-xs uppercase tracking-wide text-slate-500">Mode</legend>
          <div className="flex flex-wrap gap-2">
            {modes.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={`rounded-md border px-3 py-1 text-xs transition ${
                  mode === option.value
                    ? 'border-accent bg-accent/30 text-slate-900'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-accent hover:text-accent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <form onSubmit={handleAddCatalyst} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={catalystDraft}
              onChange={(event) => setCatalystDraft(event.target.value)}
              placeholder="Add catalyst (earnings, FOMC, etc.)"
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-accent/40 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-accent"
            >
              Add
            </button>
          </div>
          {catalysts.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-xs">
              {catalysts.map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeCatalyst(item)}
                    className="text-slate-400 transition hover:text-red-400"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>

      {error && <p className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex-1 rounded-md bg-accent/50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate Plan'}
        </button>
      </div>
    </motion.section>
  );
}
