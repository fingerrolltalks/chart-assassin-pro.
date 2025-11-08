'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { parseCsv } from '../../lib/utils/csv';

async function loadSample(symbol: string) {
  const res = await fetch(`/samples/${symbol}`);
  if (!res.ok) throw new Error('Failed to load sample');
  const text = await res.text();
  return parseCsv(text);
}

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const setData = useAppStore((state) => state.setData);
  const setTicker = useAppStore((state) => state.setTicker);
  const setTimeframe = useAppStore((state) => state.setTimeframe);
  const reset = useAppStore((state) => state.reset);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLoadSample = useCallback(
    async (symbol: string) => {
      try {
        const data = await loadSample(symbol);
        setTicker(symbol.replace('_15m', ''));
        if (symbol.includes('_15m')) {
          setTimeframe('15m');
        }
        setData(data);
        setOpen(false);
      } catch (error) {
        console.error(error);
      }
    },
    [setData, setTicker, setTimeframe]
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800">
          ⌘K Command
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-24 w-full max-w-md -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-2xl">
          <Dialog.Title className="text-lg font-semibold text-slate-100">Command Palette</Dialog.Title>
          <Dialog.Description className="mb-4 text-sm text-slate-400">
            Quick actions for Chart Assassin — Pro
          </Dialog.Description>
          <div className="space-y-2 text-sm">
            <button
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-left text-slate-200 transition hover:bg-accent/30"
              onClick={() => handleLoadSample('SPY_15m')}
            >
              Load SPY 15m sample
            </button>
            <button
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-left text-slate-200 transition hover:bg-accent/30"
              onClick={() => handleLoadSample('QQQ_15m')}
            >
              Load QQQ 15m sample
            </button>
            <button
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-left text-red-300 transition hover:bg-danger/40"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Reset workspace
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
