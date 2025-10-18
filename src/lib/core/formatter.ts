import type { PlaybookPlan } from './templates';
import type { Regime } from '../tech/regimeDetector';

export function formatAssistantContract({
  plan,
  regime,
  disclaimer = 'Educational only — not financial advice.'
}: {
  plan: PlaybookPlan;
  regime: Regime;
  disclaimer?: string;
}): string {
  const header = `Market Regime: ${regime === 'bull' ? 'Bull' : regime === 'bear' ? 'Bear' : 'Neutral'}`;
  const bullets = plan.bullets.join('\n');
  const execution = `${plan.executionLine}`;
  return `${header}\n${bullets}\n${execution}\n${disclaimer}`;
}
