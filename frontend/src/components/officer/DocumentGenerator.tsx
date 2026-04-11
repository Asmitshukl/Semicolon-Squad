import { useState } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import type { MockFIR } from '../../data/officerMock';
import { officerService } from '../../services/officerService';

type Phase = 'idle' | 'loading' | 'done';

export const DocumentGenerator = ({ fir }: { fir: MockFIR }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = [
    { ok: true, label: 'Victim statement received' },
    { ok: true, label: 'BNS sections confirmed' },
    { ok: true, label: 'AI summary reviewed' },
    { ok: fir.checklistVoiceOk, label: 'Voice statement verified', warn: !fir.checklistVoiceOk },
    { ok: true, label: 'Officer identity confirmed' },
  ];

  const generate = async () => {
    setPhase('loading');
    setError(null);
    setMessage(null);
    try {
      await officerService.generateSummary(fir.id);
      const blob = await officerService.downloadFirPdf(fir.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fir.firNo.replace(/[^\w.-]+/g, '_')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      setPhase('done');
      setMessage('PDF downloaded and FIR summary refreshed.');
    } catch (err) {
      setPhase('idle');
      setError(err instanceof Error ? err.message : 'Document generation failed.');
    }
  };

  return (
    <div>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7280]">
        Generate Official Document
      </p>
      <div className="mb-8 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            {item.ok ? (
              <Check className="h-4 w-4 shrink-0 text-[#16A34A]" strokeWidth={3} />
            ) : (
              <span className="w-4 text-center font-bold text-[#D97706]">x</span>
            )}
            <span className={item.warn ? 'text-[#D97706]' : 'text-[#D1D5DB]'}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-2 rounded-xl border border-white/[0.08] bg-[rgba(255,255,255,0.04)] p-4 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">Digital signing context</p>
        <p className="text-white">FIR: {fir.firNo}</p>
        <p className="text-white">Primary BNS: {fir.bnsCode} - {fir.bnsTitle}</p>
        <p className="font-mono text-[#9CA3AF]">Timestamp auto-filled during PDF generation</p>
      </div>

      {error ? <p className="mb-3 text-sm text-[#FCA5A5]">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-[#86EFAC]">{message}</p> : null}

      {phase === 'loading' ? (
        <div className="flex items-center justify-center gap-2 py-4 text-[#9CA3AF]">
          <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
          <span className="font-mono text-sm">Generating PDF...</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void generate()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] py-4 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-[#ea580c]"
        >
          <Download className="h-4 w-4" />
          {phase === 'done' ? 'Download Again' : 'Generate & Download PDF'}
        </button>
      )}
    </div>
  );
};
