import { InputsPanel } from './(components)/InputsPanel';
import { Chat } from './(components)/Chat';
import { ChartView } from './(components)/ChartView';
import { RightRail } from './(components)/RightRail';
import { CommandBar } from './(components)/CommandBar';
export default function Page() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-100">
            Chart Assassin — Pro
          </h1>
          <p className="text-sm text-slate-400">
            Elite real-time trading assistant combining regime, pattern, catalyst, and risk intelligence.
          </p>
        </div>
        <CommandBar />
      </header>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
        <InputsPanel />
        <div className="flex flex-col gap-6">
          <ChartView />
          <Chat />
        </div>
        <RightRail />
      </div>
    </div>
  );
}
