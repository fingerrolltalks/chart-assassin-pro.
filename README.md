# Chart Assassin — Pro

Chart Assassin — Pro is an elite real-time trading assistant built with Next.js 14, TypeScript, Tailwind CSS, Zustand, shadcn/ui primitives, and Recharts. It combines market regime detection, pattern recognition, catalyst management, and risk tooling to deliver actionable trade playbooks.

## Features

- ⚡️ **Real-time assistant** that always returns plans with market regime header, 5–7 tactical bullets, execution line, and educational disclaimer.
- 🧠 **Pattern engine** detecting flags, wedges, double tops/bottoms, head & shoulders, liquidity sweeps, and divergences from OHLCV data.
- 📊 **Regime detector** leveraging EMA alignment, breadth proxy, VIX trend, yield trend, and gamma proxy heuristics.
- 🛠️ **Risk toolkit** with ATR-based stops, default targets per mode, risk/reward calculator, and position sizing helper.
- 🎯 **Templates & catalysts** for quick playbook generation that weave in macro events (Fed, CPI, earnings, geopolitics, oil).
- 📈 **Interactive chart** powered by Recharts with candlesticks, EMA 20/50/200 overlays, ATR band, VWAP, and volume.
- 💾 **Local persistence** using Zustand + localStorage, plus CSV/JSON loaders and baked-in SPY/QQQ samples.
- 🧪 **Quality gates** with strict TypeScript, ESLint, Prettier, Vitest unit tests, and GitHub Actions CI.

## Stack

- [Next.js 14 (App Router)](https://nextjs.org)
- TypeScript & Zod for type-safe inputs
- Tailwind CSS + shadcn/ui-inspired components
- Zustand for client state (persisted in `localStorage`)
- Recharts for charting
- Vitest for unit testing

## Getting Started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` to explore the dashboard.

### Loading Data & Generating a Plan

1. Use **⌘/Ctrl + K** or the “Command” button to load the bundled SPY 15m sample.
2. Adjust ticker, timeframe, mode, and catalysts from the inputs panel.
3. Optionally upload your own CSV/JSON OHLCV file (columns: `ts,open,high,low,close,volume`).
4. Hit **Generate Plan** in the Assistant panel. The response includes regime, bias, entry, stop, target, R:R, confidence, and execution line.

### Sample Prompts

- “Analyze SPY 15m scalp using latest uploaded data.”
- “Generate a swing plan for NVDA daily with manual catalysts: earnings next week, VIX sub-18.”
- “Detect patterns on QQQ and propose entries with ATR stops.”
- “Size a position with $500 risk from 450 entry, 447.8 stop.”

## Scripts

- `pnpm dev` – start local development server
- `pnpm build` – create production build
- `pnpm start` – run built app
- `pnpm lint` – lint with ESLint
- `pnpm typecheck` – run TypeScript in no-emit mode
- `pnpm test` – execute Vitest unit tests

## Testing & CI

Vitest covers technical indicators, regime detection, risk math, and schema validation. GitHub Actions (`.github/workflows/ci.yml`) runs install, lint, typecheck, tests, and build on each push/PR targeting `main`.

## Environment Variables

Copy `.env.example` to `.env.local` if you plan to integrate optional APIs later:

```
OPENAI_API_KEY=
NEXT_PUBLIC_APP_NAME="Chart Assassin — Pro"
```

## Limitations

- Uses heuristics and local samples for regime signals; plug in live market feeds for production.
- Current catalyst module accepts manual inputs; API adapters can be layered later.
- No brokerage execution. Educational output only.

## License

MIT © 2024 Chart Assassin — Pro
