'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { parseCsv, parseJson, type Candle } from '../../lib/utils/csv';
import { useAppStore } from '../../store/useAppStore';
import { runPatternEngine } from '../../lib/tech/patternEngine';

type TimeframeOption = '1m' | '5m' | '15m' | '30m' | '1h' | '1d';

const timeframes: TimeframeOption[] = ['1m', '5m', '15m', '30m', '1h', '1d'];

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

type BasicBar = { t: number; o: number; h: number; l: number; c: number; v: number };

function toBars(data: Candle[]): BasicBar[] {
  return data.map((item) => ({
    t: item.ts,
    o: item.open,
    h: item.high,
    l: item.low,
    c: item.close,
    v: item.volume
  }));
}

function toCandles(data: BasicBar[]): Candle[] {
  return data.map((bar) => ({
    ts: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v
  }));
}

export function InputsPanel() {
  const storeTicker = useAppStore((state) => state.ticker);
  const storeTimeframe = useAppStore((state) => state.timeframe);
  const storeMode = useAppStore((state) => state.mode);
  const catalysts = useAppStore((state) => state.catalysts);
  const setStoreTicker = useAppStore((state) => state.setTicker);
  const setStoreTimeframe = useAppStore((state) => state.setTimeframe);
  const setStoreMode = useAppStore((state) => state.setMode);
  const addCatalyst = useAppStore((state) => state.addCatalyst);
  const removeCatalyst = useAppStore((state) => state.removeCatalyst);
  const setData = useAppStore((state) => state.setData);
  const setAnalysis = useAppStore((state) => state.setAnalysis);
  const setPatterns = useAppStore((state) => state.setPatterns);
  const setMessages = useAppStore((state) => state.setMessages);
  const pushMessage = useAppStore((state) => state.pushMessage);
  const setStoreLoading = useAppStore((state) => state.setLoading);
  const storeData = useAppStore((state) => state.data);

  const [source, setSource] = useState<'live' | 'upload'>('live');
  const [ticker, setTicker] = useState(() => storeTicker ?? '');
  const [timeframe, setTimeframe] = useState<TimeframeOption>(() =>
    timeframes.includes(storeTimeframe as TimeframeOption) ? (storeTimeframe as TimeframeOption) : '5m'
  );
  const [mode, setMode] = useState<'scalp' | 'swing' | 'position'>(() => storeMode ?? 'scalp');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disableReason, setDisableReason] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newCatalyst, setNewCatalyst] = useState('');
  const [parsedSeries, setParsedSeries] = useState<Candle[]>(storeData);

  useEffect(() => {
    if (storeTicker !== ticker) {
      setTicker(storeTicker);
    }
  }, [storeTicker]);

  useEffect(() => {
    if (storeTimeframe && storeTimeframe !== timeframe) {
      if (timeframes.includes(storeTimeframe as TimeframeOption)) {
        setTimeframe(storeTimeframe as TimeframeOption);
      }
    }
  }, [storeTimeframe, timeframe]);

  useEffect(() => {
    if (storeMode && storeMode !== mode) {
      setMode(storeMode);
    }
  }, [storeMode, mode]);

  useEffect(() => {
    if (source === 'upload') {
      setParsedSeries(storeData);
    }
  }, [source, storeData]);

  useEffect(() => {
    setStoreTicker(ticker);
  }, [ticker, setStoreTicker]);

  useEffect(() => {
    setStoreTimeframe(timeframe);
  }, [timeframe, setStoreTimeframe]);

  useEffect(() => {
    setStoreMode(mode);
  }, [mode, setStoreMode]);

  useEffect(() => {
    if (source === 'live') {
      setFile(null);
    }
  }, [source]);

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0];
      setFile(nextFile ?? null);
      if (!nextFile) return;
      try {
        const data = await parseFile(nextFile);
        if (!data.length) {
          setParsedSeries([]);
          setUploadError('No candles parsed from file.');
        } else {
          setSource('upload');
          setParsedSeries(data);
          setData(data);
          setUploadError(null);
        }
      } catch (err) {
        console.error(err);
        setParsedSeries([]);
        setUploadError('Failed to parse file. Ensure CSV or JSON OHLCV format.');
      }
    },
    [setData]
  );

  const computedDisableReason = useMemo(() => {
    if (loading) return 'Running...';
    if (!ticker.trim()) return 'Ticker required';
    if (!timeframe) return 'Timeframe required';
    if (!mode) return 'Mode required';
    if (source === 'upload' && !file && parsedSeries.length === 0) return 'Upload a CSV/JSON file';
    return null;
  }, [loading, ticker, timeframe, mode, source, file, parsedSeries.length]);

  useEffect(() => {
    setDisableReason(computedDisableReason);
  }, [computedDisableReason]);

  const disabled = computedDisableReason !== null;

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

  const loadSample = useCallback(() => {
    const now = Date.now();
    const sampleBars: BasicBar[] = Array.from({ length: 25 }).map((_, index) => ({
      t: now - (25 - index) * 5 * 60 * 1000,
      o: 170 + index * 0.05,
      h: 170.3 + index * 0.05,
      l: 169.8 + index * 0.05,
      c: 170.1 + index * 0.05,
      v: 800000
    }));
    const candles = toCandles(sampleBars);
    setSource('upload');
    setTicker('AAPL');
    setTimeframe('5m');
    setFile(null);
    setParsedSeries(candles);
    setData(candles);
    setUploadError(null);
    setError(null);
    setMessages([]);
  }, [
    setData,
    setMessages,
    setSource,
    setTicker,
    setTimeframe,
    setFile,
    setParsedSeries,
    setUploadError,
    setError
  ]);

  const handleGenerate = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setStoreLoading(true);

      const symbol = ticker.trim().toUpperCase();
      if (!symbol) throw new Error('Ticker required');

      let series: BasicBar[] = [];

      if (source === 'live') {
        const res = await fetch(
          `/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(timeframe)}&limit=500`,
          { cache: 'no-store' }
        );
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || 'Failed to fetch live candles');
        }
        const json = await res.json();
        const candles = Array.isArray(json) ? json : json.candles;
        if (!Array.isArray(candles)) {
          throw new Error('Unexpected candles payload');
        }
        series = candles
          .map((item: any) => ({
            t: Number(item.t ?? item.time ?? item.ts ?? 0),
            o: Number(item.o ?? item.open ?? 0),
            h: Number(item.h ?? item.high ?? 0),
            l: Number(item.l ?? item.low ?? 0),
            c: Number(item.c ?? item.close ?? 0),
            v: Number(item.v ?? item.volume ?? 0)
          }))
          .filter(
            (bar) =>
              Number.isFinite(bar.t) &&
              Number.isFinite(bar.o) &&
              Number.isFinite(bar.h) &&
              Number.isFinite(bar.l) &&
              Number.isFinite(bar.c) &&
              Number.isFinite(bar.v)
          );
        if (series.length < 20) {
          throw new Error('Not enough candles');
        }
      } else {
        series = toBars(parsedSeries);
        if (!series?.length) {
          throw new Error('Upload a CSV/JSON or click Load Sample');
        }
      }

      const candles = toCandles(series);
      setData(candles);
      setPatterns(runPatternEngine(candles));

      const ohlcv = series.map((bar) => [bar.t, bar.o, bar.h, bar.l, bar.c, bar.v]);

      const planRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe, mode, ohlcv })
      });

      if (!planRes.ok) {
        const message = await planRes.text();
        throw new Error(message || 'Failed to build plan');
      }

      const data = await planRes.json();

      if (!data.report) {
        throw new Error('Server did not return a plan report');
      }

      const lines: string[] = String(data.report)
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);

      const summaryLines = lines.slice(1, Math.max(1, lines.length - 1));
      const executionLine = lines[lines.length - 1] ?? '';

      setAnalysis({
        regime: data.regime ?? 'neutral',
        bullets: summaryLines,
        execution: executionLine,
        confidence: data.stats?.confidence ?? 0,
        rr: data.stats?.rr ?? 0,
        levels: data.levels ?? { entry: 0, stop: 0, target: 0 }
      });

      const timestamp = Date.now();
      setMessages([]);
      pushMessage({ role: 'user', content: `Generate ${symbol} ${timeframe} ${mode} plan`, createdAt: timestamp });
      pushMessage({ role: 'assistant', content: data.report, createdAt: timestamp + 1 });
    } catch (err: any) {
      const message = err?.message ?? 'Failed to generate plan';
      setError(message);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  }, [
    mode,
    parsedSeries,
    pushMessage,
    setAnalysis,
    setData,
    setMessages,
    setPatterns,
    setStoreLoading,
    source,
    ticker,
    timeframe,
    setError,
    setLoading
  ]);

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
              placeholder="AAPL"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-slate-300">Timeframe</span>
            <select
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value as TimeframeOption)}
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
          <label className="text-slate-300">Data Source</label>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as 'live' | 'upload')}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-accent focus:outline-none"
          >
            <option value="live">Live</option>
            <option value="upload">Upload</option>
          </select>
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
            title={disableReason ?? 'Generate plan'}
            className={`rounded-md bg-accent/40 px-4 py-2 text-sm font-semibold text-slate-900 transition ${
              disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-accent'
            }`}
          >
            {loading ? 'Generating…' : 'Generate Plan'}
          </button>
          <button
            type="button"
            onClick={loadSample}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-accent hover:text-accent"
          >
            Load Sample
          </button>
        </div>
        {error && <div className="mt-2 text-sm text-red-400">{String(error)}</div>}
        {!error && disableReason && (
          <div className="mt-2 text-xs text-slate-400">Hint: {disableReason}</div>
        )}
      </div>
    </motion.section>
  );
}
