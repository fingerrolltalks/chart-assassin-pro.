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

  const normalizeSignal = (signal: 'bull' | 'bear' | 'mixed'): Regime =>
    signal === 'mixed' ? 'neutral' : signal;

  const spySignal = normalizeSignal(emaStackSignal(closeSpy));
  const qqqSignal = normalizeSignal(emaStackSignal(closeQqq));
  const iwmSignal = normalizeSignal(emaStackSignal(closeIwm));

  const breadth = breadthProxy(closeIwm, closeSpy);
  const vixClose = vix;
  const vixDir = vixTrend(vixClose);
  const yldDir = yieldTrend(tnx);

  const gammaFlip = pctChange(closeSpy[closeSpy.length - 1], closeSpy[Math.max(0, closeSpy.length - 10)]) > 0.02;

  const decideRegime = () => {
    const votes = [spySignal, qqqSignal, iwmSignal]; // 'bull'|'bear'|'neutral'
    const bullCount = votes.filter((v) => v === 'bull').length;
    const bearCount = votes.filter((v) => v === 'bear').length;
    let regime: Regime = 'neutral';
    if (bullCount >= 2 && breadth >= 60 && vixDir !== 'up') regime = 'bull';
    else if (bearCount >= 2 && vixDir === 'up') regime = 'bear';
    else regime = 'neutral';
    return regime;
  };

  return {
    regime: decideRegime(),
    signals: {
      emas: {
        spy: spySignal,
        qqq: qqqSignal,
        iwm: iwmSignal
      },
      breadth,
      vix: vixClose[vixClose.length - 1] ?? 0,
      tnxTrend: yldDir,
      gammaFlip
    }
  };
}
