'use client';

import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { parseCsv, parseJson, type Candle } from '../../lib/utils/csv';
import { useAppStore } from '../../store/useAppStore';

const timeframes = ['1m', '5m', '15m', '1h', '4h', 'D'];

function parseFile(file: File): Promise<Candle[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        if (file.name.endsWith('.json')) {
          resolve(parseJson(text));
        } else {
          resolve(parseCsv(text));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newCatalyst, setNewCatalyst] = useState('');

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const data = await parseFile(file);
        if (!data.length) {
          setUploadError('No candles parsed from file.');
        } else {
          setData(data);
          setUploadError(null);
        }
      } catch (error) {
        console.error(error);
        setUploadError('Failed to parse file. Ensure CSV or JSON OHLCV format.');
      }
    },
    [setData]
  );

  const catalystTags = useMemo(
    () =>
      catalysts.map((tag) => (
        <button
          key={tag}
          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
          onClick={() => removeCatalyst(tag)}
        >
          {tag} ✕
        </button>
      )),
    [catalysts, removeCatalyst]
  );

  return (
    <motion.section
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl"
    >
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Inputs</h2>
        <p className="text-xs text-slate-400">Configure the setup before running the assistant.</p>
      </header>
      <div className="space-y-4 text-sm">
        <div className="space-y-2">
          <label className="flex flex-col gap-2">
            <span className="text-slate-300">Ticker</span>
            <input
              value={ticker}
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 uppercase text-slate-100 focus:border-accent focus:outline-none"
              placeholder="SPY"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-slate-300">Timeframe</span>
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-accent focus:outline-none"
            >
              {timeframes.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-slate-300">Mode</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as typeof mode)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-accent focus:outline-none"
            >
              <option value="scalp">Scalp (1–15m)</option>
              <option value="swing">Swing (4h–D)</option>
              <option value="position">Position (Multi-day)</option>
            </select>
          </label>
        </div>
        <div className="space-y-2">
          <span className="text-slate-300">Catalysts</span>
          <div className="flex flex-wrap gap-2">{catalystTags}</div>
          <div className="flex items-center gap-2">
            <input
              value={newCatalyst}
              onChange={(event) => setNewCatalyst(event.target.value)}
              placeholder="Add catalyst (e.g. CPI tomorrow)"
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => {
                if (newCatalyst.trim()) {
                  addCatalyst(newCatalyst.trim());
                  setNewCatalyst('');
                }
              }}
              className="rounded-md bg-accent/40 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-accent"
            >
              Add
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-slate-300">Upload OHLCV (CSV or JSON)</label>
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            className="w-full cursor-pointer rounded-md border border-dashed border-slate-700 bg-slate-950 px-3 py-4 text-xs text-slate-400"
          />
          {uploadError ? <p className="text-xs text-danger">{uploadError}</p> : null}
        </div>
      </div>
    </motion.section>
  );
}
