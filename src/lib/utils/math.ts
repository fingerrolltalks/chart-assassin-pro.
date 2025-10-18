export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function slope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    const x = i - xMean;
    numerator += x * (values[i] - yMean);
    denominator += x * x;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

export function pctChange(a: number, b: number): number {
  if (b === 0) return 0;
  return (a - b) / Math.abs(b);
}

export function normalizeScore(value: number, min: number, max: number): number {
  if (min === max) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
