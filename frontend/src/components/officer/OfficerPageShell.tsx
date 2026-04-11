import type { ReactNode } from 'react';

const AshokaMark = () => (
  <svg
    className="fixed bottom-6 right-6 w-[min(40vw,420px)] h-[min(40vw,420px)] pointer-events-none select-none text-white opacity-[0.04] z-0"
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden
  >
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2.5" />
    {Array.from({ length: 24 }, (_, i) => {
      const a = ((i * 360) / 24 - 90) * (Math.PI / 180);
      return (
        <line
          key={i}
          x1={50 + 12 * Math.cos(a)}
          y1={50 + 12 * Math.sin(a)}
          x2={50 + 42 * Math.cos(a)}
          y2={50 + 42 * Math.sin(a)}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      );
    })}
    <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const OfficerPageShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-x-hidden flex flex-col">
    <div className="fixed inset-x-0 top-0 z-[60] flex h-[3px]">
      <div className="flex-1 bg-[#FF9933]" />
      <div className="flex-1 bg-white" />
      <div className="flex-1 bg-[#138808]" />
    </div>
    <AshokaMark />
    <div className="relative z-[1] flex flex-col flex-1 min-h-0 pt-[3px]">{children}</div>
    <footer className="relative z-[1] border-t border-white/[0.08] px-6 py-4 mt-auto shrink-0">
      <p className="text-center text-[11px] font-bold tracking-[0.2em] text-[#F97316]">सत्यमेव जयते</p>
      <p className="text-center text-[10px] text-[#6B7280] mt-1 font-mono">NyayaSetu — Digital Justice System · Officer Portal</p>
    </footer>
  </div>
);
