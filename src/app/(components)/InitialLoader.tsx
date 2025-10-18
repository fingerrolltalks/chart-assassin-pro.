'use client';

import { useEffect } from 'react';
import type { Candle } from '../../lib/utils/csv';
import { useAppStore } from '../../store/useAppStore';

export function InitialLoader({ data, ticker }: { data: Candle[]; ticker: string }) {
  const setData = useAppStore((state) => state.setData);
  const currentData = useAppStore((state) => state.data);
  const setTicker = useAppStore((state) => state.setTicker);

  useEffect(() => {
    if (!currentData.length && data.length) {
      setData(data);
      setTicker(ticker);
    }
  }, [currentData.length, data, setData, setTicker, ticker]);

  return null;
}
