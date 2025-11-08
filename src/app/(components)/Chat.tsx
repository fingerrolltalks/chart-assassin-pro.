'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { toOhlcvTuples } from '../../lib/utils/csv';
import type { PatternDetection } from '../../lib/tech/patternEngine';

const quickPrompts = [
  'Analyze AAPL 15m scalp using latest live data.',
  'Generate a swing plan for NVDA daily with manual catalysts: earnings next week, VIX sub-18.',
  'Detect patterns on QQQ and propose entries with ATR stops.',
  'Size a position with $500 risk from 450 entry, 447.8 stop.'
];

export function Chat() {
  const { ticker, timeframe, mode, catalysts, data, loading } = useAppStore((state) => state);
  const pushMessage = useAppStore((state) => state.pushMessage);
  const setAnalysis = useAppStore((state) => state.setAnalysis);
  const setPatterns = useAppStore((state) => state.setPatterns);
  const setLoading = useAppStore((state) => state.setLoading);
  const messages = useAppStore((state) => state.messages);

  const [prompt, setPrompt] = useState('');

  const disabled = useMemo(() => !data || data.length === 0 || loading, [data, loading]);

  const runAnalysis = useCallback(
    async (customPrompt?: string) => {
      if (!data || data.length === 0) {
        alert('No live data detected. Please refresh or re-fetch candles.');
        return;
      }

      const userPrompt = customPrompt ?? prompt;
      pushMessage({ role: 'user', content: userPrompt || 'Generate plan', createdAt: Date.now() });

      try {
        setLoading(true);

        const body = {
          ticker,
          timeframe,
          mode,
          catalysts,
          ohlcv: toOhlcvTuples(data), // this now uses your live candles
        };

        const [patternRes, analyzeRes] = await Promise.all([
          fetch('/api/pattern', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ohlcv: body.ohlcv }),
          }),
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
        ]);

        if (!patternRes.ok || !analyzeRes.ok) {
          throw new Error('API error — check console logs.');
        }

        const patternJson = (await patternRes.json()) as { patterns: PatternDetection[] };
        const analysisJson = await analyzeRes.json();

        // Save to store
        setPatterns(patternJson.patterns);

        const lines = analysisJson.report?.split('\n') ?? [];
        setAnalysis({
          regime: analysisJson.regime ?? 'neutral',
          bullets: lines.slice(1, Math.max(1, lines.length - 1)),
          execution: lines.at(-1) ?? '',
          confidence: analysisJson.stats?.confidence ?? 0,
          rr: analysisJson.stats?.rr ?? 0,
          levels: analysisJson.levels ?? { entry: 0, stop: 0, target: 0 },
        });

        pushMessage({
          role: 'assistant',
          content: analysisJson.report || 'No report generated.',
          createdAt: Date.now(),
        });

        setPrompt('');
      } catch (error) {
        console.error(error);
        pushMessage({
          role: 'assistant',
          content: '❌ Unable to generate analysis. Check your live feed or API key.',
          createdAt: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [data, ticker, timeframe, mode, catalysts, prompt, pushMessage, setAnalysis, setPatterns, setLoading]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl"
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Assistant</h2>
          <p className="text-xs text-slate-400">
            Real-time tactical output with full regime + pattern context.
          </p>
        </div>
        <button
          disabled={disabled}
          onClick={() => runAnalysis()}
          className="rounded-md bg-accent/40 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate Plan'}
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm">
        {messages.length === 0 ? (
          <p className="text-slate-500">Prompt the assistant or use quick suggestions below.</p>
        ) : (
          messages.map((message) => (
            <div key={message.createdAt} className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-slate-500">{message.role}</span>
              <pre className="whitespace-pre-wrap rounded-md bg-slate-900/80 p-3 text-slate-200">
                {message.content}
              </pre>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Detail the setup, risk, or ask for alternative plays."
          className="h-24 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none"
        />
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {quickPrompts.map((item) => (
            <button
              key={item}
              onClick={() => runAnalysis(item)}
              className="rounded-full border border-slate-700 px-3 py-1 transition hover:border-accent hover:text-accent"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
