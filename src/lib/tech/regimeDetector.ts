import type { Candle } from '../utils/csv';
import { emaStackSignal, breadthProxy, vixTrend, yieldTrend } from './detectors';
import { pctChange } from '../utils/math';

export type Regime = 'bull' | 'bear' | 'neutral';

export type RegimeSignals = {
  emas: Record<string, Regime>;
  breadth: number;
  vix: number;
  tnxTrend: 'up' | 'down' | 'flat';
  gammaFlip: boolean;
};

export function regimeDetector({
  spy,
  qqq,
  iwm,
  vix,
  tnx
}: {
  spy: Candle[];
  qqq: Candle[];
  iwm: Candle[];
  vix: number[];
  tnx: number[];
}): { regime: Regime; signals: RegimeSignals } {
  const closeSpy = spy.map((c) => c.close);
  const closeQqq = qqq.map((c) => c.close);
  const closeIwm = iwm.map((c) => c.close);

  const spySignal = emaStackSignal(closeSpy);
  const qqqSignal = emaStackSignal(closeQqq);
  const iwmSignal = emaStackSignal(closeIwm);

  const breadth = breadthProxy(closeIwm, closeSpy);
  const vixValue = vix[vix.length - 1] ?? 0;
  const vixState = vixTrend(vix);
  const tnxState = yieldTrend(tnx);

  const gammaFlip = pctChange(closeSpy[closeSpy.length - 1], closeSpy[Math.max(0, closeSpy.length - 10)]) > 0.02;

  const bullishCount = [spySignal, qqqSignal, iwmSignal].filter((s) => s === 'bull').length;
  const bearishCount = [spySignal, qqqSignal, iwmSignal].filter((s) => s === 'bear').length;

  let regime: Regime = 'neutral';
  if (bullishCount >= 2 && breadth >= 0.98 && vixState !== 'up') {
    regime = 'bull';
  } else if (bearishCount >= 2 && (breadth <= 0.96 || vixState === 'up')) {
    regime = 'bear';
  }

  if (tnxState === 'up' && regime === 'bull' && vixState === 'up') {
    regime = 'neutral';
  }

  return {
    regime,
    signals: {
      emas: {
        spy: spySignal,
        qqq: qqqSignal,
        iwm: iwmSignal
      },
      breadth,
      vix: Number(vixValue.toFixed(2)),
      tnxTrend: tnxState,
      gammaFlip
    }
  };
}
