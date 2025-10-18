'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Candle } from '../lib/utils/csv';
import type { PatternDetection } from '../lib/tech/patternEngine';
import type { Regime } from '../lib/tech/regimeDetector';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export type AnalysisState = {
  regime: Regime;
  bullets: string[];
  execution: string;
  confidence: number;
  rr: number;
  levels: {
    entry: number;
    stop: number;
    target: number;
  };
};

export const SYSTEM_PROMPT = `You are Chart Assassin — Pro, an elite real-time trading AI. Style: short and tactical. Always output 5–7 bullets. Always include: Bias (🟢/🔴/🟡), Catalyst, Entry, 🚫 Stop, 🎯 Target, R:R, Confidence %. Detect and state the current market regime at the top. Include active macro catalysts if present. Trade modes: Scalp 1–15m, Swing 4h–D, Position multi-day. Pattern engine recognizes flags, wedges, double tops/bottoms, H&S, liquidity sweeps, divergences. Integrate price action, VWAP, volume profile. End with one clear execution line. Educational only — not financial advice.

When given OHLCV arrays and user inputs, run regimeDetector, patternEngine, and risk to propose a setup. If data is missing, ask for ticker, timeframe, entry, and risk tolerance.`;

type AppState = {
  ticker: string;
  timeframe: string;
  mode: 'scalp' | 'swing' | 'position';
  catalysts: string[];
  data: Candle[];
  patterns: PatternDetection[];
  analysis?: AnalysisState;
  messages: ChatMessage[];
  loading: boolean;
  setTicker: (value: string) => void;
  setTimeframe: (value: string) => void;
  setMode: (value: 'scalp' | 'swing' | 'position') => void;
  setCatalysts: (values: string[]) => void;
  addCatalyst: (value: string) => void;
  removeCatalyst: (value: string) => void;
  setData: (data: Candle[]) => void;
  setPatterns: (patterns: PatternDetection[]) => void;
  setAnalysis: (analysis?: AnalysisState) => void;
  setMessages: (messages: ChatMessage[]) => void;
  pushMessage: (message: ChatMessage) => void;
  setLoading: (value: boolean) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ticker: 'SPY',
      timeframe: '15m',
      mode: 'scalp',
      catalysts: [],
      data: [],
      patterns: [],
      messages: [],
      loading: false,
      setTicker: (value) => set({ ticker: value }),
      setTimeframe: (value) => set({ timeframe: value }),
      setMode: (value) => set({ mode: value }),
      setCatalysts: (values) => set({ catalysts: values }),
      addCatalyst: (value) => {
        const catalysts = Array.from(new Set([...get().catalysts, value].filter(Boolean)));
        set({ catalysts });
      },
      removeCatalyst: (value) => {
        set({ catalysts: get().catalysts.filter((item) => item !== value) });
      },
      setData: (data) => set({ data }),
      setPatterns: (patterns) => set({ patterns }),
      setAnalysis: (analysis) => set({ analysis }),
      setMessages: (messages) => set({ messages }),
      pushMessage: (message) => set({ messages: [...get().messages, message] }),
      setLoading: (value) => set({ loading: value }),
      reset: () =>
        set({
          ticker: 'SPY',
          timeframe: '15m',
          mode: 'scalp',
          catalysts: [],
          data: [],
          patterns: [],
          analysis: undefined,
          messages: []
        })
    }),
    {
      name: 'chart-assassin-state'
    }
  )
);
