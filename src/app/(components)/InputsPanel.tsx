// inside the component file
const handleGenerate = async () => {
  setError?.(null);
  setLoading?.(true);
  try {
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) throw new Error('Ticker required');

    const tf = timeframe; // '5m' | '15m' etc
    const r = await fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(tf)}&limit=500`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok || !Array.isArray(json?.candles) || json.candles.length < 20) {
      throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load candles');
    }

    const ohlcv = json.candles.map((b: any) => [b.t, b.o, b.h, b.l, b.c, b.v]);

    const plan = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, timeframe: tf, mode, ohlcv })
    });

    const data = await plan.json();
    if (!plan.ok || !data?.report) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Analyze failed');
    }

    setAssistantOutput?.(data.report); // your render hook
    setHeaderInfo?.(`Symbol: ${symbol} • Source: Live • Candles: ${ohlcv.length}`);
  } catch (e: any) {
    setError?.(String(e.message || e));
  } finally {
    setLoading?.(false);
  }
};
