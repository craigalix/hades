import { BrainCircuit } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-tg-border/70 px-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-link">
          <BrainCircuit aria-hidden="true" size={21} strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-[0] text-tg-text">Hermes Agent</h1>
          <p className="text-xs text-tg-hint">HADES control centre</p>
        </div>
      </div>
    </header>
  );
}
