'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, Line, Area, CartesianGrid, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ema } from '../../lib/tech/ema';
import { atr } from '../../lib/tech/atr';
import type { Candle } from '../../lib/utils/csv';
import { formatTime } from '../../lib/utils/time';

function buildChartData(data: Candle[]) {
  if (!data.length) return [];
  const closes = data.map((c) => c.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const atrValues = atr(data, 14);
  let cumulativeVolume = 0;
  let cumulativeTypical = 0;
  return data.map((candle, index) => {
    const typical = (candle.high + candle.low + candle.close) / 3;
    cumulativeTypical += typical * candle.volume;
    cumulativeVolume += candle.volume;
    const vwap = cumulativeVolume === 0 ? candle.close : cumulativeTypical / cumulativeVolume;
    const atrBand = atrValues[index] ?? 0;
    return {
      time: formatTime(candle.ts),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      ema20: ema20[index],
      ema50: ema50[index],
      ema200: ema200[index],
      atrUpper: candle.close + atrBand,
      atrLower: candle.close - atrBand,
      vwap
    };
  });
}

export function ChartView() {
  const data = useAppStore((state) => state.data);

  const chartData = useMemo(() => buildChartData(data), [data]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-[480px] rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Chart</h2>
        <p className="text-xs text-slate-400">Replays uploaded OHLCV with EMAs, ATR band & VWAP.</p>
      </header>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" hide interval="preserveEnd" />
            <YAxis yAxisId="price" domain={['auto', 'auto']} stroke="#64748b" width={60} orientation="right" />
            <YAxis yAxisId="volume" hide domain={[0, 'auto']} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Legend />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="atrUpper"
              stroke="#38bdf8"
              fill="#38bdf8"
              fillOpacity={0.05}
              name="ATR Band"
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="atrLower"
              stroke="#38bdf8"
              fill="#38bdf8"
              fillOpacity={0.05}
            />
            <Line yAxisId="price" type="monotone" dataKey="ema20" stroke="#38bdf8" dot={false} strokeWidth={2} name="EMA 20" />
            <Line yAxisId="price" type="monotone" dataKey="ema50" stroke="#a78bfa" dot={false} strokeWidth={2} name="EMA 50" />
            <Line yAxisId="price" type="monotone" dataKey="ema200" stroke="#f97316" dot={false} strokeWidth={2} name="EMA 200" />
            <Line yAxisId="price" type="monotone" dataKey="vwap" stroke="#22d3ee" dot={false} strokeDasharray="5 5" name="VWAP" />
            <Bar dataKey="volume" yAxisId="volume" fill="#334155" barSize={4} opacity={0.5} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-500">
          Upload data or load a sample to render the chart.
        </div>
      )}
    </motion.section>
  );
}
