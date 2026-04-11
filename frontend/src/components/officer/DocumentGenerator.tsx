import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { MockFIR } from '../../data/officerMock';

type Phase = 'idle' | 'loading' | 'done';

export const DocumentGenerator = ({ fir }: { fir: MockFIR }) => {
  const [phase, setPhase] = useState<Phase>('idle');

  const items = [
    { ok: true, label: 'Victim statement received' },
    { ok: true, label: 'BNS sections confirmed' },
    { ok: true, label: 'AI summary reviewed' },
    { ok: fir.checklistVoiceOk, label: 'Voice statement verified', warn: !fir.checklistVoiceOk },
    { ok: true, label: 'Officer identity confirmed' },
  ];

  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.2em] text-[#6B7280] uppercase mb-4">— दस्तावेज़ · GENERATE OFFICIAL DOCUMENT</p>
      <div className="space-y-2 mb-8">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-sm">
            {it.ok ? (
              <Check className="w-4 h-4 text-[#16A34A] shrink-0" strokeWidth={3} />
            ) : (
              <span className="text-[#D97706] font-bold w-4 text-center">✗</span>
            )}
            <span className={it.warn ? 'text-[#D97706]' : 'text-[#D1D5DB]'}>{it.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-4 mb-6 space-y-2 text-sm">
        <p className="text-[11px] font-bold tracking-wide text-[#6B7280] uppercase">Digitally signing as:</p>
        <p>
          <span className="text-[#6B7280]">Name:</span>{' '}
          <span className="font-mono text-white">SI Rajesh Kumar Singh</span>
        </p>
        <p>
          <span className="text-[#6B7280]">Badge:</span> <span className="font-mono text-white">DL-SI-4821</span>
        </p>
        <p>
          <span className="text-[#6B7280]">Station:</span>{' '}
          <span className="text-white">Connaught Place PS, Central Delhi</span>
        </p>
        <p>
          <span className="text-[#6B7280]">Timestamp:</span>{' '}
          <span className="font-mono text-[#9CA3AF]">Auto-filled on generation</span>
        </p>
      </div>

      {phase === 'idle' && (
        <button
          type="button"
          onClick={() => {
            setPhase('loading');
            window.setTimeout(() => setPhase('done'), 1600);
          }}
          className="w-full py-4 rounded-xl bg-[#F97316] text-white text-sm font-extrabold tracking-wide uppercase hover:bg-[#ea580c]"
        >
          Generate & Sign FIR Document →
        </button>
      )}
      {phase === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-4 text-[#9CA3AF]">
          <Loader2 className="w-5 h-5 animate-spin text-[#F97316]" />
          <span className="font-mono text-sm">Generating...</span>
        </div>
      )}
      {phase === 'done' && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#16A34A]">✓ Document Generated · Download PDF</p>
          <p className="text-xs text-[#6B7280] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-[#16A34A]" />
            SMS sent to victim with FIR number
          </p>
        </div>
      )}
    </div>
  );
};
