export function ema(series: number[], period: number): number[] {
  if (period <= 0) throw new Error('EMA period must be positive');
  if (series.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = series[0];
  result.push(prev);
  for (let i = 1; i < series.length; i += 1) {
    const value = series[i] * k + prev * (1 - k);
    result.push(value);
    prev = value;
  }
  return result;
}
